import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useUser, useIsUniversityUser } from '@/lib/useUserData';
import { usePendingTasks } from '@/context/PendingTasksContext';
import StatCard from '@/components/StatCard';
import CareerJourneyChart from '@/components/CareerJourneyChart';
import LevelProgress from '@/components/LevelProgress';
import GoalCard from '@/components/GoalCard';
import CreateGoalModal from '@/components/modals/CreateGoalModal';
import EditGoalModal from '@/components/modals/EditGoalModal';
import Confetti from '@/components/Confetti';
import TodaysRecommendations from '@/components/TodaysRecommendations';
import { CombinedFollowupActions } from '@/components/dashboard/CombinedFollowupActions';
import { ActiveApplicationsStatCard } from '@/components/dashboard/ActiveApplicationsStatCard';
import { InterviewCountdownCard } from '@/components/dashboard/InterviewCountdownCard';
import { UpcomingInterviewsCard } from '@/components/dashboard/UpcomingInterviewsCard';
import { GetStartedChecklist } from '@/components/dashboard/GetStartedChecklist';
import { Target, FileText, Clock, Plus, Bot, Send, Briefcase, Mail, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
// Default stats for when the API doesn't return data
const DEFAULT_STATS = {
    activeGoals: 0,
    achievementsCount: 0,
    resumesCount: 0,
    pendingTasks: 0,
    upcomingInterviews: 0,
    monthlyXp: [
        { month: 'Jan', xp: 120 },
        { month: 'Feb', xp: 240 },
        { month: 'Mar', xp: 180 },
        { month: 'Apr', xp: 320 },
        { month: 'May', xp: 290 },
        { month: 'Jun', xp: 450 }
    ]
};
export default function Dashboard() {
    const { user } = useUser();
    const { toast } = useToast();
    const isUnivUser = useIsUniversityUser();
    // Modal states
    const [createGoalModalOpen, setCreateGoalModalOpen] = useState(false);
    const [editGoalModalOpen, setEditGoalModalOpen] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    // Get stats data from API with regular refresh
    const { data: statsData } = useQuery({
        queryKey: ['/api/users/statistics'],
        // Refresh every 30 seconds to keep statistics up to date
        refetchInterval: 30000,
    });
    // Get the pending followup count from the PendingTasksContext
    const { pendingFollowupCount } = usePendingTasks();
    // Use default stats if data is not available, and override pendingTasks with our follow-up count
    const stats = {
        ...(statsData || DEFAULT_STATS),
        // Use the direct count from our context which reflects actual pending tasks in localStorage
        pendingTasks: pendingFollowupCount,
        // We'll get the upcoming interview count from our context later
    };
    // State to track goals that should be hidden (recently completed)
    // Only track completely hidden goals (after animation completes)
    const [hiddenGoalIds, setHiddenGoalIds] = useState([]);
    const [showConfetti, setShowConfetti] = useState(false);
    // Handle when a goal is completed - updated to show in Completed Goals section
    const handleGoalCompletion = (id) => {
        // Show confetti for completed goals
        setShowConfetti(true);
        setTimeout(() => {
            setShowConfetti(false);
        }, 2000);
        // Find the completed goal element and apply dissolve effect manually
        const goalElement = document.getElementById(`goal-${id}`);
        if (goalElement) {
            setTimeout(() => {
                // Apply dissolve effect manually to only the completed goal
                goalElement.style.transition = 'all 0.75s ease';
                goalElement.style.opacity = '0';
                goalElement.style.filter = 'blur(4px)';
                goalElement.style.transform = 'scale(0.95)';
                goalElement.style.height = '0';
                goalElement.style.marginBottom = '0';
                goalElement.style.overflow = 'hidden';
            }, 2200);
        }
        // Temporarily hide the goal during animation
        setTimeout(() => {
            setHiddenGoalIds(prev => [...prev, id]);
            // After the animation, find the goal and update its status in the database
            const goal = goals.find((g) => g.id === id);
            if (goal) {
                // Update the goal status to completed via the API
                apiRequest('PUT', `/api/goals/${id}`, {
                    ...goal,
                    status: 'completed',
                    progress: 100,
                    completed: true,
                    completedAt: new Date().toISOString()
                })
                    .then(() => {
                    // Refresh goals data and user statistics
                    queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
                    queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
                    toast({
                        title: "Goal Completed",
                        description: "Your goal has been marked as completed.",
                    });
                    // After another short delay, remove it from hidden list
                    // so it appears in the Completed Goals section
                    setTimeout(() => {
                        setHiddenGoalIds(prev => prev.filter(goalId => goalId !== id));
                    }, 500);
                })
                    .catch((error) => {
                    console.error('Error updating goal:', error);
                    // Still remove from hidden state even if there's an error
                    setTimeout(() => {
                        setHiddenGoalIds(prev => prev.filter(goalId => goalId !== id));
                    }, 500);
                    toast({
                        title: "Error",
                        description: "Failed to update goal status. Please try again.",
                        variant: "destructive",
                    });
                });
            }
        }, 3000); // Longer delay to allow for confetti and dissolve animation
    };
    // Fetch goals
    const { data: goals = [] } = useQuery({
        queryKey: ['/api/goals']
    });
    // Auto-dissolve completed goals when goals data changes
    useEffect(() => {
        if (!goals || !Array.isArray(goals))
            return;
        // Auto-dissolve any completed goals that have all checklist items completed
        goals.forEach((goal) => {
            if (goal.status === 'completed' &&
                goal.checklist &&
                goal.checklist.length > 0 &&
                goal.checklist.every((item) => item.completed)) {
                // Add a small delay to let the UI render first
                setTimeout(() => {
                    handleGoalCompletion(goal.id);
                }, 500);
            }
        });
    }, [goals]);
    // Fetch achievements
    const { data: achievements = [] } = useQuery({
        queryKey: ['/api/achievements/user'],
    });
    // Fetch interview processes and stages to check for upcoming interviews
    const { data: interviewProcesses = [] } = useQuery({
        queryKey: ['/api/interview/processes'],
    });
    // Calculate active interview processes count
    const activeInterviewProcesses = useMemo(() => {
        // Check if we have interview processes
        if (!interviewProcesses || !Array.isArray(interviewProcesses))
            return 0;
        // Count only the interview processes with status "In Progress" or "Offer Extended"
        return interviewProcesses.filter((process) => process.status === 'In Progress' || process.status === 'Offer Extended').length;
    }, [interviewProcesses]);
    // Find upcoming interviews (scheduled within the next 2 weeks)
    const upcomingInterviews = useMemo(() => {
        const now = new Date();
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(now.getDate() + 14); // 2 weeks from now
        const upcoming = [];
        // Check if we have interview processes
        if (!interviewProcesses || !Array.isArray(interviewProcesses))
            return [];
        // For each process, check if it has any stages with scheduled dates in the next 2 weeks
        interviewProcesses.forEach((process) => {
            if (process.stages && Array.isArray(process.stages)) {
                process.stages.forEach((stage) => {
                    if (stage.scheduledDate) {
                        const stageDate = new Date(stage.scheduledDate);
                        if (stageDate >= now && stageDate <= twoWeeksFromNow) {
                            upcoming.push({
                                id: stage.id,
                                companyName: process.companyName,
                                position: process.position,
                                scheduledDate: stage.scheduledDate,
                                type: stage.type
                            });
                        }
                    }
                });
            }
        });
        // Sort by date (earliest first)
        return upcoming.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    }, [interviewProcesses]);
    // Fetch AI coach conversations for preview
    const { data: conversations = [] } = useQuery({
        queryKey: ['/api/ai-coach/conversations'],
    });
    // States for dashboard AI coach mini-conversation
    const [userQuestion, setUserQuestion] = useState('');
    const [miniCoachMessages, setMiniCoachMessages] = useState([
        { role: 'assistant', content: 'Welcome to Ascentul! I\'m your AI career coach. How can I help you today?' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const conversationRef = useRef(null);
    // Function to handle sending a message to the coach
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userQuestion.trim())
            return;
        // Add user's question to the conversation
        const newMessages = [
            ...miniCoachMessages,
            { role: 'user', content: userQuestion.trim() }
        ];
        setMiniCoachMessages(newMessages);
        const currentQuestion = userQuestion.trim();
        setUserQuestion('');
        setIsTyping(true);
        try {
            // Use the same API format as the standalone AI Coach
            const response = await apiRequest("POST", "/api/ai-coach/generate-response", {
                query: currentQuestion,
                conversationHistory: newMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                selectedModel: "gpt-4o-mini" // Use the same default model as standalone coach
            });
            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }
            const data = await response.json();
            // Use the same response format as standalone coach
            setMiniCoachMessages([...newMessages, { role: 'assistant', content: data.response }]);
        }
        catch (error) {
            console.error('Error getting AI response:', error);
            toast({
                title: "Something went wrong",
                description: "Could not get a response from AI Coach. Please try again.",
                variant: "destructive"
            });
            // Fallback message in case of error
            setMiniCoachMessages([...newMessages, {
                    role: 'assistant',
                    content: "I'm sorry, I'm having trouble connecting right now. Please try again later."
                }]);
        }
        finally {
            setIsTyping(false);
            // Scroll to bottom of conversation
            if (conversationRef.current) {
                conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
            }
        }
    };
    // Auto-scroll conversation to bottom when new messages appear
    useEffect(() => {
        if (conversationRef.current) {
            conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
        }
    }, [miniCoachMessages]);
    // Calculate next level XP requirement
    const nextLevelXp = 1000;
    const nextRank = user && user.level < 5
        ? "Career Adventurer"
        : user && user.level < 10
            ? "Career Navigator"
            : "Career Master";
    const handleEditGoal = (id) => {
        setSelectedGoalId(id);
        setEditGoalModalOpen(true);
    };
    if (!user || !stats) {
        return _jsx("div", { className: "h-full flex items-center justify-center", children: "Loading dashboard data..." });
    }
    // Animation variants - instant (no animations for smooth adding/removing)
    const fadeIn = {
        hidden: { opacity: 1 },
        visible: { opacity: 1, transition: { duration: 0 } }
    };
    const subtleUp = {
        hidden: { opacity: 1, y: 0 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0
            }
        }
    };
    const cardAnimation = {
        hidden: { opacity: 1, y: 0 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0
            }
        }
    };
    const staggeredContainer = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0,
                delayChildren: 0
            }
        }
    };
    return (_jsxs(motion.div, { className: "container mx-auto", initial: "hidden", animate: "visible", variants: fadeIn, children: [_jsx(Confetti, { active: showConfetti, duration: 2000 }), _jsxs(motion.div, { className: "flex flex-col md:flex-row md:items-center justify-between mb-6 will-change-opacity will-change-transform", variants: subtleUp, style: { transform: 'translateZ(0)' }, children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold font-poppins", children: "Dashboard" }), _jsxs("p", { className: "text-neutral-500", children: ["Welcome back, ", user.name, "! Here's your career progress."] })] }), _jsx("div", { className: "mt-4 md:mt-0", children: _jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { className: "bg-primary hover:bg-primary/90 text-white", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Quick Actions"] }) }), _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { className: "text-center", children: "Quick Actions" }) }), _jsxs("div", { className: "grid grid-cols-1 gap-2 py-4", children: [_jsxs("div", { className: "flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors", onClick: () => {
                                                        setCreateGoalModalOpen(true);
                                                    }, children: [_jsx("div", { className: "h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mr-3 flex-shrink-0", children: _jsx(Target, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Create a Goal" }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Track your career objectives" })] })] }), _jsx(Link, { href: "/resume", className: "w-full", children: _jsxs("div", { className: "flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors", children: [_jsx("div", { className: "h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center mr-3 flex-shrink-0", children: _jsx(FileText, { className: "h-5 w-5 text-blue-500" }) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Create a Resume" }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Build a professional resume" })] })] }) }), _jsx(Link, { href: "/cover-letter", className: "w-full", children: _jsxs("div", { className: "flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors", children: [_jsx("div", { className: "h-9 w-9 rounded-full bg-purple-500/10 flex items-center justify-center mr-3 flex-shrink-0", children: _jsx(Mail, { className: "h-5 w-5 text-purple-500" }) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Create a Cover Letter" }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Craft a compelling cover letter" })] })] }) }), _jsx(Link, { href: "/application-tracker?create=true", className: "w-full", children: _jsxs("div", { className: "flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors", children: [_jsx("div", { className: "h-9 w-9 rounded-full bg-green-500/10 flex items-center justify-center mr-3 flex-shrink-0", children: _jsx(Users, { className: "h-5 w-5 text-green-500" }) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Track an Application" }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Track your job applications" })] })] }) }), _jsx(Link, { href: "/work-history", className: "w-full", children: _jsxs("div", { className: "flex items-center p-3 text-sm hover:bg-muted rounded-md cursor-pointer transition-colors", children: [_jsx("div", { className: "h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center mr-3 flex-shrink-0", children: _jsx(Briefcase, { className: "h-5 w-5 text-amber-500" }) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: "Add Work History" }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Record your work experience" })] })] }) })] })] })] }) })] }), _jsxs(motion.div, { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 will-change-opacity", variants: staggeredContainer, style: { backfaceVisibility: 'hidden' }, children: [_jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: { transform: 'translateZ(0)' }, children: _jsx(InterviewCountdownCard, {}) }), _jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: { transform: 'translateZ(0)' }, children: _jsx(ActiveApplicationsStatCard, {}) }), _jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: { transform: 'translateZ(0)' }, children: _jsx(StatCard, { icon: _jsx(Clock, { className: "h-5 w-5 text-[#ff9800]" }), iconBgColor: "bg-[#ff9800]/25", iconColor: "text-[#ff9800]", label: "Pending Tasks", value: stats.pendingTasks, change: {
                                type: stats.pendingTasks > 0 ? 'increase' : 'no-change',
                                text: stats.pendingTasks > 0
                                    ? `${stats.pendingTasks} item${stats.pendingTasks !== 1 ? 's' : ''} need attention`
                                    : 'No pending tasks'
                            } }) }), _jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: { transform: 'translateZ(0)' }, children: _jsx(StatCard, { icon: _jsx(Target, { className: "h-5 w-5 text-primary" }), iconBgColor: "bg-primary/20", iconColor: "text-primary", label: "Active Goals", value: stats.activeGoals, change: {
                                type: 'increase',
                                text: '2 more than last month'
                            } }) })] }), user && user.id && _jsx(GetStartedChecklist, { userId: user.id }), _jsxs(motion.div, { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 will-change-opacity", variants: staggeredContainer, style: { backfaceVisibility: 'hidden' }, children: [_jsx(motion.div, { className: "will-change-transform", variants: cardAnimation, style: { transform: 'translateZ(0)' }, children: _jsx(Card, { children: _jsxs(CardContent, { className: "p-5", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-lg font-semibold font-poppins", children: "Career Goals" }), _jsx("div", { className: "flex space-x-2", children: _jsxs(Button, { variant: "outline", size: "sm", className: "text-xs", onClick: () => setCreateGoalModalOpen(true), children: [_jsx(Plus, { className: "mr-1 h-3 w-3" }), "Create Goal"] }) })] }), _jsx("div", { children: _jsx("div", { className: "space-y-4", children: Array.isArray(goals) && goals.filter((goal) => goal.status !== 'completed' && !hiddenGoalIds.includes(goal.id)).length > 0 ? (_jsx(AnimatePresence, { mode: "sync", children: goals
                                                    .filter((goal) => goal.status !== 'completed' && !hiddenGoalIds.includes(goal.id))
                                                    .slice(0, 3)
                                                    .map((goal) => (_jsx(motion.div, { id: `goal-${goal.id}`, initial: { opacity: 1 }, animate: { opacity: 1 }, className: "mb-4", children: _jsx(GoalCard, { id: goal.id, title: goal.title, description: goal.description || '', progress: goal.progress, status: goal.status, dueDate: goal.dueDate ? new Date(goal.dueDate) : undefined, checklist: goal.checklist || [], onEdit: handleEditGoal, onComplete: handleGoalCompletion }) }, goal.id))) })) : (_jsxs("div", { className: "text-center py-4 text-neutral-500 bg-muted/30 rounded-lg", children: [_jsx(Target, { className: "mx-auto h-8 w-8 text-neutral-300 mb-2" }), _jsx("p", { children: "No active goals. Create your first career goal!" }), _jsx(Button, { variant: "link", className: "mt-1", onClick: () => setCreateGoalModalOpen(true), children: "Create Goal" })] })) }) })] }) }) }), _jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: { transform: 'translateZ(0)' }, children: _jsx(UpcomingInterviewsCard, {}) }), _jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: { transform: 'translateZ(0)' }, children: _jsx(Card, { children: _jsxs(CardContent, { className: "p-5", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Follow-up Actions" }), _jsx("div", { className: "flex space-x-2" })] }), _jsx(CombinedFollowupActions, { limit: 3, showTitle: false })] }) }) })] }), _jsxs(motion.div, { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 will-change-opacity", variants: staggeredContainer, style: { backfaceVisibility: 'hidden' }, children: [_jsx(motion.div, { className: "will-change-transform lg:col-span-2", variants: cardAnimation, style: { transform: 'translateZ(0)' }, children: _jsx(Card, { className: "h-full", children: _jsxs(CardContent, { className: "p-5 h-full flex flex-col", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-lg font-semibold font-poppins", children: "AI Coach" }), _jsx(Link, { href: "/ai-coach", children: _jsx(Button, { variant: "link", className: "text-sm text-primary p-0 h-auto", children: "Open Full Coach" }) })] }), _jsxs("div", { ref: conversationRef, className: "flex-1 min-h-[240px] max-h-[400px] overflow-y-auto mb-4 pr-1 conversation-container", children: [miniCoachMessages.map((message, index) => (message.role === 'assistant' ? (_jsx(Card, { className: "border border-neutral-200 shadow-none p-3 mb-3", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0", children: _jsx(Bot, { className: "h-4 w-4" }) }), _jsxs("div", { className: "ml-3 flex-1", children: [_jsx("p", { className: "text-sm font-medium", children: "Career Coach" }), _jsx("div", { className: "text-sm text-muted-foreground mt-1 space-y-2", children: message.content.split('\n').map((paragraph, i) => (paragraph.trim() ? (_jsx("p", { children: paragraph.replace(/\*/g, '') }, i)) : (_jsx("div", { className: "h-2" }, i)))) })] })] }) }, index)) : (_jsx("div", { className: "pl-11 pr-1 mb-3", children: _jsx("div", { className: "bg-muted/50 rounded-lg p-3 text-sm relative", children: _jsx("div", { className: "space-y-2", children: message.content.split('\n').map((paragraph, i) => (paragraph.trim() ? (_jsx("p", { children: paragraph.replace(/\*/g, '') }, i)) : (_jsx("div", { className: "h-2" }, i)))) }) }) }, index)))), isTyping && (_jsx(Card, { className: "border border-neutral-200 shadow-none p-3 mb-3", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0", children: _jsx(Bot, { className: "h-4 w-4" }) }), _jsxs("div", { className: "ml-3", children: [_jsx("p", { className: "text-sm font-medium", children: "Career Coach" }), _jsxs("div", { className: "flex space-x-1 mt-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-primary animate-pulse", style: { animationDelay: '0ms' } }), _jsx("div", { className: "w-2 h-2 rounded-full bg-primary animate-pulse", style: { animationDelay: '300ms' } }), _jsx("div", { className: "w-2 h-2 rounded-full bg-primary animate-pulse", style: { animationDelay: '600ms' } })] })] })] }) }))] }), _jsx("form", { onSubmit: handleSendMessage, className: "mt-auto", children: _jsxs("div", { className: "flex items-center border rounded-lg overflow-hidden bg-background", children: [_jsx(Input, { type: "text", placeholder: "Ask me anything about your career...", className: "flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0", value: userQuestion, onChange: (e) => setUserQuestion(e.target.value), disabled: isTyping }), _jsx(Button, { type: "submit", variant: "ghost", size: "icon", className: "h-10 w-10 rounded-none", disabled: isTyping || !userQuestion.trim(), children: _jsx(Send, { className: "h-5 w-5 text-primary" }) })] }) })] }) }) }), _jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: { transform: 'translateZ(0)' }, children: _jsx(TodaysRecommendations, {}) })] }), isUnivUser && (_jsx(motion.div, { className: "mb-6 will-change-opacity", variants: staggeredContainer, style: { backfaceVisibility: 'hidden' }, children: _jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: { transform: 'translateZ(0)' }, children: _jsx(Card, { children: _jsxs(CardContent, { className: "p-5 flex flex-col", children: [_jsx("div", { className: "mb-4", children: _jsx("h2", { className: "text-lg font-semibold font-poppins", children: "Your Level" }) }), _jsx("div", { className: "flex flex-col items-center justify-center", children: _jsx(LevelProgress, { level: user.level || 1, xp: user.xp || 0, nextLevelXp: nextLevelXp, rank: user.rank || 'Career Novice', nextRank: nextRank }) })] }) }) }) })), isUnivUser && (_jsxs(motion.div, { className: "grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 will-change-opacity", variants: staggeredContainer, style: { backfaceVisibility: 'hidden' }, children: [_jsx(motion.div, { className: "lg:col-span-2 will-change-transform", variants: cardAnimation, style: { transform: 'translateZ(0)' }, children: _jsx(Card, { children: _jsxs(CardContent, { className: "p-5", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h2", { className: "text-lg font-semibold font-poppins", children: "Career Journey" }), _jsx("p", { className: "text-xs text-neutral-500", children: "Your XP growth over time" })] }), _jsx("div", { className: "h-[300px]", children: _jsx(CareerJourneyChart, { data: stats.monthlyXp }) })] }) }) }), _jsx(motion.div, { variants: cardAnimation, className: "will-change-transform", style: { transform: 'translateZ(0)' }, children: _jsx(Card, { children: _jsxs(CardContent, { className: "p-5", children: [_jsx("div", { className: "mb-4", children: _jsx("h2", { className: "text-lg font-semibold font-poppins", children: "Upcoming Interviews" }) }), _jsxs("div", { className: "space-y-4", children: [stats.upcomingInterviews > 0 && Array.isArray(upcomingInterviews) && upcomingInterviews.length > 0 ? (upcomingInterviews.slice(0, 3).map((interview) => (_jsxs("div", { className: "p-3 bg-background border rounded-md", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("p", { className: "font-medium text-sm", children: interview.companyName }), _jsx(Badge, { variant: "outline", className: "text-xs capitalize", children: interview.type.replace('_', ' ') })] }), _jsx("p", { className: "text-xs text-neutral-500", children: interview.position }), _jsxs("div", { className: "flex items-center mt-2 text-xs text-neutral-400", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), new Date(interview.scheduledDate).toLocaleDateString(), " at ", ' ', new Date(interview.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] })] }, interview.id)))) : (_jsxs("div", { className: "text-center py-8 text-neutral-500", children: [_jsx(Calendar, { className: "mx-auto h-10 w-10 text-neutral-300 mb-2" }), _jsx("p", { children: "No upcoming interviews scheduled" }), _jsx(Link, { href: "/application-tracker?create=true", children: _jsx(Button, { variant: "link", className: "text-xs mt-2", children: "Schedule an interview" }) })] })), _jsx("div", { className: "pt-2", children: _jsx(Link, { href: "/application-tracker", children: _jsx(Button, { variant: "outline", size: "sm", className: "w-full", children: "View All Interviews" }) }) })] })] }) }) })] })), createGoalModalOpen && (_jsx(CreateGoalModal, { isOpen: createGoalModalOpen, onClose: () => setCreateGoalModalOpen(false) })), editGoalModalOpen && selectedGoalId && (_jsx(EditGoalModal, { isOpen: editGoalModalOpen, onClose: () => setEditGoalModalOpen(false), goalId: selectedGoalId, goals: Array.isArray(goals) ? goals : [] }))] }));
}
