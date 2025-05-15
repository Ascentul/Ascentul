import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Form schema
const formSchema = z.object({
  type: z.string().min(1, { message: "Type is required" }),
  scheduledDate: z.date().optional().nullable(),
  location: z.string().optional(),
  interviewers: z.string().optional(), // Will be split into array later
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewInterviewStageFormProps {
  open: boolean;
  onClose: () => void;
  processId: number;
}

export function NewInterviewStageForm({ open, onClose, processId }: NewInterviewStageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      scheduledDate: null,
      location: "",
      interviewers: "",
      notes: "",
    },
  });

  // Create mutation for submitting the new interview stage
  const createInterviewStageMutation = useMutation({
    mutationFn: async (values: FormValues & { processId: number }) => {
      // Process interviewers into an array if present
      const formattedValues = {
        ...values,
        // The scheduledDate is already a Date object (or null), so we don't need to convert it
        interviewers: values.interviewers ? values.interviewers.split(',').map(name => name.trim()) : []
      };
      
      console.log('Submitting interview stage with data:', formattedValues);
      
      const response = await apiRequest("POST", `/api/interview/processes/${processId}/stages`, formattedValues);
      
      // Also invalidate upcoming interviews data
      queryClient.invalidateQueries({ queryKey: ["/api/users/statistics"] });
      
      return response;
    },
    onSuccess: () => {
      // Invalidate both interview processes and stages queries to refresh all related data
      queryClient.invalidateQueries({ queryKey: ["/api/interview/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interview/processes", processId, "stages"] });
      
      toast({
        title: "Success",
        description: "Interview stage has been added",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      console.error('Error adding interview stage:', error);
      toast({
        title: "Error",
        description: `Failed to add interview stage: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    createInterviewStageMutation.mutate({ ...values, processId });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Add Interview Stage</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Add a new stage to this interview process.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage Type*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Phone Screening">Phone Screening</SelectItem>
                      <SelectItem value="Technical Assessment">Technical Assessment</SelectItem>
                      <SelectItem value="Technical Interview">Technical Interview</SelectItem>
                      <SelectItem value="Behavioral Interview">Behavioral Interview</SelectItem>
                      <SelectItem value="Onsite Interview">Onsite Interview</SelectItem>
                      <SelectItem value="System Design Interview">System Design Interview</SelectItem>
                      <SelectItem value="HR Interview">HR Interview</SelectItem>
                      <SelectItem value="Final Interview">Final Interview</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Scheduled Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Virtual / Office Address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="interviewers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interviewers</FormLabel>
                  <FormControl>
                    <Input placeholder="Names separated by commas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about this stage..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Stage"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}