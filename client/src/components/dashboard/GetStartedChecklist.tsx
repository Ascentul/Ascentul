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
import { useReviewPopup } from '@/components/ReviewPopup';

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
  const { openReviewPopup, closeReviewPopup, ReviewPopupComponent } = useReviewPopup();
  
  // Fetch career data to check profile completion
  const { data: careerData } = useQuery({
    queryKey: ['/api/career-data'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/career-data');
        return await res.json();
      } catch (error) {
        console.error('Error fetching career data:', error);
        return {};
      }
    },
  });
  
  // Fetch network contacts to check if the user has added any
  const { data: networkContacts = [] } = useQuery({
    queryKey: ['/api/contacts'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/contacts');
        return await res.json();
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
        const res = await apiRequest('GET', '/api/goals');
        return await res.json();
      } catch (error) {
        console.error('Error fetching user goals:', error);
        return [];
      }
    },
  });
  
  // Fetch job applications to check if they've added any
  const { data: jobApplications = [] } = useQuery({
    queryKey: ['/api/job-applications'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/job-applications');
        return await res.json();
      } catch (error) {
        console.error('Error fetching job applications:', error);
        return [];
      }
    },
  });
  
  // Fetch user resumes to check if they've created any
  const { data: userResumes = [] } = useQuery({
    queryKey: ['/api/resumes'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/resumes');
        return await res.json();
      } catch (error) {
        console.error('Error fetching user resumes:', error);
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
      href: '/application-tracker',
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
  // State to track if the review item is unlocked - always true to show it from the start
  const [reviewUnlocked, setReviewUnlocked] = useState(true);
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
    // Open the review popup instead of immediately marking as complete
    openReviewPopup();
  };
  
  // Handle successful review submission
  const handleReviewSubmitSuccess = () => {
    setReviewItem(prev => {
      const updated = { ...prev, completed: true };
      
      // Save progress
      saveProgress(checklistItems, true);
      
      // Show success toast
      toast({
        title: "Thank you for your feedback!",
        description: "Your review has been recorded. We appreciate your input.",
      });
      
      return updated;
    });
  };

  // Calculate progress
  const completedCount = checklistItems.filter(item => item.completed).length;
  const progressPercentage = (completedCount / checklistItems.length) * 100;

  // Review is always unlocked/available from the start
  // No need to check completed items count

  // Track if we need to update the state of the checklist items
  const [hasUpdatedContactItem, setHasUpdatedContactItem] = useState(false);
  const [hasUpdatedGoalItem, setHasUpdatedGoalItem] = useState(false);
  const [hasUpdatedApplicationItem, setHasUpdatedApplicationItem] = useState(false);
  const [hasUpdatedResumeItem, setHasUpdatedResumeItem] = useState(false);
  const [hasUpdatedCareerProfileItem, setHasUpdatedCareerProfileItem] = useState(false);
  
  // Calculate career profile completion percentage
  const calculateProfileCompletion = (data: any) => {
    if (!data) return 0;
    
    const hasWorkHistory = data.workHistory && Array.isArray(data.workHistory) && data.workHistory.length > 0;
    const hasEducation = data.educationHistory && Array.isArray(data.educationHistory) && data.educationHistory.length > 0;
    const hasSkills = data.skills && Array.isArray(data.skills) && data.skills.length > 0;
    const hasCertifications = data.certifications && Array.isArray(data.certifications) && data.certifications.length > 0;
    
    // Calculate completion percentage - each category is worth 25%
    let completionPercentage = 0;
    if (hasWorkHistory) completionPercentage += 25;
    if (hasEducation) completionPercentage += 25;
    if (hasSkills) completionPercentage += 25;
    if (hasCertifications) completionPercentage += 25;
    
    return completionPercentage;
  };
  
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
  
  // Update the job application checklist item based on actual data
  useEffect(() => {
    if (!jobApplications || !Array.isArray(jobApplications) || hasUpdatedApplicationItem) return;
    
    // Check if the user has added at least one application
    const hasAtLeastOneApplication = jobApplications.length > 0;
    
    console.log(`User has ${jobApplications.length} job applications`);
    
    // We only want to update if there are applications and the item isn't already marked as completed
    const applicationItem = checklistItems.find(item => item.id === 'job-application');
    
    if (hasAtLeastOneApplication && applicationItem && !applicationItem.completed) {
      console.log('Marking job-application checklist item as completed based on actual applications');
      
      // Update only the job-application item based on actual data
      setChecklistItems(prevItems => {
        const updatedItems = prevItems.map(item => {
          if (item.id === 'job-application') {
            return { ...item, completed: true };
          }
          return item;
        });
        
        return updatedItems;
      });
    }
    
    // Mark that we've processed this check to avoid further updates
    setHasUpdatedApplicationItem(true);
  }, [jobApplications, checklistItems, hasUpdatedApplicationItem]);
  
  // Update the resume checklist item based on actual data
  useEffect(() => {
    if (!userResumes || !Array.isArray(userResumes) || hasUpdatedResumeItem) return;
    
    // Check if the user has created at least one resume
    const hasAtLeastOneResume = userResumes.length > 0;
    
    console.log(`User has ${userResumes.length} resumes`);
    
    // We only want to update if there are resumes and the item isn't already marked as completed
    const resumeItem = checklistItems.find(item => item.id === 'resume-creation');
    
    if (hasAtLeastOneResume && resumeItem && !resumeItem.completed) {
      console.log('Marking resume-creation checklist item as completed based on actual resumes');
      
      // Update only the resume-creation item based on actual data
      setChecklistItems(prevItems => {
        const updatedItems = prevItems.map(item => {
          if (item.id === 'resume-creation') {
            return { ...item, completed: true };
          }
          return item;
        });
        
        return updatedItems;
      });
    }
    
    // Mark that we've processed this check to avoid further updates
    setHasUpdatedResumeItem(true);
  }, [userResumes, checklistItems, hasUpdatedResumeItem]);
  
  // Update the career profile checklist item based on profile completion
  useEffect(() => {
    if (!careerData || hasUpdatedCareerProfileItem) return;
    
    // Calculate profile completion
    const sections = [
      !!(careerData as any).careerSummary,
      ((careerData as any).workHistory?.length || 0) > 0,
      ((careerData as any).educationHistory?.length || 0) > 0,
      ((careerData as any).skills?.length || 0) > 0,
      ((careerData as any).certifications?.length || 0) > 0
    ];
    
    const completedSections = sections.filter(Boolean).length;
    const totalSections = sections.length;
    const percentageComplete = Math.round((completedSections / totalSections) * 100);
    
    console.log(`Career profile completion: ${percentageComplete}% (${completedSections}/${totalSections} sections)`);
    
    // We only want to update if profile is 100% complete and the item isn't already marked as completed
    const profileItem = checklistItems.find(item => item.id === 'career-profile');
    
    if (percentageComplete === 100 && profileItem && !profileItem.completed) {
      console.log('Marking career-profile checklist item as completed based on 100% profile completion');
      
      // Update only the career-profile item based on completion
      setChecklistItems(prevItems => {
        const updatedItems = prevItems.map(item => {
          if (item.id === 'career-profile') {
            return { ...item, completed: true };
          }
          return item;
        });
        
        return updatedItems;
      });
      
      toast({
        title: "Career Profile Complete!",
        description: "You've completed your career profile. Great job!",
      });
    }
    
    // Mark that we've processed this check to avoid further updates
    setHasUpdatedCareerProfileItem(true);
  }, [careerData, checklistItems, hasUpdatedCareerProfileItem, toast]);
  
  // Save progress whenever checklist items change
  useEffect(() => {
    // Only update localStorage when we have processed all data
    if ((hasUpdatedContactItem || !Array.isArray(networkContacts)) && 
        (hasUpdatedGoalItem || !Array.isArray(userGoals)) &&
        (hasUpdatedApplicationItem || !Array.isArray(jobApplications)) &&
        (hasUpdatedResumeItem || !Array.isArray(userResumes)) &&
        (hasUpdatedCareerProfileItem || !careerData)) {
      // Save the updated progress to local storage
      saveProgress(checklistItems, reviewItem.completed);
    }
  }, [checklistItems, reviewItem.completed, hasUpdatedContactItem, hasUpdatedGoalItem, 
      hasUpdatedApplicationItem, hasUpdatedResumeItem, hasUpdatedCareerProfileItem, 
      networkContacts, userGoals, jobApplications, userResumes, careerData, userId]);
  
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
      {/* Review Popup */}
      <ReviewPopupComponent onSubmitSuccess={handleReviewSubmitSuccess} />
      
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
                <div 
                  className="flex-shrink-0 mt-0.5 cursor-default" 
                  aria-label={`${item.title} is ${item.completed ? 'complete' : 'incomplete'}`}
                >
                  {item.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground opacity-60" />
                  )}
                </div>
                
                <div className="ml-2.5 flex-grow">
                  <h3 className={`text-sm font-medium ${
                    item.completed ? 'text-green-700 dark:text-green-400' : ''
                  }`}>
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                
                {!item.completed && (
                  <Link href={item.href}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-shrink-0 ml-2 h-7 px-2 text-xs whitespace-nowrap"
                    >
                      Go <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
            
            {/* Review item - always shown regardless of completion status */}
            <div 
              className={`flex items-start p-2.5 rounded-md border transition-colors ${
                reviewItem.completed 
                  ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900' 
                  : 'border-border/60 hover:bg-muted/50'
              }`}
            >
              <div 
                className="flex-shrink-0 mt-0.5 cursor-pointer" 
                onClick={toggleReviewCompletion}
                aria-label={`Open review for ${reviewItem.title}`}
              >
                {reviewItem.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground hover:text-muted-foreground/80" />
                )}
              </div>
              
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
              
              {!reviewItem.completed && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-shrink-0 ml-2 h-7 px-2 text-xs whitespace-nowrap"
                  onClick={toggleReviewCompletion}
                >
                  Go <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}