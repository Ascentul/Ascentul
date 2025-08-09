import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, ArrowUpRight, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePendingTasks } from '@/context/PendingTasksContext';
export function ApplicationFollowupActions({ limit = 5, showTitle = true }) {
    const [followupActions, setFollowupActions] = useState([]);
    const { toast } = useToast();
    const { updateTaskStatus, updatePendingFollowupCount, pendingFollowupCount } = usePendingTasks();
    // Track if applications have loaded from localStorage
    const [localApplicationsLoaded, setLocalApplicationsLoaded] = useState(false);
    // Get applications directly from localStorage first for faster loading
    useEffect(() => {
        try {
            const mockApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
            if (Array.isArray(mockApps) && mockApps.length > 0) {
                console.log(`Loaded ${mockApps.length} applications from localStorage`);
                setLocalApplicationsLoaded(true);
                // Immediately load followups based on these applications
                const pendingFollowups = loadPendingFollowupsFromApps(mockApps);
                const sortedFollowups = sortFollowups(pendingFollowups);
                setFollowupActions(sortedFollowups);
                // Also sync the counter
                updatePendingFollowupCount().catch(console.error);
            }
        }
        catch (error) {
            console.error("Error loading applications from localStorage:", error);
        }
    }, []);
    // Fetch job applications from API as backup
    const { data: applications, isLoading: isLoadingApplications } = useQuery({
        queryKey: ['/api/job-applications'],
        queryFn: async () => {
            try {
                console.log("Refreshing applications list...");
                const response = await apiRequest('GET', '/api/job-applications');
                if (!response.ok)
                    throw new Error(`API error: ${response.status}`);
                const apiApps = await response.json();
                // Combine with localStorage applications to ensure we have everything
                try {
                    const mockApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
                    const combinedApps = [...apiApps];
                    // Add any localStorage apps that aren't in the API response
                    if (Array.isArray(mockApps)) {
                        const apiAppIds = new Set(apiApps.map((app) => app.id));
                        mockApps.forEach((app) => {
                            if (!apiAppIds.has(app.id)) {
                                combinedApps.push(app);
                            }
                        });
                    }
                    console.log("Combined applications:", combinedApps.slice(0, 2));
                    return combinedApps;
                }
                catch (e) {
                    console.error("Error combining applications:", e);
                    return apiApps;
                }
            }
            catch (error) {
                console.error('Failed to fetch applications:', error);
                // Try to get from localStorage as a fallback
                const mockApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
                return mockApps;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
    // Function to load ONLY PENDING followups from localStorage given an array of applications
    const loadPendingFollowupsFromApps = (apps) => {
        if (!apps || !Array.isArray(apps))
            return [];
        const pendingFollowups = [];
        // Go through each application
        for (const app of apps) {
            try {
                // Get all followups for this application
                const followupsJson = localStorage.getItem(`mockFollowups_${app.id}`);
                if (!followupsJson)
                    continue;
                // Parse the followups
                const followups = JSON.parse(followupsJson);
                if (!Array.isArray(followups))
                    continue;
                // Filter only pending (not completed) followups and add application info
                followups
                    .filter((f) => f && !f.completed) // Only pending followups
                    .forEach((followup) => {
                    pendingFollowups.push({
                        ...followup,
                        applicationId: followup.applicationId || app.id,
                        application: app
                    });
                });
            }
            catch (error) {
                console.error(`Error loading followups for application ${app.id}:`, error);
            }
        }
        return pendingFollowups;
    };
    // Wrapper function that uses the current applications
    const loadPendingFollowups = () => {
        return loadPendingFollowupsFromApps(applications || []);
    };
    // Sort followups by due date and creation date
    const sortFollowups = (followups) => {
        return followups.sort((a, b) => {
            // Sort by due date first (earliest due dates first)
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            // Items with due dates come before those without
            if (a.dueDate && !b.dueDate)
                return -1;
            if (!a.dueDate && b.dueDate)
                return 1;
            // Then sort by creation date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    };
    // Function to refresh the followups data (load from localStorage and update state)
    const refreshFollowups = () => {
        if (!applications)
            return;
        // Load only pending followups
        const pendingFollowups = loadPendingFollowups();
        const sortedFollowups = sortFollowups(pendingFollowups);
        console.log(`Loaded ${pendingFollowups.length} pending followups across all applications`);
        setFollowupActions(sortedFollowups);
        // Ensure the counter matches the number of followups we've loaded
        if (pendingFollowups.length !== pendingFollowupCount) {
            updatePendingFollowupCount().catch(err => console.error('Error updating pending followup count:', err));
        }
    };
    // Listen for localStorage changes and task status changes to refresh the component
    useEffect(() => {
        if (!applications)
            return;
        // Initial load from API data
        refreshFollowups();
        // Function to handle when a task status changes via the TaskStatusChangeEvent
        const handleTaskStatusChange = (event) => {
            const taskEvent = event;
            // Always refresh when a task status changes
            refreshFollowups();
        };
        // Listen for both taskStatusChange and storage events
        window.addEventListener('taskStatusChange', handleTaskStatusChange);
        window.addEventListener('storage', (event) => {
            if (event.key && event.key.startsWith('mockFollowups_')) {
                refreshFollowups();
            }
        });
        // Set up a refresh interval (every 5 seconds) to ensure the list stays updated
        const interval = setInterval(refreshFollowups, 5000);
        return () => {
            window.removeEventListener('taskStatusChange', handleTaskStatusChange);
            window.removeEventListener('storage', handleTaskStatusChange);
            clearInterval(interval);
        };
    }, [applications]);
    // Function to toggle followup completion status
    const handleToggleStatus = async (followupId, applicationId) => {
        const followupToUpdate = followupActions.find(f => f.id === followupId);
        if (!followupToUpdate)
            return;
        // Determine the new completion status (reverse of current status)
        const newCompletionStatus = !followupToUpdate.completed;
        // Create a copy of the followups array for optimistic UI update
        const updatedFollowups = followupActions.map(f => f.id === followupId ? { ...f, completed: newCompletionStatus } : f);
        // Update state immediately for better UX
        setFollowupActions(updatedFollowups);
        // Use our context updateTaskStatus method to update the localStorage and task count
        // This will update the task status AND synchronize the counter in one operation
        updateTaskStatus(applicationId, followupId, newCompletionStatus);
        // Try server update
        try {
            await apiRequest('PATCH', `/api/applications/${applicationId}/followups/${followupId}`, { completed: newCompletionStatus });
            // Show success toast
            toast({
                title: followupToUpdate.completed ? "Task marked as pending" : "Task marked as completed",
                description: "Follow-up action updated successfully",
                variant: followupToUpdate.completed ? "default" : "success",
            });
        }
        catch (error) {
            console.error('Error updating followup status via API:', error);
            // Since we've already updated the localStorage and counter via updateTaskStatus,
            // and updated the UI state, we don't need to revert anything here
        }
    };
    // Handle loading states
    if (isLoadingApplications) {
        return (_jsx("div", { className: "flex justify-center items-center py-8", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }));
    }
    // If no followups
    if (followupActions.length === 0) {
        return (_jsxs("div", { className: "text-center py-6", children: [_jsx(HelpCircle, { className: "mx-auto h-10 w-10 text-muted-foreground mb-2" }), _jsx("p", { className: "text-muted-foreground", children: "No follow-up actions to display" }), _jsx(Link, { href: "/job-applications", children: _jsx(Button, { variant: "link", className: "mt-2", children: "View applications" }) })] }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [showTitle && (_jsx("h3", { className: "text-lg font-medium mb-4", children: "Upcoming Follow-up Actions" })), followupActions.slice(0, limit).map((action) => (_jsx(Card, { className: "p-4 border shadow-sm", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-sm font-medium", children: action.type === 'thank_you_email' ? 'Thank You Email' :
                                                action.type === 'follow_up' ? 'Follow-up' :
                                                    action.type === 'preparation' ? 'Interview Preparation' :
                                                        action.type === 'document_submission' ? 'Document Submission' :
                                                            action.type === 'networking' ? 'Networking Connection' :
                                                                action.type }), action.application && (_jsx(Badge, { variant: "outline", className: "text-xs", children: action.application.company }))] }), _jsx("p", { className: "text-sm text-muted-foreground", children: action.description }), action.dueDate && (_jsxs("div", { className: "flex items-center mt-2 text-xs text-muted-foreground", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1.5" }), _jsxs("span", { children: ["Due: ", format(new Date(action.dueDate), 'MMM d, yyyy')] })] }))] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "flex items-center space-x-1.5", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: action.completed ? 'Completed' : 'Pending' }), _jsx(Switch, { checked: action.completed, onCheckedChange: () => handleToggleStatus(action.id, action.applicationId), className: "data-[state=checked]:bg-green-500" })] }), action.application && (_jsx(Link, { href: `/job-applications/${action.applicationId}`, children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", children: _jsx(ArrowUpRight, { className: "h-4 w-4" }) }) }))] })] }) }, action.id))), followupActions.length > limit && (_jsx("div", { className: "pt-2 text-center", children: _jsx(Link, { href: "/job-applications", children: _jsx(Button, { variant: "outline", size: "sm", children: "View All Follow-ups" }) }) }))] }));
}
