import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Briefcase, ExternalLink, Search } from 'lucide-react';
import { AdzunaJobSearch } from '@/components/apply/AdzunaJobSearch';
export default function Apply() {
    const [selectedJob, setSelectedJob] = useState(null);
    // Handle selecting a job from the search
    const handleSelectJob = (jobInfo) => {
        // Set the selected job information
        setSelectedJob({
            title: jobInfo.title,
            company: jobInfo.company,
            description: jobInfo.description,
            url: jobInfo.url
        });
    };
    return (_jsxs("div", { className: "container mx-auto py-6 max-w-7xl", children: [_jsx("h1", { className: "text-3xl font-bold mb-8", children: "Application Tracker" }), _jsx("div", { className: "grid grid-cols-1 gap-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Search, { className: "h-5 w-5" }), "Find and Track Jobs"] }), _jsx(CardDescription, { children: "Search for jobs, track applications, and manage your job search process" })] }), _jsx(CardContent, { children: _jsxs(Tabs, { defaultValue: "adzuna", className: "w-full", children: [_jsxs(TabsList, { className: "w-full mb-4", children: [_jsxs(TabsTrigger, { value: "adzuna", className: "flex items-center gap-1", children: [_jsx(Search, { className: "h-4 w-4" }), "Job Search"] }), _jsxs(TabsTrigger, { value: "tracked", className: "flex items-center gap-1", children: [_jsx(Briefcase, { className: "h-4 w-4" }), "Tracked Applications"] })] }), _jsxs(TabsContent, { value: "adzuna", children: [_jsx(AdzunaJobSearch, { onSelectJob: handleSelectJob }), selectedJob && (_jsxs("div", { className: "mt-8 border rounded-lg p-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: selectedJob.title }), _jsx("p", { className: "text-gray-600", children: selectedJob.company }), _jsxs("div", { className: "mt-4 flex gap-4", children: [_jsxs(Button, { variant: "outline", className: "flex items-center gap-1", onClick: () => selectedJob.url && window.open(selectedJob.url, '_blank'), children: [_jsx(ExternalLink, { className: "h-4 w-4" }), "Apply on Website"] }), _jsx(Button, { className: "flex items-center gap-1", children: "Add to Tracker" })] })] }))] }), _jsx(TabsContent, { value: "tracked", children: _jsxs("div", { className: "text-center py-12", children: [_jsx("h3", { className: "text-lg font-medium mb-2", children: "No tracked applications yet" }), _jsx("p", { className: "text-muted-foreground mb-6", children: "Start searching for jobs and tracking your applications to see them here" }), _jsx(Button, { variant: "outline", onClick: () => document.querySelector('button[value="adzuna"]')?.click(), children: "Find Jobs" })] }) })] }) })] }) })] }));
}
