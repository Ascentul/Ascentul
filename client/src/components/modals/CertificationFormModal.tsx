import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Define the form schema
const certificationFormSchema = z.object({
  name: z.string().min(1, { message: 'Certification name is required' }),
  issuingOrganization: z.string().min(1, { message: 'Issuing organization is required' }),
  issueDate: z.date().nullable().optional(),
  expiryDate: z.date().nullable().optional(),
  noExpiration: z.boolean().default(false),
  credentialID: z.string().nullable().optional(),
  credentialURL: z.string().url().nullable().optional().or(z.literal('')),
});

type CertificationFormValues = z.infer<typeof certificationFormSchema>;

interface CertificationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: CertificationFormValues;
  mode: 'add' | 'edit';
  certificationId?: number;
  onSuccess?: () => void;
}

export function CertificationFormModal({
  open,
  onOpenChange,
  defaultValues = {
    name: '',
    issuingOrganization: '',
    issueDate: null,
    expiryDate: null,
    noExpiration: false,
    credentialID: '',
    credentialURL: '',
  },
  mode = 'add',
  certificationId,
  onSuccess,
}: CertificationFormModalProps) {
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationFormSchema),
    defaultValues,
  });

  // Get the current values from the form to use for conditional rendering
  const noExpiration = form.watch('noExpiration');

  // Form submission mutation
  const mutation = useMutation({
    mutationFn: async (values: CertificationFormValues) => {
      // If noExpiration is true, set expiryDate to null
      if (values.noExpiration) {
        values.expiryDate = null;
      }

      // Ensure empty URL is null
      if (values.credentialURL === '') {
        values.credentialURL = null;
      }

      let response;
      if (mode === 'add') {
        response = await apiRequest('POST', '/api/career-data/certifications', values);
      } else {
        response = await apiRequest('PUT', `/api/career-data/certifications/${certificationId}`, values);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save certification');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: mode === 'add' ? 'Certification added' : 'Certification updated',
        description: 'Your changes have been saved successfully.',
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
  const onSubmit = (values: CertificationFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Certification' : 'Edit Certification'}
          </DialogTitle>
          <DialogDescription>
            Add details about your certifications, licenses, or credentials.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certification Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. AWS Certified Solutions Architect" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issuingOrganization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issuing Organization</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Amazon Web Services" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Issue Date <span className="text-muted-foreground">(Optional)</span></FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
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
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
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
              name="noExpiration"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0">
                  <FormLabel>No Expiration</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!noExpiration && (
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiry Date <span className="text-muted-foreground">(Optional)</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
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
                          disabled={(date) => date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="credentialID"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credential ID <span className="text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. ABC123XYZ" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credentialURL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credential URL <span className="text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. https://verify.credential.com/abc123" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormDescription>
                    If available, enter the URL where others can verify this credential.
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
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}