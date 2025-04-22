import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { insertJobApplicationSchema, type JobListing, type Resume } from '@shared/schema';
import { CheckCircle2, ArrowRight, FileText, Briefcase, Send } from 'lucide-react';
import { LoadingButton } from '@/components/ui/loading-button';

// Extend the insert schema with validation rules
const formSchema = insertJobApplicationSchema.extend({
  companyName: z.string().min(1, 'Company name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  jobLocation: z.string().optional(),
  jobDescription: z.string().optional(),
  applicationNotes: z.string().optional(),
  resumeId: z.number().optional(),
  coverLetterId: z.number().optional(),
  status: z.string().default('Not Started'),
});

type FormValues = z.infer<typeof formSchema>;

interface ApplyWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialJobListing?: JobListing | null;
}

export const ApplyWizard = ({ 
  isOpen, 
  onClose,
  initialJobListing = null,
}: ApplyWizardProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  
  // Fetch user's resumes for selection
  const { data: resumes } = useQuery<Resume[]>({
    queryKey: ['/api/resumes'],
    placeholderData: [],
  });

  // Form setup with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: initialJobListing?.companyName || '',
      jobTitle: initialJobListing?.title || '',
      jobLocation: initialJobListing?.location || '',
      jobDescription: initialJobListing?.description || '',
      jobLink: initialJobListing?.url || '',
      applicationNotes: '',
      status: 'Not Started',
    },
  });

  // Create job application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest('POST', '/api/job-applications', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application created",
        description: "Your job application has been saved successfully.",
      });
      // Reset form and close dialog
      form.reset();
      setStep(1);
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create application",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (values: FormValues) => {
    createApplicationMutation.mutate(values);
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-6">
        {[...Array(totalSteps)].map((_, index) => (
          <div key={index} className="flex items-center">
            <div 
              className={`rounded-full h-8 w-8 flex items-center justify-center border-2 
                ${step > index + 1 ? 'bg-primary border-primary text-primary-foreground' : 
                 step === index + 1 ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}`}
            >
              {step > index + 1 ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
            </div>
            {index < totalSteps - 1 && (
              <div 
                className={`h-[2px] w-10 mx-1 
                  ${step > index + 1 ? 'bg-primary' : 'bg-muted'}`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
              <DialogDescription>
                Enter the details of the job you're applying for
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Job title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Job location (optional)" {...field} />
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
                    <FormLabel>Job Link</FormLabel>
                    <FormControl>
                      <Input placeholder="URL of the job posting (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        );
      
      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Application Materials</DialogTitle>
              <DialogDescription>
                Select the resume and cover letter to use
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="resumeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resume</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a resume" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {resumes && resumes.length > 0 ? (
                          resumes.map((resume) => (
                            <SelectItem key={resume.id} value={resume.id.toString()}>
                              {resume.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No resumes available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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
                        placeholder="Paste the job description here for AI analysis" 
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        );
      
      case 3:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Application Status</DialogTitle>
              <DialogDescription>
                Set your current application status and notes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="Interviewing">Interviewing</SelectItem>
                        <SelectItem value="Offer">Offer</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applicationNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes about this application" 
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
              <LoadingButton 
                type="submit" 
                loading={createApplicationMutation.isPending}
                onClick={form.handleSubmit(handleSubmit)}
              >
                Save Application
                <Send className="ml-2 h-4 w-4" />
              </LoadingButton>
            </DialogFooter>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {renderStepIndicator()}
            {renderStepContent()}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyWizard;