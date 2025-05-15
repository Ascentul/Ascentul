import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { NetworkingContact } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertTriangle,
  CalendarRange, 
  Loader2 
} from 'lucide-react';
import { format } from 'date-fns';

// Form validation schema
const formSchema = z.object({
  fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email' }).optional().nullable(),
  phone: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(), // changed from position to jobTitle
  company: z.string().min(1, { message: 'Company name is required' }),
  linkedInUrl: z.string().url({ message: 'Please enter a valid URL' }).optional().nullable(), // changed from linkedinUrl to linkedInUrl
  relationshipType: z.string(),
  lastContactedDate: z.date().optional().nullable(), // changed from lastContactDate to lastContactedDate
  notes: z.string().optional().nullable(),
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

  // Set up form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      jobTitle: initialData?.jobTitle || '', // Changed from position to jobTitle
      company: initialData?.company || '',
      linkedInUrl: initialData?.linkedInUrl || '', // Changed from linkedinUrl to linkedInUrl
      relationshipType: initialData?.relationshipType || '',
      lastContactedDate: initialData?.lastContactedDate ? new Date(initialData.lastContactedDate) : null, // Changed from lastContactDate to lastContactedDate
      notes: initialData?.notes || '',
    },
  });

  // Create or update contact mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEdit && initialData?.id) {
        return apiRequest<NetworkingContact>({
          url: `/api/contacts/${initialData.id}`,
          method: 'PUT',
          data: values
        });
      } else {
        return apiRequest<NetworkingContact>({
          url: '/api/contacts',
          method: 'POST',
          data: values
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/need-followup'] });
      toast({
        title: isEdit ? 'Contact updated' : 'Contact added',
        description: isEdit
          ? 'The contact has been successfully updated.'
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

  // Submit form
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name*</FormLabel>
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe@example.com" {...field} value={field.value || ''} />
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
                  <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input placeholder="Software Engineer" {...field} value={field.value || ''} />
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
                <FormLabel>Company*</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Inc." {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="linkedInUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://linkedin.com/in/johndoe" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Website URL field is not in the current schema */}
        </div>

        <FormField
          control={form.control}
          name="relationshipType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship Type*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a relationship type" />
                  </SelectTrigger>
                </FormControl>
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
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="lastContactedDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Contact Date</FormLabel>
                <FormControl>
                  <div className="relative w-[160px]">
                    <Input
                      type="date"
                      className="w-full"
                      {...field}
                      value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null;
                        field.onChange(date);
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Next Follow-Up Date field is not in the current schema */}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional notes about this contact" 
                  className="min-h-[100px]" 
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Update Contact' : 'Add Contact'}
          </Button>
        </div>
      </form>
    </Form>
  );
}