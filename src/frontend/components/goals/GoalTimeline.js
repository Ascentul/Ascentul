import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from 'date-fns';
import { Clock, Calendar, Target, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// Helper function to get goal status color
const getStatusColor = (goal) => {
    if (goal.completed) {
        return 'bg-green-500 border-green-600';
    }
    if (goal.dueDate && new Date(goal.dueDate) < new Date()) {
        return 'bg-amber-500 border-amber-600'; // Past due date
    }
    return 'bg-blue-500 border-blue-600'; // Active
};
// Helper function to get goal status icon
const getStatusIcon = (goal) => {
    if (goal.completed) {
        return _jsx(CheckCircle, { className: "h-4 w-4 text-green-500" });
    }
    if (goal.dueDate && new Date(goal.dueDate) < new Date()) {
        return _jsx(AlertTriangle, { className: "h-4 w-4 text-amber-500" });
    }
    return _jsx(Clock, { className: "h-4 w-4 text-blue-500" });
};
// Helper to format time periods
const formatTimePeriod = (date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays < 1)
        return 'Today';
    if (diffInDays === 1)
        return 'Yesterday';
    if (diffInDays < 7)
        return `${diffInDays} days ago`;
    if (diffInDays < 30)
        return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365)
        return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
};
const GoalTimeline = ({ goals, className }) => {
    // Sort goals by completedAt (if completed) or createdAt
    const sortedGoals = [...goals].sort((a, b) => {
        const dateA = a.completedAt || a.createdAt;
        const dateB = b.completedAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    return (_jsx("div", { className: cn("py-4", className), children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-1/2 top-0 h-full w-px bg-gray-300 transform -translate-x-1/2" }), _jsx("div", { className: "space-y-12", children: sortedGoals.map((goal, index) => (_jsxs("div", { className: cn("relative flex items-center", index % 2 === 0 ? "justify-end" : "justify-start", "pb-8"), children: [_jsxs("div", { className: cn("w-5/12", "bg-background p-4 rounded-lg border shadow-sm", index % 2 === 0 ? "mr-6 text-right" : "ml-6"), children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: cn("flex items-center", index % 2 === 0 ? "justify-end" : "justify-start"), children: [index % 2 === 0 && (_jsx("h4", { className: "font-semibold text-md mr-2", children: goal.title })), _jsx("div", { className: "flex items-center justify-center h-6 w-6 rounded-full bg-muted", children: _jsx(Target, { className: "h-4 w-4" }) }), index % 2 !== 0 && (_jsx("h4", { className: "font-semibold text-md ml-2", children: goal.title }))] }), _jsx("div", { children: getStatusIcon(goal) })] }), _jsx("div", { className: "text-sm text-muted-foreground", children: goal.completedAt ? (_jsxs("div", { className: "flex items-center justify-start gap-1 mb-1", children: [_jsx(Calendar, { className: "h-3 w-3" }), _jsxs("span", { children: ["Completed: ", format(new Date(goal.completedAt), 'MMM d, yyyy')] })] })) : goal.dueDate ? (_jsxs("div", { className: "flex items-center justify-start gap-1 mb-1", children: [_jsx(Calendar, { className: "h-3 w-3" }), _jsxs("span", { children: ["Due: ", format(new Date(goal.dueDate), 'MMM d, yyyy')] })] })) : (_jsxs("div", { className: "flex items-center justify-start gap-1 mb-1", children: [_jsx(Calendar, { className: "h-3 w-3" }), _jsxs("span", { children: ["Created: ", format(new Date(goal.createdAt), 'MMM d, yyyy')] })] })) })] }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { children: _jsx("div", { className: cn("absolute left-1/2 transform -translate-x-1/2", "h-4 w-4 rounded-full border-2", getStatusColor(goal)) }) }), _jsx(TooltipContent, { children: _jsxs("div", { className: "text-xs", children: [goal.completedAt ? (_jsxs("p", { children: ["Completed ", formatTimePeriod(new Date(goal.completedAt))] })) : goal.dueDate ? (_jsxs("p", { children: ["Due ", format(new Date(goal.dueDate), 'MMM d, yyyy')] })) : (_jsxs("p", { children: ["Created ", formatTimePeriod(new Date(goal.createdAt))] })), _jsxs("p", { children: ["Status: ", goal.status] }), _jsxs("p", { children: ["Progress: ", goal.progress, "%"] })] }) })] }) })] }, goal.id))) })] }) }));
};
export default GoalTimeline;
