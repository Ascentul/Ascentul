import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  CheckCircle, Circle, Briefcase, Users, FileText, 
  Linkedin, Star, ChevronRight, X, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Confetti from '@/components/Confetti';

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
  profileCompletion?: number; // Profile completion percentage
  hasGoals?: boolean; // Whether user has any career goals
}

// Main component
export function GetStartedChecklist({ userId, profileCompletion = 0, hasGoals = false }: GetStartedChecklistProps) {
  const { toast } = useToast();
  
  // Initial checklist item definitions with completed explicitly set to false for clarity
  const initialChecklistItems: ChecklistItem[] = [
    {
      id: 'career-profile',
      title: 'Complete your career profile',
      description: 'Add your work history, education, and skills',
      completed: false, // Ensure this starts as false for new users
      href: '/account',
      icon: <Briefcase className="h-4 w-4 text-primary" />
    },
    {
      id: 'career-goal',
      title: 'Set your first career goal',
      description: 'Define what you want to achieve next',
      completed: false, // Ensure this starts as false for new users
      href: '/goals',
      icon: <CheckCircle className="h-4 w-4 text-green-500" />
    },
    {
      id: 'job-application',
      title: 'Track your first application',
      description: 'Start managing your job applications',
      completed: false, // Ensure this starts as false for new users
      href: '/application_tracker',
      icon: <FileText className="h-4 w-4 text-blue-500" />
    },
    {
      id: 'linkedin-profile',
      title: 'Analyze your LinkedIn profile',
      description: 'Get AI-powered insights for improvement',
      completed: false, // Ensure this starts as false for new users
      href: '/linkedin-optimizer',
      icon: <Linkedin className="h-4 w-4 text-blue-600" />
    },
    {
      id: 'network-contact',
      title: 'Add 1 contact to the Network Hub',
      description: 'Start building your professional network',
      completed: false, // Ensure this starts as false for new users
      href: '/network-hub',
      icon: <Users className="h-4 w-4 text-indigo-500" />
    }
  ];
  
  // State to track checklist items - initialized with all items unchecked
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(initialChecklistItems);

  // State for review item (6th item) - explicitly set to unchecked for clarity
  const initialReviewItem: ChecklistItem = {
    id: 'leave-review',
    title: 'Leave a quick review',
    description: 'Tell us what you think about Ascentul',
    completed: false, // Ensure this starts as false for new users
    href: '/feedback',
    icon: <Star className="h-4 w-4 text-yellow-500" />
  };
  
  const [reviewItem, setReviewItem] = useState<ChecklistItem>(initialReviewItem);

  // State to track whether the checklist should be shown
  const [showChecklist, setShowChecklist] = useState(true);
  // State to track if the checklist is loading
  const [isLoading, setIsLoading] = useState(true);
  // State to track if the review item is unlocked (always true now)
  const [reviewUnlocked, setReviewUnlocked] = useState(true);
  // State for confetti animation
  const [showConfetti, setShowConfetti] = useState(false);
  // Track if we just completed all tasks
  const [justCompleted, setJustCompleted] = useState(false);

  // Fetch user's checklist progress from localStorage (or API in the future)
  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    
    // In a real app, you would fetch this data from your API
    // For now, simulate by checking localStorage
    setTimeout(() => {
      try {
        // Check if we have stored progress
        const storedProgress = localStorage.getItem(`checklist_progress_${userId}`);
        
        if (storedProgress) {
          const parsedProgress = JSON.parse(storedProgress);
          
          // Update the checklist items with the stored progress
          setChecklistItems(prevItems => 
            prevItems.map(item => ({
              ...item,
              completed: parsedProgress.items[item.id] || false
            }))
          );
          
          // Check if review is completed
          setReviewItem(prev => ({
            ...prev,
            completed: parsedProgress.reviewCompleted || false
          }));
          
          // Check if we should show the checklist
          // Hide if all 5 primary tasks are completed
          const allCompleted = 
            Object.values(parsedProgress.items).filter(Boolean).length >= 5;
          
          setShowChecklist(!allCompleted);
        } else {
          // For new users, create a fresh checklist with all items unchecked
          const freshItems = checklistItems.map(item => ({
            ...item,
            completed: false
          }));
          
          setChecklistItems(freshItems);
          
          // Ensure review item is also unchecked
          setReviewItem(prev => ({
            ...prev,
            completed: false
          }));
          
          // Save initial progress to localStorage (all unchecked)
          saveProgress(freshItems, false);
        }
      } catch (error) {
        console.error('Error loading checklist progress:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, [userId]);

  // Save progress to localStorage (or API in the future)
  const saveProgress = (items: ChecklistItem[], reviewCompleted: boolean) => {
    try {
      const progressData = {
        userId,
        items: items.reduce((acc, item) => {
          acc[item.id] = item.completed;
          return acc;
        }, {} as Record<string, boolean>),
        reviewCompleted,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(`checklist_progress_${userId}`, JSON.stringify(progressData));
    } catch (error) {
      console.error('Error saving checklist progress:', error);
    }
  };

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
          title: "Onboarding complete!",
          description: "✅ You've completed onboarding! Your dashboard is now fully personalized.",
        });
        
        // Hide checklist after 2 seconds
        setTimeout(() => {
          setShowChecklist(false);
        }, 2000);
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

  // We're always showing the review option now, so no need to check for unlocking
  
  // We'll leave this for when the user comes back to the dashboard after completing a profile
  // but we won't auto-check for new users
  useEffect(() => {
    // Only auto-complete if this is NOT a new user (has saved progress)
    // and profile completion reaches 100%
    if (profileCompletion === 100 && localStorage.getItem(`checklist_progress_${userId}`)) {
      // Find career profile checklist item
      const careerProfileItem = checklistItems.find(item => item.id === 'career-profile');
      
      // If it exists and is not already marked as completed, mark it as completed
      if (careerProfileItem && !careerProfileItem.completed) {
        setChecklistItems(prevItems => {
          const updatedItems = prevItems.map(item => 
            item.id === 'career-profile' ? { ...item, completed: true } : item
          );
          
          // Save updated progress to localStorage
          saveProgress(updatedItems, reviewItem.completed);
          
          // Show a success toast
          toast({
            title: "Career profile complete!",
            description: "✅ Your career profile is now 100% complete. Great job!",
          });
          
          return updatedItems;
        });
      }
    }
  }, [profileCompletion, toast, reviewItem.completed, saveProgress, checklistItems, userId]);
  
  // Auto-complete the career goal checklist item when user has created at least one goal
  // but only if this is not a new user session
  useEffect(() => {
    // Only auto-complete if this is NOT a new user (has saved progress)
    // and user has goals
    if (hasGoals && localStorage.getItem(`checklist_progress_${userId}`)) {
      // Find career goal checklist item
      const careerGoalItem = checklistItems.find(item => item.id === 'career-goal');
      
      // If it exists and is not already marked as completed, mark it as completed
      if (careerGoalItem && !careerGoalItem.completed) {
        setChecklistItems(prevItems => {
          const updatedItems = prevItems.map(item => 
            item.id === 'career-goal' ? { ...item, completed: true } : item
          );
          
          // Save updated progress to localStorage
          saveProgress(updatedItems, reviewItem.completed);
          
          // Show a success toast
          toast({
            title: "Career goal added!",
            description: "✅ You've created your first career goal. Keep going!",
          });
          
          return updatedItems;
        });
      }
    }
  }, [hasGoals, toast, reviewItem.completed, saveProgress, checklistItems, userId]);

  // Check if checklist should be hidden (all 5 primary tasks completed)
  useEffect(() => {
    if (completedCount >= 5 && !justCompleted) {
      // Give a short delay before hiding to allow for animation
      const timer = setTimeout(() => {
        setShowChecklist(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [completedCount, justCompleted]);

  // If checklist is hidden, don't render anything
  if (!showChecklist) return null;

  // Dismiss checklist permanently (if user clicks X)
  const dismissChecklist = () => {
    // Mark all items as completed to hide the checklist
    const allCompleted = checklistItems.map(item => ({ ...item, completed: true }));
    saveProgress(allCompleted, true);
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
            
            {/* Review item - now showing for all users from the start */}
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
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}