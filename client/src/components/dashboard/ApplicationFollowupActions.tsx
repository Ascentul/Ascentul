import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, ArrowUpRight, Check, HelpCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePendingTasks } from '@/context/PendingTasksContext';

interface FollowupAction {
  id: number;
  applicationId: number;
  type: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Application {
  id: number;
  company: string;
  position: string;
  status: string;
}

interface ApplicationFollowupActionsProps {
  limit?: number;
  showTitle?: boolean;
}

export function ApplicationFollowupActions({ limit = 5, showTitle = true }: ApplicationFollowupActionsProps) {
  const [followupActions, setFollowupActions] = useState<Array<FollowupAction & { application?: Application }>>([]);
  const { toast } = useToast();
  const { updateTaskStatus, updatePendingFollowupCount } = usePendingTasks();
  
  // Fetch job applications
  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['/api/job-applications'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/job-applications');
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        
        // Try to get from localStorage as a fallback
        const mockApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
        return mockApps;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Function to load ONLY PENDING followups from localStorage
  const loadPendingFollowups = () => {
    if (!applications || !Array.isArray(applications)) return [];
    
    const pendingFollowups: Array<FollowupAction & { application?: Application }> = [];
    
    // Go through each application
    for (const app of applications) {
      try {
        // Get all followups for this application
        const followupsJson = localStorage.getItem(`mockFollowups_${app.id}`);
        if (!followupsJson) continue;
        
        // Parse the followups
        const followups = JSON.parse(followupsJson);
        if (!Array.isArray(followups)) continue;
        
        // Filter only pending (not completed) followups and add application info
        followups
          .filter((f: any) => f && !f.completed) // Only pending followups
          .forEach((followup: any) => {
            pendingFollowups.push({
              ...followup,
              applicationId: followup.applicationId || app.id,
              application: app
            });
          });
      } catch (error) {
        console.error(`Error loading followups for application ${app.id}:`, error);
      }
    }
    
    // Return all pending followups with application data
    return pendingFollowups;
  };
  
  // Sort followups by due date and creation date
  const sortFollowups = (followups: Array<FollowupAction & { application?: Application }>) => {
    return followups.sort((a, b) => {
      // Sort by due date first (earliest due dates first)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      // Items with due dates come before those without
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // Then sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };
  
  // Function to refresh the followups data (load from localStorage and update state)
  const refreshFollowups = () => {
    if (!applications) return;
    
    // Load only pending followups
    const pendingFollowups = loadPendingFollowups();
    const sortedFollowups = sortFollowups(pendingFollowups);
    
    console.log(`Loaded ${pendingFollowups.length} pending followups across all applications`);
    setFollowupActions(sortedFollowups);
    
    // Also refresh the pending count in the context
    updatePendingFollowupCount().catch(err => 
      console.error('Error updating pending followup count:', err)
    );
  };
  
  // Listen for localStorage changes and task status changes to refresh the component
  useEffect(() => {
    if (!applications) return;
    
    // Initial load
    refreshFollowups();
    
    // Function to handle when a task status changes via the TaskStatusChangeEvent
    const handleTaskStatusChange = (event: Event) => {
      const taskEvent = event as CustomEvent;
      if (taskEvent.detail && taskEvent.detail.isCompleted) {
        // If a task was completed, immediately refresh our list to remove it
        refreshFollowups();
      }
    };
    
    // Listen for the custom event that fires when task status changes
    window.addEventListener('taskStatusChange', handleTaskStatusChange);
    
    // Set up a refresh interval (every 5 seconds) to ensure the list stays updated
    const interval = setInterval(refreshFollowups, 5000);
    
    return () => {
      window.removeEventListener('taskStatusChange', handleTaskStatusChange);
      clearInterval(interval);
    };
  }, [applications]);

  // Function to toggle followup completion status
  const handleToggleStatus = async (followupId: number, applicationId: number) => {
    const followupToUpdate = followupActions.find(f => f.id === followupId);
    if (!followupToUpdate) return;
    
    // Determine the new completion status (reverse of current status)
    const newCompletionStatus = !followupToUpdate.completed;
    
    // Create a copy of the followups array for optimistic UI update
    const updatedFollowups = followupActions.map(f => 
      f.id === followupId ? { ...f, completed: newCompletionStatus } : f
    );
    
    // Update state immediately for better UX
    setFollowupActions(updatedFollowups);
    
    // Use our context updateTaskStatus method to update the localStorage and task count
    // This will update the task status AND synchronize the counter in one operation
    updateTaskStatus(applicationId, followupId, newCompletionStatus);
    
    // Try server update
    try {
      await apiRequest(
        'PATCH',
        `/api/applications/${applicationId}/followups/${followupId}`,
        { completed: newCompletionStatus }
      );
      
      // Show success toast
      toast({
        title: followupToUpdate.completed ? "Task marked as pending" : "Task marked as completed",
        description: "Follow-up action updated successfully",
        variant: followupToUpdate.completed ? "default" : "success",
      });
    } catch (error) {
      console.error('Error updating followup status via API:', error);
      // Since we've already updated the localStorage and counter via updateTaskStatus,
      // and updated the UI state, we don't need to revert anything here
    }
  };

  // Handle loading states
  if (isLoadingApplications) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no followups
  if (followupActions.length === 0) {
    return (
      <div className="text-center py-6">
        <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No follow-up actions to display</p>
        <Link href="/job-applications">
          <Button variant="link" className="mt-2">
            View applications
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <h3 className="text-lg font-medium mb-4">Upcoming Follow-up Actions</h3>
      )}
      
      {followupActions.slice(0, limit).map((action) => (
        <Card key={action.id} className="p-4 border shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {action.type === 'thank_you_email' ? 'Thank You Email' : 
                   action.type === 'follow_up' ? 'Follow-up' :
                   action.type === 'preparation' ? 'Interview Preparation' :
                   action.type === 'document_submission' ? 'Document Submission' :
                   action.type === 'networking' ? 'Networking Connection' : 
                   action.type}
                </span>
                
                {action.application && (
                  <Badge variant="outline" className="text-xs">
                    {action.application.company}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">{action.description}</p>
              
              {action.dueDate && (
                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1.5" />
                  <span>Due: {format(new Date(action.dueDate), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-muted-foreground">
                  {action.completed ? 'Completed' : 'Pending'}
                </span>
                <Switch 
                  checked={action.completed}
                  onCheckedChange={() => handleToggleStatus(action.id, action.applicationId)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              {action.application && (
                <Link href={`/job-applications/${action.applicationId}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      ))}
      
      {followupActions.length > limit && (
        <div className="pt-2 text-center">
          <Link href="/job-applications">
            <Button variant="outline" size="sm">
              View All Follow-ups
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}