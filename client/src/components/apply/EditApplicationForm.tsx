import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { InterviewStageForm } from '@/components/interview/InterviewStageForm';
import { FollowupActionForm } from '@/components/interview/FollowupActionForm';
import { Loader2, CalendarIcon, Briefcase, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type JobApplication } from '@shared/schema';

// Schema for application editing
const applicationEditSchema = z.object({
  status: z.string(),
  company: z.string().min(1, 'Company name is required'),
  companyName: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  jobTitle: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
  jobDescription: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  jobLink: z.string().optional(),
  externalJobUrl: z.string().optional(),
});

type ApplicationEditFormValues = z.infer<typeof applicationEditSchema>;

interface EditApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  application: JobApplication;
  onSuccess?: () => void;
}

export function EditApplicationForm({ 
  isOpen, 
  onClose, 
  application, 
  onSuccess 
}: EditApplicationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInterviewStageForm, setShowInterviewStageForm] = useState(false);
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  
  // Get the corresponding interview process ID if available
  const [relatedProcessId, setRelatedProcessId] = useState<number | null>(null);

  useEffect(() => {
    // If status changes to "Interviewing", check if we have a corresponding process ID
    const checkForProcessId = async () => {
      try {
        // Try to fetch the corresponding interview process based on company and position
        const response = await apiRequest('GET', `/api/interview/processes/match?company=${encodeURIComponent(application.company || '')}&position=${encodeURIComponent(application.position || '')}`);
        const matchData = await response.json();
        
        if (matchData && matchData.id) {
          setRelatedProcessId(matchData.id);
        } else {
          // If no matching process, create one
          try {
            const createResponse = await apiRequest('POST', '/api/interview/processes', {
              companyName: application.company || application.companyName,
              position: application.position || application.jobTitle || application.title,
              jobDescription: application.jobDescription || application.description,
              status: application.status,
              jobLink: application.jobLink || application.externalJobUrl,
              notes: application.notes,
            });
            
            const newProcess = await createResponse.json();
            setRelatedProcessId(newProcess.id);
          } catch (createError) {
            console.error('Failed to create interview process:', createError);
          }
        }
      } catch (error) {
        console.error('Error finding or creating interview process:', error);
      }
    };
    
    if (application.status === 'Interviewing' && !relatedProcessId) {
      checkForProcessId();
    }
  }, [application, relatedProcessId]);
  
  // Initialize form with application data
  const form = useForm<ApplicationEditFormValues>({
    resolver: zodResolver(applicationEditSchema),
    defaultValues: {
      status: application.status || 'In Progress',
      company: application.company || application.companyName || '',
      companyName: application.companyName || application.company || '',
      position: application.position || application.jobTitle || application.title || '',
      jobTitle: application.jobTitle || application.position || application.title || '',
      title: application.title || application.position || application.jobTitle || '',
      location: application.location || application.jobLocation || '',
      jobDescription: application.jobDescription || application.description || '',
      description: application.description || application.jobDescription || '',
      notes: application.notes || '',
      jobLink: application.jobLink || application.externalJobUrl || '',
      externalJobUrl: application.externalJobUrl || application.jobLink || '',
    },
  });

  // Watch status to show/enable interview-related fields
  const currentStatus = form.watch('status');
  const showInterviewOptions = currentStatus === 'Interviewing';

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async (values: ApplicationEditFormValues) => {
      // If we're changing to "Interviewing" status, make sure we have a process
      if (values.status === 'Interviewing' && application.status !== 'Interviewing' && !relatedProcessId) {
        // Create a new interview process
        try {
          const createResponse = await apiRequest('POST', '/api/interview/processes', {
            companyName: values.company || values.companyName,
            position: values.position || values.jobTitle || values.title,
            jobDescription: values.jobDescription || values.description,
            status: values.status,
            jobLink: values.jobLink || values.externalJobUrl,
            notes: values.notes,
          });
          
          const newProcess = await createResponse.json();
          setRelatedProcessId(newProcess.id);
        } catch (createError) {
          console.error('Failed to create interview process:', createError);
        }
      }

      // Handle local storage mock applications for demo purposes
      const mockApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
      const mockAppIndex = mockApps.findIndex((app: any) => app.id === application.id);
      
      if (mockAppIndex !== -1) {
        // Update the mock application
        mockApps[mockAppIndex] = {
          ...mockApps[mockAppIndex],
          ...values,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('mockJobApplications', JSON.stringify(mockApps));
        return mockApps[mockAppIndex];
      }
      
      // Otherwise, update via API
      try {
        const response = await apiRequest('PUT', `/api/applications/${application.id}`, values);
        return await response.json();
      } catch (error) {
        console.error('Error updating application via API:', error);
        // Fall back to the mock update if API fails
        return values;
      }
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      
      if (data.status === 'Interviewing') {
        queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
      }
      
      toast({
        title: 'Application Updated',
        description: 'The application has been updated successfully.',
      });
      
      // Force an immediate refresh of application data
      queryClient.refetchQueries({ queryKey: ['/api/job-applications'] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    },
    onError: (error) => {
      console.error('Error updating application:', error);
      toast({
        title: 'Error',
        description: `Failed to update application: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: ApplicationEditFormValues) => {
    // Ensure all field variations are set for maximum compatibility
    values.companyName = values.company;
    values.jobTitle = values.position;
    values.title = values.position;
    values.description = values.jobDescription;
    values.externalJobUrl = values.jobLink;
    
    updateApplicationMutation.mutate(values);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              Update the details of your job application.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Application Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Status*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select application status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="Interviewing">Interviewing</SelectItem>
                        <SelectItem value="Offer">Offer</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <FormField
                  control={form.control}
                  name="company"
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
                
                {/* Position */}
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter job position/title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter job location (e.g., Remote, San Francisco, CA)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Job Link */}
              <FormField
                control={form.control}
                name="jobLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Posting URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter URL to the job posting" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Job Description */}
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter job description" 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any notes about this application" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Interview-related options for when status is "Interviewing" */}
              {showInterviewOptions && relatedProcessId && (
                <div className="border rounded-md p-4 space-y-4">
                  <h3 className="text-base font-medium flex items-center">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Interview Process Options
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Since this application is in the interview stage, you can track your interviews and follow-ups.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex items-center"
                      onClick={() => setShowInterviewStageForm(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Interview Stage
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex items-center"
                      onClick={() => setShowFollowupForm(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Follow-up Action
                    </Button>
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateApplicationMutation.isPending}>
                  {updateApplicationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Conditionally render the interview stage form */}
      {showInterviewStageForm && relatedProcessId && (
        <InterviewStageForm 
          isOpen={showInterviewStageForm}
          onClose={() => setShowInterviewStageForm(false)}
          processId={relatedProcessId}
          onSuccess={() => {
            // Refresh processes data
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
          }}
        />
      )}
      
      {/* Conditionally render the follow-up action form */}
      {showFollowupForm && relatedProcessId && (
        <FollowupActionForm 
          isOpen={showFollowupForm}
          onClose={() => setShowFollowupForm(false)}
          processId={relatedProcessId}
          onSuccess={() => {
            // Refresh processes data
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
          }}
        />
      )}
    </>
  );
}