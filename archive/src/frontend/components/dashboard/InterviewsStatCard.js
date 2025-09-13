import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { useUpcomingInterviews } from '@/context/UpcomingInterviewsContext';
export function InterviewsStatCard({ isLoading = false }) {
    const { upcomingInterviewCount } = useUpcomingInterviews();
    if (isLoading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "p-4 flex justify-center items-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) }) }));
    }
    return (_jsx(Link, { href: "/job-applications?filter=interviewing", children: _jsx(Card, { className: "cursor-pointer hover:shadow-md transition-shadow", children: _jsx(CardContent, { className: "p-4", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0 p-3 rounded-full bg-primary/20", children: _jsx(Calendar, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h3", { className: "text-neutral-500 text-sm", children: "Upcoming Interviews" }), _jsx("p", { className: "text-2xl font-semibold", children: upcomingInterviewCount })] })] }) }) }) }) }));
}
