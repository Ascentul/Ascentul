import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Form schema for interview stage
const interviewStageSchema = z.object({
  type: z.string().min(1, "Interview type is required"),
  scheduledDate: z.date().optional(),
  location: z.string().optional(),
  interviewers: z.string().optional(),
  notes: z.string().optional(),
  // Add these fields for TypeScript compatibility
  applicationId: z.number().optional(),
  processId: z.number().optional(),
});

type InterviewStageFormValues = z.infer<typeof interviewStageSchema>;

// Default form values
const defaultValues: Partial<InterviewStageFormValues> = {
  type: '',
  location: '',
  interviewers: '',
  notes: '',
};

interface InterviewStageFormProps {
  isOpen: boolean;
  onClose: () => void;
  processId?: number;
  applicationId?: number;
  onSuccess?: () => void;
}

export function InterviewStageForm({ isOpen, onClose, processId, applicationId, onSuccess }: InterviewStageFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<InterviewStageFormValues>({
    resolver: zodResolver(interviewStageSchema),
    defaultValues,
  });

  // Create interview stage mutation
  const createStageMutation = useMutation({
    mutationFn: async (values: InterviewStageFormValues) => {
      // Format the interviewers as an array if it's provided
      const interviewersArray = values.interviewers 
        ? values.interviewers.split(',').map(i => i.trim()) 
        : [];
      
      // Create properly typed data object for the stage
      const stageData: InterviewStageFormValues & {
        interviewers: string[];
        applicationId?: number;
        processId?: number;
      } = {
        ...values,
        interviewers: interviewersArray,
      };
      
      // Add the appropriate ID based on what's available
      if (applicationId) {
        stageData.applicationId = applicationId;
        try {
          // Try to save the interview stage to the server
          const response = await apiRequest('POST', `/api/applications/${applicationId}/stages`, stageData);
          return await response.json();
        } catch (error) {
          console.error(`Error adding interview stage to application ${applicationId}:`, error);
          
          // Check if error is "Application not found" (indicating localStorage-only application)
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('not found') || errorMessage.includes('404')) {
            // Fallback to localStorage for applications that exist only there
            console.log('Application not found on server, adding interview stage to localStorage application');
            
            // Get applications from localStorage
            const storedApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
            const appIndex = storedApplications.findIndex((app: any) => app.id === applicationId);
            
            if (appIndex === -1) {
              throw new Error('Application not found in localStorage either');
            }
            
            // Create a mock interview stage
            const now = new Date().toISOString();
            
            // Ensure we have a scheduled date for localStorage storage
            let scheduledDate = stageData.scheduledDate;
            if (!scheduledDate) {
              // Default to 7 days from now if no date provided
              const defaultDate = new Date();
              defaultDate.setDate(defaultDate.getDate() + 7);
              scheduledDate = defaultDate;
            }
            
            const mockStage = {
              id: Date.now(), // Use timestamp as mock ID
              applicationId: applicationId,
              type: stageData.type,
              status: 'scheduled',
              scheduledDate: new Date(scheduledDate).toISOString(), // Always ensure a valid date
              completedDate: null,
              location: stageData.location || null,
              interviewers: stageData.interviewers || [],
              notes: stageData.notes || null,
              outcome: 'scheduled', // Set outcome to scheduled for dashboard display
              createdAt: now,
              updatedAt: now
            };
            
            // Update application status to "Interviewing"
            storedApplications[appIndex].status = 'Interviewing';
            storedApplications[appIndex].updatedAt = now;
            
            // Store mock interview stage in both localStorage keys for compatibility
            const mockStages = JSON.parse(localStorage.getItem(`mockInterviewStages_${applicationId}`) || '[]');
            mockStages.push(mockStage);
            
            // Store in both localStorage keys
            localStorage.setItem(`mockInterviewStages_${applicationId}`, JSON.stringify(mockStages));
            localStorage.setItem(`mockStages_${applicationId}`, JSON.stringify(mockStages));
            localStorage.setItem('mockJobApplications', JSON.stringify(storedApplications));
            
            console.log('Saved mock interview stage in localStorage:', mockStage);
            return mockStage;
          }
          
          // If it's another error, rethrow
          throw error;
        }
      } else if (processId) {
        stageData.processId = processId;
        const response = await apiRequest('POST', `/api/interview/processes/${processId}/stages`, stageData);
        return await response.json();
      } else {
        throw new Error('Either applicationId or processId must be provided');
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/interview/stages'] });
      
      if (processId) {
        queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${processId}/stages`] });
        queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
      }
      
      if (applicationId) {
        queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/stages`] });
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      }
      
      toast({
        title: 'Success',
        description: 'Interview stage added successfully',
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
        description: `Failed to add interview stage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: InterviewStageFormValues) => {
    console.log("Submitting new interview stage:", values);
    
    // Ensure we have a scheduled date for the interview (required for dashboard display)
    const updatedValues = { ...values };
    
    // If no date was selected, default to 7 days from now
    if (!updatedValues.scheduledDate) {
      console.log("No scheduled date selected, defaulting to 7 days from now");
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      updatedValues.scheduledDate = defaultDate;
    }
    
    // Use the mutation to handle the interview stage creation
    // The mutation will try the API first, then fall back to localStorage if needed
    createStageMutation.mutate(updatedValues);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Interview Stage</DialogTitle>
          <DialogDescription>
            Add a new interview stage to track your progress with this application.
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
                        selected={field.value}
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
              <Button type="submit" disabled={createStageMutation.isPending}>
                {createStageMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Interview Stage'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}