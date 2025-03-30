import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

const coverLetterSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  template: z.string().default('standard'),
  content: z.object({
    header: z.object({
      fullName: z.string().min(1, { message: 'Full name is required' }),
      email: z.string().email({ message: 'Please enter a valid email' }),
      phone: z.string().optional(),
      location: z.string().optional(),
      date: z.string().optional(),
    }),
    recipient: z.object({
      name: z.string().optional(),
      company: z.string().optional(),
      position: z.string().optional(),
      address: z.string().optional(),
    }),
    body: z.string().min(1, { message: 'Letter content is required' }),
    closing: z.string().optional(),
  }).default({
    header: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      date: new Date().toLocaleDateString(),
    },
    recipient: {
      name: '',
      company: '',
      position: '',
      address: '',
    },
    body: '',
    closing: 'Sincerely,',
  }),
});

type CoverLetterFormValues = z.infer<typeof coverLetterSchema>;

interface CoverLetterFormProps {
  coverLetter?: any;
  onSuccess?: () => void;
}

export default function CoverLetterForm({ coverLetter, onSuccess }: CoverLetterFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: CoverLetterFormValues = {
    name: coverLetter?.name || '',
    template: coverLetter?.template || 'standard',
    content: coverLetter?.content || {
      header: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        date: new Date().toLocaleDateString(),
      },
      recipient: {
        name: '',
        company: '',
        position: '',
        address: '',
      },
      body: '',
      closing: 'Sincerely,',
    },
  };

  const form = useForm<CoverLetterFormValues>({
    resolver: zodResolver(coverLetterSchema),
    defaultValues,
  });

  const createCoverLetterMutation = useMutation({
    mutationFn: async (data: CoverLetterFormValues) => {
      return apiRequest('POST', '/api/cover-letters', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
      toast({
        title: 'Cover Letter Created',
        description: 'Your cover letter has been created successfully',
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create cover letter: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateCoverLetterMutation = useMutation({
    mutationFn: async (data: CoverLetterFormValues) => {
      return apiRequest('PUT', `/api/cover-letters/${coverLetter?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
      toast({
        title: 'Cover Letter Updated',
        description: 'Your cover letter has been updated successfully',
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update cover letter: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: CoverLetterFormValues) => {
    setIsSubmitting(true);
    try {
      if (coverLetter?.id) {
        await updateCoverLetterMutation.mutateAsync(data);
      } else {
        await createCoverLetterMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Letter Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Software Developer Application" {...field} />
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
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Tabs defaultValue="sender">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="sender">Your Information</TabsTrigger>
            <TabsTrigger value="recipient">Recipient</TabsTrigger>
            <TabsTrigger value="content">Letter Content</TabsTrigger>
          </TabsList>
          
          {/* Sender Information */}
          <TabsContent value="sender">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="content.header.fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content.header.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="content.header.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(123) 456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="content.header.location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, State ZIP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="content.header.date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., June 1, 2023" 
                          {...field} 
                          defaultValue={new Date().toLocaleDateString()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Recipient Information */}
          <TabsContent value="recipient">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="content.recipient.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient's Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content.recipient.position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient's Position</FormLabel>
                      <FormControl>
                        <Input placeholder="Hiring Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content.recipient.company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Example Corporation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content.recipient.address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Business St, City, State ZIP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Cover Letter Content */}
          <TabsContent value="content">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="content.body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Letter Body</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your cover letter content here..."
                          className="min-h-[300px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content.closing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Closing</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Sincerely," 
                          {...field} 
                          defaultValue="Sincerely,"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : coverLetter ? 'Update Cover Letter' : 'Create Cover Letter'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
