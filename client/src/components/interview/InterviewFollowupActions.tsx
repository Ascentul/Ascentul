import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Circle, CheckCircle, Check, RefreshCw } from 'lucide-react';
import { FollowupAction } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface InterviewFollowupActionsProps {
  limit?: number;
  showTitle?: boolean;
  showCard?: boolean;
  endpoint?: string;
}

const InterviewFollowupActions = ({
  limit = 3,
  showTitle = true,
  showCard = true,
  endpoint = '/api/interview/followup-actions',
}: InterviewFollowupActionsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCompleted, setShowCompleted] = useState(false);

  // Fetch all followup actions across all interview processes
  const { data: followupActions = [], isLoading } = useQuery<FollowupAction[]>({
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
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Filter actions by completion status
  const pendingActions = sortedActions.filter(action => !action.completed);
  const completedActions = sortedActions.filter(action => action.completed);
  
  // Format date for display
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'No due date';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Complete followup mutation
  const completeFollowupMutation = useMutation({
    mutationFn: async (followupId: number) => {
      const response = await apiRequest('PUT', `/api/interview/followup-actions/${followupId}/complete`, {});
      if (!response.ok) {
        throw new Error('Failed to complete followup action');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
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
    mutationFn: async (followupId: number) => {
      const response = await apiRequest('PUT', `/api/interview/followup-actions/${followupId}/uncomplete`, {});
      if (!response.ok) {
        throw new Error('Failed to mark followup action as pending');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
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

  const handleCompleteFollowup = (followupId: number) => {
    completeFollowupMutation.mutate(followupId);
  };

  const handleUncompleteFollowup = (followupId: number) => {
    uncompleteFollowupMutation.mutate(followupId);
  };

  // Create Loading UI
  const loadingContent = (
    <div className="flex justify-center items-center py-6">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
  );

  // Create Content UI
  const contentUI = (
    <div>
      {/* Pending Followups */}
      {pendingActions.length > 0 ? (
        <div className="space-y-2 mb-4">
          {pendingActions.slice(0, limit).map((action) => (
            <div
              key={action.id}
              className="flex items-start justify-between p-3 border rounded-md hover:bg-accent/10 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => handleCompleteFollowup(action.id)}
                          className="cursor-pointer hover:opacity-75 transition-opacity"
                        >
                          <Circle className="h-3 w-3 text-blue-500 mr-2" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to mark as completed</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="font-medium">{action.type}</span>
                </div>
                <p className="text-sm text-muted-foreground">{action.description}</p>
                {action.dueDate && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Due: {formatDate(action.dueDate)}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCompleteFollowup(action.id)}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {pendingActions.length > limit && (
            <div className="text-center text-sm text-muted-foreground mt-2">
              + {pendingActions.length - limit} more actions
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          No pending interview followups.
        </div>
      )}

      {/* Toggle to show completed actions */}
      {completedActions.length > 0 && (
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? "Hide completed" : "Show completed"} ({completedActions.length})
          </Button>
          
          {/* Completed Followups */}
          {showCompleted && (
            <div className="space-y-2 mt-4">
              {completedActions.slice(0, limit).map((action) => (
                <div
                  key={action.id}
                  className="flex items-start justify-between p-3 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              onClick={() => handleUncompleteFollowup(action.id)}
                              className="cursor-pointer hover:opacity-75 transition-opacity"
                            >
                              <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to mark as pending</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="font-medium line-through text-muted-foreground">
                        {action.type}
                      </span>
                    </div>
                    <p className="text-sm line-through text-muted-foreground">
                      {action.description}
                    </p>
                    {action.completedDate && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        Completed: {formatDate(action.completedDate)}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUncompleteFollowup(action.id)}
                    className="h-8 w-8 p-0"
                    title="Mark as pending"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {completedActions.length > limit && (
                <div className="text-center text-sm text-muted-foreground mt-2">
                  + {completedActions.length - limit} more completed
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Return based on showCard prop
  if (isLoading) {
    return showCard ? (
      <Card>
        <CardHeader>
          {showTitle && <CardTitle className="text-lg">Interview Followups</CardTitle>}
        </CardHeader>
        <CardContent>{loadingContent}</CardContent>
      </Card>
    ) : loadingContent;
  }

  if (showCard) {
    return (
      <Card>
        {showTitle && (
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Interview Followups</CardTitle>
              {pendingActions.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {pendingActions.length} pending
                </Badge>
              )}
            </div>
          </CardHeader>
        )}
        <CardContent>
          {contentUI}
        </CardContent>
      </Card>
    );
  }
  
  // Return content without card wrapper
  return contentUI;
};

export { InterviewFollowupActions };
