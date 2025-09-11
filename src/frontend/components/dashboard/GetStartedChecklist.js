import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { CheckCircle, Circle, Briefcase, Users, FileText, Star, ChevronRight, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Confetti from '@/components/Confetti';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useReviewPopup } from '@/components/ReviewPopup';
// Main component
export function GetStartedChecklist({ userId }) {
    const { toast } = useToast();
    const { openReviewPopup, closeReviewPopup, ReviewPopupComponent } = useReviewPopup();
    // Fetch career data to check profile completion
    const { data: careerData } = useQuery({
        queryKey: ['/api/career-data'],
        queryFn: async () => {
            try {
                const res = await apiRequest('GET', '/api/career-data');
                return await res.json();
            }
            catch (error) {
                console.error('Error fetching career data:', error);
                return {};
            }
        },
        refetchInterval: 5000, // Refetch every 5 seconds to keep data fresh
        staleTime: 0, // Always consider data stale to ensure updates
    });
    // Fetch network contacts to check if the user has added any
    const { data: networkContacts = [] } = useQuery({
        queryKey: ['/api/contacts'],
        queryFn: async () => {
            try {
                const res = await apiRequest('GET', '/api/contacts');
                return await res.json();
            }
            catch (error) {
                console.error('Error fetching network contacts:', error);
                return [];
            }
        },
        refetchInterval: 5000, // Refetch every 5 seconds to keep data fresh
        staleTime: 0, // Always consider data stale to ensure updates
    });
    // Fetch user goals to check if they've created any
    const { data: userGoals = [] } = useQuery({
        queryKey: ['/api/goals'],
        queryFn: async () => {
            try {
                const res = await apiRequest('GET', '/api/goals');
                return await res.json();
            }
            catch (error) {
                console.error('Error fetching user goals:', error);
                return [];
            }
        },
        refetchInterval: 5000, // Refetch every 5 seconds to keep data fresh
        staleTime: 0, // Always consider data stale to ensure updates
    });
    // Fetch job applications to check if they've added any
    const { data: jobApplications = [] } = useQuery({
        queryKey: ['/api/job-applications'],
        queryFn: async () => {
            try {
                const res = await apiRequest('GET', '/api/job-applications');
                return await res.json();
            }
            catch (error) {
                console.error('Error fetching job applications:', error);
                return [];
            }
        },
        refetchInterval: 5000, // Refetch every 5 seconds to keep data fresh
        staleTime: 0, // Always consider data stale to ensure updates
    });
    // Fetch user resumes to check if they've created any
    const { data: userResumes = [] } = useQuery({
        queryKey: ['/api/resumes'],
        queryFn: async () => {
            try {
                const res = await apiRequest('GET', '/api/resumes');
                return await res.json();
            }
            catch (error) {
                console.error('Error fetching user resumes:', error);
                return [];
            }
        },
        refetchInterval: 5000, // Refetch every 5 seconds to keep data fresh
        staleTime: 0, // Always consider data stale to ensure updates
    });
    // State to track checklist items
    const [checklistItems, setChecklistItems] = useState([
        {
            id: 'career-profile',
            title: 'Complete your career profile',
            description: 'Add your work history, education, and skills',
            completed: false,
            href: '/account',
            icon: _jsx(Briefcase, { className: "h-4 w-4 text-primary" })
        },
        {
            id: 'career-goal',
            title: 'Set your first career goal',
            description: 'Define what you want to achieve next',
            completed: false,
            href: '/goals',
            icon: _jsx(CheckCircle, { className: "h-4 w-4 text-green-500" })
        },
        {
            id: 'resume-creation',
            title: 'Create a resume draft',
            description: 'Start building your professional resume',
            completed: false,
            href: '/resume',
            icon: _jsx(FileText, { className: "h-4 w-4 text-orange-500" })
        },
        {
            id: 'job-application',
            title: 'Track your first application',
            description: 'Start managing your job applications',
            completed: false,
            href: '/application-tracker',
            icon: _jsx(FileText, { className: "h-4 w-4 text-blue-500" })
        },
        {
            id: 'network-contact',
            title: 'Add 1 contact to the Network Hub',
            description: 'Start building your professional network',
            completed: false,
            href: '/contacts',
            icon: _jsx(Users, { className: "h-4 w-4 text-indigo-500" })
        }
    ]);
    // State for review item (6th item)
    const [reviewItem, setReviewItem] = useState({
        id: 'leave-review',
        title: 'Leave a quick review',
        description: 'Tell us what you think about Ascentul',
        completed: false,
        href: '/feedback',
        icon: _jsx(Star, { className: "h-4 w-4 text-yellow-500" })
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
    const saveProgress = (items, reviewCompleted, explicitlyDismissed = false) => {
        try {
            // Added log to track what's being saved

            const progressData = {
                userId,
                items: items.reduce((acc, item) => {
                    acc[item.id] = item.completed;
                    return acc;
                }, {}),
                reviewCompleted,
                explicitlyDismissed,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(`checklist_progress_${userId}`, JSON.stringify(progressData));
        }
        catch (error) {
            console.error('Error saving checklist progress:', error);
        }
    };
    // Helper function to handle new user initialization
    const handleNewUser = () => {

        // Ensure we have a clean slate for the checklist items
        const freshItems = checklistItems.map(item => ({ ...item, completed: false }));
        setChecklistItems(freshItems);
        // Reset review item
        setReviewItem(prev => ({ ...prev, completed: false }));
        // Initialize localStorage with a delay to ensure state is updated
        setTimeout(() => {
            saveProgress(freshItems, false, false);

        }, 300);
        // Always show checklist for new users
        setShowChecklist(true);

    };
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
                    try {
                        const parsedProgress = JSON.parse(storedProgress);

                        // Update the checklist items with the stored progress
                        setChecklistItems(prevItems => {
                            const updatedItems = prevItems.map(item => ({
                                ...item,
                                completed: parsedProgress.items && parsedProgress.items[item.id] || false
                            }));

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

                    }
                    catch (parseError) {
                        console.error("Failed to parse stored progress, treating as new user:", parseError);
                        handleNewUser();
                    }
                }
                else {
                    handleNewUser();
                }
            }
            catch (error) {
                console.error('Error loading checklist progress:', error);
                // Safety fallback - ensure checklist shows up even on error
                setShowChecklist(true);
            }
            finally {
                setIsLoading(false);
            }
        }, 500);
    }, [userId]);
    // Toggle item completion
    const toggleItemCompletion = (id) => {
        setChecklistItems(prevItems => {
            const updatedItems = prevItems.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
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
    // State flag to prevent duplicate toast notifications for career profile completion
    const [hasUpdatedCareerProfileItem, setHasUpdatedCareerProfileItem] = useState(false);
    // Calculate career profile completion percentage
    const calculateProfileCompletion = (data) => {
        if (!data)
            return 0;
        const hasWorkHistory = data.workHistory && Array.isArray(data.workHistory) && data.workHistory.length > 0;
        const hasEducation = data.educationHistory && Array.isArray(data.educationHistory) && data.educationHistory.length > 0;
        const hasSkills = data.skills && Array.isArray(data.skills) && data.skills.length > 0;
        const hasCertifications = data.certifications && Array.isArray(data.certifications) && data.certifications.length > 0;
        // Calculate completion percentage - each category is worth 25%
        let completionPercentage = 0;
        if (hasWorkHistory)
            completionPercentage += 25;
        if (hasEducation)
            completionPercentage += 25;
        if (hasSkills)
            completionPercentage += 25;
        if (hasCertifications)
            completionPercentage += 25;
        return completionPercentage;
    };
    // Update the network contact checklist item based on actual data
    useEffect(() => {
        if (!networkContacts || !Array.isArray(networkContacts))
            return;
        // Check if the user has added at least one contact
        const hasAtLeastOneContact = networkContacts.length > 0;

        // Update the network-contact item based on actual data
        setChecklistItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                if (item.id === 'network-contact') {
                    return { ...item, completed: hasAtLeastOneContact };
                }
                return item;
            });
            return updatedItems;
        });
    }, [networkContacts]);
    // Update the career goal checklist item based on actual data
    useEffect(() => {
        if (!userGoals || !Array.isArray(userGoals))
            return;
        // Check if the user has created at least one goal
        const hasAtLeastOneGoal = userGoals.length > 0;

        // Update the career-goal item based on actual data
        setChecklistItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                if (item.id === 'career-goal') {
                    return { ...item, completed: hasAtLeastOneGoal };
                }
                return item;
            });
            return updatedItems;
        });
    }, [userGoals]);
    // Update the job application checklist item based on actual data
    useEffect(() => {
        if (!jobApplications || !Array.isArray(jobApplications))
            return;
        // Check if the user has added at least one application
        const hasAtLeastOneApplication = jobApplications.length > 0;

        // Update the job-application item based on actual data
        setChecklistItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                if (item.id === 'job-application') {
                    return { ...item, completed: hasAtLeastOneApplication };
                }
                return item;
            });
            return updatedItems;
        });
    }, [jobApplications]);
    // Update the resume checklist item based on actual data
    useEffect(() => {
        if (!userResumes || !Array.isArray(userResumes))
            return;
        // Check if the user has created at least one resume
        const hasAtLeastOneResume = userResumes.length > 0;

        // Update the resume-creation item based on actual data
        setChecklistItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                if (item.id === 'resume-creation') {
                    return { ...item, completed: hasAtLeastOneResume };
                }
                return item;
            });
            return updatedItems;
        });
    }, [userResumes]);
    // Update the career profile checklist item based on profile completion
    useEffect(() => {
        if (!careerData)
            return;
        // Calculate profile completion
        const sections = [
            !!careerData.careerSummary,
            (careerData.workHistory?.length || 0) > 0,
            (careerData.educationHistory?.length || 0) > 0,
            (careerData.skills?.length || 0) > 0,
            (careerData.certifications?.length || 0) > 0
        ];
        const completedSections = sections.filter(Boolean).length;
        const totalSections = sections.length;
        const percentageComplete = Math.round((completedSections / totalSections) * 100);

        // Check if profile is 100% complete
        const isProfileComplete = percentageComplete === 100;
        // Update the career-profile item based on completion
        setChecklistItems(prevItems => {
            const updatedItems = prevItems.map(item => {
                if (item.id === 'career-profile') {
                    return { ...item, completed: isProfileComplete };
                }
                return item;
            });
            return updatedItems;
        });
        // Show toast only when profile becomes complete (not on every update)
        if (isProfileComplete && !hasUpdatedCareerProfileItem) {
            toast({
                title: "Career Profile Complete!",
                description: "You've completed your career profile. Great job!",
            });
            setHasUpdatedCareerProfileItem(true);
        }
    }, [careerData, toast]);
    // Save progress whenever checklist items change
    useEffect(() => {
        // Save the updated progress to local storage whenever checklist items change
        saveProgress(checklistItems, reviewItem.completed);
    }, [checklistItems, reviewItem.completed, userId]);
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
                }
                catch (error) {
                    console.error("Error parsing storage during auto-hide check:", error);
                }
            }
        }
    }, [completedCount, reviewItem.completed, justCompleted, userId]);
    // If checklist is hidden, don't render anything
    if (!showChecklist)
        return null;
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
    return (_jsxs(motion.div, { initial: "hidden", animate: "visible", variants: fadeIn, className: "mb-6", children: [_jsx(ReviewPopupComponent, { onSubmitSuccess: handleReviewSubmitSuccess }), _jsx(Confetti, { active: showConfetti, duration: 2000 }), _jsxs(Card, { className: "relative overflow-hidden border border-border/60 bg-background/95 shadow-sm", children: [_jsx("button", { onClick: dismissChecklist, className: "absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors", "aria-label": "Dismiss checklist", children: _jsx(X, { className: "h-4 w-4" }) }), _jsxs(CardHeader, { className: "pb-1 pt-4 px-4", children: [_jsx(CardTitle, { className: "text-lg font-medium", children: "Get Started with Ascentul" }), _jsx(CardDescription, { className: "text-sm", children: "Want to personalize your dashboard and unlock advanced features? Complete these quick steps." }), _jsxs("div", { className: "mt-2", children: [_jsxs("div", { className: "flex justify-between text-xs mb-1", children: [_jsxs("span", { children: [completedCount, " of 5 tasks completed"] }), _jsxs("span", { children: [Math.round(progressPercentage), "%"] })] }), _jsx(Progress, { value: progressPercentage, className: "h-1.5" })] })] }), _jsx(CardContent, { className: "pt-3 pb-4 px-4", children: _jsxs("div", { className: "space-y-2.5", children: [checklistItems.map((item) => (_jsxs("div", { className: `flex items-start p-2.5 rounded-md border transition-colors ${item.completed
                                        ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900'
                                        : 'border-border/60 hover:bg-muted/50'}`, children: [_jsx("div", { className: "flex-shrink-0 mt-0.5 cursor-default", "aria-label": `${item.title} is ${item.completed ? 'complete' : 'incomplete'}`, children: item.completed ? (_jsx(CheckCircle, { className: "h-4 w-4 text-green-500" })) : (_jsx(Circle, { className: "h-4 w-4 text-muted-foreground opacity-60" })) }), _jsxs("div", { className: "ml-2.5 flex-grow", children: [_jsx("h3", { className: `text-sm font-medium ${item.completed ? 'text-green-700 dark:text-green-400' : ''}`, children: item.title }), _jsx("p", { className: "text-xs text-muted-foreground", children: item.description })] }), !item.completed && (_jsx(Link, { href: item.href, children: _jsxs(Button, { variant: "outline", size: "sm", className: "flex-shrink-0 ml-2 h-7 px-2 text-xs whitespace-nowrap", children: ["Go ", _jsx(ChevronRight, { className: "ml-1 h-3 w-3" })] }) }))] }, item.id))), _jsxs("div", { className: `flex items-start p-2.5 rounded-md border transition-colors ${reviewItem.completed
                                        ? 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900'
                                        : 'border-border/60 hover:bg-muted/50'}`, children: [_jsx("div", { className: "flex-shrink-0 mt-0.5 cursor-pointer", onClick: toggleReviewCompletion, "aria-label": `Open review for ${reviewItem.title}`, children: reviewItem.completed ? (_jsx(CheckCircle, { className: "h-4 w-4 text-green-500" })) : (_jsx(Circle, { className: "h-4 w-4 text-muted-foreground hover:text-muted-foreground/80" })) }), _jsxs("div", { className: "ml-2.5 flex-grow", children: [_jsx("div", { className: "flex items-center", children: _jsx("h3", { className: `text-sm font-medium ${reviewItem.completed ? 'text-green-700 dark:text-green-400' : ''}`, children: reviewItem.title }) }), _jsx("p", { className: "text-xs text-muted-foreground", children: reviewItem.description })] }), !reviewItem.completed && (_jsxs(Button, { variant: "outline", size: "sm", className: "flex-shrink-0 ml-2 h-7 px-2 text-xs whitespace-nowrap", onClick: toggleReviewCompletion, children: ["Go ", _jsx(ChevronRight, { className: "ml-1 h-3 w-3" })] }))] })] }) })] })] }));
}
