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
  // State to track checklist items
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    {
      id: 'career-profile',
      title: 'Complete your career profile',
      description: 'Add your work history, education, and skills',
      completed: false,
      href: '/account-settings/career',
      icon: <Briefcase className="h-5 w-5 text-primary" />
    },
    {
      id: 'career-goal',
      title: 'Set your first career goal',
      description: 'Define what you want to achieve next',
      completed: false,
      href: '/goals',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />
    },
    {
      id: 'job-application',
      title: 'Track your first application',
      description: 'Start managing your job applications',
      completed: false,
      href: '/job-applications',
      icon: <FileText className="h-5 w-5 text-blue-500" />
    },
    {
      id: 'linkedin-profile',
      title: 'Analyze your LinkedIn profile',
      description: 'Get AI-powered insights for improvement',
      completed: false,
      href: '/linkedin-analyzer',
      icon: <Linkedin className="h-5 w-5 text-blue-600" />
    },
    {
      id: 'network-contact',
      title: 'Add 1 contact to the Network Hub',
      description: 'Start building your professional network',
      completed: false,
      href: '/network',
      icon: <Users className="h-5 w-5 text-indigo-500" />
    }
  ]);

  // State for review item (6th item)
  const [reviewItem, setReviewItem] = useState<ChecklistItem>({
    id: 'leave-review',
    title: 'Leave a quick review',
    description: 'Tell us what you think about Ascentul',
    completed: false,
    href: '/feedback',
    icon: <Star className="h-5 w-5 text-yellow-500" />
  });

  // State to track whether the checklist should be shown
  const [showChecklist, setShowChecklist] = useState(true);
  // State to track if the checklist is loading
  const [isLoading, setIsLoading] = useState(true);
  // State to track if the review item is unlocked
  const [reviewUnlocked, setReviewUnlocked] = useState(false);

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
          // Mock some random completion (for demo)
          // In production, this would be based on actual user data
          const mockCompletedCount = Math.floor(Math.random() * 3); // 0-2 random completed items
          
          // Randomly mark some items as completed for the demo
          const updatedItems = [...checklistItems];
          for (let i = 0; i < mockCompletedCount; i++) {
            if (i < updatedItems.length) {
              updatedItems[i].completed = true;
            }
          }
          
          setChecklistItems(updatedItems);
          
          // Save initial progress to localStorage
          saveProgress(updatedItems, false);
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

  // Check if checklist should be hidden (all 5 primary tasks completed)
  useEffect(() => {
    if (completedCount >= 5) {
      // Give a short delay before hiding to allow for animation
      const timer = setTimeout(() => {
        setShowChecklist(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [completedCount]);

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
      transition: { duration: 0.5 } 
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="mb-6"
    >
      <Card className="relative overflow-hidden">
        <button 
          onClick={dismissChecklist}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="h-5 w-5" />
        </button>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Get Started with Ascentul</CardTitle>
          <CardDescription>5 quick actions to unlock your full dashboard</CardDescription>
          
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span>{completedCount} of 5 tasks completed</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <div 
                key={item.id}
                className={`flex items-start p-3 rounded-lg border transition-colors ${
                  item.completed 
                    ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900' 
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <button 
                  className="flex-shrink-0 mt-0.5"
                  onClick={() => toggleItemCompletion(item.id)}
                  aria-label={`Mark ${item.title} as ${item.completed ? 'incomplete' : 'complete'}`}
                >
                  {item.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                
                <div className="ml-3 flex-grow">
                  <h3 className={`text-base font-medium ${
                    item.completed ? 'text-green-700 dark:text-green-400' : ''
                  }`}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                
                <Link href={item.href}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-shrink-0 ml-2 whitespace-nowrap"
                  >
                    {item.completed ? 'View' : 'Go'} <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ))}
            
            {/* Review item - only show if 3+ tasks are completed */}
            {reviewUnlocked && (
              <div 
                className={`flex items-start p-3 rounded-lg border transition-colors ${
                  reviewItem.completed 
                    ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900' 
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <button 
                  className="flex-shrink-0 mt-0.5"
                  onClick={toggleReviewCompletion}
                  aria-label={`Mark ${reviewItem.title} as ${reviewItem.completed ? 'incomplete' : 'complete'}`}
                >
                  {reviewItem.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                
                <div className="ml-3 flex-grow">
                  <div className="flex items-center">
                    <h3 className={`text-base font-medium ${
                      reviewItem.completed ? 'text-green-700 dark:text-green-400' : ''
                    }`}>
                      {reviewItem.title}
                    </h3>
                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full">
                      Unlocked
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{reviewItem.description}</p>
                </div>
                
                <Link href={reviewItem.href}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-shrink-0 ml-2 whitespace-nowrap"
                  >
                    {reviewItem.completed ? 'View' : 'Go'} <ChevronRight className="ml-1 h-4 w-4" />
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