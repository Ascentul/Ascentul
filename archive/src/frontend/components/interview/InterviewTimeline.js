import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from 'date-fns';
import { Check, Clock, Calendar, X, AlertCircle, CheckCircle, PhoneCall, Users, Video, BookOpen, Award, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// Helper function to get the icon for a stage type
const getStageIcon = (type) => {
    switch (type.toLowerCase()) {
        case 'phone_screen':
            return _jsx(PhoneCall, { className: "h-4 w-4" });
        case 'technical':
            return _jsx(BookOpen, { className: "h-4 w-4" });
        case 'behavioral':
            return _jsx(Users, { className: "h-4 w-4" });
        case 'onsite':
            return _jsx(Briefcase, { className: "h-4 w-4" });
        case 'final':
            return _jsx(Award, { className: "h-4 w-4" });
        case 'video':
            return _jsx(Video, { className: "h-4 w-4" });
        default:
            return _jsx(Calendar, { className: "h-4 w-4" });
    }
};
// Helper function to get status color
const getStatusColor = (stage) => {
    if (stage.completedDate) {
        return stage.outcome === 'passed'
            ? 'bg-green-500 border-green-600'
            : stage.outcome === 'failed'
                ? 'bg-red-500 border-red-600'
                : 'bg-blue-500 border-blue-600';
    }
    if (stage.scheduledDate && new Date(stage.scheduledDate) < new Date()) {
        return 'bg-amber-500 border-amber-600'; // Past due date
    }
    return 'bg-gray-500 border-gray-600'; // Upcoming
};
// Helper function to get status icon
const getStatusIcon = (stage) => {
    if (stage.completedDate) {
        return stage.outcome === 'passed'
            ? _jsx(CheckCircle, { className: "h-4 w-4 text-green-500" })
            : stage.outcome === 'failed'
                ? _jsx(X, { className: "h-4 w-4 text-red-500" })
                : _jsx(Check, { className: "h-4 w-4 text-blue-500" });
    }
    if (stage.scheduledDate && new Date(stage.scheduledDate) < new Date()) {
        return _jsx(AlertCircle, { className: "h-4 w-4 text-amber-500" });
    }
    return _jsx(Clock, { className: "h-4 w-4 text-gray-500" });
};
// Helper function to get stage label
const getStageLabel = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};
const InterviewTimeline = ({ stages, className }) => {
    // Sort stages by scheduledDate (if available)
    const sortedStages = [...stages].sort((a, b) => {
        if (!a.scheduledDate)
            return 1;
        if (!b.scheduledDate)
            return -1;
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });
    return (_jsx("div", { className: cn("py-4", className), children: _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute left-1/2 top-0 h-full w-px bg-gray-300 transform -translate-x-1/2" }), _jsx("div", { className: "space-y-12", children: sortedStages.map((stage, index) => (_jsxs("div", { className: cn("relative flex items-center", index % 2 === 0 ? "justify-end" : "justify-start", "pb-8"), children: [_jsxs("div", { className: cn("w-5/12", "bg-background p-4 rounded-lg border shadow-sm", index % 2 === 0 ? "mr-6 text-right" : "ml-6"), children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: cn("flex items-center", index % 2 === 0 ? "justify-end" : "justify-start"), children: [index % 2 === 0 && (_jsx("h4", { className: "font-semibold text-md mr-2", children: getStageLabel(stage.type) })), _jsx("div", { className: "flex items-center justify-center h-6 w-6 rounded-full bg-muted", children: getStageIcon(stage.type) }), index % 2 !== 0 && (_jsx("h4", { className: "font-semibold text-md ml-2", children: getStageLabel(stage.type) }))] }), _jsx("div", { children: getStatusIcon(stage) })] }), _jsxs("div", { className: "text-sm text-muted-foreground", children: [stage.scheduledDate && (_jsxs("div", { className: "flex items-center justify-start gap-1 mb-1", children: [_jsx(Calendar, { className: "h-3 w-3" }), _jsx("span", { children: format(new Date(stage.scheduledDate), 'MMM d, yyyy') })] })), stage.location && (_jsx("div", { className: "text-xs mb-1", children: stage.location })), stage.notes && (_jsx("div", { className: "text-xs italic", children: stage.notes.length > 60 ? `${stage.notes.substring(0, 60)}...` : stage.notes }))] })] }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { children: _jsx("div", { className: cn("absolute left-1/2 transform -translate-x-1/2", "h-4 w-4 rounded-full border-2", getStatusColor(stage)) }) }), _jsx(TooltipContent, { children: _jsxs("div", { className: "text-xs", children: [stage.completedDate ? (_jsxs("p", { children: ["Completed: ", format(new Date(stage.completedDate), 'MMM d, yyyy')] })) : stage.scheduledDate ? (_jsxs("p", { children: ["Scheduled: ", format(new Date(stage.scheduledDate), 'MMM d, yyyy')] })) : (_jsx("p", { children: "Not scheduled" })), stage.outcome && _jsxs("p", { children: ["Outcome: ", stage.outcome] })] }) })] }) })] }, stage.id))) })] }) }));
};
export default InterviewTimeline;
