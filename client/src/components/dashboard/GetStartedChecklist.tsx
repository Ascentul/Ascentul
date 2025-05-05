import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  CheckCircle, Circle, Briefcase, Users, FileText, 
  Linkedin, Star, ChevronRight, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Confetti from '@/components/Confetti';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Define checklist item interface
interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  icon: JSX.Element;
}

interface GetStartedChecklistProps {
  userId: number;
}

// Main component
export function GetStartedChecklist({ userId }: GetStartedChecklistProps) {
  const { toast } = useToast();
  
  // Fetch network contacts to check if the user has added any
  const { data: networkContacts = [] } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: async () => {
      try {
        return await apiRequest({
          url: '/api/contacts',
          method: 'GET',
        });
      } catch (error) {
        console.error('Error fetching network contacts:', error);
        return [];
      }
    },
  });
  
  // Fetch user goals to check if they've created any
  const { data: userGoals = [] } = useQuery({
    queryKey: ['/api/goals'],
    queryFn: async () => {
      try {
        return await apiRequest({
          url: '/api/goals',
          method: 'GET',
        });
      } catch (error) {
        console.error('Error fetching user goals:', error);
        return [];
      }
    },
  });
  
  // State to track checklist items
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: 'career-profile',
      title: 'Complete your career profile',
      description: 'Add your work history, education, and skills',
      completed: false,
      href: '/account',
      icon: <Briefcase className="h-4 w-4 text-primary" />
    },
    {
      id: 'career-goal',
      title: 'Set your first career goal',
      description: 'Define what you want to achieve next',
      completed: false,
      href: '/goals',
      icon: <CheckCircle className="h-4 w-4 text-green-500" />
    },
    {
      id: 'job-application',
      title: 'Track your first application',
      description: 'Start managing your job applications',
      completed: false,
      href: '/job-applications',
      icon: <FileText className="h-4 w-4 text-blue-500" />
    },
    {
      id: 'resume-creation',
      title: 'Create a resume draft',
      description: 'Start building your professional resume',
      completed: false,
      href: '/resumes',
      icon: <FileText className="h-4 w-4 text-orange-500" />
    },
    {
      id: 'network-contact',
      title: 'Add 1 contact to the Network Hub',
      description: 'Start building your professional network',
      completed: false,
      href: '/network',
      icon: <Users className="h-4 w-4 text-indigo-500" />
    }
  ]);

  // State for review item (6th item)
  const [reviewItem, setReviewItem] = useState<ChecklistItem>({
    id: 'leave-review',
    title: 'Leave a quick review',
    description: 'Tell us what you think about Ascentul',
    completed: false,
    href: '/feedback',
    icon: <Star className="h-4 w-4 text-yellow-500" />
  });

  // State to track whether the checklist should be shown
  const [showChecklist, setShowChecklist] = useState(true);
  // State to track if the checklist is loading
  const [isLoading, setIsLoading] = useState(true);
  // State to track if the review item is unlocked
  const [reviewUnlocked, setReviewUnlocked] = useState(false);
  // State for confetti animation
  const [showConfetti, setShowConfetti] = useState(false);
  // Track if we just completed all tasks
  const [justCompleted, setJustCompleted] = useState(false);

  // Save progress to localStorage (or API in the future)
  const saveProgress = (items: ChecklistItem[], reviewCompleted: boolean, explicitlyDismissed: boolean = false) => {
    try {
      // Added log to track what's being saved
      console.log('Saving checklist progress for user', userId, {
        itemCount: items.length,
        completedCount: items.filter(i => i.completed).length,
        reviewCompleted,
        explicitlyDismissed
      });
      
      const progressData = {
        userId,
        items: items.reduce((acc, item) => {
          acc[item.id] = item.completed;
          return acc;
        }, {} as Record<string, boolean>),
        reviewCompleted,
        explicitlyDismissed,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(`checklist_progress_${userId}`, JSON.stringify(progressData));
    } catch (error) {
      console.error('Error saving checklist progress:', error);
    }
  };

  // Helper function to handle new user initialization
  const handleNewUser = () => {
    console.log("No stored progress found - initializing new user checklist");
    
    // Ensure we have a clean slate for the checklist items
    const freshItems = checklistItems.map(item => ({ ...item, completed: false }));
    setChecklistItems(freshItems);
    
    // Reset review item
    setReviewItem(prev => ({ ...prev, completed: false }));
    
    // Initialize localStorage with a delay to ensure state is updated
    setTimeout(() => {
      saveProgress(freshItems, false, false);
      console.log("Saved initial checklist state for new user");
    }, 300);
    
    // Always show checklist for new users
    setShowChecklist(true);
    console.log("Checklist visibility explicitly set to TRUE for new user");
  };

  // Fetch user's checklist progress from localStorage (or API in the future)
  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    console.log("Initializing checklist for user ID:", userId);
    
    // In a real app, you would fetch this data from your API
    // For now, simulate by checking localStorage
    setTimeout(() => {
      try {
        // Check if we have stored progress
        const storedProgress = localStorage.getItem(`checklist_progress_${userId}`);
        console.log("Checklist initialization - stored progress found:", !!storedProgress);
        
        if (storedProgress) {
          try {
            const parsedProgress = JSON.parse(storedProgress);
            console.log("Parsed progress:", {
              hasItems: !!parsedProgress.items,
              reviewCompleted: parsedProgress.reviewCompleted || false,
              explicitlyDismissed: parsedProgress.explicitlyDismissed || false
            });
            
            // Update the checklist items with the stored progress
            setChecklistItems(prevItems => {
              const updatedItems = prevItems.map(item => ({
                ...item,
                completed: parsedProgress.items && parsedProgress.items[item.id] || false
              }));
              console.log("Updated items:", updatedItems.map(i => ({ id: i.id, completed: i.completed })));
              return updatedItems;
            });
            
            // Check if review is completed
            setReviewItem(prev => ({
              ...prev,
              completed: parsedProgress.reviewCompleted || false
            }));
            
            // Only hide the checklist if explicitly dismissed by the user
            // This ensures the checklist persists for all users until they explicitly dismiss it
            setShowChecklist(!parsedProgress.explicitlyDismissed);
            console.log("Setting showChecklist to:", !parsedProgress.explicitlyDismissed);
          } catch (parseError) {
            console.error("Failed to parse stored progress, treating as new user:", parseError);
            handleNewUser();
          }
        } else {
          handleNewUser();
        }
      } catch (error) {
        console.error('Error loading checklist progress:', error);
        // Safety fallback - ensure checklist shows up even on error
        setShowChecklist(true);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, [userId]);

  // Toggle item completion
  const toggleItemCompletion = (id: string) => {
    setChecklistItems(prevItems => {
      const updatedItems = prevItems.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      
      // Save progress
      saveProgress(updatedItems, reviewItem.completed);
      
      // Check if we just completed all 5 items
      const newCompletedCount = updatedItems.filter(item => item.completed).length;
      if (newCompletedCount === 5 && prevItems.filter(item => item.completed).length === 4) {
        // We just completed the final task
        setJustCompleted(true);
        setShowConfetti(true);
        
        toast({
          title: "Onboarding progress!",
          description: "✅ You've completed all main tasks! Continue using Ascentul to unlock more features.",
        });
      }
      
      return updatedItems;
    });
  };

  // Toggle review completion
  const toggleReviewCompletion = () => {
    setReviewItem(prev => {
      const updated = { ...prev, completed: !prev.completed };
      
      // Save progress
      saveProgress(checklistItems, updated.completed);
      
      return updated;
    });
  };

  // Calculate progress
  const completedCount = checklistItems.filter(item => item.completed).length;
  const progressPercentage = (completedCount / checklistItems.length) * 100;

  // Check if review should be unlocked (3+ items completed)
  useEffect(() => {
    setReviewUnlocked(completedCount >= 3);
  }, [completedCount]);

  // Track if we need to update the state of the contact and goal items
  const [hasUpdatedContactItem, setHasUpdatedContactItem] = useState(false);
  const [hasUpdatedGoalItem, setHasUpdatedGoalItem] = useState(false);
  
  // Update the network contact checklist item based on actual data
  useEffect(() => {
    if (!networkContacts || !Array.isArray(networkContacts) || hasUpdatedContactItem) return;
    
    // Check if the user has added at least one contact
    const hasAtLeastOneContact = networkContacts.length > 0;
    
    console.log(`User has ${networkContacts.length} contacts in the Network Hub`);
    
    // We only want to update if there are contacts and the item isn't already marked as completed
    const contactItem = checklistItems.find(item => item.id === 'network-contact');
    
    if (hasAtLeastOneContact && contactItem && !contactItem.completed) {
      console.log('Marking network-contact checklist item as completed based on actual contacts');
      
      // Update only the network-contact item based on actual data
      setChecklistItems(prevItems => {
        const updatedItems = prevItems.map(item => {
          if (item.id === 'network-contact') {
            return { ...item, completed: true };
          }
          return item;
        });
        
        return updatedItems;
      });
    }
    
    // Mark that we've processed this check to avoid further updates
    setHasUpdatedContactItem(true);
  }, [networkContacts, checklistItems, hasUpdatedContactItem]);
  
  // Update the career goal checklist item based on actual data
  useEffect(() => {
    if (!userGoals || !Array.isArray(userGoals) || hasUpdatedGoalItem) return;
    
    // Check if the user has created at least one goal
    const hasAtLeastOneGoal = userGoals.length > 0;
    
    console.log(`User has ${userGoals.length} career goals`);
    
    // We only want to update if there are goals and the item isn't already marked as completed
    const goalItem = checklistItems.find(item => item.id === 'career-goal');
    
    if (hasAtLeastOneGoal && goalItem && !goalItem.completed) {
      console.log('Marking career-goal checklist item as completed based on actual goals');
      
      // Update only the career-goal item based on actual data
      setChecklistItems(prevItems => {
        const updatedItems = prevItems.map(item => {
          if (item.id === 'career-goal') {
            return { ...item, completed: true };
          }
          return item;
        });
        
        return updatedItems;
      });
    }
    
    // Mark that we've processed this check to avoid further updates
    setHasUpdatedGoalItem(true);
  }, [userGoals, checklistItems, hasUpdatedGoalItem]);
  
  // Save progress whenever checklist items change
  useEffect(() => {
    // Only update localStorage when we have processed both contacts and goals data
    if ((hasUpdatedContactItem || !Array.isArray(networkContacts)) && 
        (hasUpdatedGoalItem || !Array.isArray(userGoals))) {
      // Save the updated progress to local storage
      saveProgress(checklistItems, reviewItem.completed);
    }
  }, [checklistItems, reviewItem.completed, hasUpdatedContactItem, hasUpdatedGoalItem, networkContacts, userGoals, userId]);
  
  // Only auto-hide the checklist when ALL tasks are completed AND user has marked the checklist as complete
  // We've intentionally changed this to make sure the checklist persists
  useEffect(() => {
    // If all tasks completed and review completed, check if user has explicitly dismissed
    if (completedCount >= 5 && reviewItem.completed && !justCompleted) {
      // Check if user has explicitly chosen to dismiss the checklist
      const storedProgress = localStorage.getItem(`checklist_progress_${userId}`);
      if (storedProgress) {
        try {
          const parsedProgress = JSON.parse(storedProgress);
          if (parsedProgress.explicitlyDismissed) {
            setShowChecklist(false);
          }
        } catch (error) {
          console.error("Error parsing storage during auto-hide check:", error);
        }
      }
    }
  }, [completedCount, reviewItem.completed, justCompleted, userId]);

  // If checklist is hidden, don't render anything
  if (!showChecklist) return null;

  // Dismiss checklist permanently (if user clicks X)
  const dismissChecklist = () => {
    // We don't mark all items as completed, instead we track explicit dismissal
    saveProgress(checklistItems, reviewItem.completed, true);
    
    // Show a toast to inform the user they can find this checklist on the dashboard later
    toast({
      title: "Checklist hidden",
      description: "You can always find this checklist in your dashboard until all tasks are completed."
    });
    
    // Hide the checklist without marking everything as complete
    setShowChecklist(false);
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 } 
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="mb-6"
    >
      {/* Confetti effect for completion */}
      <Confetti active={showConfetti} duration={2000} />
      
      <Card className="relative overflow-hidden border border-border/60 bg-background/95 shadow-sm">
        <button 
          onClick={dismissChecklist}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
        
        <CardHeader className="pb-1 pt-4 px-4">
          <CardTitle className="text-lg font-medium">Get Started with Ascentul</CardTitle>
          <CardDescription className="text-sm">
            Want to personalize your dashboard and unlock advanced features? Complete these quick steps.
          </CardDescription>
          
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>{completedCount} of 5 tasks completed</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-1.5" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-3 pb-4 px-4">
          <div className="space-y-2.5">
            {checklistItems.map((item) => (
              <div 
                key={item.id}
                className={`flex items-start p-2.5 rounded-md border transition-colors ${
                  item.completed 
                    ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900' 
                    : 'border-border/60 hover:bg-muted/50'
                }`}
              >
                <button 
                  className="flex-shrink-0 mt-0.5"
                  onClick={() => toggleItemCompletion(item.id)}
                  aria-label={`Mark ${item.title} as ${item.completed ? 'incomplete' : 'complete'}`}
                >
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                
                <div className="ml-2.5 flex-grow">
                  <h3 className={`text-sm font-medium ${
                    item.completed ? 'text-green-700 dark:text-green-400' : ''
                  }`}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                
                <Link href={item.href}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-shrink-0 ml-2 h-7 px-2 text-xs whitespace-nowrap"
                  >
                    {item.completed ? 'View' : 'Go'} <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            ))}
            
            {/* Review item - only show if 3+ tasks are completed */}
            {reviewUnlocked && (
              <div 
                className={`flex items-start p-2.5 rounded-md border transition-colors ${
                  reviewItem.completed 
                    ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900' 
                    : 'border-border/60 hover:bg-muted/50'
                }`}
              >
                <button 
                  className="flex-shrink-0 mt-0.5"
                  onClick={toggleReviewCompletion}
                  aria-label={`Mark ${reviewItem.title} as ${reviewItem.completed ? 'incomplete' : 'complete'}`}
                >
                  {reviewItem.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                
                <div className="ml-2.5 flex-grow">
                  <div className="flex items-center">
                    <h3 className={`text-sm font-medium ${
                      reviewItem.completed ? 'text-green-700 dark:text-green-400' : ''
                    }`}>
                      {reviewItem.title}
                    </h3>
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full">
                      Unlocked
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{reviewItem.description}</p>
                </div>
                
                <Link href={reviewItem.href}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-shrink-0 ml-2 h-7 px-2 text-xs whitespace-nowrap"
                  >
                    {reviewItem.completed ? 'View' : 'Go'} <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}