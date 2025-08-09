import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Target, Filter, ArrowUpDown, CheckCircle, RefreshCw, LayoutList, GanttChartSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoalCard from '@/components/GoalCard';
import GoalForm from '@/components/GoalForm';
import GoalTimeline from '@/components/goals/GoalTimeline';
import GoalTemplates, { goalTemplates } from '@/components/goals/GoalTemplates';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
export default function Goals() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(null);
    const [sortOption, setSortOption] = useState('dueDate-asc');
    const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [hiddenGoalIds, setHiddenGoalIds] = useState([]);
    // Add state for view mode (list or timeline)
    const [viewMode, setViewMode] = useState('list');
    // Add state for selected template
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Fetch goals
    const { data: goals = [], isLoading } = useQuery({
        queryKey: ['/api/goals'],
        placeholderData: [],
    });
    const deleteGoalMutation = useMutation({
        mutationFn: async (goalId) => {
            return apiRequest('DELETE', `/api/goals/${goalId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
            toast({
                title: 'Goal Deleted',
                description: 'Your goal has been deleted successfully',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to delete goal: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    const handleEditGoal = (goalId) => {
        const goal = goals.find((g) => g.id === goalId);
        if (goal) {
            setSelectedGoal(goal);
            setIsAddGoalOpen(true);
        }
    };
    const handleDeleteGoal = (goalId) => {
        if (confirm('Are you sure you want to delete this goal?')) {
            deleteGoalMutation.mutate(goalId);
        }
    };
    const handleReopenGoal = (goalId) => {
        // Get the goal from the cache
        const goal = goals.find((g) => g.id === goalId);
        if (goal) {
            // Update the goal status via the API
            apiRequest('PUT', `/api/goals/${goalId}`, {
                ...goal,
                status: 'active',
                completed: false,
                completedAt: null
            })
                .then(() => {
                // Refresh goals data and user statistics
                queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
                queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
                toast({
                    title: "Goal Reopened",
                    description: "The goal has been moved back to active goals.",
                });
            })
                .catch((error) => {
                console.error('Error reopening goal:', error);
                toast({
                    title: "Error",
                    description: "Failed to reopen goal. Please try again.",
                    variant: "destructive",
                });
            });
        }
    };
    // Handle when a goal has been completed
    const handleGoalComplete = (goalId) => {
        // Find the goal in the current goals list
        const goal = goals.find((g) => g.id === goalId);
        if (goal) {
            // Immediately update the goal status to completed via the API
            apiRequest('PUT', `/api/goals/${goalId}`, {
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
                    title: "Goal Saved as Completed",
                    description: "Your goal has been moved to the completed section.",
                    variant: "success",
                });
            })
                .catch((error) => {
                console.error('Error updating goal:', error);
                toast({
                    title: "Error",
                    description: "Failed to save completed goal. Please try again.",
                    variant: "destructive",
                });
            });
        }
    };
    const sortedAndFilteredGoals = () => {
        if (!goals || !Array.isArray(goals))
            return [];
        let filteredGoals = [...goals];
        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredGoals = filteredGoals.filter((goal) => goal.title.toLowerCase().includes(query) ||
                (goal.description && goal.description.toLowerCase().includes(query)));
        }
        // Apply status filter
        if (statusFilter) {
            filteredGoals = filteredGoals.filter((goal) => goal.status === statusFilter);
        }
        // Apply sorting
        const [sortField, sortDirection] = sortOption.split('-');
        filteredGoals.sort((a, b) => {
            if (sortField === 'dueDate') {
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            }
            else if (sortField === 'progress') {
                return sortDirection === 'asc' ? a.progress - b.progress : b.progress - a.progress;
            }
            else if (sortField === 'title') {
                return sortDirection === 'asc'
                    ? a.title.localeCompare(b.title)
                    : b.title.localeCompare(a.title);
            }
            return 0;
        });
        return filteredGoals;
    };
    // Animation variants - keeping them subtle
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } }
    };
    const subtleUp = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };
    const listContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                when: "beforeChildren"
            }
        }
    };
    const listItem = {
        hidden: { opacity: 0, y: 5 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
    };
    return (_jsxs(motion.div, { className: "container mx-auto", initial: "hidden", animate: "visible", variants: fadeIn, children: [_jsxs(motion.div, { className: "flex flex-col md:flex-row md:items-center justify-between mb-6", variants: subtleUp, children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold mb-2 text-[#0C29AB]", children: "Career Goals" }), _jsx("p", { className: "text-neutral-500", children: "Track and manage your career goals" })] }), _jsxs(Button, { className: "mt-4 md:mt-0", onClick: () => {
                            setSelectedGoal(null);
                            setIsAddGoalOpen(true);
                        }, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "New Goal"] })] }), _jsx(motion.div, { variants: subtleUp, children: _jsx(Card, { className: "mb-6", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Input, { placeholder: "Search goals...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10" }), _jsx("div", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "11", cy: "11", r: "8" }), _jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })] }) })] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", className: "w-full justify-between rounded-full px-4 py-1 bg-gray-100 hover:bg-white hover:ring-1 hover:ring-gray-300 transition-all", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Filter, { className: "mr-2 h-4 w-4" }), statusFilter || 'Filter by Status'] }) }) }), _jsxs(DropdownMenuContent, { children: [_jsx(DropdownMenuItem, { onClick: () => setStatusFilter(null), children: "All Statuses" }), _jsx(DropdownMenuItem, { onClick: () => setStatusFilter('in_progress'), children: "In Progress" }), _jsx(DropdownMenuItem, { onClick: () => setStatusFilter('completed'), children: "Completed" })] })] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", className: "w-full justify-between rounded-full px-4 py-1 bg-gray-100 hover:bg-white hover:ring-1 hover:ring-gray-300 transition-all", children: _jsxs("div", { className: "flex items-center", children: [_jsx(ArrowUpDown, { className: "mr-2 h-4 w-4" }), "Sort by"] }) }) }), _jsxs(DropdownMenuContent, { children: [_jsx(DropdownMenuItem, { onClick: () => setSortOption('dueDate-asc'), children: "Due Date (Earliest First)" }), _jsx(DropdownMenuItem, { onClick: () => setSortOption('dueDate-desc'), children: "Due Date (Latest First)" }), _jsx(DropdownMenuItem, { onClick: () => setSortOption('progress-desc'), children: "Progress (Highest First)" }), _jsx(DropdownMenuItem, { onClick: () => setSortOption('progress-asc'), children: "Progress (Lowest First)" }), _jsx(DropdownMenuItem, { onClick: () => setSortOption('title-asc'), children: "Title (A-Z)" })] })] })] }) }) }) }), _jsx(motion.div, { variants: subtleUp, className: "mb-6", children: _jsx(GoalTemplates, { onSelectTemplate: (templateId) => {
                        // Find the template data based on templateId
                        setSelectedTemplate(templateId);
                        // Open the goal creation modal
                        setIsAddGoalOpen(true);
                    } }) }), _jsxs(motion.div, { className: "mb-10", variants: subtleUp, children: [_jsx("div", { className: "flex justify-between items-center mb-4", children: _jsx("h2", { className: "text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent", children: "Active Goals" }) }), isLoading ? (_jsx("div", { className: "flex justify-center items-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) })) : goals && Array.isArray(goals) && goals.filter((g) => g.status !== 'completed').length > 0 ? (_jsx(motion.div, { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", variants: listContainer, children: sortedAndFilteredGoals()
                            .filter(goal => goal.status !== 'completed')
                            .map((goal) => (_jsx(motion.div, { className: "relative", variants: listItem, children: _jsx(GoalCard, { id: goal.id, title: goal.title, description: goal.description || '', progress: goal.progress, status: goal.status, dueDate: goal.dueDate ? new Date(goal.dueDate) : undefined, checklist: goal.checklist || [], onEdit: handleEditGoal, onComplete: handleGoalComplete }) }, goal.id))) })) : (_jsxs(motion.div, { className: "text-center py-8 bg-white shadow-md shadow-gray-200 rounded-xl", variants: subtleUp, children: [_jsx("div", { className: "bg-white shadow-sm rounded-full p-3 inline-block mb-4", children: _jsx(Target, { className: "h-12 w-12 text-blue-500" }) }), _jsx("h3", { className: "text-xl font-medium mb-2", children: "No Active Goals" }), _jsx("p", { className: "text-neutral-500 mb-6 max-w-md mx-auto", children: "Start by creating your first career goal to track your progress toward professional success" }), _jsxs(Button, { onClick: () => {
                                    setSelectedGoal(null);
                                    setIsAddGoalOpen(true);
                                }, className: "px-6 py-2 shadow-sm hover:shadow transition-all", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Create First Goal"] })] }))] }), _jsxs(motion.div, { variants: subtleUp, children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("h2", { className: "text-lg font-semibold flex items-center", children: [_jsx(CheckCircle, { className: "h-5 w-5 mr-2 text-green-500" }), _jsx("span", { className: "bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent", children: "Completed Goals" })] }), _jsx(Tabs, { defaultValue: "list", className: "w-[200px]", children: _jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "list", onClick: () => setViewMode('list'), children: [_jsx(LayoutList, { className: "h-4 w-4 mr-1" }), "List"] }), _jsxs(TabsTrigger, { value: "timeline", onClick: () => setViewMode('timeline'), children: [_jsx(GanttChartSquare, { className: "h-4 w-4 mr-1" }), "Timeline"] })] }) })] }), isLoading ? (_jsx("div", { className: "flex justify-center items-center py-6", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500" }) })) : goals && Array.isArray(goals) && goals.filter((g) => g.status === 'completed' && !hiddenGoalIds.includes(g.id)).length > 0 ? (_jsxs(_Fragment, { children: [viewMode === 'timeline' && (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsx(GoalTimeline, { goals: goals.filter((goal) => goal.status === 'completed' && !hiddenGoalIds.includes(goal.id)) }) }) })), viewMode === 'list' && (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsx("div", { className: "space-y-4", children: _jsx(AnimatePresence, { mode: "sync", children: goals
                                                .filter((goal) => goal.status === 'completed' && !hiddenGoalIds.includes(goal.id))
                                                .map((goal) => (_jsx(motion.div, { id: `goal-${goal.id}`, initial: { opacity: 1 }, animate: { opacity: 1 }, className: "mb-4", children: _jsxs("div", { className: "bg-gradient-to-br from-white to-gray-50 rounded-xl border shadow-sm p-4 relative hover:shadow-md transition-all duration-200", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("h3", { className: "font-medium text-sm line-through text-neutral-500", children: goal.title }), _jsx("span", { className: "ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", children: "Completed" })] }), goal.description && (_jsx("p", { className: "text-xs text-neutral-500 mt-1 line-through", children: goal.description }))] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "text-xs h-8 rounded-full hover:bg-gray-100", onClick: () => handleReopenGoal(goal.id), children: [_jsx(RefreshCw, { className: "h-3 w-3 mr-1" }), "Reopen"] })] }), goal.completedAt && (_jsxs("p", { className: "text-xs text-neutral-400 mt-2", children: ["Completed ", new Date(goal.completedAt).toLocaleDateString()] }))] }) }, goal.id))) }) }) }) }))] })) : (_jsx(Card, { children: _jsx(CardContent, { className: "p-6", children: _jsxs("div", { className: "text-center py-6", children: [_jsx(CheckCircle, { className: "mx-auto h-16 w-16 text-gray-300 mb-3" }), _jsx("p", { className: "text-sm text-gray-500", children: "\uD83C\uDFAF You're on your way! Complete a goal to start building momentum." })] }) }) }))] }), _jsx(Dialog, { open: isAddGoalOpen, onOpenChange: (isOpen) => {
                    setIsAddGoalOpen(isOpen);
                    // Reset template selection when dialog is closed
                    if (!isOpen) {
                        setSelectedTemplate(null);
                    }
                }, children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: selectedGoal ? 'Edit Goal' : (selectedTemplate ? 'Create Goal from Template' : 'Create New Goal') }), selectedTemplate && (_jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: ["Using ", goalTemplates.find(t => t.id === selectedTemplate)?.title, " template"] }))] }), _jsx(GoalForm, { goal: selectedGoal, templateId: selectedTemplate, onSuccess: () => {
                                setIsAddGoalOpen(false);
                                setSelectedTemplate(null);
                            } })] }) })] }));
}
