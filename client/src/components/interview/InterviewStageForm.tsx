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
      
      const stageData = {
        ...values,
        interviewers: interviewersArray,
      };
      
      // Add the appropriate ID based on what's available
      if (applicationId) {
        stageData.applicationId = applicationId;
        const response = await apiRequest('POST', `/api/applications/${applicationId}/stages`, stageData);
        return await response.json();
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
    createStageMutation.mutate(values);
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