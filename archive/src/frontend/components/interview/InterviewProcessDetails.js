import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InterviewProcessStatusBadge } from './InterviewProcessStatusBadge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Calendar, FileText, Plus, Circle, Edit, Trash, PlusCircle, CheckCircle, PlayCircle, RefreshCw, ChevronDown, GitBranch // Using GitBranch icon as a substitute for Timeline
 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GamePracticeSession } from './GamePracticeSession';
import InterviewTimeline from './InterviewTimeline';
export const InterviewProcessDetails = ({ process }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAddStageDialogOpen, setIsAddStageDialogOpen] = useState(false);
    const [isEditStageDialogOpen, setIsEditStageDialogOpen] = useState(false);
    const [isDeleteStageDialogOpen, setIsDeleteStageDialogOpen] = useState(false);
    const [isAddFollowupDialogOpen, setIsAddFollowupDialogOpen] = useState(false);
    const [showPracticeSession, setShowPracticeSession] = useState(false);
    const [selectedStage, setSelectedStage] = useState(null);
    // Update interview process status mutation
    const updateProcessStatusMutation = useMutation({
        mutationFn: async (status) => {

            if (!process.id) {
                throw new Error('Process ID is missing');
            }
            try {
                const response = await apiRequest('PUT', `/api/interview/processes/${process.id}`, {
                    status
                });
                // Response validation
                if (!response.ok) {
                    let errorMessage = 'Failed to update interview process status';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    }
                    catch (e) {
                        console.error('Could not parse error response:', e);
                    }
                    throw new Error(errorMessage);
                }
                const data = await response.json();

                return data;
            }
            catch (error) {
                console.error('Error in mutation:', error);
                throw error;
            }
        },
        onSuccess: (data) => {

            // Invalidate the processes list
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            // Also invalidate user statistics to update any related data
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
            toast({
                title: 'Success',
                description: 'Interview process status updated successfully',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to update interview process status: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        },
    });
    const [newStage, setNewStage] = useState({
        type: '',
        scheduledDate: '',
        location: '',
        interviewers: '',
        notes: ''
    });
    const [editStage, setEditStage] = useState({
        id: 0,
        type: '',
        scheduledDate: '',
        location: '',
        interviewers: '',
        notes: ''
    });
    const [newFollowup, setNewFollowup] = useState({
        type: '',
        description: '',
        dueDate: '',
        notes: ''
    });
    // Fetch stages for this specific process
    const { data: stages, isLoading: loadingStages } = useQuery({
        queryKey: [`/api/interview/processes/${process.id}/stages`],
        enabled: !!process.id, // Only run query if we have a process ID
    });
    // Fetch followups for this specific process
    const { data: followups, isLoading: loadingFollowups } = useQuery({
        queryKey: [`/api/interview/processes/${process.id}/followups`],
        enabled: !!process.id, // Only run query if we have a process ID
    });
    // Combine server data with any data from the process prop
    const processStages = stages || process.stages || [];
    const processFollowups = followups || process.followups || [];
    // Add interview stage mutation
    const addStageMutation = useMutation({
        mutationFn: async (stageData) => {

            // Enhanced validation
            if (!process.id) {
                throw new Error('Process ID is missing. Please select a valid interview process.');
            }
            try {
                // Add processId to the request payload for additional validation on the server
                const payload = {
                    ...stageData,
                    processId: process.id
                };
                // Enhanced error logging

                const response = await apiRequest('POST', `/api/interview/processes/${process.id}/stages`, payload);
                // Additional response validation
                if (!response.ok) {
                    let errorMessage = 'Failed to add interview stage';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    }
                    catch (e) {
                        console.error('Could not parse error response:', e);
                    }
                    throw new Error(errorMessage);
                }
                const data = await response.json();

                return data;
            }
            catch (error) {
                console.error('Error in mutation:', error);
                throw error;
            }
        },
        onSuccess: (data) => {

            // Invalidate all relevant queries
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${process.id}/stages`] });
            queryClient.invalidateQueries({ queryKey: ['/api/interview/stages'] }); // For HorizontalTimeline
            // Also invalidate user statistics to update the upcoming interviews count
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
            toast({
                title: 'Success',
                description: 'Interview stage added successfully',
            });
            setIsAddStageDialogOpen(false);
            setNewStage({
                type: '',
                scheduledDate: '',
                location: '',
                interviewers: '',
                notes: ''
            });
        },
        onError: (error) => {
            console.error('Mutation error:', error);
            toast({
                title: 'Error',
                description: `Failed to add interview stage: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        },
    });
    // Add followup action mutation
    const addFollowupMutation = useMutation({
        mutationFn: async (followupData) => {

            // Enhanced validation
            if (!process.id) {
                throw new Error('Process ID is missing. Please select a valid interview process.');
            }
            try {
                // Add processId to the request payload for additional validation on the server
                const payload = {
                    ...followupData,
                    processId: process.id
                };
                // Enhanced error logging

                const response = await apiRequest('POST', `/api/interview/processes/${process.id}/followups`, payload);
                // Additional response validation
                if (!response.ok) {
                    let errorMessage = 'Failed to add followup action';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    }
                    catch (e) {
                        console.error('Could not parse error response:', e);
                    }
                    throw new Error(errorMessage);
                }
                const data = await response.json();

                return data;
            }
            catch (error) {
                console.error('Error in mutation:', error);
                throw error;
            }
        },
        onSuccess: (data) => {

            // Invalidate both the process list and the specific followups query
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${process.id}/followups`] });
            // Also invalidate the generic followup actions endpoint used by the Dashboard
            queryClient.invalidateQueries({ queryKey: ['/api/interview/followup-actions'] });
            // Also invalidate user statistics to update any related data
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
            toast({
                title: 'Success',
                description: 'Followup action added successfully',
            });
            setIsAddFollowupDialogOpen(false);
            setNewFollowup({
                type: '',
                description: '',
                dueDate: '',
                notes: ''
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to add followup action: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        },
    });
    // Update interview stage mutation
    const updateStageMutation = useMutation({
        mutationFn: async (stageData) => {

            if (!stageData.id) {
                throw new Error('Stage ID is missing');
            }
            try {
                // Prepare a clean payload with only the fields we want to update
                const payload = {
                    type: stageData.type,
                    scheduledDate: stageData.scheduledDate,
                    location: stageData.location,
                    notes: stageData.notes,
                    interviewers: Array.isArray(stageData.interviewers)
                        ? stageData.interviewers
                        : stageData.interviewers.split(',').map((item) => item.trim()),
                    processId: process.id // Send process ID for additional server validation
                };
                const response = await apiRequest('PUT', `/api/interview/stages/${stageData.id}`, payload);
                // Response validation
                if (!response.ok) {
                    let errorMessage = 'Failed to update interview stage';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    }
                    catch (e) {
                        console.error('Could not parse error response:', e);
                    }
                    throw new Error(errorMessage);
                }
                const data = await response.json();

                return data;
            }
            catch (error) {
                console.error('Error in mutation:', error);
                throw error;
            }
        },
        onSuccess: (data) => {

            // Invalidate all relevant queries
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${process.id}/stages`] });
            queryClient.invalidateQueries({ queryKey: ['/api/interview/stages'] }); // For HorizontalTimeline
            // Also invalidate user statistics to update any related data
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
            toast({
                title: 'Success',
                description: 'Interview stage updated successfully',
            });
            setIsEditStageDialogOpen(false);
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to update interview stage: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        },
    });
    // Delete interview stage mutation
    const deleteStageMutation = useMutation({
        mutationFn: async (stageId) => {

            if (!stageId) {
                throw new Error('Stage ID is missing');
            }
            try {
                const response = await apiRequest('DELETE', `/api/interview/stages/${stageId}`, {
                    processId: process.id // Send process ID for additional server validation
                });
                // Response validation
                if (!response.ok) {
                    let errorMessage = 'Failed to delete interview stage';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    }
                    catch (e) {
                        console.error('Could not parse error response:', e);
                    }
                    throw new Error(errorMessage);
                }
                return stageId;
            }
            catch (error) {
                console.error('Error in mutation:', error);
                throw error;
            }
        },
        onSuccess: (stageId) => {

            // Invalidate all relevant queries
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${process.id}/stages`] });
            queryClient.invalidateQueries({ queryKey: ['/api/interview/stages'] }); // For HorizontalTimeline
            // Also invalidate user statistics to update any related data
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
            toast({
                title: 'Success',
                description: 'Interview stage deleted successfully',
            });
            setIsDeleteStageDialogOpen(false);
            setSelectedStage(null);
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to delete interview stage: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        },
    });
    // Complete interview stage mutation
    const completeInterviewStageMutation = useMutation({
        mutationFn: async (stageId) => {

            if (!stageId) {
                throw new Error('Stage ID is missing');
            }
            try {
                const response = await apiRequest('PUT', `/api/interview/stages/${stageId}`, {
                    completedDate: new Date().toISOString().split('T')[0], // Send today's date as completion date
                    processId: process.id // Send process ID for additional server validation
                });
                // Response validation
                if (!response.ok) {
                    let errorMessage = 'Failed to complete interview stage';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    }
                    catch (e) {
                        console.error('Could not parse error response:', e);
                    }
                    throw new Error(errorMessage);
                }
                const data = await response.json();

                return data;
            }
            catch (error) {
                console.error('Error in mutation:', error);
                throw error;
            }
        },
        onSuccess: (data) => {

            // Invalidate all relevant queries
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${process.id}/stages`] });
            queryClient.invalidateQueries({ queryKey: ['/api/interview/stages'] }); // For HorizontalTimeline
            // Also invalidate user statistics to update any related data
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
            toast({
                title: 'Success',
                description: 'Interview stage marked as completed',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to complete interview stage: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        },
    });
    // Complete followup action mutation
    const completeFollowupMutation = useMutation({
        mutationFn: async (followupId) => {

            if (!followupId) {
                throw new Error('Followup action ID is missing');
            }
            try {
                const response = await apiRequest('PUT', `/api/interview/followup-actions/${followupId}/complete`, {
                    processId: process.id // Send process ID for additional server validation
                });
                // Additional response validation
                if (!response.ok) {
                    let errorMessage = 'Failed to complete followup action';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    }
                    catch (e) {
                        console.error('Could not parse error response:', e);
                    }
                    throw new Error(errorMessage);
                }
                const data = await response.json();

                return data;
            }
            catch (error) {
                console.error('Error in mutation:', error);
                throw error;
            }
        },
        onSuccess: (data) => {

            // Invalidate both the process list and the specific followups query
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${process.id}/followups`] });
            // Also invalidate the generic followup actions endpoint used by the Dashboard
            queryClient.invalidateQueries({ queryKey: ['/api/interview/followup-actions'] });
            // Also invalidate user statistics to update any related data
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
            toast({
                title: 'Success',
                description: 'Followup action marked as completed',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to complete followup action: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        },
    });
    // Uncomplete followup action mutation
    const uncompleteFollowupMutation = useMutation({
        mutationFn: async (followupId) => {

            if (!followupId) {
                throw new Error('Followup action ID is missing');
            }
            try {
                const response = await apiRequest('PUT', `/api/interview/followup-actions/${followupId}/uncomplete`, {
                    processId: process.id // Send process ID for additional server validation
                });
                // Additional response validation
                if (!response.ok) {
                    let errorMessage = 'Failed to uncomplete followup action';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    }
                    catch (e) {
                        console.error('Could not parse error response:', e);
                    }
                    throw new Error(errorMessage);
                }
                const data = await response.json();

                return data;
            }
            catch (error) {
                console.error('Error in mutation:', error);
                throw error;
            }
        },
        onSuccess: (data) => {

            // Invalidate both the process list and the specific followups query
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${process.id}/followups`] });
            // Also invalidate the generic followup actions endpoint used by the Dashboard
            queryClient.invalidateQueries({ queryKey: ['/api/interview/followup-actions'] });
            // Also invalidate user statistics to update any related data
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
            toast({
                title: 'Success',
                description: 'Followup action marked as pending',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to uncomplete followup action: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        },
    });
    const handleAddStage = (e) => {
        e.preventDefault();
        // Format interviewers as an array
        const interviewersArray = newStage.interviewers
            ? newStage.interviewers.split(',').map(item => item.trim())
            : [];
        addStageMutation.mutate({
            ...newStage,
            interviewers: interviewersArray
        });
    };
    const handleAddFollowup = (e) => {
        e.preventDefault();
        addFollowupMutation.mutate(newFollowup);
    };
    const handleCompleteFollowup = (followupId) => {
        completeFollowupMutation.mutate(followupId);
    };
    const handleUncompleteFollowup = (followupId) => {
        uncompleteFollowupMutation.mutate(followupId);
    };
    const handleCompleteStage = (stageId) => {
        completeInterviewStageMutation.mutate(stageId);
    };
    const handleEditStage = (stage) => {
        // Format interviewers array to string if it exists
        const interviewersString = stage.interviewers && Array.isArray(stage.interviewers)
            ? stage.interviewers.join(', ')
            : '';
        // Format scheduledDate to YYYY-MM-DD format for input[type="date"]
        const scheduledDateFormatted = stage.scheduledDate
            ? new Date(stage.scheduledDate).toISOString().split('T')[0]
            : '';
        setEditStage({
            id: stage.id,
            type: stage.type,
            scheduledDate: scheduledDateFormatted,
            location: stage.location || '',
            interviewers: interviewersString,
            notes: stage.notes || ''
        });
        setSelectedStage(stage);
        setIsEditStageDialogOpen(true);
    };
    const handleUpdateStage = (e) => {
        e.preventDefault();
        updateStageMutation.mutate(editStage);
    };
    const handleDeleteStage = (stage) => {
        setSelectedStage(stage);
        setIsDeleteStageDialogOpen(true);
    };
    const confirmDeleteStage = () => {
        if (selectedStage) {
            deleteStageMutation.mutate(selectedStage.id);
        }
    };
    // Sort stages by scheduled date (most recent first)
    const sortedStages = processStages.length > 0
        ? [...processStages].sort((a, b) => {
            if (!a.scheduledDate)
                return 1;
            if (!b.scheduledDate)
                return -1;
            return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
        })
        : [];
    // Sort followups by due date
    const sortedFollowups = processFollowups.length > 0
        ? [...processFollowups].sort((a, b) => {
            if (!a.dueDate)
                return 1;
            if (!b.dueDate)
                return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        })
        : [];
    // Filter pending and completed followups
    const pendingFollowups = sortedFollowups.filter(f => !f.completed);
    const completedFollowups = sortedFollowups.filter(f => f.completed);
    // Format status badges
    const getStatusBadge = (status) => {
        return _jsx(InterviewProcessStatusBadge, { status: status });
    };
    // Format dates
    const formatDate = (date) => {
        if (!date)
            return 'Not scheduled';
        if (date instanceof Date) {
            return format(date, 'MMM d, yyyy');
        }
        return format(new Date(date), 'MMM d, yyyy');
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-xl", children: process.companyName }), _jsx("p", { className: "text-muted-foreground", children: process.position })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "flex items-center", onClick: () => setShowPracticeSession(true), children: [_jsx(PlayCircle, { className: "h-4 w-4 mr-1" }), "Practice"] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: "flex items-center gap-1 py-1 px-2 border border-input hover:bg-accent hover:text-accent-foreground", children: [getStatusBadge(process.status), _jsx(ChevronDown, { className: "h-4 w-4 ml-1" })] }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsxs(DropdownMenuItem, { className: process.status === 'Application Submitted' ? 'bg-accent text-accent-foreground' : '', onClick: () => updateProcessStatusMutation.mutate('Application Submitted'), children: [_jsx("div", { className: "mr-2", children: _jsx(InterviewProcessStatusBadge, { status: "Application Submitted" }) }), process.status === 'Application Submitted' && _jsx(Check, { className: "h-4 w-4 ml-auto" })] }), _jsxs(DropdownMenuItem, { className: process.status === 'In Progress' ? 'bg-accent text-accent-foreground' : '', onClick: () => updateProcessStatusMutation.mutate('In Progress'), children: [_jsx("div", { className: "mr-2", children: _jsx(InterviewProcessStatusBadge, { status: "In Progress" }) }), process.status === 'In Progress' && _jsx(Check, { className: "h-4 w-4 ml-auto" })] }), _jsxs(DropdownMenuItem, { className: process.status === 'Offer Extended' ? 'bg-accent text-accent-foreground' : '', onClick: () => updateProcessStatusMutation.mutate('Offer Extended'), children: [_jsx("div", { className: "mr-2", children: _jsx(InterviewProcessStatusBadge, { status: "Offer Extended" }) }), process.status === 'Offer Extended' && _jsx(Check, { className: "h-4 w-4 ml-auto" })] }), _jsxs(DropdownMenuItem, { className: process.status === 'Hired' ? 'bg-accent text-accent-foreground' : '', onClick: () => updateProcessStatusMutation.mutate('Hired'), children: [_jsx("div", { className: "mr-2", children: _jsx(InterviewProcessStatusBadge, { status: "Hired" }) }), process.status === 'Hired' && _jsx(Check, { className: "h-4 w-4 ml-auto" })] }), _jsxs(DropdownMenuItem, { className: process.status === 'Not Selected' ? 'bg-accent text-accent-foreground' : '', onClick: () => updateProcessStatusMutation.mutate('Not Selected'), children: [_jsx("div", { className: "mr-2", children: _jsx(InterviewProcessStatusBadge, { status: "Not Selected" }) }), process.status === 'Not Selected' && _jsx(Check, { className: "h-4 w-4 ml-auto" })] })] })] })] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [process.jobDescription && (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Job Description" }), _jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-line", children: process.jobDescription })] })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [process.contactName && (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Contact" }), _jsx("p", { className: "text-sm", children: process.contactName })] })), process.contactEmail && (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Email" }), _jsx("p", { className: "text-sm", children: process.contactEmail })] })), process.contactPhone && (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Phone" }), _jsx("p", { className: "text-sm", children: process.contactPhone })] })), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Created" }), _jsx("p", { className: "text-sm", children: formatDate(process.createdAt) })] })] }), process.notes && (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-1", children: "Notes" }), _jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-line", children: process.notes })] }))] })] }), _jsxs(Accordion, { type: "single", collapsible: true, className: "w-full", children: [_jsxs(AccordionItem, { value: "stages", children: [_jsxs(AccordionTrigger, { className: "text-base font-medium", children: ["Interview Stages (", sortedStages.length, ")"] }), _jsx(AccordionContent, { children: _jsxs("div", { className: "space-y-4", children: [sortedStages.length > 0 ? (_jsxs(Tabs, { defaultValue: "table", className: "mb-4", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "table", className: "flex items-center gap-1", children: [_jsx(FileText, { className: "h-4 w-4" }), _jsx("span", { children: "Table View" })] }), _jsxs(TabsTrigger, { value: "timeline", className: "flex items-center gap-1", children: [_jsx(GitBranch, { className: "h-4 w-4" }), _jsx("span", { children: "Timeline" })] })] }), _jsx(TabsContent, { value: "table", className: "mt-4", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Type" }), _jsx(TableHead, { children: "Date" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: sortedStages.map((stage) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: stage.type }), _jsx(TableCell, { children: formatDate(stage.scheduledDate) }), _jsx(TableCell, { children: stage.completedDate ? (_jsx(Badge, { variant: "outline", className: "bg-green-100 text-green-800 hover:bg-green-100", children: "Completed" })) : (_jsx(Badge, { variant: "outline", className: "bg-blue-100 text-blue-800 hover:bg-blue-100", children: "Scheduled" })) }), _jsx(TableCell, { className: "text-right", children: _jsx("div", { className: "flex justify-end space-x-2", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", children: _jsx(Edit, { className: "h-4 w-4" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [!stage.completedDate && (_jsxs(DropdownMenuItem, { onClick: () => handleCompleteStage(stage.id), disabled: completeInterviewStageMutation.isPending, children: [_jsx(Check, { className: "mr-2 h-4 w-4" }), "Mark as Completed"] })), _jsxs(DropdownMenuItem, { onClick: () => handleEditStage(stage), children: [_jsx(Edit, { className: "mr-2 h-4 w-4" }), "Edit Details"] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { className: "text-red-600", onClick: () => handleDeleteStage(stage), children: [_jsx(Trash, { className: "mr-2 h-4 w-4" }), "Delete"] })] })] }) }) })] }, stage.id))) })] }) }), _jsx(TabsContent, { value: "timeline", className: "mt-4", children: _jsx(InterviewTimeline, { stages: sortedStages }) })] })) : (_jsx("div", { className: "text-center py-4 text-muted-foreground", children: "No interview stages added yet." })), _jsxs(Button, { onClick: () => setIsAddStageDialogOpen(true), variant: "outline", className: "w-full", children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Interview Stage"] })] }) })] }), _jsxs(AccordionItem, { value: "followups", children: [_jsxs(AccordionTrigger, { className: "text-base font-medium", children: ["Followup Actions (", pendingFollowups.length, " pending)"] }), _jsx(AccordionContent, { children: _jsxs("div", { className: "space-y-4", children: [pendingFollowups.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2", children: "Pending Actions" }), _jsx("div", { className: "space-y-2", children: pendingFollowups.map((followup) => (_jsxs("div", { className: "flex items-start justify-between p-3 border rounded-md", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { onClick: () => handleCompleteFollowup(followup.id), className: "cursor-pointer hover:opacity-75 transition-opacity", children: _jsx(Circle, { className: "h-3 w-3 text-blue-500 mr-2" }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Click to mark as completed" }) })] }) }), _jsx("span", { className: "font-medium", children: followup.type })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: followup.description }), followup.dueDate && (_jsxs("div", { className: "flex items-center text-xs text-muted-foreground", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), "Due: ", formatDate(followup.dueDate)] }))] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleCompleteFollowup(followup.id), children: _jsx(Check, { className: "h-4 w-4" }) })] }, followup.id))) })] })), completedFollowups.length > 0 && (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2", children: "Completed Actions" }), _jsx("div", { className: "space-y-2", children: completedFollowups.map((followup) => (_jsxs("div", { className: "flex items-start justify-between p-3 border rounded-md bg-gray-50", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { onClick: () => handleUncompleteFollowup(followup.id), className: "cursor-pointer hover:opacity-75 transition-opacity", children: _jsx(CheckCircle, { className: "h-3 w-3 text-green-500 mr-2" }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Click to mark as pending" }) })] }) }), _jsx("span", { className: "font-medium line-through text-muted-foreground", children: followup.type })] }), _jsx("p", { className: "text-sm text-muted-foreground line-through", children: followup.description }), followup.completedDate && (_jsxs("div", { className: "flex items-center text-xs text-muted-foreground", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), "Completed: ", formatDate(followup.completedDate)] }))] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleUncompleteFollowup(followup.id), className: "h-8 w-8 p-0", title: "Mark as pending", children: _jsx(RefreshCw, { className: "h-4 w-4" }) })] }, followup.id))) })] })), sortedFollowups.length === 0 && (_jsx("div", { className: "text-center py-4 text-muted-foreground", children: "No followup actions added yet." })), _jsxs(Button, { onClick: () => setIsAddFollowupDialogOpen(true), variant: "outline", className: "w-full", children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "Add Followup Action"] })] }) })] })] }), _jsx(Dialog, { open: isAddStageDialogOpen, onOpenChange: setIsAddStageDialogOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add Interview Stage" }), _jsx(DialogDescription, { children: "Add a new interview stage to track your interview process." })] }), _jsxs("form", { onSubmit: handleAddStage, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Type*" }), _jsx(Input, { placeholder: "e.g., Phone Screening, Technical Interview", value: newStage.type, onChange: (e) => setNewStage({ ...newStage, type: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Scheduled Date" }), _jsx(Input, { type: "date", value: newStage.scheduledDate, onChange: (e) => setNewStage({ ...newStage, scheduledDate: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Location" }), _jsx(Input, { placeholder: "e.g., Zoom, On-site, Phone", value: newStage.location, onChange: (e) => setNewStage({ ...newStage, location: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Interviewers" }), _jsx(Input, { placeholder: "Names separated by commas", value: newStage.interviewers, onChange: (e) => setNewStage({ ...newStage, interviewers: e.target.value }) }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Enter names separated by commas" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Notes" }), _jsx(Textarea, { placeholder: "Additional details about this interview stage", value: newStage.notes, onChange: (e) => setNewStage({ ...newStage, notes: e.target.value }) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsAddStageDialogOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: !newStage.type || addStageMutation.isPending, children: addStageMutation.isPending ? 'Adding...' : 'Add Stage' })] })] })] }) }), _jsx(Dialog, { open: isAddFollowupDialogOpen, onOpenChange: setIsAddFollowupDialogOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add Followup Action" }), _jsx(DialogDescription, { children: "Add a new followup action to keep track of your next steps." })] }), _jsxs("form", { onSubmit: handleAddFollowup, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Type*" }), _jsx(Input, { placeholder: "e.g., Thank You Email, Prepare Questions", value: newFollowup.type, onChange: (e) => setNewFollowup({ ...newFollowup, type: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Description*" }), _jsx(Textarea, { placeholder: "Detailed description of the action", value: newFollowup.description, onChange: (e) => setNewFollowup({ ...newFollowup, description: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Due Date" }), _jsx(Input, { type: "date", value: newFollowup.dueDate, onChange: (e) => setNewFollowup({ ...newFollowup, dueDate: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Notes" }), _jsx(Textarea, { placeholder: "Additional notes or details", value: newFollowup.notes, onChange: (e) => setNewFollowup({ ...newFollowup, notes: e.target.value }) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsAddFollowupDialogOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: !newFollowup.type || !newFollowup.description || addFollowupMutation.isPending, children: addFollowupMutation.isPending ? 'Adding...' : 'Add Followup' })] })] })] }) }), _jsx(GamePracticeSession, { isOpen: showPracticeSession, onClose: () => setShowPracticeSession(false), process: process }), _jsx(Dialog, { open: isEditStageDialogOpen, onOpenChange: setIsEditStageDialogOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit Interview Stage" }), _jsx(DialogDescription, { children: "Update the details of this interview stage." })] }), _jsxs("form", { onSubmit: handleUpdateStage, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Type*" }), _jsx(Input, { placeholder: "e.g., Phone Screening, Technical Interview", value: editStage.type, onChange: (e) => setEditStage({ ...editStage, type: e.target.value }), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Scheduled Date" }), _jsx(Input, { type: "date", value: editStage.scheduledDate, onChange: (e) => setEditStage({ ...editStage, scheduledDate: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Location" }), _jsx(Input, { placeholder: "e.g., Zoom, On-site, Phone", value: editStage.location, onChange: (e) => setEditStage({ ...editStage, location: e.target.value }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Interviewers" }), _jsx(Input, { placeholder: "Names separated by commas", value: editStage.interviewers, onChange: (e) => setEditStage({ ...editStage, interviewers: e.target.value }) }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Enter names separated by commas" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Notes" }), _jsx(Textarea, { placeholder: "Additional details about this interview stage", value: editStage.notes, onChange: (e) => setEditStage({ ...editStage, notes: e.target.value }) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsEditStageDialogOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: !editStage.type || updateStageMutation.isPending, children: updateStageMutation.isPending ? 'Updating...' : 'Update Stage' })] })] })] }) }), _jsx(AlertDialog, { open: isDeleteStageDialogOpen, onOpenChange: setIsDeleteStageDialogOpen, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Are you sure?" }), _jsxs(AlertDialogDescription, { children: ["This will permanently delete the interview stage \"", selectedStage?.type, "\". This action cannot be undone."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsx(AlertDialogAction, { onClick: confirmDeleteStage, disabled: deleteStageMutation.isPending, className: "bg-red-500 hover:bg-red-600", children: deleteStageMutation.isPending ? 'Deleting...' : 'Delete' })] })] }) })] }));
};
