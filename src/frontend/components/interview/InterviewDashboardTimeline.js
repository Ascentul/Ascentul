import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { format } from 'date-fns';
import { ChevronRightCircle, CircleCheck, CheckCircle2, XCircle, PieChart } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { InterviewProcessStatusBadge } from './InterviewProcessStatusBadge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
export const InterviewDashboardTimeline = ({ processes, className }) => {
    // Sort processes by date (newest first)
    const sortedProcesses = [...processes].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    if (processes.length === 0) {
        return (_jsx("div", { className: cn("text-center py-10", className), children: _jsx("p", { className: "text-muted-foreground", children: "No interview processes to display." }) }));
    }
    return (_jsxs("div", { className: cn("relative", className), children: [_jsx("div", { className: "absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -ml-0.5 z-0" }), _jsx("div", { className: "relative z-10", children: sortedProcesses.map((process, index) => {
                    // Determine if item should be on left or right side (alternating)
                    const isLeft = index % 2 === 0;
                    // Determine icon based on status
                    let StatusIcon = ChevronRightCircle;
                    let iconColor = "text-primary";
                    if (process.status === 'Hired') {
                        StatusIcon = CheckCircle2;
                        iconColor = "text-green-600";
                    }
                    else if (process.status === 'Not Selected' || process.status === 'Rejected') {
                        StatusIcon = XCircle;
                        iconColor = "text-red-500";
                    }
                    else if (process.status === 'Completed') {
                        StatusIcon = CircleCheck;
                        iconColor = "text-blue-500";
                    }
                    else if (process.status === 'Application Submitted') {
                        StatusIcon = PieChart;
                        iconColor = "text-orange-500";
                    }
                    // Animation variants
                    const fadeSlide = {
                        hidden: {
                            opacity: 0,
                            x: isLeft ? -20 : 20
                        },
                        visible: {
                            opacity: 1,
                            x: 0,
                            transition: {
                                duration: 0.5,
                                delay: index * 0.1 // Stagger effect
                            }
                        }
                    };
                    return (_jsxs(motion.div, { variants: fadeSlide, initial: "hidden", animate: "visible", className: `flex items-center mb-12 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`, children: [_jsx("div", { className: `w-5/12 px-4 ${isLeft ? 'text-right' : 'text-left'}`, children: _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("div", { className: `p-4 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isLeft ? 'ml-auto' : 'mr-auto'}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("div", { className: `font-semibold text-lg ${isLeft ? 'ml-auto' : ''}`, children: process.companyName }), _jsx(InterviewProcessStatusBadge, { status: process.status })] }), _jsx("div", { className: "text-sm", children: process.position }), _jsx("div", { className: "text-xs text-muted-foreground mt-2", children: format(new Date(process.createdAt), 'MMM d, yyyy') })] }) }), _jsx(TooltipContent, { side: isLeft ? "left" : "right", className: "max-w-sm", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "font-medium", children: [process.companyName, " - ", process.position] }), _jsx("p", { className: "text-sm", children: process.jobDescription || 'No job description available.' }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-2", children: [_jsx(Badge, { variant: "outline", className: "text-xs", children: process.contactName || 'No contact' }), _jsxs(Badge, { variant: "outline", className: "text-xs", children: ["Updated: ", new Date(process.updatedAt).toLocaleDateString()] })] })] }) })] }) }) }), _jsx("div", { className: "w-2/12 flex justify-center", children: _jsx("div", { className: `w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10 ${iconColor}`, children: _jsx(StatusIcon, { className: "h-5 w-5" }) }) }), _jsx("div", { className: "w-5/12" })] }, process.id));
                }) })] }));
};
export default InterviewDashboardTimeline;
