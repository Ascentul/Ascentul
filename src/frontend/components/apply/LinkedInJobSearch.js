import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { SiLinkedin } from 'react-icons/si';
export function LinkedInJobSearch({ onSelectJob, onOpenLinkedIn }) {
    const [searchParams, setSearchParams] = useState({
        jobTitle: '',
        location: '',
        remoteOnly: false,
    });
    const [isSearching, setIsSearching] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    const handleRemoteOnlyChange = (checked) => {
        setSearchParams((prev) => ({
            ...prev,
            remoteOnly: checked,
        }));
    };
    const handleSearch = useCallback(() => {
        // Validate inputs
        if (!searchParams.jobTitle.trim()) {
            alert('Please enter a job title');
            return;
        }
        setIsSearching(true);
        // Add to search history
        setSearchHistory((prev) => [
            { title: searchParams.jobTitle, location: searchParams.location, timestamp: new Date() },
            ...prev.slice(0, 9), // Keep only the 10 most recent searches
        ]);
        // Construct LinkedIn search URL
        let linkedInUrl = 'https://www.linkedin.com/jobs/search/?keywords=';
        // Encode the job title
        linkedInUrl += encodeURIComponent(searchParams.jobTitle);
        // Add location if provided
        if (searchParams.location.trim()) {
            linkedInUrl += '&location=' + encodeURIComponent(searchParams.location);
        }
        // Add remote filter if selected
        if (searchParams.remoteOnly) {
            linkedInUrl += '&f_WT=2';
        }
        // Simulate network delay
        setTimeout(() => {
            setIsSearching(false);
            // If a job is selected, call the onSelectJob callback
            if (onSelectJob) {
                onSelectJob({
                    title: searchParams.jobTitle,
                    company: 'LinkedIn Search',
                    url: linkedInUrl,
                });
            }
            // If open in LinkedIn is requested, call the onOpenLinkedIn callback
            if (onOpenLinkedIn) {
                onOpenLinkedIn(linkedInUrl);
            }
        }, 800);
    }, [searchParams, onSelectJob, onOpenLinkedIn]);
    const handleHistoryItemClick = (item) => {
        setSearchParams((prev) => ({
            ...prev,
            jobTitle: item.title,
            location: item.location,
        }));
    };
    const clearSearchHistory = () => {
        setSearchHistory([]);
    };
    return (_jsxs(Card, { className: "w-full", children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(SiLinkedin, { className: "text-[#0A66C2]", size: 24 }), "LinkedIn Job Search"] }), _jsx(CardDescription, { children: "Search for jobs on LinkedIn directly within the application" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800", children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0 mt-0.5", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }) }), _jsxs("div", { className: "ml-2", children: [_jsx("p", { className: "font-medium", children: "LinkedIn Embedding Restrictions" }), _jsx("p", { className: "mt-1", children: "Due to LinkedIn's security policies, jobs will open in a new tab when selected. You can use the AI assistant for application help once you've viewed a job." })] })] }) }), _jsxs(Tabs, { defaultValue: "search", children: [_jsxs(TabsList, { className: "w-full mb-4", children: [_jsx(TabsTrigger, { value: "search", className: "flex-1", children: "Search" }), _jsx(TabsTrigger, { value: "history", className: "flex-1", children: "History" })] }), _jsxs(TabsContent, { value: "search", className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "jobTitle", children: "Job Title" }), _jsx(Input, { id: "jobTitle", name: "jobTitle", placeholder: "Software Engineer, Product Manager, etc.", value: searchParams.jobTitle, onChange: handleInputChange })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "location", children: "Location (Optional)" }), _jsx(Input, { id: "location", name: "location", placeholder: "San Francisco, Remote, etc.", value: searchParams.location, onChange: handleInputChange })] }), _jsxs("div", { className: "flex items-center space-x-2 mt-4", children: [_jsx(Checkbox, { id: "remoteOnly", checked: searchParams.remoteOnly, onCheckedChange: handleRemoteOnlyChange }), _jsx(Label, { htmlFor: "remoteOnly", children: "Remote jobs only" })] })] }), _jsx(TabsContent, { value: "history", children: searchHistory.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "space-y-2 max-h-[300px] overflow-y-auto", children: searchHistory.map((item, index) => (_jsxs("div", { className: "p-3 border rounded-md hover:bg-gray-50 cursor-pointer flex justify-between items-center", onClick: () => handleHistoryItemClick(item), children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: item.title }), _jsx("p", { className: "text-sm text-gray-500", children: item.location || 'No location' })] }), _jsxs("p", { className: "text-xs text-gray-400", children: [item.timestamp.toLocaleDateString(), " ", item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] })] }, index))) }), _jsx(Button, { variant: "outline", size: "sm", onClick: clearSearchHistory, className: "mt-4", children: "Clear History" })] })) : (_jsx("p", { className: "text-center py-8 text-gray-500", children: "No search history available" })) })] })] }), _jsxs(CardFooter, { className: "flex justify-between", children: [_jsx(Button, { variant: "outline", onClick: () => window.open('https://www.linkedin.com/jobs', '_blank'), children: "Browse LinkedIn Jobs" }), _jsx(Button, { onClick: handleSearch, disabled: isSearching || !searchParams.jobTitle.trim(), children: isSearching ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Searching..."] })) : ('Search Jobs') })] })] }));
}
