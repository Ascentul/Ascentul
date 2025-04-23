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
        return response.json();
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
    onError: (error) => {
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
                    onClick={() => {
                      const result = form.trigger(['jobTitle', 'companyName']);
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Job Details</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="font-medium w-24">Title:</span>
                      <span>{form.getValues('jobTitle')}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">Company:</span>
                      <span>{form.getValues('companyName')}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">Location:</span>
                      <span>{form.getValues('jobLocation') || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Application Details</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex">
                      <span className="font-medium w-24">Status:</span>
                      <span>Not Started</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">Date:</span>
                      <span>{form.getValues('applicationDate')}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">Resume:</span>
                      <span>{form.getValues('resumeId') ? `Selected (ID: ${form.getValues('resumeId')})` : 'None selected'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes about this application..." 
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
                name="aiAssisted"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input 
                        type="checkbox" 
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="cursor-pointer">Use AI to optimize this application</FormLabel>
                      <FormDescription>
                        Let our AI suggest improvements for your resume and cover letter
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={createApplication.isPending}
                >
                  {createApplication.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Add Application'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}