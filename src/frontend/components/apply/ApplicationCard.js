import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ExternalLink, Calendar, MapPin, Edit } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { EditApplicationForm } from './EditApplicationForm';
export function ApplicationCard({ application, isSelected = false, onClick, className, onEditSuccess }) {
    const [showEditForm, setShowEditForm] = useState(false);
    // Extract job details with multiple property name support for compatibility
    const jobTitle = application.jobTitle || application.title || application.position || "Untitled Position";
    const companyName = application.companyName || application.company || "Company Not Specified";
    const jobLocation = application.jobLocation || application.location || "Remote";
    const viewMode = application.jobId ? 'compact' : 'full';
    // Calculate time ago for application date
    const timeAgo = application.applicationDate
        ? formatDistanceToNow(new Date(application.applicationDate), { addSuffix: true })
        : formatDistanceToNow(new Date(application.createdAt), { addSuffix: true });
    // Prevent card click from triggering when edit button is clicked
    const handleEditClick = (e) => {
        e.stopPropagation();
        setShowEditForm(true);
    };
    // Handle click on the entire card
    const handleCardClick = () => {

        if (onClick)
            onClick();
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { className: cn("transition-colors cursor-pointer hover:border-primary/50", isSelected && "border-primary/80 shadow-sm bg-primary/5", className), onClick: handleCardClick, children: [_jsx(CardContent, { className: cn("p-3 sm:p-4 pb-2", className), children: _jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-base text-foreground", children: jobTitle }), _jsx("p", { className: "text-muted-foreground text-sm", children: companyName })] }), _jsx(ApplicationStatusBadge, { status: application.status && typeof application.status === 'string'
                                                ? application.status.charAt(0).toUpperCase() + application.status.slice(1)
                                                : 'In Progress', size: "sm" })] }), _jsxs("div", { className: "flex flex-col gap-1.5", children: [jobLocation && (_jsxs("div", { className: "flex items-center text-xs text-muted-foreground", children: [_jsx(MapPin, { className: "h-3 w-3 mr-1.5" }), _jsx("span", { children: jobLocation })] })), _jsxs("div", { className: "flex items-center text-xs text-muted-foreground", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1.5" }), _jsx("span", { children: timeAgo })] }), application.jobLink && (_jsxs("div", { className: "flex items-center text-xs", children: [_jsx(ExternalLink, { className: "h-3 w-3 mr-1.5 text-blue-500" }), _jsx("a", { href: application.jobLink, target: "_blank", rel: "noopener noreferrer", className: "text-blue-500 hover:underline", onClick: (e) => e.stopPropagation(), children: "View Original Job Posting" })] }))] }), application.notes && viewMode === 'full' && (_jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: _jsx("p", { className: "line-clamp-2", children: application.notes }) }))] }) }), _jsx(CardFooter, { className: "p-2 pt-0 flex justify-end", children: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-8 px-2 text-xs", onClick: handleEditClick, children: [_jsx(Edit, { className: "h-3.5 w-3.5 mr-1.5" }), "Edit"] }) })] }), showEditForm && (_jsx(EditApplicationForm, { isOpen: showEditForm, onClose: () => setShowEditForm(false), application: application, onSuccess: () => {
                    if (onEditSuccess) {
                        onEditSuccess();
                    }
                } }))] }));
}
