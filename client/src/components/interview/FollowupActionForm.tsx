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

// Form schema for follow-up action
const followupActionSchema = z.object({
  type: z.string().min(1, "Follow-up type is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
});

type FollowupActionFormValues = z.infer<typeof followupActionSchema>;

// Default form values
const defaultValues: Partial<FollowupActionFormValues> = {
  type: '',
  description: '',
  notes: '',
};

interface FollowupActionFormProps {
  isOpen: boolean;
  onClose: () => void;
  processId: number;
  stageId?: number; // Optional, if the follow-up is for a specific stage
  onSuccess?: () => void;
}

export function FollowupActionForm({ 
  isOpen, 
  onClose, 
  processId, 
  stageId, 
  onSuccess 
}: FollowupActionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FollowupActionFormValues>({
    resolver: zodResolver(followupActionSchema),
    defaultValues,
  });

  // Create follow-up action mutation
  const createFollowupMutation = useMutation({
    mutationFn: async (values: FollowupActionFormValues) => {
      const followupData = {
        ...values,
        processId,
        ...(stageId && { stageId }),
      };
      
      const response = await apiRequest('POST', `/api/interview/processes/${processId}/followups`, followupData);
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/interview/followups'] });
      queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${processId}/followups`] });
      queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
      
      toast({
        title: 'Success',
        description: 'Follow-up action added successfully',
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
        description: `Failed to add follow-up action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: FollowupActionFormValues) => {
    createFollowupMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Follow-up Action</DialogTitle>
          <DialogDescription>
            Add a new follow-up action to stay on top of your application process.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Follow-up Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Type*</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select follow-up type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="thank_you_email">Thank You Email</SelectItem>
                      <SelectItem value="follow_up">General Follow-Up</SelectItem>
                      <SelectItem value="preparation">Interview Preparation</SelectItem>
                      <SelectItem value="document_submission">Document Submission</SelectItem>
                      <SelectItem value="networking">Networking Connection</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description*</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a description of the follow-up action"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
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
                            <span>Select due date</span>
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
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional notes"
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
              <Button type="submit" disabled={createFollowupMutation.isPending}>
                {createFollowupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Follow-up Action'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}