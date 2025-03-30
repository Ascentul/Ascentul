import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

// Define the validation schema for the email change form
const emailChangeSchema = z.object({
  email: z.string()
    .email({ message: "Please enter a valid email address." })
    .min(1, { message: "Email is required." }),
  currentPassword: z.string()
    .min(1, { message: "Current password is required." }),
});

// Define the type for the form values
export type EmailChangeFormValues = z.infer<typeof emailChangeSchema>;

interface EmailChangeFormProps {
  currentEmail: string;
  onSubmit: (data: EmailChangeFormValues) => void;
}

const EmailChangeForm: React.FC<EmailChangeFormProps> = ({ currentEmail, onSubmit }) => {
  // Initialize the form with react-hook-form and zod validation
  const form = useForm<EmailChangeFormValues>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: {
      email: '',
      currentPassword: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Email Address</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={currentEmail}
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter className="mt-6">
          <Button type="submit">Send Verification</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default EmailChangeForm;