import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarClock, ExternalLink, MapPin, Calendar, Briefcase, SendHorizontal, FileText, FileEdit, PlusCircle, Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { InterviewStageForm } from '@/components/interview/InterviewStageForm';
import { FollowupActionForm } from '@/components/interview/FollowupActionForm';
import { EditInterviewStageForm } from '@/components/interview/EditInterviewStageForm';
import { EditFollowupForm } from './EditFollowupForm';
import { loadInterviewStagesForApplication, updateInterviewStage, notifyInterviewDataChanged, INTERVIEW_DATA_CHANGED_EVENT, INTERVIEW_STAGE_ADDED_EVENT, INTERVIEW_STAGE_UPDATED_EVENT, INTERVIEW_COUNT_UPDATE_EVENT, MOCK_STAGES_PREFIX, MOCK_INTERVIEW_STAGES_PREFIX } from '@/lib/interview-utils';
export function ApplicationDetails({ application, onClose, onDelete, onStatusChange }) {
    const [isEditing, setIsEditing] = useState(false);
    const [localApplication, setLocalApplication] = useState(application);
    // We no longer need relatedProcessId as interview stages are linked directly to applications
    const [showInterviewStageForm, setShowInterviewStageForm] = useState(false);
    const [showFollowupForm, setShowFollowupForm] = useState(false);
    const [currentStageToEdit, setCurrentStageToEdit] = useState(null);
    const [showEditStageForm, setShowEditStageForm] = useState(false);
    const [currentFollowupToEdit, setCurrentFollowupToEdit] = useState(null);
    const [showEditFollowupForm, setShowEditFollowupForm] = useState(false);
    const [showMaterialsModal, setShowMaterialsModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);
    const [selectedResume, setSelectedResume] = useState(null);
    const [selectedCoverLetter, setSelectedCoverLetter] = useState(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Fetch user's resumes
    const { data: resumes, isLoading: isLoadingResumes } = useQuery({
        queryKey: ['/api/resumes'],
        queryFn: async () => {
            try {
                const response = await apiRequest('GET', '/api/resumes');
                return await response.json();
            }
            catch (error) {
                console.error('Error fetching resumes:', error);
                return [];
            }
        },
        enabled: showMaterialsModal, // Only fetch when modal is open
    });
    // Fetch user's cover letters
    const { data: coverLetters, isLoading: isLoadingCoverLetters } = useQuery({
        queryKey: ['/api/cover-letters'],
        queryFn: async () => {
            try {
                const response = await apiRequest('GET', '/api/cover-letters');
                return await response.json();
            }
            catch (error) {
                console.error('Error fetching cover letters:', error);
                return [];
            }
        },
        enabled: showMaterialsModal, // Only fetch when modal is open
    });
    // Update localApplication when the application prop changes
    useEffect(() => {

        setLocalApplication(application);
        setIsEditing(false); // Reset editing state when application changes
    }, [application]);
    // Add event listener for interview data changes using all the event types from interview-utils
    useEffect(() => {
        // Function to handle interview data change event
        const handleInterviewDataChange = () => {

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
            if (event.key && (event.key.startsWith(MOCK_STAGES_PREFIX) ||
                event.key.startsWith(MOCK_INTERVIEW_STAGES_PREFIX))) {

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
    const { data: interviewStages } = useQuery({
        queryKey: [`/api/applications/${application.id}/stages`],
        queryFn: async () => {
            try {
                // First try to get from server
                const response = await apiRequest('GET', `/api/applications/${application.id}/stages`);
                return await response.json();
            }
            catch (error) {
                // If server request fails, use our utility function to get from localStorage

                // Load interview stages using our centralized utility
                const stages = loadInterviewStagesForApplication(application.id);
                if (stages.length > 0) {

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
    const { data: followupActions } = useQuery({
        queryKey: [`/api/applications/${application.id}/followups`],
        queryFn: async () => {
            try {
                // First try to get from server
                const response = await apiRequest('GET', `/api/applications/${application.id}/followups`);
                return await response.json();
            }
            catch (error) {
                // If server request fails, try localStorage

                // Check if there are mock followup actions in localStorage
                const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${application.id}`) || '[]');
                if (mockFollowups.length > 0) {

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
        mutationFn: async (updatedApplication) => {

            // First try both API endpoints
            try {
                try {
                    // Try server-side application first
                    const response = await apiRequest('PUT', `/api/applications/${application.id}`, updatedApplication);
                    return await response.json();
                }
                catch (error) {

                    // Fall back to job-applications endpoint
                    const response = await apiRequest('PATCH', `/api/job-applications/${application.id}`, updatedApplication);
                    return await response.json();
                }
            }
            catch (error) {

                // If both API calls fail, update in localStorage
                const mockApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
                const appIndex = mockApps.findIndex((a) => a.id === application.id);
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
    const handleStatusChange = (status) => {
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

                onStatusChange(application.id, status);
            }
        }
    };
    // Handle applying with selected materials
    const handleApplyWithMaterials = () => {
        if (!pendingStatus)
            return;
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
    const handleUpdateStageOutcome = async (stageId, outcome) => {

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

            // Notify components that interview data has changed
            notifyInterviewDataChanged();
        }
        catch (localStorageError) {
            console.error("Error updating localStorage:", localStorageError);
        }
        // Create a proper update payload that preserves all existing values
        const updatePayload = {
            ...stageToUpdate,
            outcome
        };

        // Try to update on server in parallel
        try {
            const response = await apiRequest('PATCH', `/api/applications/${application.id}/stages/${stageId}`, updatePayload);

        }
        catch (apiError) {
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
    const handleToggleFollowupStatus = async (followupId) => {

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

        // Toggle the completion status
        const newCompletionStatus = !followupToUpdate.completed;
        // Update in localStorage first for immediate UI feedback
        try {
            // Always update in localStorage as a backup - Get followups from localStorage
            const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${application.id}`) || '[]');

            let followupIndex = mockFollowups.findIndex((f) => f.id === followupId);
            if (followupIndex === -1) {
                // If followup doesn't exist in localStorage yet, add it
                mockFollowups.push({
                    ...followupToUpdate,
                    completed: newCompletionStatus,
                    updatedAt: new Date().toISOString()
                });

            }
            else {
                // Update existing followup
                mockFollowups[followupIndex] = {
                    ...mockFollowups[followupIndex],
                    completed: newCompletionStatus,
                    updatedAt: new Date().toISOString()
                };

            }
            // Save updated followups back to localStorage
            localStorage.setItem(`mockFollowups_${application.id}`, JSON.stringify(mockFollowups));
        }
        catch (localStorageError) {
            console.error("Error updating localStorage:", localStorageError);
        }
        // Create a proper update payload that preserves all existing values
        const updatePayload = {
            ...followupToUpdate,
            completed: newCompletionStatus
        };

        // Try to update on server in parallel
        try {
            const response = await apiRequest('PATCH', `/api/applications/${application.id}/followups/${followupId}`, updatePayload);

        }
        catch (apiError) {
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
    const formatDate = (date) => {
        if (!date)
            return 'Not specified';
        return format(new Date(date), 'MMM d, yyyy');
    };
    // Mock data for tabs (would come from API in real implementation)
    const mockResume = { id: 1, name: "Software Engineer Resume" };
    const mockCoverLetter = { id: 1, name: "Software Engineer Cover Letter" };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold tracking-tight", children: localApplication.jobTitle || "Software Engineer" }), _jsx("p", { className: "text-lg text-muted-foreground", children: localApplication.companyName || "Acme Inc." }), localApplication.jobLocation && (_jsxs("div", { className: "flex items-center mt-1 text-sm text-muted-foreground", children: [_jsx(MapPin, { className: "h-4 w-4 mr-1" }), _jsx("span", { children: localApplication.jobLocation })] }))] }), _jsxs("div", { className: "space-y-2", children: [isEditing ? (_jsxs(Select, { defaultValue: localApplication.status, onValueChange: (value) => handleStatusChange(value), children: [_jsx(SelectTrigger, { className: "w-[180px]", children: _jsx(SelectValue, { placeholder: "Status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Not Started", children: "Not Started" }), _jsx(SelectItem, { value: "Applied", children: "Applied" }), _jsx(SelectItem, { value: "Interviewing", children: "Interviewing" }), _jsx(SelectItem, { value: "Offer", children: "Offer" }), _jsx(SelectItem, { value: "Rejected", children: "Rejected" })] })] })) : (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", className: "p-0 h-auto hover:bg-transparent cursor-pointer", children: _jsx(ApplicationStatusBadge, { status: localApplication.status, className: "text-sm" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { onClick: () => handleStatusChange('Not Started'), children: "Not Started" }), _jsx(DropdownMenuItem, { onClick: () => handleStatusChange('Applied'), children: "Applied" }), _jsx(DropdownMenuItem, { onClick: () => handleStatusChange('Interviewing'), children: "Interviewing" }), _jsx(DropdownMenuItem, { onClick: () => handleStatusChange('Offer'), children: "Offer" }), _jsx(DropdownMenuItem, { onClick: () => handleStatusChange('Rejected'), children: "Rejected" })] })] })), localApplication.applicationDate && (_jsxs("div", { className: "flex items-center text-xs text-muted-foreground", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), _jsxs("span", { children: ["Applied ", formatDate(localApplication.applicationDate)] })] }))] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("div", { className: "space-x-2", children: isEditing ? (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "default", onClick: handleSave, disabled: updateApplication.isPending, children: "Save Changes" }), _jsx(Button, { variant: "outline", onClick: () => {
                                        setIsEditing(false);
                                        setLocalApplication(application);
                                    }, children: "Cancel" })] })) : (_jsxs(Button, { variant: "outline", onClick: () => setIsEditing(true), children: [_jsx(FileEdit, { className: "h-4 w-4 mr-2" }), "Edit"] })) }), localApplication.jobLink && (_jsx(Button, { variant: "outline", asChild: true, children: _jsxs("a", { href: localApplication.jobLink, target: "_blank", rel: "noopener noreferrer", className: "flex items-center", children: [_jsx(ExternalLink, { className: "h-4 w-4 mr-2" }), "View Job Posting"] }) }))] }), _jsxs(Tabs, { defaultValue: "details", className: "w-full", children: [_jsxs(TabsList, { className: "grid grid-cols-3", children: [_jsx(TabsTrigger, { value: "details", children: "Details" }), _jsx(TabsTrigger, { value: "interviews", children: "Interviews" }), _jsx(TabsTrigger, { value: "follow-up", children: "Follow-up" })] }), _jsxs(TabsContent, { value: "details", className: "space-y-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Job Description" }) }), _jsx(CardContent, { children: isEditing ? (_jsx(Textarea, { value: localApplication.description || "", onChange: (e) => setLocalApplication({ ...localApplication, description: e.target.value }), placeholder: "Enter or paste the job description", className: "min-h-[200px]" })) : (_jsx("div", { className: "prose prose-sm max-w-none", children: localApplication.description ? (_jsx("p", { children: localApplication.description })) : (_jsx("p", { className: "text-muted-foreground italic", children: "No job description has been added yet." })) })) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Notes" }), _jsx(CardDescription, { children: "Add personal notes about this application" })] }), _jsx(CardContent, { children: isEditing ? (_jsx(Textarea, { value: localApplication.notes || "", onChange: (e) => setLocalApplication({ ...localApplication, notes: e.target.value }), placeholder: "Add notes about this application", className: "min-h-[100px]" })) : (_jsx("div", { className: "prose prose-sm max-w-none", children: localApplication.notes ? (_jsx("p", { children: localApplication.notes })) : (_jsx("p", { className: "text-muted-foreground italic", children: "No notes have been added yet." })) })) })] }), _jsxs(Card, { className: "mt-6", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Materials Used" }), _jsx(CardDescription, { children: "Resume and cover letter used for this application" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "Resume:" }), localApplication.resumeId ? (_jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2 text-blue-500" }), _jsx("span", { children: localApplication.resumeTitle || "Selected Resume" })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                                                        // Open modal to change resume
                                                                        // Implement this functionality later
                                                                        toast({
                                                                            title: "Coming soon",
                                                                            description: "Resume selection functionality is coming soon.",
                                                                        });
                                                                    }, children: "Change" })] })) : (_jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsx("p", { className: "text-muted-foreground italic", children: "Not provided" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                                                        // Open modal to select resume
                                                                        // Implement this functionality later
                                                                        toast({
                                                                            title: "Coming soon",
                                                                            description: "Resume selection functionality is coming soon.",
                                                                        });
                                                                    }, children: "Select" })] }))] }), _jsxs("div", { children: [_jsx(Label, { className: "text-sm font-medium", children: "Cover Letter:" }), localApplication.coverLetterId ? (_jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2 text-blue-500" }), _jsx("span", { children: localApplication.coverLetterTitle || "Selected Cover Letter" })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                                                        // Open modal to change cover letter
                                                                        // Implement this functionality later
                                                                        toast({
                                                                            title: "Coming soon",
                                                                            description: "Cover letter selection functionality is coming soon.",
                                                                        });
                                                                    }, children: "Change" })] })) : (_jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsx("p", { className: "text-muted-foreground italic", children: "Not provided" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                                                        // Open modal to select cover letter
                                                                        // Implement this functionality later
                                                                        toast({
                                                                            title: "Coming soon",
                                                                            description: "Cover letter selection functionality is coming soon.",
                                                                        });
                                                                    }, children: "Select" })] }))] })] }) })] })] }), _jsxs(TabsContent, { value: "interviews", className: "space-y-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Interviews" }), _jsx(CardDescription, { children: "Manage interviews for this application" })] }), _jsxs(Button, { size: "sm", onClick: () => {
                                                    if (localApplication.status !== 'Interviewing') {
                                                        // Show a confirmation dialog before adding an interview
                                                        // This will also change the application status to Interviewing
                                                        toast({
                                                            title: "Application Status Change",
                                                            description: "Adding an interview will change the application status to 'Interviewing'. Continue?",
                                                            action: (_jsx(Button, { onClick: () => {
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
                                                                }, variant: "default", size: "sm", children: "Confirm" })),
                                                        });
                                                    }
                                                    else {
                                                        // If already in interviewing status, just show the form
                                                        setShowInterviewStageForm(true);
                                                    }
                                                }, className: "flex items-center", children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "Add Interview"] })] }), _jsx(CardContent, { children: localApplication.status === 'Interviewing' ? (_jsx("div", { className: "space-y-3", children: interviewStages && interviewStages.length > 0 ? (_jsx("div", { className: "space-y-3", children: interviewStages.map((stage) => (_jsxs("div", { className: "flex items-start justify-between border rounded-md p-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "font-medium", children: stage.type === 'phone_screen' ? 'Phone Screen' :
                                                                                stage.type === 'technical' ? 'Technical Interview' :
                                                                                    stage.type === 'behavioral' ? 'Behavioral Interview' :
                                                                                        stage.type === 'onsite' ? 'Onsite Interview' :
                                                                                            stage.type === 'panel' ? 'Panel Interview' :
                                                                                                stage.type === 'final' ? 'Final Round' :
                                                                                                    'Interview' }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 ml-2", onClick: () => {
                                                                                setCurrentStageToEdit(stage);
                                                                                setShowEditStageForm(true);
                                                                            }, children: _jsx(Pencil, { className: "h-3.5 w-3.5" }) })] }), stage.scheduledDate && (_jsxs("div", { className: "flex items-center text-sm text-muted-foreground mt-1", children: [_jsx(CalendarClock, { className: "h-4 w-4 mr-1.5" }), _jsx("span", { children: format(new Date(stage.scheduledDate), 'MMM d, yyyy') })] })), stage.location && (_jsxs("div", { className: "flex items-center text-sm text-muted-foreground mt-1", children: [_jsx(Briefcase, { className: "h-4 w-4 mr-1.5" }), _jsx("span", { children: stage.location })] })), stage.notes && (_jsx("div", { className: "mt-2 text-xs text-muted-foreground", children: _jsx("p", { className: "line-clamp-2", children: stage.notes }) }))] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", className: stage.outcome === 'passed' ? "bg-green-50 text-green-700 border-green-200" :
                                                                            stage.outcome === 'failed' ? "bg-red-50 text-red-700 border-red-200" :
                                                                                stage.outcome === 'scheduled' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                                                    "bg-orange-50 text-orange-700 border-orange-200", size: "sm", children: stage.outcome === 'passed' ? 'Passed' :
                                                                            stage.outcome === 'failed' ? 'Rejected' :
                                                                                stage.outcome === 'scheduled' ? 'Scheduled' :
                                                                                    'Pending' }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { onClick: () => handleUpdateStageOutcome(stage.id, 'scheduled'), children: "Scheduled" }), _jsx(DropdownMenuItem, { onClick: () => handleUpdateStageOutcome(stage.id, 'pending'), children: "Pending" }), _jsx(DropdownMenuItem, { onClick: () => handleUpdateStageOutcome(stage.id, 'passed'), children: "Passed" }), _jsx(DropdownMenuItem, { onClick: () => handleUpdateStageOutcome(stage.id, 'failed'), children: "Rejected" })] })] })] }, stage.id))) })) : (_jsxs("div", { className: "text-center py-6", children: [_jsx(CalendarClock, { className: "h-10 w-10 mx-auto text-muted-foreground mb-2" }), _jsx("p", { className: "text-muted-foreground", children: "No interviews scheduled yet" }), _jsx(Button, { variant: "outline", className: "mt-3", onClick: () => setShowInterviewStageForm(true), children: "Schedule Interview" })] })) })) : (_jsxs("div", { className: "text-center py-6", children: [_jsx(CalendarClock, { className: "h-10 w-10 mx-auto text-muted-foreground mb-2" }), _jsx("p", { className: "text-muted-foreground", children: "No interviews scheduled yet" }), _jsx(Button, { variant: "outline", className: "mt-3", onClick: () => {
                                                        // Show a confirmation dialog before adding an interview
                                                        toast({
                                                            title: "Application Status Change",
                                                            description: "Adding an interview will change the application status to 'Interviewing'. Continue?",
                                                            action: (_jsx(Button, { onClick: () => {
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
                                                                }, variant: "default", size: "sm", children: "Confirm" })),
                                                        });
                                                    }, children: "Add Interview" })] })) })] }), showInterviewStageForm && (_jsx(InterviewStageForm, { isOpen: showInterviewStageForm, onClose: () => setShowInterviewStageForm(false), applicationId: application.id, onSuccess: () => {
                                    // Refresh interview stages data
                                    queryClient.invalidateQueries({
                                        queryKey: [`/api/applications/${application.id}/stages`]
                                    });
                                    toast({
                                        title: "Interview added",
                                        description: "The interview stage has been added successfully."
                                    });
                                } }))] }), _jsxs(TabsContent, { value: "follow-up", className: "space-y-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Follow-up Actions" }), _jsx(CardDescription, { children: "Track your follow-up communications" })] }), _jsxs(Button, { size: "sm", onClick: () => setShowFollowupForm(true), className: "flex items-center", children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "Add Follow-up"] })] }), _jsx(CardContent, { children: followupActions && followupActions.length > 0 ? (_jsx("div", { className: "space-y-3", children: followupActions.map((action) => (_jsx("div", { className: "flex items-start justify-between border rounded-md p-3", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("h4", { className: "font-medium", children: action.type === 'thank_you_email' ? 'Thank You Email' :
                                                                        action.type === 'follow_up' ? 'Follow-up' :
                                                                            action.type === 'preparation' ? 'Interview Preparation' :
                                                                                action.type === 'document_submission' ? 'Document Submission' :
                                                                                    action.type === 'networking' ? 'Networking Connection' :
                                                                                        action.description }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("div", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: action.completed ? 'Completed' : 'Pending' }), _jsx(Switch, { checked: action.completed, onCheckedChange: () => handleToggleFollowupStatus(action.id), className: "data-[state=checked]:bg-green-500" })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 flex-shrink-0", onClick: () => {
                                                                                setCurrentFollowupToEdit(action);
                                                                                setShowEditFollowupForm(true);
                                                                            }, children: _jsx(Pencil, { className: "h-3.5 w-3.5" }) })] })] }), _jsx("p", { className: "text-sm", children: action.description }), action.dueDate && (_jsxs("div", { className: "flex items-center text-sm text-muted-foreground mt-1", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1.5" }), _jsxs("span", { children: ["Due: ", format(new Date(action.dueDate), 'MMM d, yyyy')] })] })), action.notes && (_jsx("div", { className: "mt-2 text-xs text-muted-foreground", children: _jsx("p", { className: "line-clamp-2", children: action.notes }) }))] }) }, action.id))) })) : (_jsxs("div", { className: "text-center py-6", children: [_jsx(SendHorizontal, { className: "h-10 w-10 mx-auto text-muted-foreground mb-2" }), _jsx("p", { className: "text-muted-foreground", children: "No follow-up actions yet" }), _jsx(Button, { variant: "outline", className: "mt-3", onClick: () => setShowFollowupForm(true), children: "Add Follow-up" })] })) })] }), showFollowupForm && (_jsx(FollowupActionForm, { isOpen: showFollowupForm, onClose: () => setShowFollowupForm(false), applicationId: application.id, onSuccess: () => {
                                    // Refresh follow-up actions data
                                    queryClient.invalidateQueries({
                                        queryKey: [`/api/applications/${application.id}/followups`]
                                    });
                                    toast({
                                        title: "Follow-up added",
                                        description: "The follow-up action has been added successfully."
                                    });
                                } }))] })] }), onClose && (_jsx("div", { className: "flex justify-end mt-4", children: _jsx(Button, { variant: "outline", onClick: onClose, children: "Close" }) })), showEditStageForm && currentStageToEdit && (_jsx(EditInterviewStageForm, { isOpen: showEditStageForm, onClose: () => setShowEditStageForm(false), stage: currentStageToEdit, applicationId: application.id, onSuccess: () => {
                    // Refresh interview stages data
                    queryClient.invalidateQueries({
                        queryKey: [`/api/applications/${application.id}/stages`]
                    });
                    toast({
                        title: "Interview updated",
                        description: "The interview stage has been updated successfully."
                    });
                } })), showEditFollowupForm && currentFollowupToEdit && (_jsx(EditFollowupForm, { isOpen: showEditFollowupForm, onClose: () => setShowEditFollowupForm(false), followup: currentFollowupToEdit, applicationId: application.id, onSuccess: () => {
                    // Refresh follow-up actions data
                    queryClient.invalidateQueries({
                        queryKey: [`/api/applications/${application.id}/followups`]
                    });
                    toast({
                        title: "Follow-up updated",
                        description: "The follow-up action has been updated successfully."
                    });
                } })), _jsx(Dialog, { open: showMaterialsModal, onOpenChange: setShowMaterialsModal, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Select Application Materials" }), _jsx(DialogDescription, { children: "Choose the resume and cover letter you used for this job application." })] }), _jsxs("div", { className: "grid gap-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "resume", children: "Resume" }), _jsxs(Select, { value: selectedResume?.id, onValueChange: (value) => {
                                                if (resumes && resumes.length > 0) {
                                                    const selected = resumes.find((r) => r.id === value);
                                                    if (selected) {
                                                        setSelectedResume({
                                                            id: selected.id,
                                                            title: selected.title || selected.name || 'Untitled Resume'
                                                        });
                                                    }
                                                }
                                            }, disabled: isLoadingResumes, children: [_jsx(SelectTrigger, { id: "resume", children: _jsx(SelectValue, { placeholder: isLoadingResumes ? "Loading resumes..." : "Select a resume" }) }), _jsx(SelectContent, { children: isLoadingResumes ? (_jsx(SelectItem, { value: "loading", disabled: true, children: "Loading resumes..." })) : resumes && resumes.length > 0 ? (resumes.map((resume) => (_jsx(SelectItem, { value: resume.id, children: resume.title || resume.name || 'Untitled Resume' }, resume.id)))) : (_jsx(SelectItem, { value: "none", disabled: true, children: "No resumes found" })) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "cover-letter", children: "Cover Letter" }), _jsxs(Select, { value: selectedCoverLetter?.id, onValueChange: (value) => {
                                                if (coverLetters && coverLetters.length > 0) {
                                                    const selected = coverLetters.find((cl) => cl.id === value);
                                                    if (selected) {
                                                        setSelectedCoverLetter({
                                                            id: selected.id,
                                                            title: selected.title || selected.name || 'Untitled Cover Letter'
                                                        });
                                                    }
                                                }
                                            }, disabled: isLoadingCoverLetters, children: [_jsx(SelectTrigger, { id: "cover-letter", children: _jsx(SelectValue, { placeholder: isLoadingCoverLetters ? "Loading cover letters..." : "Select a cover letter" }) }), _jsx(SelectContent, { children: isLoadingCoverLetters ? (_jsx(SelectItem, { value: "loading", disabled: true, children: "Loading cover letters..." })) : coverLetters && coverLetters.length > 0 ? (coverLetters.map((coverLetter) => (_jsx(SelectItem, { value: coverLetter.id, children: coverLetter.title || coverLetter.name || 'Untitled Cover Letter' }, coverLetter.id)))) : (_jsx(SelectItem, { value: "none", disabled: true, children: "No cover letters found" })) })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                        setShowMaterialsModal(false);
                                        setPendingStatus(null);
                                    }, children: "Cancel" }), _jsx(Button, { type: "button", onClick: handleApplyWithMaterials, children: "Apply with Selected Materials" })] })] }) })] }));
}
