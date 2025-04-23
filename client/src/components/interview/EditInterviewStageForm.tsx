import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { InterviewStage } from "@shared/schema";

// Reuse the same validation schema
const interviewStageSchema = z.object({
  type: z.string().min(1, "Type is required"),
  scheduledDate: z.date().optional().nullable(),
  location: z.string().optional().nullable(),
  interviewers: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  outcome: z.enum(['passed', 'failed', 'pending', 'scheduled']).optional().nullable(),
  feedback: z.string().optional().nullable(),
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Parse interviewers from array to comma-separated string
  const interviewersString = stage.interviewers ? 
    Array.isArray(stage.interviewers) ? 
      stage.interviewers.join(", ") : 
      stage.interviewers.toString() : 
    "";

  // Prepare default values
  const defaultValues: Partial<InterviewStageFormValues> = {
    type: stage.type || '',
    scheduledDate: stage.scheduledDate ? new Date(stage.scheduledDate) : null,
    location: stage.location || '',
    interviewers: interviewersString,
    notes: stage.notes || '',
    outcome: stage.outcome as any || 'pending',
    feedback: stage.feedback || '',
  };
  
  const form = useForm<InterviewStageFormValues>({
    resolver: zodResolver(interviewStageSchema),
    defaultValues,
  });

  // Update interview stage mutation
  const updateStageMutation = useMutation({
    mutationFn: async (values: InterviewStageFormValues) => {
      // Format the interviewers as an array if it's provided
      const interviewersArray = values.interviewers 
        ? values.interviewers.split(',').map(i => i.trim()) 
        : [];
      
      const stageData = {
        ...values,
        interviewers: interviewersArray,
      };
      
      // Format date properly for API
      if (stageData.scheduledDate) {
        stageData.scheduledDate = new Date(stageData.scheduledDate);
      }
      
      try {
        // Try to save the interview stage to the server
        if (applicationId) {
          const response = await apiRequest('PATCH', `/api/applications/${applicationId}/stages/${stage.id}`, stageData);
          return await response.json();
        } else {
          throw new Error('Missing applicationId for update');
        }
      } catch (error) {
        console.error(`Error updating interview stage ${stage.id}:`, error);
        
        // Check if it's a localStorage-only stage
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          console.log('Interview stage not found on server, updating in localStorage');
          
          // Get applications from localStorage
          const storedApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
          
          // Find the application
          if (!applicationId) {
            throw new Error('Application ID is required for localStorage update');
          }
          
          const appIndex = storedApplications.findIndex((app: any) => app.id === applicationId);
          if (appIndex === -1) {
            throw new Error('Application not found in localStorage');
          }
          
          // Get stages from localStorage
          const mockStages = JSON.parse(localStorage.getItem(`mockInterviewStages_${applicationId}`) || '[]');
          
          // Find the stage to update
          const stageIndex = mockStages.findIndex((s: any) => s.id === stage.id);
          if (stageIndex === -1) {
            throw new Error('Interview stage not found in localStorage');
          }
          
          // Update the stage
          const now = new Date().toISOString();
          const updatedStage = {
            ...mockStages[stageIndex],
            type: stageData.type,
            location: stageData.location,
            scheduledDate: stageData.scheduledDate ? new Date(stageData.scheduledDate).toISOString() : mockStages[stageIndex].scheduledDate,
            interviewers: stageData.interviewers,
            notes: stageData.notes,
            outcome: stageData.outcome,
            feedback: stageData.feedback,
            updatedAt: now
          };
          
          mockStages[stageIndex] = updatedStage;
          
          // Save updated stages back to localStorage
          localStorage.setItem(`mockInterviewStages_${applicationId}`, JSON.stringify(mockStages));
          
          console.log('Updated mock interview stage in localStorage:', updatedStage);
          return updatedStage;
        }
        
        // If it's another error, rethrow
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      if (applicationId) {
        queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/stages`] });
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      }
      
      toast({
        title: 'Success',
        description: 'Interview stage updated successfully',
      });
      
      form.reset();
      onClose();
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update interview stage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: InterviewStageFormValues) => {
    updateStageMutation.mutate(values);
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Interview Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Type*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interview type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="phone_screen">Phone Screen</SelectItem>
                      <SelectItem value="technical">Technical Interview</SelectItem>
                      <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                      <SelectItem value="culture_fit">Culture Fit</SelectItem>
                      <SelectItem value="take_home">Take-Home Assignment</SelectItem>
                      <SelectItem value="onsite">Onsite Interview</SelectItem>
                      <SelectItem value="panel">Panel Interview</SelectItem>
                      <SelectItem value="final">Final Round</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Scheduled Date */}
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Select interview date</span>
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
            
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter interview location (e.g., Zoom, Company Office)"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Interviewers */}
            <FormField
              control={form.control}
              name="interviewers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interviewers</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter interviewer names (comma-separated)"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Interview Outcome */}
            <FormField
              control={form.control}
              name="outcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outcome</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || 'pending'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select outcome" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Feedback */}
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter feedback from the interview"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any notes about this interview stage"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateStageMutation.isPending}>
                {updateStageMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}