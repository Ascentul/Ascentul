import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarClock, ExternalLink, MapPin, Calendar, Briefcase, Building, SendHorizontal, FileText, FileEdit } from 'lucide-react';
import { ApplicationStatusBadge, ApplicationStatus } from './ApplicationStatusBadge';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ApplicationDetailsProps {
  application: any;
  onClose?: () => void;
}

export function ApplicationDetails({ application, onClose }: ApplicationDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localApplication, setLocalApplication] = useState(application);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateApplication = useMutation({
    mutationFn: async (updatedApplication: any) => {
      const response = await apiRequest(`/api/job-applications/${application.id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatedApplication),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Application updated",
        description: "The application has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
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
  const mockInterviewDate = new Date();
  mockInterviewDate.setDate(mockInterviewDate.getDate() + 5);

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
                  value={localApplication.jobDescription || ""}
                  onChange={(e) => setLocalApplication({...localApplication, jobDescription: e.target.value})}
                  placeholder="Enter or paste the job description"
                  className="min-h-[200px]"
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  {localApplication.jobDescription ? (
                    <p>{localApplication.jobDescription}</p>
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
            <CardHeader>
              <CardTitle>Upcoming Interviews</CardTitle>
              <CardDescription>Your scheduled interviews for this application</CardDescription>
            </CardHeader>
            <CardContent>
              {localApplication.status === 'Interviewing' ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between border rounded-md p-3">
                    <div>
                      <h4 className="font-medium">Technical Interview</h4>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <CalendarClock className="h-4 w-4 mr-1.5" />
                        <span>{format(mockInterviewDate, 'MMM d, yyyy - h:mm a')}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Briefcase className="h-4 w-4 mr-1.5" />
                        <span>Virtual (Zoom)</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Upcoming
                    </Badge>
                  </div>
                  <Button variant="outline" className="w-full">
                    Add Interview
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarClock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No interviews scheduled yet</p>
                  <Button variant="outline" className="mt-3">
                    Add Interview
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="follow-up" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Actions</CardTitle>
              <CardDescription>Track your follow-up communications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <SendHorizontal className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No follow-up actions yet</p>
                <Button variant="outline" className="mt-3">
                  Add Follow-up
                </Button>
              </div>
            </CardContent>
          </Card>
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