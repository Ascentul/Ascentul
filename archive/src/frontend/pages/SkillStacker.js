import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, BookOpen, Code, Flame, Calendar, Clock, PlusCircle, Medal, BarChart, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import LoadingSpinner from '@/components/ui/loading-spinner';
import { format } from 'date-fns';
// Skill level options for generating plans
const skillLevelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
];
// Helper function to determine task icon
const getTaskIcon = (type) => {
    switch (type) {
        case 'learning':
            return _jsx(BookOpen, { className: "h-5 w-5 mr-2" });
        case 'practice':
            return _jsx(Code, { className: "h-5 w-5 mr-2" });
        case 'project':
            return _jsx(Flame, { className: "h-5 w-5 mr-2" });
        default:
            return _jsx(BookOpen, { className: "h-5 w-5 mr-2" });
    }
};
// Helper function to format task type for display
const formatTaskType = (type) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
};
export default function SkillStacker() {
    const { toast } = useToast();
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [selectedWeek, setSelectedWeek] = useState(1);
    const [selectedSkillLevel, setSelectedSkillLevel] = useState('beginner');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [currentTab, setCurrentTab] = useState('active');
    // Fetch all skill stacker plans
    const { data: allPlans, isLoading: isLoadingPlans } = useQuery({
        queryKey: ['/api/skill-stacker'],
        queryFn: async () => {

            const result = await apiRequest({ url: '/api/skill-stacker' });

            return result;
        },
    });
    // Fetch goals for dropdown
    const { data: goals, isLoading: isLoadingGoals } = useQuery({
        queryKey: ['/api/goals'],
        queryFn: () => apiRequest({ url: '/api/goals' }),
    });
    // Filter plans based on selected tab
    const filteredPlans = allPlans ? allPlans.filter((plan) => {
        if (currentTab === 'active')
            return plan.status === 'active';
        if (currentTab === 'completed')
            return plan.status === 'completed';
        if (currentTab === 'archived')
            return plan.status === 'archived';
        return true;
    }) : [];
    // Mutation for generating a new skill stacker plan
    const generateMutation = useMutation({
        mutationFn: (data) => apiRequest({
            url: '/api/skill-stacker/generate',
            method: 'POST',
            data,
        }),
        onSuccess: () => {
            setIsGenerating(false);
            setIsGenerateDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['/api/skill-stacker'] });
            toast({
                title: 'Success!',
                description: 'Your skill development plan has been created.',
            });
        },
        onError: (error) => {
            setIsGenerating(false);
            toast({
                title: 'Error',
                description: 'Failed to generate skill plan. Please try again.',
                variant: 'destructive',
            });
            console.error('Error generating skill plan:', error);
        },
    });
    // Mutation for completing a task
    const completeTaskMutation = useMutation({
        mutationFn: ({ planId, taskId, status, rating }) => apiRequest({
            url: `/api/skill-stacker/${planId}/task/${taskId}`,
            method: 'PUT',
            data: { status, rating },
        }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['/api/skill-stacker'] });
            setSelectedPlan(data);
            toast({
                title: 'Task updated',
                description: 'Your progress has been saved.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: 'Failed to update task status.',
                variant: 'destructive',
            });
            console.error('Error updating task:', error);
        },
    });
    // Mutation for completing a plan
    const completePlanMutation = useMutation({
        mutationFn: (planId) => apiRequest({
            url: `/api/skill-stacker/${planId}/complete`,
            method: 'PUT',
        }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['/api/skill-stacker'] });
            setSelectedPlan(data);
            toast({
                title: 'Congratulations!',
                description: 'You completed this week\'s skill development plan.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: 'Failed to complete plan. Make sure all tasks are finished.',
                variant: 'destructive',
            });
            console.error('Error completing plan:', error);
        },
    });
    // Handle generating a new skill plan
    const handleGeneratePlan = () => {
        if (!selectedGoal) {
            toast({
                title: 'Error',
                description: 'Please select a goal first.',
                variant: 'destructive',
            });
            return;
        }

        setIsGenerating(true);
        generateMutation.mutate({
            goalId: selectedGoal,
            week: selectedWeek,
            currentSkillLevel: selectedSkillLevel,
        });
    };
    // Handle task completion
    const handleTaskStatusChange = (planId, taskId, currentStatus) => {
        const newStatus = currentStatus === 'complete' ? 'incomplete' : 'complete';
        completeTaskMutation.mutate({ planId, taskId, status: newStatus });
    };
    // Check if a plan can be completed (all tasks complete)
    const canCompletePlan = (plan) => {
        return plan.tasks.every(task => task.status === 'complete') && !plan.isCompleted;
    };
    // Calculate progress percentage
    const calculateProgress = (plan) => {
        if (!plan.tasks.length)
            return 0;
        const completedTasks = plan.tasks.filter(task => task.status === 'complete').length;
        return Math.round((completedTasks / plan.tasks.length) * 100);
    };
    // Handle viewing a plan's details
    const handleViewPlan = (plan) => {
        setSelectedPlan(plan);
    };
    // Handle completing a plan
    const handleCompletePlan = (planId) => {
        completePlanMutation.mutate(planId);
    };
    if (isLoadingPlans || isLoadingGoals) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[60vh]", children: _jsx(LoadingSpinner, { size: "lg" }) }));
    }
    return (_jsxs("div", { className: "container mx-auto py-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Skill Stacker" }), _jsx("p", { className: "text-muted-foreground", children: "Build skills progressively with AI-powered learning paths" })] }), _jsx("div", { className: "flex gap-2", children: _jsxs(Dialog, { open: isGenerateDialogOpen, onOpenChange: setIsGenerateDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "New Skill Plan"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create a New Skill Development Plan" }), _jsx(DialogDescription, { children: "Select a goal and skill level to generate a personalized learning path." })] }), _jsxs("div", { className: "grid gap-4 py-4", children: [_jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "goal", children: "Select a Goal" }), _jsxs(Select, { value: selectedGoal?.toString() || '', onValueChange: (value) => setSelectedGoal(parseInt(value)), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a goal" }) }), _jsx(SelectContent, { children: goals && goals.map((goal) => (_jsx(SelectItem, { value: goal.id.toString(), children: goal.title }, goal.id))) })] }), selectedGoal && goals && (_jsx("div", { className: "text-sm text-muted-foreground mt-1 bg-muted p-2 rounded-md", children: _jsx("p", { children: goals.find(g => g.id === selectedGoal)?.description || "No description available" }) }))] }), _jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "week", children: "Week Number" }), _jsx(Input, { id: "week", type: "number", min: "1", value: selectedWeek, onChange: (e) => setSelectedWeek(parseInt(e.target.value) || 1) })] }), _jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "skill-level", children: "Your Current Skill Level" }), _jsxs(Select, { value: selectedSkillLevel, onValueChange: setSelectedSkillLevel, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select your skill level" }) }), _jsx(SelectContent, { children: skillLevelOptions.map((option) => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value))) })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setIsGenerateDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleGeneratePlan, disabled: isGenerating || !selectedGoal, children: isGenerating ? (_jsxs(_Fragment, { children: [_jsx(LoadingSpinner, { className: "mr-2" }), "Generating..."] })) : (_jsxs(_Fragment, { children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Generate Plan"] })) })] })] })] }) })] }), _jsxs(Tabs, { defaultValue: "active", onValueChange: setCurrentTab, className: "w-full mb-6", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3 mb-4", children: [_jsx(TabsTrigger, { value: "active", children: "Active Plans" }), _jsx(TabsTrigger, { value: "completed", children: "Completed" }), _jsx(TabsTrigger, { value: "archived", children: "Archived" })] }), _jsx(TabsContent, { value: "active", className: "space-y-4", children: filteredPlans.length === 0 ? (_jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center pt-6 pb-6", children: [_jsx("p", { className: "mb-4 text-center text-muted-foreground", children: "No active skill development plans." }), _jsxs(Button, { variant: "outline", onClick: () => setIsGenerateDialogOpen(true), children: [_jsx(PlusCircle, { className: "h-4 w-4 mr-2" }), "Create Your First Plan"] })] }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: filteredPlans.map((plan) => (_jsxs(Card, { className: "overflow-hidden", children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx(CardTitle, { className: "text-xl", children: plan.title }), _jsx(Badge, { variant: plan.isCompleted ? "secondary" : "default", className: plan.isCompleted ? "bg-green-500 text-white hover:bg-green-600" : "", children: plan.status.charAt(0).toUpperCase() + plan.status.slice(1) })] }), _jsx(CardDescription, { className: "line-clamp-2", children: plan.description })] }), _jsxs(CardContent, { className: "pb-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1 text-muted-foreground" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: ["Week ", plan.week] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Medal, { className: "h-4 w-4 mr-1 text-amber-500" }), _jsx("span", { className: "text-sm", children: plan.streak > 0 ? `${plan.streak} week streak` : 'No streak' })] })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex justify-between text-sm mb-1", children: [_jsx("span", { children: "Progress" }), _jsxs("span", { children: [calculateProgress(plan), "%"] })] }), _jsx(Progress, { value: calculateProgress(plan), className: "h-2" })] }), _jsxs("div", { className: "space-y-2 mb-2", children: [plan.tasks.slice(0, 2).map((task) => (_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start", children: [task.status === 'complete' ? (_jsx(CheckCircle, { className: "h-4 w-4 mr-2 text-green-500 shrink-0 mt-1" })) : (_jsx(XCircle, { className: "h-4 w-4 mr-2 text-muted-foreground shrink-0 mt-1" })), _jsx("span", { className: "text-sm line-clamp-1", children: task.title })] }), _jsx(Badge, { variant: "outline", className: "shrink-0 ml-2", children: formatTaskType(task.type) })] }, task.id))), plan.tasks.length > 2 && (_jsxs("div", { className: "text-sm text-muted-foreground text-center pt-1", children: ["+", plan.tasks.length - 2, " more tasks"] }))] })] }), _jsxs(CardFooter, { className: "flex justify-between pt-4", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => handleViewPlan(plan), children: "View Details" }), canCompletePlan(plan) && (_jsx(Button, { size: "sm", onClick: () => handleCompletePlan(plan.id), children: "Complete Week" }))] })] }, plan.id))) })) }), _jsx(TabsContent, { value: "completed", children: filteredPlans.length === 0 ? (_jsx(Card, { children: _jsx(CardContent, { className: "flex justify-center pt-6 pb-6", children: _jsx("p", { className: "text-center text-muted-foreground", children: "No completed skill development plans yet." }) }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: filteredPlans.map((plan) => (_jsxs(Card, { className: "overflow-hidden", children: [_jsxs(CardHeader, { className: "pb-2", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx(CardTitle, { className: "text-xl", children: plan.title }), _jsx(Badge, { variant: "secondary", className: "bg-green-500 text-white hover:bg-green-600", children: "Completed" })] }), _jsx(CardDescription, { className: "line-clamp-2", children: plan.description })] }), _jsxs(CardContent, { className: "pb-0", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1 text-muted-foreground" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: ["Week ", plan.week] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { className: "h-4 w-4 mr-1 text-muted-foreground" }), _jsx("span", { className: "text-sm text-muted-foreground", children: plan.completedAt && format(new Date(plan.completedAt), 'MMM d, yyyy') })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx(BarChart, { className: "h-4 w-4 mr-2 text-muted-foreground" }), _jsxs("span", { className: "text-sm", children: [plan.tasks.length, " tasks completed"] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Medal, { className: "h-4 w-4 mr-2 text-amber-500" }), _jsx("span", { className: "text-sm", children: plan.streak > 0 ? `${plan.streak} week streak` : 'No streak' })] })] })] }), _jsx(CardFooter, { className: "pt-4", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleViewPlan(plan), className: "w-full", children: "View Details" }) })] }, plan.id))) })) }), _jsx(TabsContent, { value: "archived", children: filteredPlans.length === 0 ? (_jsx(Card, { children: _jsx(CardContent, { className: "flex justify-center pt-6 pb-6", children: _jsx("p", { className: "text-center text-muted-foreground", children: "No archived skill development plans." }) }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: filteredPlans.map((plan) => (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: plan.title }), _jsx(CardDescription, { children: plan.description })] }), _jsx(CardFooter, { children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleViewPlan(plan), className: "w-full", children: "View Details" }) })] }, plan.id))) })) })] }), selectedPlan && (_jsx(Dialog, { open: !!selectedPlan, onOpenChange: () => setSelectedPlan(null), children: _jsxs(DialogContent, { className: "sm:max-w-[900px] max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx(DialogTitle, { className: "text-2xl", children: selectedPlan.title }), _jsx(Badge, { variant: selectedPlan.isCompleted ? "secondary" : "default", className: selectedPlan.isCompleted ? "bg-green-500 text-white hover:bg-green-600" : "", children: selectedPlan.status.charAt(0).toUpperCase() + selectedPlan.status.slice(1) })] }), _jsx(DialogDescription, { children: selectedPlan.description })] }), _jsxs("div", { className: "flex flex-wrap gap-4 mb-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 mr-2 text-muted-foreground" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: ["Week ", selectedPlan.week] })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(Medal, { className: "h-4 w-4 mr-2 text-amber-500" }), _jsx("span", { className: "text-sm", children: selectedPlan.streak > 0 ? `${selectedPlan.streak} week streak` : 'No streak' })] }), _jsxs("div", { className: "flex items-center", children: [_jsx(BarChart, { className: "h-4 w-4 mr-2 text-muted-foreground" }), _jsxs("span", { className: "text-sm text-muted-foreground", children: ["Progress: ", calculateProgress(selectedPlan), "%"] })] }), selectedPlan.completedAt && (_jsxs("div", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "h-4 w-4 mr-2 text-green-500" }), _jsxs("span", { className: "text-sm", children: ["Completed on ", format(new Date(selectedPlan.completedAt), 'MMMM d, yyyy')] })] }))] }), _jsx(Separator, { className: "my-4" }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-medium mb-4", children: "Tasks" }), _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-[50px]", children: "Status" }), _jsx(TableHead, { children: "Task" }), _jsx(TableHead, { children: "Type" }), _jsx(TableHead, { className: "text-right", children: "Time" }), _jsx(TableHead, { className: "text-right", children: "Action" })] }) }), _jsx(TableBody, { children: selectedPlan.tasks.map((task) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: task.status === 'complete' ? (_jsx(CheckCircle, { className: "h-5 w-5 text-green-500" })) : (_jsx(XCircle, { className: "h-5 w-5 text-gray-400" })) }), _jsx(TableCell, { children: _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: task.title }), _jsx("div", { className: "text-sm text-muted-foreground line-clamp-2", children: task.description })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center", children: [getTaskIcon(task.type), formatTaskType(task.type)] }) }), _jsxs(TableCell, { className: "text-right", children: [task.estimatedHours, "h"] }), _jsx(TableCell, { className: "text-right", children: !selectedPlan.isCompleted && (_jsx(Button, { variant: task.status === 'complete' ? "outline" : "default", size: "sm", onClick: () => handleTaskStatusChange(selectedPlan.id, task.id, task.status), children: task.status === 'complete' ? 'Mark Incomplete' : 'Complete' })) })] }, task.id))) })] })] }), _jsx(Separator, { className: "my-4" }), _jsx("h3", { className: "text-lg font-medium mb-2", children: "Resources" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-4", children: selectedPlan.tasks.map((task) => (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center", children: [getTaskIcon(task.type), _jsx(CardTitle, { className: "text-base", children: task.title })] }) }), _jsx(CardContent, { children: _jsx("ul", { className: "list-disc pl-5 space-y-1", children: task.resources.map((resource, index) => (_jsx("li", { className: "text-sm", children: resource }, index))) }) })] }, task.id))) }), _jsx(DialogFooter, { children: canCompletePlan(selectedPlan) && (_jsx(Button, { onClick: () => handleCompletePlan(selectedPlan.id), children: "Complete Week" })) })] }) }))] }));
}
