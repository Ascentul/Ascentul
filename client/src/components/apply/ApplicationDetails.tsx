import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { LoadingButton } from '@/components/ui/loading-button';
import { LoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/hooks/use-toast';
import { 
  Building, 
  Briefcase, 
  MapPin, 
  Calendar, 
  FileText, 
  Link as LinkIcon, 
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  FileSpreadsheet,
  ListChecks
} from 'lucide-react';
import { JobApplication, Resume } from '@shared/schema';
import { motion } from 'framer-motion';

interface ApplicationDetailsProps {
  application: JobApplication;
  onClose: () => void;
  onDelete?: () => void;
}

export const ApplicationDetails = ({ 
  application, 
  onClose,
  onDelete
}: ApplicationDetailsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedApplication, setEditedApplication] = useState(application);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Fetch user's resumes for selection
  const { data: resumes, isLoading: isLoadingResumes } = useQuery<Resume[]>({
    queryKey: ['/api/resumes'],
    placeholderData: [],
  });

  // Get resume name if available
  const resumeName = resumes?.find(r => r.id === application.resumeId)?.name || 'No resume selected';

  // Update application mutation
  const updateApplicationMutation = useMutation({
    mutationFn: async (data: Partial<JobApplication>) => {
      const response = await apiRequest('PUT', `/api/job-applications/${application.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application updated",
        description: "Your changes have been saved successfully.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update application",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete application mutation
  const deleteApplicationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/job-applications/${application.id}`);
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: "Application deleted",
        description: "The job application has been removed.",
      });
      setConfirmDelete(false);
      queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
      if (onDelete) onDelete();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete application",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSaveChanges = () => {
    updateApplicationMutation.mutate(editedApplication);
  };

  const handleDeleteApplication = () => {
    deleteApplicationMutation.mutate();
  };

  const renderEditMode = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Company Name</label>
          <Input 
            value={editedApplication.companyName} 
            onChange={(e) => setEditedApplication({...editedApplication, companyName: e.target.value})}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Job Title</label>
          <Input 
            value={editedApplication.jobTitle} 
            onChange={(e) => setEditedApplication({...editedApplication, jobTitle: e.target.value})}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Location</label>
          <Input 
            value={editedApplication.jobLocation || ''} 
            onChange={(e) => setEditedApplication({...editedApplication, jobLocation: e.target.value})}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Application Status</label>
          <Select 
            value={editedApplication.status}
            onValueChange={(value) => setEditedApplication({...editedApplication, status: value})}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select status" />
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

      <div>
        <label className="text-sm font-medium">Job Link</label>
        <Input 
          value={editedApplication.jobLink || ''} 
          onChange={(e) => setEditedApplication({...editedApplication, jobLink: e.target.value})}
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Resume</label>
        <Select 
          value={editedApplication.resumeId?.toString() || ''}
          onValueChange={(value) => setEditedApplication({
            ...editedApplication, 
            resumeId: value ? parseInt(value) : undefined
          })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select a resume" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingResumes ? (
              <SelectItem value="loading" disabled>Loading resumes...</SelectItem>
            ) : resumes && resumes.length > 0 ? (
              resumes.map((resume) => (
                <SelectItem key={resume.id} value={resume.id.toString()}>
                  {resume.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>No resumes available</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Notes</label>
        <Textarea 
          value={editedApplication.applicationNotes || ''} 
          onChange={(e) => setEditedApplication({...editedApplication, applicationNotes: e.target.value})}
          className="mt-1 min-h-[100px]"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
        <LoadingButton 
          loading={updateApplicationMutation.isPending} 
          onClick={handleSaveChanges}
        >
          Save Changes
        </LoadingButton>
      </div>
    </div>
  );

  const renderViewMode = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{application.companyName}</h3>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <p>{application.jobTitle}</p>
          </div>
          {application.jobLocation && (
            <div className="flex items-center space-x-2 mt-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{application.jobLocation}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end space-y-2">
          <ApplicationStatusBadge status={application.status} className="text-sm px-3 py-1" />
          <div className="text-sm text-muted-foreground">
            {application.applicationDate ? (
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Applied on {format(new Date(application.applicationDate), 'MMM d, yyyy')}
              </div>
            ) : (
              <div className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Created on {format(new Date(application.createdAt), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="details">
            <AccordionTrigger>
              <div className="flex items-center">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Application Details
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {application.resumeId && (
                  <div>
                    <h4 className="text-sm font-medium flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Resume Used
                    </h4>
                    <p className="mt-1 text-sm">{resumeName}</p>
                  </div>
                )}

                {application.jobLink && (
                  <div>
                    <h4 className="text-sm font-medium flex items-center">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Job Listing
                    </h4>
                    <a 
                      href={application.jobLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-1 text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                    >
                      {application.jobLink.substring(0, 50)}
                      {application.jobLink.length > 50 ? '...' : ''}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                )}

                {application.applicationNotes && (
                  <div>
                    <h4 className="text-sm font-medium flex items-center">
                      <ListChecks className="h-4 w-4 mr-2" />
                      Notes
                    </h4>
                    <p className="mt-1 text-sm whitespace-pre-line">{application.applicationNotes}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          variant="destructive" 
          onClick={() => setConfirmDelete(true)}
          size="sm"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={onClose} size="sm">
            Close
          </Button>
          <Button onClick={() => setIsEditing(true)} size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card className="border rounded-lg overflow-hidden">
        <CardContent className="p-6">
          {isEditing ? renderEditMode() : renderViewMode()}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this job application and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteApplication}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ApplicationDetails;