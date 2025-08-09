import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardTitle, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
// Define the goal templates data structure
export const goalTemplates = [
    {
        id: "job-change",
        icon: "🧭",
        title: "Job Change",
        summary: "Plan your next role with clarity.",
        prefill: {
            title: "Plan My Job Change",
            description: "Step-by-step plan to find and secure my next job opportunity.",
            milestones: [
                "Complete self-assessment",
                "Update resume and portfolio",
                "Identify 5 target roles",
                "Submit 10 applications",
                "Prep for interviews"
            ]
        }
    },
    {
        id: "promotion-path",
        icon: "📣",
        title: "Promotion Path",
        summary: "Showcase your growth and move up.",
        prefill: {
            title: "Prepare for Promotion",
            description: "Actions to position myself for promotion and career advancement.",
            milestones: [
                "Track 3 major achievements",
                "Request peer feedback",
                "Review skill gaps",
                "Meet with manager",
                "Present promotion case"
            ]
        }
    },
    {
        id: "skill-building",
        icon: "🧠",
        title: "Skill Building",
        summary: "Develop expertise in high-demand skills.",
        prefill: {
            title: "Master New Skills",
            description: "Structured learning plan to acquire valuable professional skills.",
            milestones: [
                "Identify skill gaps in my field",
                "Find learning resources",
                "Complete beginner course",
                "Build practice project",
                "Get feedback on work"
            ]
        }
    },
    {
        id: "networking",
        icon: "🤝",
        title: "Networking Plan",
        summary: "Expand your professional connections.",
        prefill: {
            title: "Grow My Network",
            description: "Strategic networking to build valuable professional relationships.",
            milestones: [
                "Update LinkedIn profile",
                "Join 2 industry groups",
                "Attend networking event",
                "Schedule 3 coffee chats",
                "Follow up with new contacts"
            ]
        }
    },
    {
        id: "side-project",
        icon: "💡",
        title: "Side Project",
        summary: "Launch a project to showcase skills.",
        prefill: {
            title: "Complete Side Project",
            description: "Planning and execution of a portfolio-worthy side project.",
            milestones: [
                "Brainstorm project ideas",
                "Create project plan",
                "Build MVP version",
                "Get user feedback",
                "Finalize project and document"
            ]
        }
    }
];
const GoalTemplateCard = ({ icon, title, summary, onClick, }) => {
    return (_jsxs(Card, { className: "w-64 min-w-[16rem] min-h-[260px] bg-white border hover:shadow-md transition-all rounded-xl flex flex-col justify-between", children: [_jsxs(CardContent, { className: "pt-6", children: [_jsx("div", { className: "bg-white shadow-sm rounded-full p-2 inline-block mb-2", children: _jsx("span", { className: "text-2xl", children: icon }) }), _jsx(CardTitle, { className: "text-xl mb-1", children: title }), _jsx(CardDescription, { className: "line-clamp-2", children: summary })] }), _jsx(CardFooter, { className: "pt-0 mt-auto", children: _jsx(Button, { variant: "secondary", className: "w-full px-4 py-2 hover:ring-1 hover:ring-blue-300", onClick: onClick, children: "Start with this Template" }) })] }));
};
const GoalTemplates = ({ onSelectTemplate }) => {
    const scrollContainerRef = React.useRef(null);
    const handleScrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };
    const handleScrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };
    return (_jsxs("div", { className: "mb-6 relative", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold flex items-center", children: "\uD83D\uDD25 Popular Templates" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Start with a pre-defined career goal" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "icon", className: "h-8 w-8", onClick: handleScrollLeft, children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "outline", size: "icon", className: "h-8 w-8", onClick: handleScrollRight, children: _jsx(ChevronRight, { className: "h-4 w-4" }) })] })] }), _jsx("div", { ref: scrollContainerRef, className: "flex gap-4 overflow-x-auto pb-4 pt-1 -mx-1 px-1 snap-x scroll-smooth", style: {
                    scrollbarWidth: 'none', // For Firefox
                    msOverflowStyle: 'none', // For Internet Explorer and Edge
                }, children: goalTemplates.map((template) => (_jsx("div", { className: "snap-start", children: _jsx(GoalTemplateCard, { icon: template.icon, title: template.title, summary: template.summary, onClick: () => onSelectTemplate(template.id) }) }, template.id))) })] }));
};
export default GoalTemplates;
