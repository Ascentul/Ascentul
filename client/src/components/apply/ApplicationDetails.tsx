import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CalendarClock, 
  ExternalLink, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Building, 
  SendHorizontal, 
  FileText, 
  FileEdit,
  PlusCircle,
  MoreHorizontal,
  Pencil,
  GitBranch
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ApplicationStatusBadge, ApplicationStatus } from './ApplicationStatusBadge';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { InterviewStageForm } from '@/components/interview/InterviewStageForm';
import { FollowupActionForm } from '@/components/interview/FollowupActionForm';
import { EditInterviewStageForm } from '@/components/interview/EditInterviewStageForm';
import { EditFollowupForm } from './EditFollowupForm';
import InterviewTimeline from '@/components/interview/InterviewTimeline';
import type { InterviewStage, FollowupAction } from '@shared/schema';
import { 
  loadInterviewStagesForApplication, 
  updateInterviewStage, 
  notifyInterviewDataChanged,
  INTERVIEW_DATA_CHANGED_EVENT,
  INTERVIEW_STAGE_ADDED_EVENT,
  INTERVIEW_STAGE_UPDATED_EVENT,
  INTERVIEW_COUNT_UPDATE_EVENT,
  MOCK_STAGES_PREFIX,
  MOCK_INTERVIEW_STAGES_PREFIX
} from '@/lib/interview-utils';


interface ApplicationDetailsProps {
  application: any;
  onClose?: () => void;
  onDelete?: () => void;
  onStatusChange?: (applicationId: number, newStatus: string) => void;
}

export function ApplicationDetails({ application, onClose, onDelete, onStatusChange }: ApplicationDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localApplication, setLocalApplication] = useState(application);
  // We no longer need relatedProcessId as interview stages are linked directly to applications
  const [showInterviewStageForm, setShowInterviewStageForm] = useState(false);
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [currentStageToEdit, setCurrentStageToEdit] = useState<InterviewStage | null>(null);
  const [showEditStageForm, setShowEditStageForm] = useState(false);
  const [currentFollowupToEdit, setCurrentFollowupToEdit] = useState<FollowupAction | null>(null);
  const [showEditFollowupForm, setShowEditFollowupForm] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(null);
  const [selectedResume, setSelectedResume] = useState<{id: string, title: string} | null>(null);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<{id: string, title: string} | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Update localApplication when the application prop changes
  useEffect(() => {
    console.log("Application changed:", application);
    setLocalApplication(application);
    setIsEditing(false); // Reset editing state when application changes
  }, [application]);
  
  // Add event listener for interview data changes using all the event types from interview-utils
  useEffect(() => {
    // Function to handle interview data change event
    const handleInterviewDataChange = () => {
      console.log("Interview data changed event detected, refreshing data");
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${application.id}/stages`] });
    };
    
    // Add event listeners for all relevant events
    window.addEventListener(INTERVIEW_DATA_CHANGED_EVENT, handleInterviewDataChange);
    window.addEventListener(INTERVIEW_STAGE_ADDED_EVENT, handleInterviewDataChange);
    window.addEventListener(INTERVIEW_STAGE_UPDATED_EVENT, handleInterviewDataChange);
    window.addEventListener(INTERVIEW_COUNT_UPDATE_EVENT, handleInterviewDataChange);
    
    // Also listen to storage events that might come from other tabs/windows
    window.addEventListener('storage', (event) => {
      if (event.key && (
        event.key.startsWith(MOCK_STAGES_PREFIX) || 
        event.key.startsWith(MOCK_INTERVIEW_STAGES_PREFIX)
      )) {
        console.log('Storage event detected for interview stages, refreshing');
        handleInterviewDataChange();
      }
    });
    
    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener(INTERVIEW_DATA_CHANGED_EVENT, handleInterviewDataChange);
      window.removeEventListener(INTERVIEW_STAGE_ADDED_EVENT, handleInterviewDataChange);
      window.removeEventListener(INTERVIEW_STAGE_UPDATED_EVENT, handleInterviewDataChange);
      window.removeEventListener(INTERVIEW_COUNT_UPDATE_EVENT, handleInterviewDataChange);
      window.removeEventListener('storage', handleInterviewDataChange);
    };
  }, [application.id, queryClient]);

  // No longer need to find or create a related interview process
  // as interview stages are now directly connected to the application

  // Fetch interview stages directly for this application using our utility function
  const { data: interviewStages } = useQuery<InterviewStage[]>({
    queryKey: [`/api/applications/${application.id}/stages`],
    queryFn: async () => {
      try {
        // First try to get from server
        const response = await apiRequest('GET', `/api/applications/${application.id}/stages`);
        return await response.json();
      } catch (error) {
        // If server request fails, use our utility function to get from localStorage
        console.log('Server request for interview stages failed, checking localStorage');
        
        // Load interview stages using our centralized utility
        const stages = loadInterviewStagesForApplication(application.id);
        
        if (stages.length > 0) {
          console.log('Using interview stages from localStorage via utility:', stages);
          return stages;
        }
        
        // If no localStorage data, return empty array
        return [];
      }
    },
    enabled: !!application.id && localApplication.status === 'Interviewing',
    placeholderData: [],
    // Listen for interview data changes and refetch
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch follow-up actions directly for this application
  const { data: followupActions } = useQuery<FollowupAction[]>({
    queryKey: [`/api/applications/${application.id}/followups`],
    queryFn: async () => {
      try {
        // First try to get from server
        const response = await apiRequest('GET', `/api/applications/${application.id}/followups`);
        return await response.json();
      } catch (error) {
        // If server request fails, try localStorage
        console.log('Server request for followup actions failed, checking localStorage');
        
        // Check if there are mock followup actions in localStorage
        const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${application.id}`) || '[]');
        
        if (mockFollowups.length > 0) {
          console.log('Using mock followup actions from localStorage:', mockFollowups);
          return mockFollowups;
        }
        
        // If no localStorage data, return empty array
        return [];
      }
    },
    enabled: !!application.id,
    placeholderData: [],
  });

  const updateApplication = useMutation({
    mutationFn: async (updatedApplication: any) => {
      console.log(`Updating application ${application.id} with data:`, updatedApplication);
      
      // First try both API endpoints
      try {
        try {
          // Try server-side application first
          const response = await apiRequest('PUT', `/api/applications/${application.id}`, updatedApplication);
          return await response.json();
        } catch (error) {
          console.log('Trying job-applications endpoint instead');
          // Fall back to job-applications endpoint
          const response = await apiRequest('PATCH', `/api/job-applications/${application.id}`, updatedApplication);
          return await response.json();
        }
      } catch (error) {
        console.log('Both API endpoints failed, updating localStorage');
        
        // If both API calls fail, update in localStorage
        const mockApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
        const appIndex = mockApps.findIndex((a: any) => a.id === application.id);
        
        if (appIndex === -1) {
          throw new Error('Application not found in localStorage');
        }
        
        // Update the application
        mockApps[appIndex] = {
          ...mockApps[appIndex],
          ...updatedApplication,
          updatedAt: new Date().toISOString()
        };
        
        // Save back to localStorage
        localStorage.setItem('mockJobApplications', JSON.stringify(mockApps));
        
        return mockApps[appIndex];
      }
    },
    onSuccess: () => {
      toast({
        title: "Application updated",
        description: "The application has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      
      // If application status is changing, we should refresh any related data
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${application.id}/stages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${application.id}/followups`] });
      
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem updating the application. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating application:', error);
    }
  });

  const handleStatusChange = (status: ApplicationStatus) => {
    // Check if trying to update to Interviewing without interview stages
    if (status === 'Interviewing' && (!interviewStages || interviewStages.length === 0)) {
      toast({
        title: "Action Required",
        description: "You need to create an interview stage first before setting status to 'Interviewing'.",
        variant: "default"
      });
      return; // Don't update the status
    }
    
    // If changing from "In Progress" to "Applied", show the materials selection modal
    if (localApplication.status === 'In Progress' && status === 'Applied') {
      // Set the pending status so we know what to update to after the modal is closed
      setPendingStatus(status);
      setShowMaterialsModal(true);
      return; // Don't update the status yet until the user selects materials
    }
    
    const updatedApplication = { ...localApplication, status };
    setLocalApplication(updatedApplication);
    
    if (!isEditing) {
      // First try the normal update through API
      updateApplication.mutate({ status });
      
      // Then call the parent callback if it exists
      if (onStatusChange) {
        console.log(`Calling onStatusChange with application ID ${application.id} and status ${status}`);
        onStatusChange(application.id, status);
      }
    }
  };
  
  // Handle applying with selected materials
  const handleApplyWithMaterials = () => {
    if (!pendingStatus) return;
    
    // Create an update object with the new status and selected resume/cover letter
    const updateData = {
      status: pendingStatus,
      resumeId: selectedResume?.id,
      resumeTitle: selectedResume?.title,
      coverLetterId: selectedCoverLetter?.id,
      coverLetterTitle: selectedCoverLetter?.title,
      appliedAt: new Date().toISOString()
    };
    
    // Update the application with the selected materials
    updateApplication.mutate(updateData);
    
    // Update local state
    setLocalApplication(prev => ({
      ...prev,
      ...updateData
    }));
    
    // Call the parent callback if it exists
    if (onStatusChange && pendingStatus) {
      onStatusChange(application.id, pendingStatus);
    }
    
    // Close the modal and reset the pending status
    setShowMaterialsModal(false);
    setPendingStatus(null);
    
    toast({
      title: "Application Status Updated",
      description: "Your application has been marked as Applied with the selected materials.",
    });
  };

  const handleSave = () => {
    updateApplication.mutate({
      status: localApplication.status,
      notes: localApplication.notes,
      // Add other fields as needed
    });
  };
  
  // Function to update interview stage outcome using our utility functions
  const handleUpdateStageOutcome = async (stageId: number, outcome: string) => {
    console.log(`Updating stage ${stageId} outcome to ${outcome} for application ${application.id}`);
    
    // Find the current stage from our data
    const stageToUpdate = interviewStages?.find(s => s.id === stageId);
    if (!stageToUpdate) {
      console.error(`Stage with ID ${stageId} not found in current data`);
      toast({
        title: "Error",
        description: "Interview stage not found in current data",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Current stage data:", stageToUpdate);
    
    // Create an updated stage
    const updatedStage = {
      ...stageToUpdate,
      outcome,
      // Convert updatedAt to a Date object to match what the utility expects
      updatedAt: new Date()
    };
    
    // We're going to try both localStorage and API updates to ensure it works
    
    // Update in localStorage first using our utility function
    try {
      // Use the updateInterviewStage utility to consistently update the stage
      updateInterviewStage(updatedStage);
      console.log("Updated stage using utility function:", updatedStage);
      
      // Notify components that interview data has changed
      notifyInterviewDataChanged();
    } catch (localStorageError) {
      console.error("Error updating localStorage:", localStorageError);
    }
    
    // Create a proper update payload that preserves all existing values
    const updatePayload = {
      ...stageToUpdate,
      outcome
    };
    
    console.log("Sending update payload to API:", updatePayload);
    
    // Try to update on server in parallel
    try {
      const response = await apiRequest('PATCH', `/api/applications/${application.id}/stages/${stageId}`, updatePayload);
      console.log(`API response status:`, response.status);
    } catch (apiError) {
      console.error("API update failed, but localStorage update should still work:", apiError);
    }
    
    // Always refresh the data
    queryClient.invalidateQueries({ queryKey: [`/api/applications/${application.id}/stages`] });
    
    // Show success toast
    toast({
      title: "Status updated",
      description: `Interview status updated to ${outcome === 'passed' ? 'Passed' : 
                     outcome === 'failed' ? 'Rejected' : 
                     outcome === 'scheduled' ? 'Scheduled' : 
                     'Pending'}`,
    });
  };

  // Function to toggle followup completion status
  const handleToggleFollowupStatus = async (followupId: number) => {
    console.log(`Toggling followup ${followupId} completion status for application ${application.id}`);
    
    // Find the current followup from our data
    const followupToUpdate = followupActions?.find(f => f.id === followupId);
    if (!followupToUpdate) {
      console.error(`Followup with ID ${followupId} not found in current data`);
      toast({
        title: "Error",
        description: "Followup action not found in current data",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Current followup data:", followupToUpdate);
    
    // Toggle the completion status
    const newCompletionStatus = !followupToUpdate.completed;
    
    // Update in localStorage first for immediate UI feedback
    try {
      // Always update in localStorage as a backup - Get followups from localStorage
      const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${application.id}`) || '[]');
      console.log("Followups in localStorage before update:", mockFollowups);
      
      let followupIndex = mockFollowups.findIndex((f: any) => f.id === followupId);
      
      if (followupIndex === -1) {
        // If followup doesn't exist in localStorage yet, add it
        mockFollowups.push({
          ...followupToUpdate,
          completed: newCompletionStatus,
          updatedAt: new Date().toISOString()
        });
        console.log("Adding new followup to localStorage:", mockFollowups[mockFollowups.length - 1]);
      } else {
        // Update existing followup
        mockFollowups[followupIndex] = {
          ...mockFollowups[followupIndex],
          completed: newCompletionStatus,
          updatedAt: new Date().toISOString()
        };
        console.log("Updated followup in localStorage:", mockFollowups[followupIndex]);
      }
      
      // Save updated followups back to localStorage
      localStorage.setItem(`mockFollowups_${application.id}`, JSON.stringify(mockFollowups));
    } catch (localStorageError) {
      console.error("Error updating localStorage:", localStorageError);
    }
    
    // Create a proper update payload that preserves all existing values
    const updatePayload = {
      ...followupToUpdate,
      completed: newCompletionStatus
    };
    
    console.log("Sending update payload to API:", updatePayload);
    
    // Try to update on server in parallel
    try {
      const response = await apiRequest('PATCH', `/api/applications/${application.id}/followups/${followupId}`, updatePayload);
      console.log(`API response status:`, response.status);
    } catch (apiError) {
      console.error("API update failed, but localStorage update should still work:", apiError);
    }
    
    // Always refresh the data
    queryClient.invalidateQueries({ queryKey: [`/api/applications/${application.id}/followups`] });
    
    // Show success toast
    toast({
      title: "Status updated",
      description: `Follow-up action marked as ${newCompletionStatus ? 'Completed' : 'Pending'}`,
    });
  };

  // Format dates for display
  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Not specified';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Mock data for tabs (would come from API in real implementation)
  const mockResume = { id: 1, name: "Software Engineer Resume" };
  const mockCoverLetter = { id: 1, name: "Software Engineer Cover Letter" };

  return (
    <div className="space-y-6">
      {/* Header with job title, company and status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{localApplication.jobTitle || "Software Engineer"}</h2>
          <p className="text-lg text-muted-foreground">{localApplication.companyName || "Acme Inc."}</p>
          
          {localApplication.jobLocation && (
            <div className="flex items-center mt-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{localApplication.jobLocation}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {isEditing ? (
            <Select 
              defaultValue={localApplication.status} 
              onValueChange={(value) => handleStatusChange(value as ApplicationStatus)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="Applied">Applied</SelectItem>
                <SelectItem value="Interviewing">Interviewing</SelectItem>
                <SelectItem value="Offer">Offer</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto hover:bg-transparent cursor-pointer">
                  <ApplicationStatusBadge status={localApplication.status} className="text-sm" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange('Not Started')}>
                  Not Started
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('Applied')}>
                  Applied
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('Interviewing')}>
                  Interviewing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('Offer')}>
                  Offer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('Rejected')}>
                  Rejected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {localApplication.applicationDate && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Applied {formatDate(localApplication.applicationDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between">
        <div className="space-x-2">
          {isEditing ? (
            <>
              <Button variant="default" onClick={handleSave} disabled={updateApplication.isPending}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setLocalApplication(application);
              }}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <FileEdit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        {/* External link to job posting */}
        {localApplication.jobLink && (
          <Button variant="outline" asChild>
            <a 
              href={localApplication.jobLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Job Posting
            </a>
          </Button>
        )}
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="follow-up">Follow-up</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          {/* Job Description Section */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea 
                  value={localApplication.description || ""}
                  onChange={(e) => setLocalApplication({...localApplication, description: e.target.value})}
                  placeholder="Enter or paste the job description"
                  className="min-h-[200px]"
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  {localApplication.description ? (
                    <p>{localApplication.description}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No job description has been added yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Add personal notes about this application</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea 
                  value={localApplication.notes || ""}
                  onChange={(e) => setLocalApplication({...localApplication, notes: e.target.value})}
                  placeholder="Add notes about this application"
                  className="min-h-[100px]"
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  {localApplication.notes ? (
                    <p>{localApplication.notes}</p>
                  ) : (
                    <p className="text-muted-foreground italic">No notes have been added yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Materials Used Section */}
          <Card className="bg-white rounded-lg shadow p-4 mt-6">
            <CardHeader>
              <CardTitle>Materials Used</CardTitle>
              <CardDescription>Resume and cover letter used for this application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Resume:</Label>
                  {localApplication.resumeId ? (
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-500" />
                        <span>{localApplication.resumeTitle || "Selected Resume"}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          // Open modal to change resume
                          // Implement this functionality later
                          toast({
                            title: "Coming soon",
                            description: "Resume selection functionality is coming soon.",
                          });
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-muted-foreground italic">Not provided</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Open modal to select resume
                          // Implement this functionality later
                          toast({
                            title: "Coming soon",
                            description: "Resume selection functionality is coming soon.",
                          });
                        }}
                      >
                        Select
                      </Button>
                    </div>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Cover Letter:</Label>
                  {localApplication.coverLetterId ? (
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-500" />
                        <span>{localApplication.coverLetterTitle || "Selected Cover Letter"}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Open modal to change cover letter
                          // Implement this functionality later
                          toast({
                            title: "Coming soon",
                            description: "Cover letter selection functionality is coming soon.",
                          });
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-muted-foreground italic">Not provided</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Open modal to select cover letter
                          // Implement this functionality later
                          toast({
                            title: "Coming soon",
                            description: "Cover letter selection functionality is coming soon.",
                          });
                        }}
                      >
                        Select
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="interviews" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Interviews</CardTitle>
                <CardDescription>Manage interviews for this application</CardDescription>
              </div>
              
              <Button 
                size="sm" 
                onClick={() => {
                  if (localApplication.status !== 'Interviewing') {
                    // Show a confirmation dialog before adding an interview
                    // This will also change the application status to Interviewing
                    toast({
                      title: "Application Status Change",
                      description: "Adding an interview will change the application status to 'Interviewing'. Continue?",
                      action: (
                        <Button 
                          onClick={() => {
                            // Update application status first
                            const updatedApplication = { ...localApplication, status: 'Interviewing' };
                            setLocalApplication(updatedApplication);
                            
                            // Call the normal update function
                            updateApplication.mutate({ status: 'Interviewing' });
                            
                            // Show the interview form after a slight delay
                            setTimeout(() => {
                              setShowInterviewStageForm(true);
                            }, 300);
                            
                            // Then call the parent callback if it exists
                            if (onStatusChange) {
                              onStatusChange(application.id, 'Interviewing');
                            }
                          }}
                          variant="default"
                          size="sm"
                        >
                          Confirm
                        </Button>
                      ),
                    });
                  } else {
                    // If already in interviewing status, just show the form
                    setShowInterviewStageForm(true);
                  }
                }}
                className="flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Interview
              </Button>
            </CardHeader>
            <CardContent>
              {localApplication.status === 'Interviewing' ? (
                <div className="space-y-3">
                  {interviewStages && interviewStages.length > 0 ? (
                    <div className="space-y-3">
                      {interviewStages.map((stage) => (
                          <div key={stage.id} className="flex items-start justify-between border rounded-md p-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">
                                  {stage.type === 'phone_screen' ? 'Phone Screen' : 
                                   stage.type === 'technical' ? 'Technical Interview' :
                                   stage.type === 'behavioral' ? 'Behavioral Interview' :
                                   stage.type === 'onsite' ? 'Onsite Interview' :
                                   stage.type === 'panel' ? 'Panel Interview' :
                                   stage.type === 'final' ? 'Final Round' : 
                                   'Interview'}
                                </h4>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 ml-2" 
                                  onClick={() => {
                                    setCurrentStageToEdit(stage);
                                    setShowEditStageForm(true);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              {stage.scheduledDate && (
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <CalendarClock className="h-4 w-4 mr-1.5" />
                                  <span>{format(new Date(stage.scheduledDate), 'MMM d, yyyy')}</span>
                                </div>
                              )}
                              {stage.location && (
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <Briefcase className="h-4 w-4 mr-1.5" />
                                  <span>{stage.location}</span>
                                </div>
                              )}
                              {stage.notes && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <p className="line-clamp-2">{stage.notes}</p>
                                </div>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" 
                                  className={
                                    stage.outcome === 'passed' ? "bg-green-50 text-green-700 border-green-200" :
                                    stage.outcome === 'failed' ? "bg-red-50 text-red-700 border-red-200" :
                                    stage.outcome === 'scheduled' ? "bg-blue-50 text-blue-700 border-blue-200" : 
                                    "bg-orange-50 text-orange-700 border-orange-200"
                                  }
                                  size="sm"
                                >
                                  {stage.outcome === 'passed' ? 'Passed' :
                                   stage.outcome === 'failed' ? 'Rejected' :
                                   stage.outcome === 'scheduled' ? 'Scheduled' :
                                   'Pending'}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleUpdateStageOutcome(stage.id, 'scheduled')}>
                                  Scheduled
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStageOutcome(stage.id, 'pending')}>
                                  Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStageOutcome(stage.id, 'passed')}>
                                  Passed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStageOutcome(stage.id, 'failed')}>
                                  Rejected
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                  ) : (
                    <div className="text-center py-6">
                      <CalendarClock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No interviews scheduled yet</p>
                      <Button 
                        variant="outline" 
                        className="mt-3"
                        onClick={() => setShowInterviewStageForm(true)}
                      >
                        Schedule Interview
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarClock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No interviews scheduled yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => {
                      // Show a confirmation dialog before adding an interview
                      toast({
                        title: "Application Status Change",
                        description: "Adding an interview will change the application status to 'Interviewing'. Continue?",
                        action: (
                          <Button 
                            onClick={() => {
                              // Update application status first
                              const updatedApplication = { ...localApplication, status: 'Interviewing' };
                              setLocalApplication(updatedApplication);
                              
                              // Call the normal update function
                              updateApplication.mutate({ status: 'Interviewing' });
                              
                              // Show the interview form after a slight delay
                              setTimeout(() => {
                                setShowInterviewStageForm(true);
                              }, 300);
                              
                              // Then call the parent callback if it exists
                              if (onStatusChange) {
                                onStatusChange(application.id, 'Interviewing');
                              }
                            }}
                            variant="default"
                            size="sm"
                          >
                            Confirm
                          </Button>
                        ),
                      });
                    }}
                  >
                    Add Interview
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Show interview stage form */}
          {showInterviewStageForm && (
            <InterviewStageForm
              isOpen={showInterviewStageForm}
              onClose={() => setShowInterviewStageForm(false)}
              applicationId={application.id}
              onSuccess={() => {
                // Refresh interview stages data
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/applications/${application.id}/stages`] 
                });
                toast({
                  title: "Interview added",
                  description: "The interview stage has been added successfully."
                });
              }}
            />
          )}
        </TabsContent>
        
        <TabsContent value="follow-up" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Follow-up Actions</CardTitle>
                <CardDescription>Track your follow-up communications</CardDescription>
              </div>
              
              <Button 
                size="sm" 
                onClick={() => setShowFollowupForm(true)}
                className="flex items-center"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Follow-up
              </Button>
            </CardHeader>
            <CardContent>
              {followupActions && followupActions.length > 0 ? (
                <div className="space-y-3">
                  {followupActions.map((action) => (
                    <div key={action.id} className="flex items-start justify-between border rounded-md p-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">
                            {action.type === 'thank_you_email' ? 'Thank You Email' : 
                             action.type === 'follow_up' ? 'Follow-up' :
                             action.type === 'preparation' ? 'Interview Preparation' :
                             action.type === 'document_submission' ? 'Document Submission' :
                             action.type === 'networking' ? 'Networking Connection' : 
                             action.description}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs text-muted-foreground">
                                {action.completed ? 'Completed' : 'Pending'}
                              </span>
                              <Switch 
                                checked={action.completed}
                                onCheckedChange={() => handleToggleFollowupStatus(action.id)}
                                className="data-[state=checked]:bg-green-500"
                              />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 flex-shrink-0" 
                              onClick={() => {
                                setCurrentFollowupToEdit(action);
                                setShowEditFollowupForm(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm">{action.description}</p>
                        
                        {action.dueDate && (
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Calendar className="h-4 w-4 mr-1.5" />
                            <span>Due: {format(new Date(action.dueDate), 'MMM d, yyyy')}</span>
                          </div>
                        )}
                        
                        {action.notes && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <p className="line-clamp-2">{action.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <SendHorizontal className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No follow-up actions yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => setShowFollowupForm(true)}
                  >
                    Add Follow-up
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Show follow-up form */}
          {showFollowupForm && (
            <FollowupActionForm
              isOpen={showFollowupForm}
              onClose={() => setShowFollowupForm(false)}
              applicationId={application.id}
              onSuccess={() => {
                // Refresh follow-up actions data
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/applications/${application.id}/followups`] 
                });
                toast({
                  title: "Follow-up added",
                  description: "The follow-up action has been added successfully."
                });
              }}
            />
          )}
        </TabsContent>
      </Tabs>
      
      {onClose && (
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
      
      {/* Show edit interview stage form */}
      {showEditStageForm && currentStageToEdit && (
        <EditInterviewStageForm
          isOpen={showEditStageForm}
          onClose={() => setShowEditStageForm(false)}
          stage={currentStageToEdit}
          applicationId={application.id}
          onSuccess={() => {
            // Refresh interview stages data
            queryClient.invalidateQueries({ 
              queryKey: [`/api/applications/${application.id}/stages`] 
            });
            toast({
              title: "Interview updated",
              description: "The interview stage has been updated successfully."
            });
          }}
        />
      )}

      {/* Show edit followup form */}
      {showEditFollowupForm && currentFollowupToEdit && (
        <EditFollowupForm
          isOpen={showEditFollowupForm}
          onClose={() => setShowEditFollowupForm(false)}
          followup={currentFollowupToEdit}
          applicationId={application.id}
          onSuccess={() => {
            // Refresh follow-up actions data
            queryClient.invalidateQueries({ 
              queryKey: [`/api/applications/${application.id}/followups`] 
            });
            toast({
              title: "Follow-up updated",
              description: "The follow-up action has been updated successfully."
            });
          }}
        />
      )}
    </div>
  );
}