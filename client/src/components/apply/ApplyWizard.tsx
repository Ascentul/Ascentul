import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { JobSearch, type Job } from './JobSearch';

// Define the form schema for job application
const applicationSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().min(1, "Company name is required"),
  jobLocation: z.string().optional(),
  applicationDate: z.string().optional(),
  resumeId: z.number().optional(),
  coverLetterId: z.number().optional(),
  jobLink: z.string().url("Please enter a valid URL").optional(),
  jobDescription: z.string().optional(),
  status: z.string().default("Not Started"),
  notes: z.string().optional(),
  aiAssisted: z.boolean().default(false),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

// The ApplyWizard props
interface ApplyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  jobInfo?: { 
    title: string; 
    company: string; 
    url: string; 
    description: string;
    location?: string;
  } | null;
}

export function ApplyWizard({ isOpen, onClose, jobInfo = null }: ApplyWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // React Hook Form setup
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      jobTitle: "",
      companyName: "",
      jobLocation: "",
      jobLink: "",
      jobDescription: "",
      applicationDate: new Date().toISOString().split('T')[0],
      status: "Not Started",
      notes: "",
      aiAssisted: true,
    }
  });

  // When jobInfo is provided, use it to pre-populate the form
  useEffect(() => {
    if (jobInfo && isOpen) {
      // If we have job info coming in from a search result, use it
      const initialValues = {
        jobTitle: jobInfo.title,
        companyName: jobInfo.company,
        jobLocation: jobInfo.location || '',
        jobLink: jobInfo.url,
        jobDescription: jobInfo.description,
        status: "Not Started" as const,
      };
      
      form.reset(initialValues);
      // Skip job search step if we already have job info
      setStep(2);
    }
  }, [jobInfo, isOpen, form]);

  // Fetch resumes for the resume selection step
  const { data: resumes, isLoading: isLoadingResumes } = useQuery({
    queryKey: ['/api/resumes'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/resumes');
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error('Error fetching resumes:', error);
        return [];
      }
    },
    enabled: isOpen && step === 2
  });

  // Create application mutation
  const createApplication = useMutation({
    mutationFn: async (values: ApplicationFormValues) => {
      const response = await apiRequest<{ success: boolean, message: string }>({
        url: '/api/job-applications',
        method: 'POST',
        data: values,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Application created",
        description: "Your job application has been added to the tracker.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      onClose();
      setStep(1);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "There was a problem creating your application. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating application:', error);
    }
  });

  // Handle form submission
  const onSubmit = (values: ApplicationFormValues) => {
    createApplication.mutate(values);
  };

  // Reset form and steps when closing the dialog
  const handleClose = () => {
    setStep(1);
    form.reset();
    onClose();
  };

  // Handle job selection
  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    form.setValue('jobTitle', job.title);
    form.setValue('companyName', job.company);
    form.setValue('jobLocation', job.location || '');
    form.setValue('jobLink', job.applyUrl);
    form.setValue('jobDescription', job.fullDescription || job.description);
    setStep(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Application Agent</DialogTitle>
          <DialogDescription>
            {step === 1 && "Start by adding job details or import from a job board."}
            {step === 2 && "Select or upload a resume for this application."}
            {step === 3 && "Review and submit your application details."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Enter Manually</TabsTrigger>
              <TabsTrigger value="import">Import Job</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual">
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Software Engineer" {...field} />
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
                        <FormLabel>Company Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Acme Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="jobLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Remote, New York, NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="applicationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="jobLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/job-posting" 
                            {...field}
                            value={field.value || ''}
                          />
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
                            placeholder="Paste the job description here..." 
                            className="min-h-[120px]"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="button" 
                    className="w-full" 
                    onClick={async () => {
                      const result = await form.trigger(['jobTitle', 'companyName']);
                      if (result) setStep(2);
                    }}
                  >
                    Continue to Resume Selection
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="import">
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md">
                  <h3 className="font-medium mb-2">Import from URL</h3>
                  <div className="flex space-x-2">
                    <Input placeholder="Paste job URL" />
                    <Button type="button">Import</Button>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="font-medium mb-4">Search for Jobs</h3>
                  {/* Add our new JobSearch component */}
                  <JobSearch onSelectJob={handleJobSelect} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isLoadingResumes ? (
                <div className="col-span-full flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : resumes && resumes.length > 0 ? (
                resumes.map((resume: any) => (
                  <Card 
                    key={resume.id} 
                    className={`cursor-pointer hover:border-primary transition-colors ${form.getValues('resumeId') === resume.id ? 'border-primary bg-primary/5' : ''}`}
                    onClick={() => form.setValue('resumeId', resume.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{resume.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Last updated: {new Date(resume.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {form.getValues('resumeId') === resume.id && (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                            ✓
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full p-8 text-center bg-muted rounded-md">
                  <p>No resumes found. Create one in the Resume Builder.</p>
                  <Button 
                    variant="link" 
                    onClick={() => window.location.href = '/resume'}
                  >
                    Go to Resume Builder
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button 
                onClick={() => setStep(3)}
              >
                Continue to Review
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium">Job Details</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Job Title</Label>
                    <p className="text-sm font-medium">{form.getValues('jobTitle')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Company</Label>
                    <p className="text-sm font-medium">{form.getValues('companyName')}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <p className="text-sm">{form.getValues('jobLocation') || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <p className="text-sm">{form.getValues('applicationDate')}</p>
                  </div>
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes about this application..." 
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include any details you want to remember about this application.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Applied">Applied</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Update the status as your application progresses.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="aiAssisted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 mt-1"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>AI Assistant Enabled</FormLabel>
                      <FormDescription>
                        Get AI-powered insights and suggestions for this application.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <div className="flex justify-between w-full">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button type="submit" disabled={createApplication.isPending}>
                    {createApplication.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Create Application'
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}