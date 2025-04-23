import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm } from 'react-hook-form';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';

interface ApplicationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  jobDetails: {
    id?: string;
    title: string;
    company: string; 
    description: string;
    location?: string;
    url?: string;
    adzunaJobId?: string;
  };
}

export function ApplicationWizard({ isOpen, onClose, jobDetails }: ApplicationWizardProps) {
  const [step, setStep] = useState(1);
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Form control
  const { register, handleSubmit, reset, watch, getValues, formState: { errors, isSubmitting } } = useForm();

  // Reset step when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      reset();
    }
  }, [isOpen, reset]);

  // Check if we already have application data if an ID was provided
  const { data: existingApplication, isLoading: isLoadingApplication } = useQuery({
    queryKey: ['/api/applications', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      try {
        const response = await apiRequest({
          url: `/api/applications/${applicationId}`,
          method: 'GET'
        });
        return response;
      } catch (error) {
        // For demo purposes, create a mock application if authentication fails
        const errorWithMessage = error as { message?: string };
        if (errorWithMessage.message?.includes('Authentication required')) {
          console.log('Demo mode: Creating mock application data');
          return {
            application: {
              id: applicationId,
              title: jobDetails.title,
              company: jobDetails.company,
              status: 'in_progress',
              createdAt: new Date().toISOString(),
            },
            steps: [
              { id: 1, applicationId: applicationId, stepName: 'personal_info', stepOrder: 1, completed: true },
              { id: 2, applicationId: applicationId, stepName: 'resume', stepOrder: 2, completed: false },
              { id: 3, applicationId: applicationId, stepName: 'cover_letter', stepOrder: 3, completed: false },
              { id: 4, applicationId: applicationId, stepName: 'review', stepOrder: 4, completed: false }
            ]
          };
        }
        throw error;
      }
    },
    enabled: !!applicationId,
  });

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await apiRequest({
          url: '/api/applications',
          method: 'POST',
          data: {
            jobId: 0, // We'll create a local job entry from the Adzuna data
            title: jobDetails.title,
            jobTitle: jobDetails.title, // Additional field for Interview.tsx compatibility
            position: jobDetails.title, // Additional field for Interview.tsx compatibility
            company: jobDetails.company,
            companyName: jobDetails.company, // Additional field for Interview.tsx compatibility
            location: jobDetails.location || 'Remote',
            jobLocation: jobDetails.location || 'Remote', // Additional field for Interview.tsx compatibility
            description: jobDetails.description,
            status: 'In Progress', // Capitalized for consistency in display
            adzunaJobId: jobDetails.adzunaJobId || jobDetails.id || '',
            externalJobUrl: jobDetails.url || '',
            jobLink: jobDetails.url || '', // Additional field for Interview.tsx compatibility
            notes: data.notes || '',
            source: 'Adzuna'
          }
        });
        return response;
      } catch (error) {
        // For demo purposes, create a temporary mock application
        const errorWithMessage = error as { message?: string };
        if (errorWithMessage.message?.includes('Authentication required')) {
          // Simulate a successful response with mock data
          const mockId = Math.floor(Math.random() * 10000);
          console.log('Demo mode: Creating mock application data');
          
          // Create a complete mock application object with full compatibility
          const mockApp = {
            id: mockId,
            // Standard fields
            title: jobDetails.title,
            company: jobDetails.company,
            companyName: jobDetails.company,
            status: 'In Progress',
            location: jobDetails.location || 'Remote',
            jobLocation: jobDetails.location || 'Remote',
            position: jobDetails.title,
            jobTitle: jobDetails.title,
            jobDescription: jobDetails.description,
            notes: data.notes || '',
            // URL fields
            externalJobUrl: jobDetails.url || '',
            jobLink: jobDetails.url || '',
            // Date fields
            createdAt: formatDate(),
            updatedAt: formatDate(),
            applicationDate: formatDate(),
            submittedAt: null,
            appliedAt: null,
            // Source tracking
            source: 'Adzuna',
            // Additional metadata
            adzunaJobId: jobDetails.adzunaJobId || jobDetails.id || null,
          };
          
          // Store initial application in localStorage
          const storedApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
          storedApplications.push(mockApp);
          localStorage.setItem('mockJobApplications', JSON.stringify(storedApplications));
          
          return {
            application: mockApp,
            steps: [
              { id: mockId * 10 + 1, applicationId: mockId, stepName: 'personal_info', stepOrder: 1, completed: true, data: { notes: data.notes || '' } },
              { id: mockId * 10 + 2, applicationId: mockId, stepName: 'resume', stepOrder: 2, completed: false, data: {} },
              { id: mockId * 10 + 3, applicationId: mockId, stepName: 'cover_letter', stepOrder: 3, completed: false, data: {} },
              { id: mockId * 10 + 4, applicationId: mockId, stepName: 'review', stepOrder: 4, completed: false, data: {} }
            ]
          };
        }
        throw error;
      }
    },
    onSuccess: (data: any) => {
      setApplicationId(data.application.id);
      
      // Invalidate all application-related queries to ensure updated data is fetched
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      
      // Force an immediate refresh of the job applications list
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
      }, 100);
      
      toast({
        title: 'Application created',
        description: 'Your application has been started successfully.',
      });
      setStep(2);
    },
    onError: (error) => {
      console.error('Error creating application:', error);
      toast({
        title: 'Error',
        description: 'Failed to create application. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Update application step mutation
  const updateStepMutation = useMutation({
    mutationFn: async ({ stepId, data }: { stepId: number; data: any }) => {
      try {
        return await apiRequest({
          url: `/api/applications/steps/${stepId}/complete`,
          method: 'POST',
          data
        });
      } catch (error) {
        // For demo purposes, simulate a successful step update
        const errorWithMessage = error as { message?: string };
        if (errorWithMessage.message?.includes('Authentication required')) {
          console.log('Demo mode: Simulating successful step update');
          return { 
            id: stepId,
            completed: true, 
            data: data
          };
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Refresh application data
      queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      
      // Force immediate refresh
      queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
    }
  });

  // Submit application mutation
  const submitApplicationMutation = useMutation({
    mutationFn: async () => {
      if (!applicationId) throw new Error('No application ID');
      try {
        return await apiRequest({
          url: `/api/applications/${applicationId}/submit`,
          method: 'POST'
        });
      } catch (error) {
        // For demo purposes, simulate a successful application submission
        const errorWithMessage = error as { message?: string };
        if (errorWithMessage.message?.includes('Authentication required')) {
          console.log('Demo mode: Simulating successful application submission');
          
          // In demo mode, default to not applied
          let hasBeenApplied = false;
          
          // For the final step where a checkbox is present, try to determine if it was checked
          // This must be done before form submission since the form will be reset after submission
          try {
            // Look for applied status in local storage
            const storedData = localStorage.getItem(`application_${applicationId}_data`);
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              hasBeenApplied = !!parsedData.applied;
              console.log('Found stored application data with applied status:', hasBeenApplied);
            } else {
              console.log('No stored application data found, using default not applied status');
            }
          } catch (err) {
            console.log('Could not determine applied status, using default not applied status');
          }
          
          // Create a complete mock application object for the Interview page with full format compatibility
          const completedApplication = { 
            id: applicationId,
            // Status fields
            status: hasBeenApplied ? 'Applied' : 'In Progress', // Set status based on checkbox
            appliedAt: hasBeenApplied ? formatDate() : null,
            submittedAt: hasBeenApplied ? formatDate() : null,
            applicationDate: formatDate(),
            // Job details fields with multiple naming formats for compatibility
            company: jobDetails.company,
            companyName: jobDetails.company, 
            position: jobDetails.title,
            jobTitle: jobDetails.title,
            title: jobDetails.title,
            // Location fields with multiple naming formats
            location: jobDetails.location || 'Remote',
            jobLocation: jobDetails.location || 'Remote',
            // Description and notes
            jobDescription: jobDetails.description,
            description: jobDetails.description,
            notes: hasBeenApplied ? 'Applied via Ascentul' : 'Started application in Ascentul',
            // Date tracking
            createdAt: formatDate(),
            updatedAt: formatDate(),
            // URL fields
            jobLink: jobDetails.url || '',
            externalJobUrl: jobDetails.url || '',
            // Source tracking
            source: 'Adzuna',
            adzunaJobId: jobDetails.adzunaJobId || jobDetails.id || null,
          };
          
          // Store the completed application in localStorage for demo mode
          const storedApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
          // Check if application with this ID already exists
          const existingIndex = storedApplications.findIndex((app: any) => app.id === applicationId);
          
          if (existingIndex >= 0) {
            // Update existing application
            storedApplications[existingIndex] = completedApplication;
          } else {
            // Add new application
            storedApplications.push(completedApplication);
          }
          
          localStorage.setItem('mockJobApplications', JSON.stringify(storedApplications));
          console.log('Stored mock application in localStorage:', completedApplication);
          
          return completedApplication;
        }
        throw error;
      }
    },
    onSuccess: (data: any) => {
      // Invalidate all application-related queries to ensure updated data is fetched
      // Invalidate both /api/applications and /api/job-applications endpoints
      // as both may be used in different parts of the application
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/applications', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      
      // For backwards compatibility, also invalidate interview processes
      queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
      
      // Invalidate general user data to refresh notifications and counts
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      
      // Force multiple immediate refreshes of the application list to ensure data is updated
      // First immediate refresh
      queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
      
      // Second refresh after a short delay to ensure any server processing is complete
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
      }, 300);
      
      // Final refresh after database operations should be complete
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
      }, 800);
      
      toast({
        title: 'Application submitted',
        description: 'Your application has been marked as submitted and added to your applications tracker.',
        duration: 5000, // Give users a bit more time to read the message
      });
      
      // Navigate to the interviews page which contains the application tracker
      onClose();
      setLocation('/interviews');
    },
    onError: (error) => {
      console.error('Error submitting application:', error);
      
      let errorMessage = 'Failed to submit application. Please try again.';
      
      // Check if the error has detailed information from the server
      const axiosError = error as { response?: { data?: { message?: string } } };
      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      } else if ((error as Error).message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Submission Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Handle step submission
  const onSubmitStep = async (data: any) => {
    try {
      if (step === 1) {
        createApplicationMutation.mutate(data);
      } else if (applicationId && existingApplication) {
        const applicationWithSteps = existingApplication as { steps: Array<{ id: number, stepOrder: number }> };
        const currentStep = applicationWithSteps.steps.find((s) => s.stepOrder === step);
        if (currentStep) {
          await updateStepMutation.mutateAsync({ 
            stepId: currentStep.id, 
            data: {
              ...data,
              completed: true
            }
          });
          
          // If this is the last step, submit the application
          const applicationWithSteps = existingApplication as { steps: Array<{ id: number, stepOrder: number }> };
          if (step === applicationWithSteps.steps.length) {
            submitApplicationMutation.mutate();
          } else {
            // Move to next step
            setStep(step + 1);
          }
        }
      }
    } catch (error) {
      console.error('Error in onSubmitStep:', error);
      
      // Provide a user-friendly error message based on the error type
      let errorMessage = 'Failed to complete this step. Please try again.';
      
      const errorWithMessage = error as { message?: string };
      if (errorWithMessage.message?.includes('Authentication required')) {
        errorMessage = 'Please sign in to track your application progress.';
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  // Render current step
  const renderStepContent = () => {
    if (isLoadingApplication) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSubmit(onSubmitStep)}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Application Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this application"
                  className="mt-1"
                  {...register('notes')}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Start Application'
                )}
              </Button>
            </div>
          </form>
        );
      
      case 2: // Resume selection
        return (
          <form onSubmit={handleSubmit(onSubmitStep)}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="resumeId">Select Resume</Label>
                <select 
                  id="resumeId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('resumeId')}
                >
                  <option value="">None</option>
                  <option value="1">My General Resume</option>
                  <option value="2">Software Engineer Resume</option>
                  <option value="3">Product Management Resume</option>
                </select>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  A resume is required for most applications, but you can skip this step if you're applying through the company website.
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Previous
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Next'
                )}
              </Button>
            </div>
          </form>
        );
        
      case 3: // Cover Letter
        return (
          <form onSubmit={handleSubmit(onSubmitStep)}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="coverLetterId">Select Cover Letter</Label>
                <select 
                  id="coverLetterId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('coverLetterId')}
                >
                  <option value="">None</option>
                  <option value="1">General Cover Letter</option>
                  <option value="2">Software Engineering Cover Letter</option>
                  <option value="3">Product Management Cover Letter</option>
                </select>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You can skip this step if a cover letter is not required.
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Previous
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Next'
                )}
              </Button>
            </div>
          </form>
        );
        
      case 4: // Final Review
        return (
          <form onSubmit={handleSubmit(onSubmitStep)}>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm">Job Details:</h3>
                <p className="mt-1">
                  <span className="font-semibold">{jobDetails.title}</span> at {jobDetails.company}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Status:</h3>
                <p className="mt-1">In Progress</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Mark as Applied:</h3>
                <div className="flex items-center mt-2">
                  <input 
                    type="checkbox" 
                    id="applied" 
                    className="mr-2"
                    {...register('applied')} 
                  />
                  <Label htmlFor="applied">I've submitted this application</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="submissionNotes">Submission Notes</Label>
                <Textarea
                  id="submissionNotes"
                  placeholder="Add any notes about your submission"
                  className="mt-1"
                  {...register('submissionNotes')}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
                Previous
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                onClick={() => {
                  // Store the current form data with applied checkbox status in localStorage
                  try {
                    // Get form values including the applied checkbox status
                    // We have to access the form values from the form object
                    const formData = getValues();
                    console.log('Storing application data before submission:', formData);
                    localStorage.setItem(`application_${applicationId}_data`, JSON.stringify(formData));
                  } catch (e) {
                    console.error('Failed to store form data:', e);
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  'Complete Application'
                )}
              </Button>
            </div>
          </form>
        );
      
      default:
        return <div>Invalid step</div>;
    }
  };

  // Create a date for application date in correct format
  const formatDate = () => {
    const now = new Date();
    return now.toISOString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'Start Application' : step === 4 ? 'Review Application' : `Application Step ${step}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? `Track your application for ${jobDetails.title} at ${jobDetails.company}` 
              : step === 4 
                ? 'Review and complete your application'
                : 'Complete each step to track your application progress'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}