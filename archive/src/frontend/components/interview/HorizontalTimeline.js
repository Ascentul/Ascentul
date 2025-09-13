import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef } from 'react';
import { format, differenceInDays, isAfter, isBefore, startOfToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, User, Paperclip, Check, X, Clock, HourglassIcon, ExternalLink, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { InterviewProcessStatusBadge } from './InterviewProcessStatusBadge';
// Get stage status based on properties
const getStageStatus = (stage) => {
    const today = new Date();
    if (stage.outcome === 'passed')
        return 'passed';
    if (stage.outcome === 'not_selected')
        return 'failed';
    if (stage.scheduledDate) {
        const stageDate = new Date(stage.scheduledDate || 0);
        if (isAfter(stageDate, today))
            return 'upcoming';
        if (isBefore(stageDate, today))
            return 'awaiting';
    }
    return 'upcoming';
};
// This renders each stage node in the timeline
const StageNode = ({ stage, onClick, isNext = false, isOverdue = false }) => {
    const stageStatus = getStageStatus(stage);
    // Determine icon based on status
    let StatusIcon = Clock;
    let statusClass = 'text-yellow-500 bg-yellow-100';
    if (stageStatus === 'passed') {
        StatusIcon = Check;
        statusClass = 'text-green-600 bg-green-100';
    }
    else if (stageStatus === 'failed') {
        StatusIcon = X;
        statusClass = 'text-red-600 bg-red-100';
    }
    else if (stageStatus === 'upcoming') {
        StatusIcon = Clock;
        statusClass = 'text-blue-600 bg-blue-100';
    }
    else if (stageStatus === 'awaiting') {
        StatusIcon = HourglassIcon;
        statusClass = 'text-amber-600 bg-amber-100';
    }
    // Calculate border style for next or overdue nodes
    const nodeBorderClass = isNext
        ? 'border-primary border-2'
        : isOverdue
            ? 'border-destructive border-2'
            : 'border-border';
    return (_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs(motion.div, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.98 }, onClick: onClick, className: cn("group cursor-pointer flex flex-col items-center min-w-[100px] max-w-[120px] bg-card border rounded-md p-2 shadow-sm hover:shadow-md transition-all", nodeBorderClass), children: [_jsx("div", { className: cn("w-8 h-8 rounded-full flex items-center justify-center mb-1", statusClass), children: _jsx(StatusIcon, { className: "h-4 w-4" }) }), _jsx("span", { className: "text-xs font-medium text-center line-clamp-2", children: stage.type }), stage.scheduledDate && (_jsx("span", { className: "text-[10px] text-muted-foreground mt-1", children: format(new Date(stage.scheduledDate), 'MMM d, yyyy') })), _jsxs("div", { className: "flex mt-1 gap-1", children: [stage.location && (_jsx("div", { className: "text-muted-foreground", children: _jsx(ExternalLink, { className: "h-3 w-3" }) })), stage.interviewers && stage.interviewers.length > 0 && (_jsx("div", { className: "text-muted-foreground", children: _jsx(User, { className: "h-3 w-3" }) })), stage.notes && (_jsx("div", { className: "text-muted-foreground", children: _jsx(Paperclip, { className: "h-3 w-3" }) }))] })] }) }), _jsx(TooltipContent, { side: "top", align: "center", className: "max-w-xs", children: _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "font-medium", children: stage.type }), stage.scheduledDate && (_jsxs("div", { className: "flex items-center text-xs", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1 text-muted-foreground" }), format(new Date(stage.scheduledDate), 'MMMM d, yyyy')] })), stage.location && (_jsxs("div", { className: "text-xs", children: ["Location: ", stage.location] })), stage.interviewers && stage.interviewers.length > 0 && (_jsxs("div", { className: "text-xs", children: ["Interviewers: ", stage.interviewers.join(', ')] })), stage.notes && (_jsxs("div", { className: "text-xs", children: [_jsx("div", { className: "font-medium", children: "Notes:" }), _jsx("p", { className: "text-muted-foreground", children: stage.notes })] })), _jsx("div", { className: "text-xs italic text-muted-foreground", children: "Click to view or edit details" })] }) })] }) }));
};
// Main horizontal timeline component
export const HorizontalTimeline = ({ processes, stages, onStageClick, onEditProcess, className }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(undefined);
    const [stageFilter, setStageFilter] = useState(undefined);
    const [expandedProcessIds, setExpandedProcessIds] = useState([]);
    const scrollContainerRefs = useRef({});
    // Filter processes
    const filteredProcesses = processes.filter(process => {
        const matchesSearch = !searchQuery ||
            process.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            process.position.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || process.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    // Toggle expanded state for a process
    const toggleProcessExpanded = (processId) => {
        if (expandedProcessIds.includes(processId)) {
            setExpandedProcessIds(expandedProcessIds.filter(id => id !== processId));
        }
        else {
            setExpandedProcessIds([...expandedProcessIds, processId]);
        }
    };
    // Check if a process is expanded
    const isProcessExpanded = (processId) => {
        return expandedProcessIds.includes(processId) || expandedProcessIds.length === 0;
    };
    // Scroll timeline horizontally
    const scrollTimeline = (processId, direction) => {
        const container = scrollContainerRefs.current[processId];
        if (container) {
            container.scrollBy({
                left: direction === 'left' ? -200 : 200,
                behavior: 'smooth'
            });
        }
    };
    return (_jsxs("div", { className: cn("w-full flex flex-col gap-4", className), children: [_jsxs("div", { className: "sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b pb-4 flex flex-col lg:flex-row gap-2 items-center", children: [_jsxs("div", { className: "relative w-full lg:w-64 flex-shrink-0", children: [_jsx(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { type: "text", placeholder: "Search company or position...", className: "w-full pl-8", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), _jsxs("div", { className: "flex items-center gap-2 w-full lg:w-auto flex-wrap", children: [_jsxs(Select, { value: statusFilter || 'all', onValueChange: (value) => setStatusFilter(value === 'all' ? undefined : value), children: [_jsx(SelectTrigger, { className: "w-full lg:w-48", children: _jsx(SelectValue, { placeholder: "Filter by status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All statuses" }), _jsx(SelectItem, { value: "Application Submitted", children: "Application Submitted" }), _jsx(SelectItem, { value: "Phone Screen", children: "Phone Screen" }), _jsx(SelectItem, { value: "Technical Interview", children: "Technical Interview" }), _jsx(SelectItem, { value: "Onsite Interview", children: "Onsite Interview" }), _jsx(SelectItem, { value: "Final Round", children: "Final Round" }), _jsx(SelectItem, { value: "Offer Received", children: "Offer Received" }), _jsx(SelectItem, { value: "Hired", children: "Hired" }), _jsx(SelectItem, { value: "Not Selected", children: "Not Selected" }), _jsx(SelectItem, { value: "Rejected", children: "Rejected" })] })] }), _jsxs(Select, { value: stageFilter || 'all_outcomes', onValueChange: (value) => setStageFilter(value === 'all_outcomes' ? undefined : value), children: [_jsx(SelectTrigger, { className: "w-full lg:w-48", children: _jsx(SelectValue, { placeholder: "Filter by stage outcome" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all_outcomes", children: "All outcomes" }), _jsx(SelectItem, { value: "passed", children: "Passed" }), _jsx(SelectItem, { value: "failed", children: "Failed/Rejected" }), _jsx(SelectItem, { value: "upcoming", children: "Upcoming" }), _jsx(SelectItem, { value: "awaiting", children: "Awaiting Feedback" })] })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                    setSearchQuery('');
                                    setStatusFilter(undefined);
                                    setStageFilter(undefined);
                                }, children: "Clear Filters" })] })] }), _jsx("div", { className: "space-y-6", children: filteredProcesses.length === 0 ? (_jsxs("div", { className: "text-center py-8 border rounded-lg bg-card", children: [_jsx("h3", { className: "text-lg font-medium mb-2", children: "No interview processes found" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "Try adjusting the search or filters above." })] })) : (filteredProcesses.map(process => (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, className: cn("border rounded-lg shadow-sm bg-card overflow-hidden", "transition-all duration-300 ease-in-out", isProcessExpanded(process.id) ? "max-h-[300px]" : "max-h-[80px]"), children: [_jsxs("div", { className: "flex items-center justify-between p-4 bg-muted/30 cursor-pointer", onClick: () => toggleProcessExpanded(process.id), children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center gap-1 md:gap-3", children: [_jsx("h3", { className: "font-semibold truncate", children: process.companyName }), _jsx("div", { className: "text-sm text-muted-foreground", children: process.position })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(InterviewProcessStatusBadge, { status: process.status }), _jsxs(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 rounded-full", onClick: (e) => {
                                                e.stopPropagation();
                                                onEditProcess(process.id);
                                            }, children: [_jsx(ExternalLink, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "View details" })] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 rounded-full", onClick: (e) => {
                                                e.stopPropagation();
                                                toggleProcessExpanded(process.id);
                                            }, children: [_jsx(ChevronRight, { className: cn("h-5 w-5 transition-transform", isProcessExpanded(process.id) ? "rotate-90" : "") }), _jsx("span", { className: "sr-only", children: "Toggle timeline" })] })] })] }), isProcessExpanded(process.id) && (_jsx("div", { className: "p-4", children: _jsxs("div", { className: "relative", children: [_jsx(Button, { variant: "outline", size: "icon", className: "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full", onClick: () => scrollTimeline(process.id, 'left'), children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "outline", size: "icon", className: "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full", onClick: () => scrollTimeline(process.id, 'right'), children: _jsx(ChevronRight, { className: "h-4 w-4" }) }), _jsx("div", { ref: ref => scrollContainerRefs.current[process.id] = ref, className: "overflow-x-auto py-4 px-10 scrollbar-thin scrollbar-thumb-rounded-md scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 scrollbar-track-muted/10", children: _jsxs("div", { className: "relative min-w-max", children: [_jsx("div", { className: "absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" }), _jsx("div", { className: "flex items-center gap-4 relative z-10", children: stages[process.id]?.length > 0 ? (stages[process.id]
                                                        .filter(stage => {
                                                        if (!stageFilter)
                                                            return true;
                                                        return getStageStatus(stage) === stageFilter;
                                                    })
                                                        .sort((a, b) => {
                                                        const dateA = new Date(a.scheduledDate || 0);
                                                        const dateB = new Date(b.scheduledDate || 0);
                                                        return dateA.getTime() - dateB.getTime();
                                                    })
                                                        .map((stage, index, filteredStages) => {
                                                        // Calculate spacing between nodes based on time
                                                        const today = startOfToday();
                                                        let marginLeft = '0px';
                                                        if (index > 0 && stage.scheduledDate && filteredStages[index - 1].scheduledDate) {
                                                            const prevDate = new Date(filteredStages[index - 1].scheduledDate || 0);
                                                            const currDate = new Date(stage.scheduledDate || 0);
                                                            const daysDiff = differenceInDays(currDate, prevDate);
                                                            // Add more space for longer gaps
                                                            if (daysDiff > 14) {
                                                                marginLeft = `${Math.min(daysDiff * 2, 200)}px`;
                                                            }
                                                            else if (daysDiff > 7) {
                                                                marginLeft = `${Math.min(daysDiff * 1.5, 120)}px`;
                                                            }
                                                            else if (daysDiff > 0) {
                                                                marginLeft = `${Math.min(daysDiff * 1, 80)}px`;
                                                            }
                                                        }
                                                        // Determine if this is the next upcoming stage
                                                        const isNext = stage.scheduledDate &&
                                                            isAfter(new Date(stage.scheduledDate || 0), today) &&
                                                            !filteredStages.slice(0, index).some(s => s.scheduledDate && isAfter(new Date(s.scheduledDate || 0), today));
                                                        // Determine if this stage is overdue
                                                        const isOverdue = stage.scheduledDate &&
                                                            isBefore(new Date(stage.scheduledDate || 0), today) &&
                                                            getStageStatus(stage) === 'awaiting';
                                                        return (_jsx("div", { style: { marginLeft }, className: "flex flex-col items-center", children: _jsx(StageNode, { stage: stage, onClick: () => onStageClick(process.id, stage.id), isNext: isNext || undefined, isOverdue: isOverdue || undefined }) }, stage.id));
                                                    })) : (_jsx("div", { className: "w-full py-4 text-center text-muted-foreground", children: "No interview stages found for this process." })) })] }) })] }) }))] }, process.id)))) })] }));
};
export const StageDetailsDialog = ({ isOpen, onClose, stage, onSave }) => {
    const [editedStage, setEditedStage] = useState({});
    React.useEffect(() => {
        if (stage) {
            // For proper date handling, we convert to string format for input[type="date"]
            setEditedStage({
                ...stage,
                scheduledDate: stage.scheduledDate
                    ? new Date(stage.scheduledDate || 0).toISOString().split('T')[0]
                    : '',
            });
        }
        else {
            setEditedStage({});
        }
    }, [stage]);
    const handleSave = () => {
        // Create a new object without the scheduledDate to avoid type conflicts
        const { scheduledDate, ...rest } = editedStage;
        // Convert string date back to Date object before saving
        const formattedStage = {
            ...rest,
        };
        // Handle date conversion if needed
        if (typeof scheduledDate === 'string') {
            if (scheduledDate) {
                formattedStage.scheduledDate = new Date(scheduledDate);
            }
            else {
                formattedStage.scheduledDate = null;
            }
        }
        else {
            formattedStage.scheduledDate = scheduledDate;
        }
        onSave(formattedStage);
        onClose();
    };
    if (!stage)
        return null;
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: stage.type }), _jsx(DialogDescription, { children: "View and edit this interview stage's details." })] }), _jsxs("div", { className: "space-y-4 my-2", children: [_jsxs("div", { className: "grid w-full items-center gap-1.5", children: [_jsx("label", { htmlFor: "stage-type", className: "text-sm font-medium", children: "Stage Name" }), _jsx(Input, { id: "stage-type", value: editedStage.type || '', onChange: (e) => setEditedStage({ ...editedStage, type: e.target.value }) })] }), _jsxs("div", { className: "grid w-full items-center gap-1.5", children: [_jsx("label", { htmlFor: "stage-date", className: "text-sm font-medium", children: "Date" }), _jsx(Input, { id: "stage-date", type: "date", value: editedStage.scheduledDate ? String(editedStage.scheduledDate) : '', onChange: (e) => setEditedStage({ ...editedStage, scheduledDate: e.target.value }) })] }), _jsxs("div", { className: "grid w-full items-center gap-1.5", children: [_jsx("label", { htmlFor: "stage-location", className: "text-sm font-medium", children: "Location" }), _jsx(Input, { id: "stage-location", value: editedStage.location || '', onChange: (e) => setEditedStage({ ...editedStage, location: e.target.value }), placeholder: "Video call, on-site, etc." })] }), _jsxs("div", { className: "grid w-full items-center gap-1.5", children: [_jsx("label", { htmlFor: "stage-interviewers", className: "text-sm font-medium", children: "Interviewers" }), _jsx(Input, { id: "stage-interviewers", value: editedStage.interviewers?.join(', ') || '', onChange: (e) => setEditedStage({
                                        ...editedStage,
                                        interviewers: e.target.value.split(',').map(i => i.trim()).filter(Boolean)
                                    }), placeholder: "Separate multiple interviewers with commas" })] }), _jsxs("div", { className: "grid w-full items-center gap-1.5", children: [_jsx("label", { htmlFor: "stage-outcome", className: "text-sm font-medium", children: "Outcome" }), _jsxs(Select, { value: editedStage.outcome || 'pending', onValueChange: (value) => setEditedStage({ ...editedStage, outcome: value === 'pending' ? undefined : value }), children: [_jsx(SelectTrigger, { id: "stage-outcome", children: _jsx(SelectValue, { placeholder: "Select an outcome" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "pending", children: "Pending" }), _jsx(SelectItem, { value: "passed", children: "Passed" }), _jsx(SelectItem, { value: "not_selected", children: "Not Selected" })] })] })] }), _jsxs("div", { className: "grid w-full items-center gap-1.5", children: [_jsx("label", { htmlFor: "stage-notes", className: "text-sm font-medium", children: "Notes" }), _jsx(Textarea, { id: "stage-notes", value: editedStage.notes || '', onChange: (e) => setEditedStage({ ...editedStage, notes: e.target.value }), placeholder: "Interview notes, preparation, follow-up items, etc.", className: "min-h-[100px]" })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: handleSave, children: "Save Changes" })] })] }) }));
};
export default HorizontalTimeline;
