import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Linkedin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const linkedInProfileFormSchema = z.object({
  linkedInUrl: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .min(1, { message: "LinkedIn profile URL is required" })
    .refine((url) => url.includes('linkedin.com'), {
      message: "URL must be from linkedin.com"
    })
});

type LinkedInProfileFormValues = z.infer<typeof linkedInProfileFormSchema>;

interface LinkedInProfileFormModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  defaultValue?: string;
  onSuccess?: () => void;
}

export function LinkedInProfileFormModal({
  open,
  onOpenChange,
  onClose,
  defaultValue = '',
  onSuccess
}: LinkedInProfileFormModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LinkedInProfileFormValues>({
    resolver: zodResolver(linkedInProfileFormSchema),
    defaultValues: {
      linkedInUrl: defaultValue || ''
    }
  });

  // Reset form when modal opens/closes or defaultValue changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        linkedInUrl: defaultValue || ''
      });
    }
  }, [open, defaultValue, form]);

  const handleSubmit = async (values: LinkedInProfileFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Send to backend
      const response = await apiRequest('POST', '/api/career-data/linkedin-url', {
        linkedInUrl: values.linkedInUrl
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save LinkedIn profile URL');
      }
      
      toast({
        title: "LinkedIn Profile Updated",
        description: "Your LinkedIn profile URL has been saved successfully.",
      });
      
      // Close modal
      if (onOpenChange) {
        onOpenChange(false);
      } else if (onClose) {
        onClose();
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Linkedin className="h-5 w-5 mr-2 text-blue-600" />
            LinkedIn Profile
          </DialogTitle>
          <DialogDescription>
            Add your LinkedIn profile URL to enhance your professional presence.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="linkedInUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.linkedin.com/in/yourprofile"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the full URL to your LinkedIn profile
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange && onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}