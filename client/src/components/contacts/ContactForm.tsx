import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { NetworkingContact, insertNetworkingContactSchema } from '@shared/schema';
import { z } from 'zod';

// Import UI components
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

// Extend schema with validation
const formSchema = insertNetworkingContactSchema.extend({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  jobTitle: z.string().min(2, 'Job title must be at least 2 characters'),
  company: z.string().min(1, 'Company name is required'),
  linkedInUrl: z.string().url().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ContactFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<NetworkingContact>;
  isEdit?: boolean;
}

export default function ContactForm({
  onSuccess,
  onCancel,
  initialData,
  isEdit = false,
}: ContactFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || null,
      phone: initialData?.phone || null,
      jobTitle: initialData?.jobTitle || '',
      company: initialData?.company || '',
      relationshipType: initialData?.relationshipType || 'Other',
      linkedInUrl: initialData?.linkedInUrl || null,
      notes: initialData?.notes || null,
      lastContactedDate: initialData?.lastContactedDate || null,
    },
  });

  // Create or update contact mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEdit && initialData?.id) {
        return apiRequest<NetworkingContact>(`/api/contacts/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        });
      } else {
        return apiRequest<NetworkingContact>('/api/contacts', {
          method: 'POST',
          body: JSON.stringify(values),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/need-followup'] });
      toast({
        title: isEdit ? 'Contact updated' : 'Contact added',
        description: isEdit
          ? 'The contact information has been updated successfully.'
          : 'The contact has been added to your network.',
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: isEdit
          ? 'Failed to update the contact. Please try again.'
          : 'Failed to add the contact. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company *</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="relationshipType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship Type *</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Current Colleague">Current Colleague</SelectItem>
                    <SelectItem value="Former Colleague">Former Colleague</SelectItem>
                    <SelectItem value="Industry Expert">Industry Expert</SelectItem>
                    <SelectItem value="Mentor">Mentor</SelectItem>
                    <SelectItem value="Client">Client</SelectItem>
                    <SelectItem value="Recruiter">Recruiter</SelectItem>
                    <SelectItem value="Hiring Manager">Hiring Manager</SelectItem>
                    <SelectItem value="Friend">Friend</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="john.doe@example.com" 
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input 
                    type="tel" 
                    placeholder="+1 (555) 123-4567"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value || null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="linkedInUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn URL</FormLabel>
              <FormControl>
                <Input 
                  type="url" 
                  placeholder="https://linkedin.com/in/johndoe" 
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormDescription>
                Full URL to their LinkedIn profile
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lastContactedDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Contacted Date</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field}
                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                  onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                />
              </FormControl>
              <FormDescription>
                When did you last interact with this contact?
              </FormDescription>
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
                  placeholder="Add notes about this contact, like meeting details, things to remember, or potential collaboration opportunities."
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEdit ? 'Update Contact' : 'Add Contact'}
          </Button>
        </div>
      </form>
    </Form>
  );
}