import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';
import { cn } from "@/lib/utils";
import type { InterviewStage } from '@shared/schema';

const interviewStageSchema = z.object({
  type: z.string().min(1, { message: "Please select an interview type" }),
  scheduledDate: z.date().nullable(),
  location: z.string().nullable(),
  interviewers: z.string().transform(val => 
    val.length > 0 ? val.split(',').map(v => v.trim()) : []
  ),
  notes: z.string().nullable(),
  outcome: z.string().nullable(),
  feedback: z.string().nullable(),
});

type InterviewStageFormValues = z.infer<typeof interviewStageSchema>;

interface EditInterviewStageFormProps {
  isOpen: boolean;
  onClose: () => void;
  stage: InterviewStage;
  applicationId?: number;
  onSuccess?: () => void;
}

export function EditInterviewStageForm({ 
  isOpen, 
  onClose, 
  stage,
  applicationId,
  onSuccess 
}: EditInterviewStageFormProps) {
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();
  
  // Initialize form with stage values
  const form = useForm<Omit<InterviewStageFormValues, 'interviewers'> & { interviewers: string }>({
    resolver: zodResolver(interviewStageSchema),
    defaultValues: {
      type: stage.type || 'phone_screen',
      scheduledDate: stage.scheduledDate ? new Date(stage.scheduledDate) : null,
      location: stage.location || null,
      interviewers: stage.interviewers && stage.interviewers.length > 0 ? stage.interviewers.join(', ') : '',
      notes: stage.notes || null,
      outcome: stage.outcome || null,
      feedback: stage.feedback || null,
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async (values: InterviewStageFormValues) => {
      try {
        // First try to update on server
        const response = await apiRequest('PATCH', `/api/applications/${applicationId}/stages/${stage.id}`, values);
        return await response.json();
      } catch (error) {
        console.error(`Error updating interview stage via API:`, error);
        
        // If API call fails (for localStorage apps), update in localStorage
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          console.log('Updating stage in localStorage instead');
          
          // Get existing stages
          const mockStages = JSON.parse(localStorage.getItem(`mockInterviewStages_${applicationId}`) || '[]');
          const stageIndex = mockStages.findIndex((s: any) => s.id === stage.id);
          
          if (stageIndex === -1) {
            throw new Error('Interview stage not found in localStorage');
          }
          
          // Update the stage with new values
          mockStages[stageIndex] = {
            ...mockStages[stageIndex],
            ...values,
            updatedAt: new Date().toISOString(),
          };
          
          // Save back to localStorage
          localStorage.setItem(`mockInterviewStages_${applicationId}`, JSON.stringify(mockStages));
          
          return mockStages[stageIndex];
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries
      if (applicationId) {
        queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/stages`] });
      }
      
      // Close form and call success callback
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    }
  });

  const onSubmit = (data: any) => {
    setIsPending(true);
    
    // Convert the form data to the expected format for the API
    const values: InterviewStageFormValues = {
      ...data,
      // interviewers is already transformed by the schema
    };
    
    console.log("Submitting interview stage update:", values);
    
    updateStageMutation.mutate(values, {
      onSettled: () => setIsPending(false)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Interview Stage</DialogTitle>
          <DialogDescription>
            Update the details of this interview stage.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interview type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="phone_screen">Phone Screen</SelectItem>
                      <SelectItem value="technical">Technical Interview</SelectItem>
                      <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                      <SelectItem value="onsite">Onsite Interview</SelectItem>
                      <SelectItem value="panel">Panel Interview</SelectItem>
                      <SelectItem value="final">Final Round</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Interview Date</FormLabel>
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
                        disabled={(date) => date < new Date("1900-01-01")}
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
                    <Input 
                      placeholder="Online / Zoom / Office location" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="interviewers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interviewers</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Names of interviewers (separate with commas)" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an outcome" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback Received</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any feedback received from the interview"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ''}
                    />
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
                      placeholder="Additional notes about this interview stage"
                      className="min-h-[80px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update Interview"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}