import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  PlusCircle
} from 'lucide-react';
import { ApplicationStatusBadge, ApplicationStatus } from './ApplicationStatusBadge';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { InterviewStageForm } from '@/components/interview/InterviewStageForm';
import { FollowupActionForm } from '@/components/interview/FollowupActionForm';
import type { InterviewStage, FollowupAction } from '@shared/schema';

interface ApplicationDetailsProps {
  application: any;
  onClose?: () => void;
}

export function ApplicationDetails({ application, onClose }: ApplicationDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localApplication, setLocalApplication] = useState(application);
  const [relatedProcessId, setRelatedProcessId] = useState<number | null>(null);
  const [showInterviewStageForm, setShowInterviewStageForm] = useState(false);
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Find or create a related interview process
  useEffect(() => {
    const findOrCreateProcess = async () => {
      try {
        // Try to fetch a matching interview process
        const response = await apiRequest('GET', `/api/interview/processes/match?company=${encodeURIComponent(application.company || '')}&position=${encodeURIComponent(application.position || '')}`);
        const matchData = await response.json();
        
        if (matchData && matchData.id) {
          setRelatedProcessId(matchData.id);
        } else if (application.status === 'Interviewing') {
          // If application is in interviewing status but no process exists, create one
          try {
            const createResponse = await apiRequest('POST', '/api/interview/processes', {
              companyName: application.company || application.companyName,
              position: application.position || application.jobTitle || application.title,
              jobDescription: application.description || "",
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
    
    findOrCreateProcess();
  }, [application]);

  // Fetch interview stages if we have a related process ID
  const { data: interviewStages } = useQuery<InterviewStage[]>({
    queryKey: [`/api/interview/processes/${relatedProcessId}/stages`],
    queryFn: async () => {
      if (!relatedProcessId) return [];
      const response = await apiRequest('GET', `/api/interview/processes/${relatedProcessId}/stages`);
      return await response.json();
    },
    enabled: !!relatedProcessId,
    placeholderData: [],
  });

  // Fetch follow-up actions if we have a related process ID
  const { data: followupActions } = useQuery<FollowupAction[]>({
    queryKey: [`/api/interview/processes/${relatedProcessId}/followups`],
    queryFn: async () => {
      if (!relatedProcessId) return [];
      const response = await apiRequest('GET', `/api/interview/processes/${relatedProcessId}/followups`);
      return await response.json();
    },
    enabled: !!relatedProcessId,
    placeholderData: [],
  });

  const updateApplication = useMutation({
    mutationFn: async (updatedApplication: any) => {
      const response = await apiRequest('PATCH', `/api/job-applications/${application.id}`, updatedApplication);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Application updated",
        description: "The application has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      
      // If application status is "Interviewing", refresh interview processes
      if (localApplication.status === 'Interviewing') {
        queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
      }
      
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
    const updatedApplication = { ...localApplication, status };
    setLocalApplication(updatedApplication);
    
    if (!isEditing) {
      updateApplication.mutate({ status });
    }
  };

  const handleSave = () => {
    updateApplication.mutate({
      status: localApplication.status,
      notes: localApplication.notes,
      // Add other fields as needed
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
            <ApplicationStatusBadge status={localApplication.status} className="text-sm" />
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
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
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
        </TabsContent>
        
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resume</CardTitle>
              <CardDescription>Resume used for this application</CardDescription>
            </CardHeader>
            <CardContent>
              {mockResume ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-500" />
                    <span>{mockResume.name}</span>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No resume attached to this application.</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cover Letter</CardTitle>
              <CardDescription>Cover letter used for this application</CardDescription>
            </CardHeader>
            <CardContent>
              {mockCoverLetter ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-500" />
                    <span>{mockCoverLetter.name}</span>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No cover letter attached to this application.</p>
              )}
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
              
              {relatedProcessId && (
                <Button 
                  size="sm" 
                  onClick={() => setShowInterviewStageForm(true)}
                  className="flex items-center"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Interview
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {localApplication.status === 'Interviewing' ? (
                <div className="space-y-3">
                  {interviewStages && interviewStages.length > 0 ? (
                    <div className="space-y-3">
                      {interviewStages.map((stage) => (
                        <div key={stage.id} className="flex items-start justify-between border rounded-md p-3">
                          <div>
                            <h4 className="font-medium">
                              {stage.type === 'phone_screen' ? 'Phone Screen' : 
                               stage.type === 'technical' ? 'Technical Interview' :
                               stage.type === 'behavioral' ? 'Behavioral Interview' :
                               stage.type === 'onsite' ? 'Onsite Interview' :
                               stage.type === 'panel' ? 'Panel Interview' :
                               stage.type === 'final' ? 'Final Round' : 
                               'Interview'}
                            </h4>
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
                          <Badge variant="outline" 
                            className={
                              stage.outcome === 'passed' ? "bg-green-50 text-green-700 border-green-200" :
                              stage.outcome === 'failed' ? "bg-red-50 text-red-700 border-red-200" :
                              stage.completedDate ? "bg-orange-50 text-orange-700 border-orange-200" : 
                              "bg-blue-50 text-blue-700 border-blue-200"
                            }
                          >
                            {stage.outcome === 'passed' ? 'Passed' :
                             stage.outcome === 'failed' ? 'Failed' :
                             stage.completedDate ? 'Completed' : 'Upcoming'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : !relatedProcessId ? (
                    <div className="text-center py-6">
                      <CalendarClock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No interview process linked to this application</p>
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
                  <p className="text-muted-foreground">Update application status to "Interviewing" to add interviews</p>
                  <div className="mt-3">
                    <Select 
                      value={localApplication.status}
                      onValueChange={(value) => handleStatusChange(value as ApplicationStatus)}
                    >
                      <SelectTrigger className="w-[250px] mx-auto">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="Interviewing">Interviewing</SelectItem>
                        <SelectItem value="Offer">Offer</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Show interview stage form */}
          {showInterviewStageForm && relatedProcessId && (
            <InterviewStageForm
              isOpen={showInterviewStageForm}
              onClose={() => setShowInterviewStageForm(false)}
              processId={relatedProcessId}
              onSuccess={() => {
                // Refresh interview stages data
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/interview/processes/${relatedProcessId}/stages`] 
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
              
              {relatedProcessId && (
                <Button 
                  size="sm" 
                  onClick={() => setShowFollowupForm(true)}
                  className="flex items-center"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Follow-up
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {followupActions && followupActions.length > 0 ? (
                <div className="space-y-3">
                  {followupActions.map((action) => (
                    <div key={action.id} className="flex items-start justify-between border rounded-md p-3">
                      <div>
                        <h4 className="font-medium">
                          {action.type === 'thank_you_email' ? 'Thank You Email' : 
                           action.type === 'follow_up' ? 'Follow-up' :
                           action.type === 'preparation' ? 'Interview Preparation' :
                           action.type === 'document_submission' ? 'Document Submission' :
                           action.type === 'networking' ? 'Networking Connection' : 
                           action.description}
                        </h4>
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
                      <Badge variant="outline" 
                        className={
                          action.completed ? "bg-green-50 text-green-700 border-green-200" : 
                          "bg-blue-50 text-blue-700 border-blue-200"
                        }
                      >
                        {action.completed ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : !relatedProcessId ? (
                <div className="text-center py-6">
                  <SendHorizontal className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No follow-up process linked to this application</p>
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
          {showFollowupForm && relatedProcessId && (
            <FollowupActionForm
              isOpen={showFollowupForm}
              onClose={() => setShowFollowupForm(false)}
              processId={relatedProcessId}
              onSuccess={() => {
                // Refresh follow-up actions data
                queryClient.invalidateQueries({ 
                  queryKey: [`/api/interview/processes/${relatedProcessId}/followups`] 
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
    </div>
  );
}