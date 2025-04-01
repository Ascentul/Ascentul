import { Edit, Calendar, CheckSquare, Square, ChevronDown, ChevronUp, PartyPopper } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Import the checklist item type
import { type GoalChecklistItem } from '@shared/schema';

// Import the Confetti component
import Confetti from './Confetti';

interface GoalCardProps {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: string;
  dueDate?: Date;
  checklist?: GoalChecklistItem[] | null;
  onEdit: (id: number) => void;
  onComplete?: (id: number) => void;
}

export default function GoalCard({
  id,
  title,
  description,
  progress,
  status,
  dueDate,
  checklist = [],
  onEdit,
  onComplete,
}: GoalCardProps) {
  const [showChecklist, setShowChecklist] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Reference to track if we've shown confetti for this goal completion
  const completionCelebratedRef = useRef(false);
  // Reference to the card element for confetti positioning
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Function to handle the dissolve animation when a goal is completed
  const handleDissolveAnimation = (goalId: number) => {
    // Start the dissolve animation
    setIsDissolving(true);
    
    // After the animation finishes (matching our animation duration),
    // call the onComplete handler to move the goal to the Completed Goals section
    setTimeout(() => {
      if (onComplete) {
        onComplete(goalId);
      }
    }, 1500); // 1.5 seconds to match our animation duration
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
    if (!dueDate) return 'No due date';

    const now = new Date();
    const dueTime = new Date(dueDate).getTime();

    if (dueTime < now.getTime()) {
      return `Overdue by ${formatDistanceToNow(dueTime)}`;
    }

    return `Due in ${formatDistanceToNow(dueTime)}`;
  };

  // Update checklist item mutation
  const updateChecklistMutation = useMutation({
    mutationFn: async (updatedGoal: any) => {
      const response = await apiRequest('PUT', `/api/goals/${id}`, updatedGoal);
      return response.json();
    },
    onMutate: async (updatedGoal) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/goals'] });

      // Snapshot the previous value
      const previousGoals = queryClient.getQueryData(['/api/goals']);

      // Optimistically update to the new value
      queryClient.setQueryData(['/api/goals'], (old: any[]) => {
        if (!old) return [];

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
    onError: (error, newData, context: any) => {
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
    },
  });

  // Check if all checklist items are completed or if the status should be updated to "in progress"
  useEffect(() => {
    // Only proceed if we have a checklist
    if (!checklist || checklist.length === 0) return;
    
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
        checklist: checklist
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
  const toggleChecklistItem = (itemId: string) => {
    if (!checklist) return;

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
        status: 'completed'
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
    } else {
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
      } else {
        // Just update the checklist and progress
        updateChecklistMutation.mutate({
          checklist: updatedChecklist,
          progress: newProgress
        });
      }
    }
  };

  const hasChecklist = checklist && checklist.length > 0;

  return (
    <>
      {/* Render the confetti when goal is completed */}
      <Confetti active={showConfetti} duration={1750} targetRef={cardRef} />
      
      <motion.div 
        id={`goal-${id}`}
        animate={isDissolving ? { 
          opacity: 0,
          y: 10,
          scale: 0.98,
          transition: { duration: 1.5, ease: "easeOut" } 
        } : { 
          opacity: 1,
          y: 0,
          scale: 1
        }}
      >
        <Card ref={cardRef} className="border border-neutral-200 shadow-none">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-neutral-500 mt-1">{description}</p>
              </div>
              <Badge variant="outline" className={getBadgeStyles()}>
                {status === 'not_started' ? 'Not started' : 
                 status === 'in_progress' ? 'In progress' : 
                 status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Checklist Toggle and Checklist Items */}
            {hasChecklist && (
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto w-full flex justify-between items-center text-xs text-neutral-500"
                  onClick={() => setShowChecklist(!showChecklist)}
                >
                  <span>Checklist ({checklist.filter(item => item.completed).length}/{checklist.length})</span>
                  {showChecklist ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>

                {showChecklist && (
                  <div className="mt-2 space-y-1.5">
                    {checklist.map((item) => (
                      <div key={item.id} className="flex items-start gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleChecklistItem(item.id)}
                          className="h-5 w-5 p-0 mt-0.5"
                        >
                          {item.completed ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                        <span className={`text-xs ${item.completed ? 'line-through text-neutral-400' : 'text-neutral-600'}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 flex justify-between items-center">
              <div className="text-xs text-neutral-500 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDueDate()}
              </div>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 p-1 h-auto"
                  onClick={() => onEdit(id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}