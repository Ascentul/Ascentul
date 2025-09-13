import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PenSquare, Clock, CalendarClock, ThumbsUp, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
// Configuration for styling and icons based on status
const statusConfig = {
    'Not Started': {
        color: 'bg-slate-100 text-slate-800 border-slate-200',
        icon: _jsx(PenSquare, { className: "h-3 w-3 mr-1" }),
    },
    'In Progress': {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: _jsx(PenSquare, { className: "h-3 w-3 mr-1" }),
    },
    'Applied': {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: _jsx(Clock, { className: "h-3 w-3 mr-1" }),
    },
    'Interviewing': {
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: _jsx(CalendarClock, { className: "h-3 w-3 mr-1" }),
    },
    'Offer': {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: _jsx(ThumbsUp, { className: "h-3 w-3 mr-1" }),
    },
    'Rejected': {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: _jsx(X, { className: "h-3 w-3 mr-1" }),
    },
    'default': {
        color: 'bg-slate-100 text-slate-800 border-slate-200',
        icon: _jsx(PenSquare, { className: "h-3 w-3 mr-1" }),
    },
};
export function ApplicationStatusBadge({ status, size = 'default', className, showIcon = true }) {
    // Get configuration for the status or use default if not found
    const config = statusConfig[status] || statusConfig.default;
    return (_jsxs(Badge, { variant: "outline", className: cn(config.color, size === 'sm' ? 'text-xs py-0 px-1.5' : '', "flex items-center", className), children: [showIcon && config.icon, _jsx("span", { children: config.label || status })] }));
}
