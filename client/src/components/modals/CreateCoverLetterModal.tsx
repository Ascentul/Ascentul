import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Form schema
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  jobTitle: z.string().min(2, 'Job title must be at least 2 characters').max(100),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  contactPerson: z.string().optional(),
  keyPoints: z.string().min(10, 'Key points should be at least 10 characters'),
  tone: z.enum(['professional', 'enthusiastic', 'formal', 'conversational']),
});

type FormData = z.infer<typeof formSchema>;

interface CreateCoverLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateCoverLetterModal({ isOpen, onClose }: CreateCoverLetterModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default form values
  const defaultValues: FormData = {
    title: '',
    jobTitle: '',
    companyName: '',
    contactPerson: '',
    keyPoints: '',
    tone: 'professional',
  };
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  const createCoverLetterMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/cover-letters', data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch cover letters query
      queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
      
      // Show success message
      toast({
        title: "Cover letter created",
        description: "Your cover letter has been created successfully.",
      });
      
      // Reset form and close modal
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to create cover letter",
        description: error.message || "There was a problem creating your cover letter. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormData) => {
    createCoverLetterMutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Cover Letter</DialogTitle>
          <DialogDescription>
            Create a personalized cover letter for your job application.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Product Manager - Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Product Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corporation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="keyPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Points to Highlight</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="5 years experience in product management, led a team of 7, increased revenue by 30%..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tone</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createCoverLetterMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createCoverLetterMutation.isPending}
              >
                {createCoverLetterMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Cover Letter"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}