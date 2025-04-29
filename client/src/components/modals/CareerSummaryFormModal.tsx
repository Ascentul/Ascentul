import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

// Define the form schema
const careerSummaryFormSchema = z.object({
  summary: z.string().min(1, { message: 'Career summary is required' }).max(750, {
    message: 'Career summary must not exceed 750 characters',
  }),
});

type CareerSummaryFormValues = z.infer<typeof careerSummaryFormSchema>;

interface CareerSummaryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValue?: string;
  onSuccess?: () => void;
}

export function CareerSummaryFormModal({
  open,
  onOpenChange,
  defaultValue = '',
  onSuccess,
}: CareerSummaryFormModalProps) {
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<CareerSummaryFormValues>({
    resolver: zodResolver(careerSummaryFormSchema),
    defaultValues: {
      summary: defaultValue || '',
    },
  });

  // Form submission mutation
  const mutation = useMutation({
    mutationFn: async (values: CareerSummaryFormValues) => {
      const response = await apiRequest('PUT', '/api/career-data/career-summary', {
        summary: values.summary,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save career summary');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: 'Career summary updated',
        description: 'Your career summary has been saved successfully.',
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/career-data'] });

      // Close the modal
      onOpenChange(false);

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submit handler
  const onSubmit = (values: CareerSummaryFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Career Summary</DialogTitle>
          <DialogDescription>
            Provide a concise overview of your professional background, skills, and career aspirations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Career Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write a professional summary that highlights your experience, skills, and career goals..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {form.watch('summary')?.length || 0}/750 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Summary'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}