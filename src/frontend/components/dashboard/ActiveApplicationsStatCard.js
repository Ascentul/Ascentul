import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
export function ActiveApplicationsStatCard({ isLoading = false }) {
    const [activeAppCount, setActiveAppCount] = useState(0);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchActiveApplications = async () => {
            try {
                // Try to get applications from API
                const response = await apiRequest('GET', '/api/job-applications');
                if (response.ok) {
                    const applications = await response.json();
                    // Count applications with status 'Active' or 'Interviewing' or 'Applied'
                    const activeCount = applications.filter((app) => app.status === 'Active' ||
                        app.status === 'Interviewing' ||
                        app.status === 'Applied').length;
                    setActiveAppCount(activeCount);
                }
                else {
                    // Fallback to localStorage if API fails
                    const localApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
                    const activeCount = localApps.filter((app) => app.status === 'Active' ||
                        app.status === 'Interviewing' ||
                        app.status === 'Applied').length;
                    setActiveAppCount(activeCount);
                }
            }
            catch (error) {
                // Last resort fallback if everything fails
                console.error('Error fetching active applications:', error);
                try {
                    const localApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
                    const activeCount = localApps.filter((app) => app.status === 'Active' ||
                        app.status === 'Interviewing' ||
                        app.status === 'Applied').length;
                    setActiveAppCount(activeCount);
                }
                catch (fallbackError) {
                    console.error('Fallback error:', fallbackError);
                    setActiveAppCount(0);
                }
            }
            finally {
                setLoading(false);
            }
        };
        fetchActiveApplications();
        // Refresh data every minute
        const interval = setInterval(() => {
            fetchActiveApplications();
        }, 60000);
        return () => clearInterval(interval);
    }, []);
    if (isLoading || loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "p-4 flex justify-center items-center", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) }) }));
    }
    return (_jsx(Link, { href: "/job-applications?filter=active", children: _jsx(Card, { className: "cursor-pointer hover:shadow-md transition-shadow", children: _jsx(CardContent, { className: "p-4", children: _jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0 p-3 rounded-full bg-primary/20", children: _jsx(Briefcase, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { className: "ml-4", children: [_jsx("h3", { className: "text-neutral-500 text-sm", children: "Active Applications" }), _jsx("p", { className: "text-2xl font-semibold", children: activeAppCount })] })] }) }) }) }) }));
}
