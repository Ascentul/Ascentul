import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Circle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
const InterviewFollowupActions = ({ limit = 3, showTitle = true, showCard = true, endpoint = '/api/interview/followup-actions', }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [showCompleted, setShowCompleted] = useState(false);
    // Fetch all followup actions across all interview processes
    const { data: followupActions = [], isLoading } = useQuery({
        queryKey: [endpoint],
        // This is a custom endpoint we'll add to fetch all followups for the logged-in user
        queryFn: async () => {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error('Failed to fetch followup actions');
            }
            return response.json();
        },
    });
    // Sort followup actions by due date (earliest first)
    const sortedActions = [...followupActions].sort((a, b) => {
        if (!a.dueDate)
            return 1;
        if (!b.dueDate)
            return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    // Filter actions by completion status
    const pendingActions = sortedActions.filter(action => !action.completed);
    const completedActions = sortedActions.filter(action => action.completed);
    // Format date for display
    const formatDate = (date) => {
        if (!date)
            return 'No due date';
        return format(new Date(date), 'MMM d, yyyy');
    };
    // Complete followup mutation
    const completeFollowupMutation = useMutation({
        mutationFn: async (followupId) => {
            const response = await apiRequest('PUT', `/api/interview/followup-actions/${followupId}/complete`, {});
            if (!response.ok) {
                throw new Error('Failed to complete followup action');
            }
            return response.json();
        },
        onSuccess: () => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: [endpoint] });
            queryClient.invalidateQueries({ queryKey: ['/api/interview/followup-actions'] });
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            queryClient.invalidateQueries({ queryKey: ['/users/statistics'] });
            toast({
                title: 'Action completed',
                description: 'The followup action has been marked as completed.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
    // Uncomplete followup mutation
    const uncompleteFollowupMutation = useMutation({
        mutationFn: async (followupId) => {
            const response = await apiRequest('PUT', `/api/interview/followup-actions/${followupId}/uncomplete`, {});
            if (!response.ok) {
                throw new Error('Failed to mark followup action as pending');
            }
            return response.json();
        },
        onSuccess: () => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: [endpoint] });
            queryClient.invalidateQueries({ queryKey: ['/api/interview/followup-actions'] });
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            queryClient.invalidateQueries({ queryKey: ['/users/statistics'] });
            toast({
                title: 'Action marked as pending',
                description: 'The followup action has been moved back to pending status.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
    const handleCompleteFollowup = (followupId) => {
        completeFollowupMutation.mutate(followupId);
    };
    const handleUncompleteFollowup = (followupId) => {
        uncompleteFollowupMutation.mutate(followupId);
    };
    // Create Loading UI
    const loadingContent = (_jsx("div", { className: "flex justify-center items-center py-6", children: _jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-primary" }) }));
    // Create Content UI
    const contentUI = (_jsx("div", { children: pendingActions.length > 0 ? (_jsxs("div", { className: "space-y-2 mb-4", children: [pendingActions.slice(0, limit).map((action) => (_jsxs("div", { className: "flex items-start justify-between p-3 border rounded-md hover:bg-accent/10 transition-colors", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { onClick: () => handleCompleteFollowup(action.id), className: "cursor-pointer hover:opacity-75 transition-opacity", children: _jsx(Circle, { className: "h-3 w-3 text-blue-500 mr-2" }) }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Click to mark as completed" }) })] }) }), _jsx("span", { className: "font-medium", children: action.type })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: action.description }), action.dueDate && (_jsxs("div", { className: "flex items-center text-xs text-muted-foreground", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), "Due: ", formatDate(action.dueDate)] }))] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleCompleteFollowup(action.id), className: "h-8 w-8 p-0", children: _jsx(Check, { className: "h-4 w-4" }) })] }, action.id))), pendingActions.length > limit && (_jsxs("div", { className: "text-center text-sm text-muted-foreground mt-2", children: ["+ ", pendingActions.length - limit, " more actions"] }))] })) : (_jsx("div", { className: "text-center py-4 text-muted-foreground", children: "No pending interview followups." })) }));
    // Return based on showCard prop
    if (isLoading) {
        return loadingContent;
    }
    return (_jsxs("div", { children: [showTitle && (_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-lg font-semibold font-poppins", children: "Interview Followups" }), pendingActions.length > 0 && (_jsxs(Badge, { variant: "outline", className: "ml-2", children: [pendingActions.length, " pending"] }))] })), contentUI] }));
};
export { InterviewFollowupActions };
