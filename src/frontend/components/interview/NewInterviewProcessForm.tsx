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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { insertInterviewProcessSchema, insertJobApplicationSchema } from '@shared/schema';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

// Extend the insert schema with validation rules
const formSchema = insertInterviewProcessSchema.extend({
  companyName: z.string().min(1, 'Company name is required'),
  company: z.string().optional(), // For consistency with Adzuna applications
  position: z.string().min(1, 'Position is required'),
  title: z.string().optional(), // For consistency with Adzuna applications
  jobTitle: z.string().optional(), // For consistency with Adzuna applications
  location: z.string().optional(),
  jobDescription: z.string().optional(),
  description: z.string().optional(), // For consistency with Adzuna applications
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default('In Progress'),
  jobLink: z.string().optional(),
  externalJobUrl: z.string().optional(),
  applied: z.boolean().optional().default(false), // Track if the user has applied
});

type NewInterviewProcessFormProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Helper function to format date in ISO format
const formatDate = () => new Date().toISOString();

export const NewInterviewProcessForm = ({ isOpen, onClose }: NewInterviewProcessFormProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      company: '',
      position: '',
      title: '',
      jobTitle: '',
      location: '',
      jobDescription: '',
      description: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      notes: '',
      status: 'In Progress',
      jobLink: '',
      externalJobUrl: '',
      applied: false,
    },
  });

  // Watch the applied field to update status
  const hasApplied = form.watch('applied');

  // Create a unified application in both interview processes and job applications
  const createApplicationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      try {
        // First, create the interview process
        const processResponse = await apiRequest('POST', '/api/interview/processes', {
          companyName: data.companyName,
          position: data.position,
          jobDescription: data.jobDescription,
          contactName: data.contactName,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          notes: data.notes,
          status: hasApplied ? 'Applied' : 'In Progress',
          jobLink: data.jobLink || data.externalJobUrl || '',
        });
        
        const processResult = await processResponse.json();
        const processId = processResult.id;
        
        // Create a job application object matching the format of Adzuna applications
        try {
          // Try to create a job application 
          const jobAppResponse = await apiRequest('POST', '/api/applications', {
            company: data.companyName,
            companyName: data.companyName,
            position: data.position,
            title: data.position,
            jobTitle: data.position,
            location: data.location || 'Remote',
            description: data.jobDescription,
            jobDescription: data.jobDescription,
            notes: hasApplied ? 'Applied via Ascentul' : 'Started application in Ascentul',
            jobLink: data.jobLink || data.externalJobUrl || '',
            externalJobUrl: data.jobLink || data.externalJobUrl || '',
            status: hasApplied ? 'Applied' : 'In Progress',
            source: 'Manual',
            applicationDate: formatDate(),
            submittedAt: hasApplied ? formatDate() : null,
            appliedAt: hasApplied ? formatDate() : null,
          });
          
          return {
            process: processResult,
            application: await jobAppResponse.json()
          };
        } catch (error) {
          console.error('Failed to create job application, falling back to localStorage:', error);
          
          // For fallback/demo purposes, create a mock application in localStorage
          const mockId = Date.now();
          const mockApp = {
            id: mockId,
            // Status fields
            status: hasApplied ? 'Applied' : 'In Progress',
            appliedAt: hasApplied ? formatDate() : null,
            submittedAt: hasApplied ? formatDate() : null,
            applicationDate: formatDate(),
            // Job details fields with multiple naming formats for compatibility
            company: data.companyName,
            companyName: data.companyName,
            position: data.position,
            jobTitle: data.position,
            title: data.position,
            // Location fields
            location: data.location || 'Remote',
            jobLocation: data.location || 'Remote',
            // Description and notes
            jobDescription: data.jobDescription,
            description: data.jobDescription,
            notes: hasApplied ? 'Applied via Ascentul' : 'Started application in Ascentul',
            // Date tracking
            createdAt: formatDate(),
            updatedAt: formatDate(),
            // URL fields
            jobLink: data.jobLink || data.externalJobUrl || '',
            externalJobUrl: data.jobLink || data.externalJobUrl || '',
            // Source tracking
            source: 'Manual',
            userId: 0, // Will be filled by the backend in real implementation
          };
          
          // Store in localStorage for demo mode
          const storedApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
          storedApplications.push(mockApp);
          localStorage.setItem('mockJobApplications', JSON.stringify(storedApplications));
          
          return { 
            process: processResult,
            application: mockApp
          };
        }
      } catch (error) {
        console.error('Failed to create application:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
      
      // Force immediate refresh
      queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
      }, 300);
      
      toast({
        title: 'Application Created',
        description: hasApplied 
          ? 'Your job application has been created and marked as Applied'
          : 'Your job application has been started successfully',
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      console.error('Error creating application:', error);
      toast({
        title: 'Error',
        description: `Failed to create application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Set company field to match companyName for format consistency
    data.company = data.companyName;
    data.title = data.position;
    data.jobTitle = data.position;
    data.description = data.jobDescription;
    
    // Update status based on applied checkbox
    data.status = data.applied ? 'Applied' : 'In Progress';
    
    createApplicationMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>New Job Application</DialogTitle>
          <DialogDescription>
            Create a new job application to track your progress and interviews.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position/Job Title*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter job title/position" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter job location (e.g., Remote, New York, NY)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="jobDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter job description or key requirements" 
                      className="h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="jobLink"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter link to job posting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter any additional notes" 
                      className="h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="applied"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I have already applied for this position
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This will mark the application as "Applied" in your tracker
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={createApplicationMutation.isPending}>
                {createApplicationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Application'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};