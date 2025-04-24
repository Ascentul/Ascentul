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
  const { decrementPendingFollowupCount, incrementPendingFollowupCount } = usePendingTasks();
  
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
  useEffect(() => {
    if (!applications || !Array.isArray(applications)) return;
    
    const collectFollowups = async () => {
      const allFollowups: Array<FollowupAction & { application?: Application }> = [];
      
      // First attempt: Load everything from localStorage for immediate display
      for (const app of applications) {
        try {
          const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${app.id}`) || '[]');
          
          if (mockFollowups.length > 0) {
            mockFollowups.forEach((followup: FollowupAction) => {
              allFollowups.push({
                ...followup,
                application: app
              });
            });
          }
        } catch (error) {
          console.error(`Error loading localStorage followups for application ${app.id}:`, error);
        }
      }
      
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
      setFollowupActions(sortFollowups([...allFollowups]));
      
      // Then try API for each application in the background
      for (const app of applications) {
        try {
          const response = await apiRequest('GET', `/api/applications/${app.id}/followups`);
          const appFollowups = await response.json();
          
          if (Array.isArray(appFollowups) && appFollowups.length > 0) {
            // First, remove any existing followups for this app
            const filteredFollowups = allFollowups.filter(f => 
              f.applicationId !== app.id
            );
            
            // Then add the new API followups
            appFollowups.forEach((followup: FollowupAction) => {
              filteredFollowups.push({
                ...followup,
                application: app
              });
            });
            
            // Update state with the new combined data
            setFollowupActions(sortFollowups(filteredFollowups));
          }
        } catch (apiError) {
          // API might not be available, already showing localStorage data
        }
      }
    };
    
    collectFollowups();
  }, [applications]);

  // Function to toggle followup completion status
  const handleToggleStatus = async (followupId: number, applicationId: number) => {
    const followupToUpdate = followupActions.find(f => f.id === followupId);
    if (!followupToUpdate) return;
    
    // Optimistic UI update for the pending tasks counter
    if (followupToUpdate.completed) {
      // If it was completed and now being marked as incomplete
      incrementPendingFollowupCount();
    } else {
      // If it was incomplete and now being marked as complete
      decrementPendingFollowupCount();
    }
    
    // Create a copy of the followups array for optimistic UI update
    const updatedFollowups = followupActions.map(f => 
      f.id === followupId ? { ...f, completed: !f.completed } : f
    );
    
    // Update state immediately for better UX
    setFollowupActions(updatedFollowups);
    
    // Update in localStorage
    try {
      const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${applicationId}`) || '[]');
      const followupIndex = mockFollowups.findIndex((f: any) => f.id === followupId);
      
      if (followupIndex !== -1) {
        mockFollowups[followupIndex] = {
          ...mockFollowups[followupIndex],
          completed: !followupToUpdate.completed,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(`mockFollowups_${applicationId}`, JSON.stringify(mockFollowups));
      }
    } catch (localStorageError) {
      console.error('Error updating localStorage:', localStorageError);
    }
    
    // Try server update
    try {
      await apiRequest(
        'PATCH',
        `/api/applications/${applicationId}/followups/${followupId}`,
        { completed: !followupToUpdate.completed }
      );
      
      // Show success toast
      toast({
        title: followupToUpdate.completed ? "Task marked as pending" : "Task marked as completed",
        description: "Follow-up action updated successfully",
        variant: followupToUpdate.completed ? "default" : "success",
      });
    } catch (error) {
      console.error('Error updating followup status via API:', error);
      // Since we've already updated localStorage and the UI, we don't need to revert anything
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