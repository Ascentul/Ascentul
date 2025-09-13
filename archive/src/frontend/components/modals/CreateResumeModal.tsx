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
  targetJobTitle: z.string().min(2, 'Job title must be at least 2 characters').max(100),
  targetCompany: z.string().optional(),
  industry: z.string().min(2, 'Industry must be at least 2 characters'),
  summary: z.string().min(20, 'Summary should be at least 20 characters'),
  template: z.enum(['modern', 'professional', 'creative', 'minimal']),
});

type FormData = z.infer<typeof formSchema>;

interface CreateResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateResumeModal({ isOpen, onClose }: CreateResumeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default form values
  const defaultValues: FormData = {
    title: '',
    targetJobTitle: '',
    targetCompany: '',
    industry: '',
    summary: '',
    template: 'modern',
  };
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  const createResumeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest('POST', '/api/resumes', data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch resumes query
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
      
      // Show success message
      toast({
        title: "Resume created",
        description: "Your resume has been created successfully.",
      });
      
      // Reset form and close modal
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to create resume",
        description: error.message || "There was a problem creating your resume. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormData) => {
    createResumeMutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Resume</DialogTitle>
          <DialogDescription>
            Create a professional resume tailored to your target job.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resume Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Frontend Developer Resume" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetJobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Frontend Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="targetCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Company (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Google" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input placeholder="Technology" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Summary</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Skilled frontend developer with 5 years of experience..."
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
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
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
                disabled={createResumeMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createResumeMutation.isPending}
              >
                {createResumeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Resume"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}