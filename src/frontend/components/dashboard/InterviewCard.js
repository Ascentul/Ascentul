import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
export default function InterviewCard({ stage, onEdit }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isExpanded, setIsExpanded] = useState(false);
    // Format the date
    const formattedDate = stage.scheduledDate
        ? format(new Date(stage.scheduledDate), 'MMM d, yyyy h:mm a')
        : 'Not scheduled';
    // Calculate time from now to interview
    const timeFromNow = stage.scheduledDate
        ? formatDistanceToNow(new Date(stage.scheduledDate), { addSuffix: true })
        : '';
    // Get application info
    const application = stage.application;
    // Handle editing the interview
    const handleEdit = () => {
        if (onEdit && stage.applicationId) {
            onEdit(stage.id, stage.applicationId);
        }
        else {
            toast({
                title: "Cannot edit interview",
                description: "Application ID is missing",
                variant: "destructive",
            });
        }
    };
    return (_jsx(Card, { className: "w-full mb-4 overflow-hidden transition-all duration-300 hover:shadow-md", children: _jsxs(CardContent, { className: "p-4", children: [_jsx("div", { className: "flex justify-between items-start mb-2", children: _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-medium text-base truncate", children: application?.company || application?.companyName || 'Company' }), _jsx(Badge, { variant: "outline", className: "text-xs font-normal", children: stage.type })] }), _jsx("p", { className: "text-sm text-muted-foreground truncate", children: application?.position || application?.jobTitle || 'Position' })] }) }), _jsxs("div", { className: "space-y-2 mt-3", children: [stage.scheduledDate && (_jsxs("div", { className: "flex items-center text-sm", children: [_jsx(Calendar, { className: "h-4 w-4 mr-2 text-muted-foreground" }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { children: formattedDate }), _jsx("span", { className: "text-xs text-muted-foreground", children: timeFromNow })] })] })), stage.location && (_jsxs("div", { className: "flex items-center text-sm", children: [_jsx(MapPin, { className: "h-4 w-4 mr-2 text-muted-foreground" }), _jsx("span", { children: stage.location })] })), stage.interviewers && stage.interviewers.length > 0 && (_jsxs("div", { className: "flex items-center text-sm", children: [_jsx(Users, { className: "h-4 w-4 mr-2 text-muted-foreground" }), _jsxs("span", { children: [stage.interviewers.slice(0, 2).join(', '), stage.interviewers.length > 2 && ` +${stage.interviewers.length - 2} more`] })] })), stage.notes && (_jsx("div", { className: `mt-3 text-sm ${isExpanded ? '' : 'line-clamp-2'}`, children: _jsx("p", { children: stage.notes }) })), stage.notes && stage.notes.length > 100 && (_jsx(Button, { variant: "ghost", size: "sm", className: "text-xs mt-1 h-6 px-2", onClick: () => setIsExpanded(!isExpanded), children: isExpanded ? 'Show less' : 'Show more' }))] })] }) }));
}
