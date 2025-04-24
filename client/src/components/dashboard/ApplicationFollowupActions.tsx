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
  const { updateTaskStatus } = usePendingTasks();
  
  // Fetch job applications
  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['/api/job-applications'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/job-applications');
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

  // Collect followup actions from all applications
  // Use the updatePendingFollowupCount from the PendingTasksContext
  const { updatePendingFollowupCount } = usePendingTasks();
  
  useEffect(() => {
    if (!applications || !Array.isArray(applications)) return;
    
    const collectFollowups = async () => {
      const allFollowups: Array<FollowupAction & { application?: Application }> = [];
      
      // DIRECT DEBUGGING OF LOCAL STORAGE DATA
      // For the application 8382 that logs show has 5 pending followups
      const mockFollowupsJsonDirect = localStorage.getItem('mockFollowups_8382');
      if (mockFollowupsJsonDirect) {
        try {
          const parsedFollowups = JSON.parse(mockFollowupsJsonDirect);
          console.log('Direct check of followups_8382:', parsedFollowups);
          
          // Count how many pending items
          if (Array.isArray(parsedFollowups)) {
            const pendingCount = parsedFollowups.filter(f => !f.completed).length;
            console.log(`Direct count of pending followups for 8382: ${pendingCount}`);
            
            // Check if we need to ensure applicationId is set
            const needsApplicationId = parsedFollowups.some(f => f.applicationId === undefined);
            if (needsApplicationId) {
              console.log("Some followups don't have applicationId set");
              
              // Fix them by setting the applicationId
              const fixedFollowups = parsedFollowups.map(f => ({
                ...f, 
                applicationId: f.applicationId || 8382 // Set it if missing
              }));
              
              // Save back to localStorage
              localStorage.setItem('mockFollowups_8382', JSON.stringify(fixedFollowups));
              console.log("Fixed and saved followups with applicationId");
            }
          }
        } catch (e) {
          console.error('Error parsing direct followups:', e);
        }
      }
      
      // First attempt: Load everything from localStorage for immediate display
      for (const app of applications) {
        try {
          const mockFollowupsJson = localStorage.getItem(`mockFollowups_${app.id}`);
          if (mockFollowupsJson) {
            let mockFollowups;
            try {
              mockFollowups = JSON.parse(mockFollowupsJson);
            } catch (parseError) {
              console.error(`Error parsing followups for app ${app.id}:`, parseError);
              continue; // Skip this application
            }
            
            if (Array.isArray(mockFollowups) && mockFollowups.length > 0) {
              mockFollowups.forEach((followup: any) => {
                if (followup && typeof followup === 'object') {
                  // Make sure applicationId is set
                  const followupWithAppId = {
                    ...followup,
                    applicationId: followup.applicationId || app.id,
                    application: app
                  };
                  
                  allFollowups.push(followupWithAppId);
                }
              });
            }
          }
        } catch (error) {
          console.error(`Error loading localStorage followups for application ${app.id}:`, error);
        }
      }
      
      // Log details about what we found
      console.log(`Total found ${allFollowups.length} followups across all applications`);
      
      // Now count pending items
      const pendingFollowups = allFollowups.filter(f => !f.completed);
      console.log(`Found ${pendingFollowups.length} pending followups to display`);
      
      // Sort and display localStorage data immediately for better UX
      const sortFollowups = (followups: Array<FollowupAction & { application?: Application }>) => {
        return followups.sort((a, b) => {
          // Incomplete items first
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
          }
          
          // Then sort by due date
          if (a.dueDate && b.dueDate) {
            return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
          }
          
          if (a.dueDate && !b.dueDate) return -1;
          if (!a.dueDate && b.dueDate) return 1;
          
          // Finally sort by creation date
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      };
      
      // Update UI with localStorage data first
      const sortedFollowups = sortFollowups([...allFollowups]);
      
      // Debug what we're displaying
      console.log(`After sorting, ready to display ${sortedFollowups.length} followups:`, 
        sortedFollowups.slice(0, 3).map(f => ({
          id: f.id, 
          type: f.type, 
          completed: f.completed, 
          appId: f.applicationId,
          company: f.application?.company
        }))
      );
      
      setFollowupActions(sortedFollowups);
      
      // While we've already got the data, trigger a refresh of the pending count
      // to ensure it stays in sync with what we're displaying
      updatePendingFollowupCount().catch(err => 
        console.error('Error updating pending followup count:', err)
      );
      
      // Then try API for each application in the background
      const apiPromises = applications.map(async (app) => {
        try {
          const response = await apiRequest('GET', `/api/applications/${app.id}/followups`);
          if (!response.ok) return [];
          
          const appFollowups = await response.json();
          if (Array.isArray(appFollowups) && appFollowups.length > 0) {
            return appFollowups.map(followup => ({
              ...followup,
              application: app
            }));
          }
          return [];
        } catch (apiError) {
          console.error(`Error fetching followups for application ${app.id}:`, apiError);
          return [];
        }
      });
      
      try {
        // Wait for all API requests to complete
        const apiFollowupsArrays = await Promise.all(apiPromises);
        
        // Flatten the array of arrays and check if we have any API followups
        const apiFollowups = apiFollowupsArrays.flat();
        if (apiFollowups.length > 0) {
          // Create a map of application IDs we got from the API
          const apiAppIds = new Set(apiFollowups.map(f => f.applicationId));
          
          // Filter out followups for applications we got from the API
          const nonApiFollowups = allFollowups.filter(f => !apiAppIds.has(f.applicationId));
          
          // Combine and sort the API followups with the non-API followups
          const combinedFollowups = [...nonApiFollowups, ...apiFollowups];
          setFollowupActions(sortFollowups(combinedFollowups));
          
          // After updating from API, refresh the pending count again
          updatePendingFollowupCount().catch(err => 
            console.error('Error updating pending followup count after API fetch:', err)
          );
        }
      } catch (error) {
        console.error('Error processing API followup results:', error);
      }
    };
    
    collectFollowups();
  }, [applications, updatePendingFollowupCount]);

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