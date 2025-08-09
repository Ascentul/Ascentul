import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Edit, Calendar, CheckSquare, Square, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import '@/assets/css/goal-card-animations.css';
// Import dropdown components
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
// Import the Confetti component
import Confetti from './Confetti';
export default function GoalCard({ id, title, description, progress, status, dueDate, checklist = [], onEdit, onComplete, }) {
    const [showChecklist, setShowChecklist] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Reference to track if we've shown confetti for this goal completion
    const completionCelebratedRef = useRef(false);
    // Reference to the card element for confetti positioning
    const cardRef = useRef(null);
    // Function to handle goal completion (immediately remove the goal without animation)
    const handleDissolveAnimation = (goalId) => {
        // Immediately call the onComplete handler to move the goal to the Completed Goals section
        if (onComplete) {
            onComplete(goalId);
        }
    };
    // Convert status to badge styling
    const getBadgeStyles = () => {
        switch (status.toLowerCase()) {
            case 'in-progress':
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'active':
                return 'bg-primary/10 text-primary';
            case 'on-track':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'overdue':
                return 'bg-red-100 text-red-800';
            case 'not_started':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    // Format due date display
    const formatDueDate = () => {
        if (!dueDate)
            return 'No due date';
        const now = new Date();
        const dueTime = new Date(dueDate).getTime();
        if (dueTime < now.getTime()) {
            return `Overdue by ${formatDistanceToNow(dueTime)}`;
        }
        return `Due in ${formatDistanceToNow(dueTime)}`;
    };
    // Handle status changes from the dropdown menu
    const handleStatusChange = (newStatus) => {
        // Don't update if the status is already the same
        if (status === newStatus)
            return;
        // For completed status, we need to set additional properties
        const isCompleted = newStatus === 'completed';
        // Create the update object
        const updateData = { status: newStatus };
        // Set completed and completedAt for completed status
        if (isCompleted) {
            updateData.completed = true;
            updateData.progress = 100;
        }
        // Call the update mutation
        updateChecklistMutation.mutate(updateData);
        // Format the status label for the toast message
        const statusLabel = newStatus.replace('_', ' ');
        const formattedStatus = statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1);
        // Show toast message
        toast({
            title: `Goal status updated`,
            description: `Status changed to "${formattedStatus}"`,
        });
        // If setting to completed, initiate the completion flow
        if (isCompleted && !completionCelebratedRef.current) {
            completionCelebratedRef.current = true;
            setShowConfetti(true);
            // After a short delay, dissolve the goal
            setTimeout(() => {
                handleDissolveAnimation(id);
            }, 1500);
        }
    };
    // Update checklist item mutation
    const updateChecklistMutation = useMutation({
        mutationFn: async (updatedGoal) => {
            const response = await apiRequest('PUT', `/api/goals/${id}`, updatedGoal);
            return response.json();
        },
        onMutate: async (updatedGoal) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['/api/goals'] });
            // Snapshot the previous value
            const previousGoals = queryClient.getQueryData(['/api/goals']);
            // Optimistically update to the new value
            queryClient.setQueryData(['/api/goals'], (old) => {
                if (!old)
                    return [];
                return old.map(goal => {
                    if (goal.id === id) {
                        return {
                            ...goal,
                            ...updatedGoal
                        };
                    }
                    return goal;
                });
            });
            // Return a context object with the snapshotted value
            return { previousGoals };
        },
        onError: (error, newData, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousGoals) {
                queryClient.setQueryData(['/api/goals'], context.previousGoals);
            }
            toast({
                title: "Failed to update checklist",
                description: error.message || "There was a problem updating the checklist. Please try again.",
                variant: "destructive",
            });
        },
        onSettled: () => {
            // Always refetch after error or success to ensure cache consistency
            queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
            // Also invalidate user statistics to update the active goals count
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
        },
    });
    // Check if all checklist items are completed or if the status should be updated to "in progress"
    useEffect(() => {
        // Only proceed if we have a checklist
        if (!checklist || checklist.length === 0)
            return;
        const allCompleted = checklist.every(item => item.completed);
        const hasAtLeastOneChecked = checklist.some(item => item.completed);
        const totalItems = checklist.length;
        const hasAtLeastTwoItems = totalItems >= 2;
        const isNotStarted = status.toLowerCase() === 'not_started' || status.toLowerCase() === 'active';
        // If all items are completed and we're not in completed status
        if (allCompleted && totalItems > 0 && status.toLowerCase() !== 'completed' && !completionCelebratedRef.current) {
            // Set the flag to avoid showing confetti multiple times for the same completion
            completionCelebratedRef.current = true;
            // Start confetti celebration
            setShowConfetti(true);
            // Update status to completed
            updateChecklistMutation.mutate({
                status: 'completed',
                progress: 100,
                checklist: checklist,
                completed: true
            });
            // Show success toast
            toast({
                title: "Goal completed! 🎉",
                description: "Congratulations on completing your goal!",
            });
            // Start the dissolve animation
            handleDissolveAnimation(id);
        }
        // Also trigger the dissolution if the goal is already marked as completed and all checklist items are done
        else if (allCompleted && totalItems > 0 && status.toLowerCase() === 'completed' && !completionCelebratedRef.current) {
            // Set the flag to avoid showing confetti multiple times for the same completion
            completionCelebratedRef.current = true;
            // Start confetti celebration
            setShowConfetti(true);
            // Show success toast
            toast({
                title: "Goal completed! 🎉",
                description: "Congratulations on completing your goal!",
            });
            // Start the dissolve animation
            handleDissolveAnimation(id);
        }
        // Check if we should update to "in progress" status
        // This happens when loading the goal initially, rather than on user interaction
        else if (hasAtLeastTwoItems && hasAtLeastOneChecked && !allCompleted && isNotStarted) {
            // Update status to in_progress
            updateChecklistMutation.mutate({
                status: 'in_progress',
                checklist: checklist
            });
        }
    }, [checklist, status, id, onComplete]);
    // Toggle checklist item
    const toggleChecklistItem = (itemId) => {
        if (!checklist)
            return;
        const updatedChecklist = checklist.map(item => {
            if (item.id === itemId) {
                return { ...item, completed: !item.completed };
            }
            return item;
        });
        // Calculate new progress based on checklist items
        const completedItems = updatedChecklist.filter(item => item.completed).length;
        const totalItems = updatedChecklist.length;
        const newProgress = totalItems > 0
            ? Math.round((completedItems / totalItems) * 100)
            : progress;
        // Check if all items are now completed
        const allCompleted = completedItems === totalItems && totalItems > 0;
        // If all completed, update status to completed and show confetti
        if (allCompleted && status.toLowerCase() !== 'completed' && !completionCelebratedRef.current) {
            // Update status to completed
            updateChecklistMutation.mutate({
                checklist: updatedChecklist,
                progress: 100,
                status: 'completed',
                completed: true
            });
            // Set the flag to avoid showing confetti multiple times
            completionCelebratedRef.current = true;
            // Start confetti celebration
            setShowConfetti(true);
            // Show success toast
            toast({
                title: "Goal completed! 🎉",
                description: "Congratulations on completing your goal!",
            });
            // Start the dissolve animation
            handleDissolveAnimation(id);
        }
        // If already completed and all items are now done, dissolve the goal
        else if (allCompleted && status.toLowerCase() === 'completed' && !completionCelebratedRef.current) {
            // Update checklist 
            updateChecklistMutation.mutate({
                checklist: updatedChecklist,
                progress: 100
            });
            // Set the flag to avoid showing confetti multiple times
            completionCelebratedRef.current = true;
            // Start confetti celebration
            setShowConfetti(true);
            // Start the dissolve animation
            handleDissolveAnimation(id);
        }
        else {
            // Check if we should update the status to "in_progress"
            // Condition: Has 2+ checklist items and at least one is checked, but not all are checked
            const hasAtLeastTwoItems = updatedChecklist.length >= 2;
            const hasAtLeastOneChecked = updatedChecklist.some(item => item.completed);
            const areAllChecked = updatedChecklist.every(item => item.completed);
            const isNotStarted = status.toLowerCase() === 'not_started' || status.toLowerCase() === 'active';
            if (hasAtLeastTwoItems && hasAtLeastOneChecked && !areAllChecked && isNotStarted) {
                // Update to in-progress status
                updateChecklistMutation.mutate({
                    checklist: updatedChecklist,
                    progress: newProgress,
                    status: 'in_progress'
                });
                // Show a subtle notification
                toast({
                    title: "Goal in progress",
                    description: "Your goal status has been updated to 'In Progress'",
                });
            }
            else {
                // Just update the checklist and progress
                updateChecklistMutation.mutate({
                    checklist: updatedChecklist,
                    progress: newProgress
                });
            }
        }
    };
    const hasChecklist = checklist && checklist.length > 0;
    return (_jsxs(_Fragment, { children: [_jsx(Confetti, { active: showConfetti, duration: 1750, targetRef: cardRef }), _jsx("div", { id: `goal-${id}`, className: "goal-card", ref: cardRef, children: _jsxs(Card, { className: "rounded-2xl shadow-sm flex flex-col justify-between h-full bg-white hover:shadow-md transition-shadow duration-150", children: [_jsxs("div", { className: "p-6 space-y-3 pb-4 flex-grow", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("div", { children: _jsx("h3", { className: "text-lg font-semibold", children: title }) }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", className: "p-0 h-auto hover:bg-transparent", children: _jsx(Badge, { variant: "outline", className: `text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${getBadgeStyles()} cursor-pointer hover:shadow-sm transition-all duration-150`, title: "Click to change status", children: status === 'not_started' ? (_jsxs("span", { className: "flex items-center", children: [_jsx("span", { className: "h-1.5 w-1.5 bg-gray-400 rounded-full mr-1.5" }), "Not started"] })) : status === 'in_progress' ? 'In progress' :
                                                                status.charAt(0).toUpperCase() + status.slice(1) }) }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-[150px]", children: [_jsxs(DropdownMenuItem, { onClick: () => handleStatusChange('not_started'), className: "gap-2", children: [_jsx("span", { className: "h-1.5 w-1.5 bg-gray-400 rounded-full" }), "Not started", status === 'not_started' && _jsx(Check, { className: "ml-auto h-4 w-4" })] }), _jsxs(DropdownMenuItem, { onClick: () => handleStatusChange('in_progress'), className: "gap-2", children: [_jsx("span", { className: "h-1.5 w-1.5 bg-blue-600 rounded-full" }), "In progress", status === 'in_progress' && _jsx(Check, { className: "ml-auto h-4 w-4" })] }), _jsxs(DropdownMenuItem, { onClick: () => handleStatusChange('completed'), className: "gap-2", children: [_jsx("span", { className: "h-1.5 w-1.5 bg-green-600 rounded-full" }), "Completed", status === 'completed' && _jsx(Check, { className: "ml-auto h-4 w-4" })] })] })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Progress" }), _jsx("div", { className: "relative", children: progress > 0 ? (_jsx(Progress, { value: progress, className: "mt-1 h-2 transition-all duration-300" })) : (_jsx("div", { className: "mt-1 h-2 w-full rounded-full bg-secondary transition-all duration-300" })) })] }), hasChecklist && (_jsxs("div", { className: "flex justify-between items-center text-sm text-muted-foreground", children: [_jsxs("p", { children: [checklist.filter(item => item.completed).length, "/", checklist.length, " tasks complete"] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "font-medium", onClick: () => setShowChecklist(!showChecklist), children: ["View checklist", showChecklist ? (_jsx(ChevronUp, { className: "ml-2 h-4 w-4" })) : (_jsx(ChevronDown, { className: "ml-2 h-4 w-4" }))] })] })), showChecklist && hasChecklist && (_jsx("div", { className: "mt-2 space-y-1 max-h-[120px] overflow-y-auto", children: checklist.map((item) => (_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Button, { type: "button", variant: "ghost", size: "icon", onClick: () => toggleChecklistItem(item.id), className: "h-5 w-5 p-0 mt-0.5 flex-shrink-0", children: item.completed ? (_jsx(CheckSquare, { className: "h-4 w-4 text-primary" })) : (_jsx(Square, { className: "h-4 w-4" })) }), _jsx("span", { className: `text-xs ${item.completed ? 'line-through text-neutral-400' : 'text-neutral-600'}`, children: item.text })] }, item.id))) }))] }), _jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-t mt-auto", children: [_jsxs("p", { className: "text-sm text-muted-foreground flex items-center gap-1", children: [_jsx(Calendar, { className: "w-4 h-4" }), formatDueDate()] }), _jsx(Button, { variant: "ghost", size: "icon", className: "text-blue-600 hover:text-blue-800 transition-colors p-1.5 rounded-full hover:bg-blue-50", onClick: () => onEdit(id), "aria-label": "Edit goal", children: _jsx(Edit, { className: "w-4 h-4" }) })] })] }) })] }));
}
