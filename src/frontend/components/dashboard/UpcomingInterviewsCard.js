import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import InterviewCard from './InterviewCard';
import { useToast } from '@/hooks/use-toast';
import { useUpcomingInterviews, INTERVIEW_COUNT_UPDATE_EVENT } from '@/context/UpcomingInterviewsContext';
// Tracks both applications with status "Interviewing" and interview stages with status "scheduled"
export function UpcomingInterviewsCard() {
    const [upcomingInterviews, setUpcomingInterviews] = useState([]);
    const [interviewCount, setInterviewCount] = useState(0);
    const [, navigate] = useLocation();
    const { toast } = useToast();
    // Fetch job applications
    const { data: applications, isLoading: isLoadingApplications } = useQuery({
        queryKey: ['/api/job-applications'],
        queryFn: async () => {
            try {
                const response = await apiRequest('GET', '/api/job-applications');
                if (!response.ok)
                    throw new Error(`API error: ${response.status}`);
                return await response.json();
            }
            catch (error) {
                console.error('Failed to fetch applications:', error);
                // Try to get from localStorage as a fallback
                const mockApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
                return mockApps;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
    // Fix existing interviews with missing scheduled dates - memoized to prevent recreation
    const fixExistingInterviews = React.useCallback(() => {
        // For debugging - dump all localStorage keys related to interviews
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('mockInterviewStages_') || key.includes('mockStages_'))) {
                keys.push(key);
            }
        }
        console.log("All interview stage localStorage keys:", keys);
        // Process each key to fix any interviews with missing scheduled dates
        keys.forEach(key => {
            try {
                const stages = JSON.parse(localStorage.getItem(key) || '[]');
                let hasChanges = false;
                stages.forEach((stage) => {
                    // Check if this is a scheduled or pending interview without a date
                    if ((stage.status === 'scheduled' || stage.status === 'pending' ||
                        stage.outcome === 'scheduled' || stage.outcome === 'pending') &&
                        !stage.scheduledDate) {
                        console.log(`Fixing stage ${stage.id} in ${key} - adding scheduled date`);
                        // Add a scheduled date (7 days from now)
                        const defaultDate = new Date();
                        defaultDate.setDate(defaultDate.getDate() + 7);
                        stage.scheduledDate = defaultDate.toISOString();
                        // Ensure it has a status or outcome set to scheduled
                        if (!stage.status && !stage.outcome) {
                            stage.status = 'scheduled';
                        }
                        hasChanges = true;
                    }
                });
                // Save back if changes were made
                if (hasChanges) {
                    console.log(`Saving fixed stages back to ${key}`);
                    localStorage.setItem(key, JSON.stringify(stages));
                }
            }
            catch (error) {
                console.error(`Error processing ${key}:`, error);
            }
        });
    }, []);
    // Use the UpcomingInterviewsContext hook
    const { upcomingInterviewCount, updateInterviewCount } = useUpcomingInterviews();
    // Pre-load interview data immediately on component mount and after applications load
    useEffect(() => {
        // Immediately fix any existing interviews with missing dates
        fixExistingInterviews();
        // Immediately dispatch an update event to force context to refresh
        window.dispatchEvent(new Event(INTERVIEW_COUNT_UPDATE_EVENT));
        // Update context data immediately
        updateInterviewCount();
        // Set multiple refresh timers to ensure data is loaded properly
        // This helps when navigating directly to the dashboard
        const refreshTimers = [
            setTimeout(() => {
                fixExistingInterviews();
                window.dispatchEvent(new Event(INTERVIEW_COUNT_UPDATE_EVENT));
                updateInterviewCount();
            }, 300),
            setTimeout(() => {
                fixExistingInterviews();
                window.dispatchEvent(new Event(INTERVIEW_COUNT_UPDATE_EVENT));
                updateInterviewCount();
            }, 800),
            setTimeout(() => {
                fixExistingInterviews();
                window.dispatchEvent(new Event(INTERVIEW_COUNT_UPDATE_EVENT));
                updateInterviewCount();
            }, 1500)
        ];
        return () => {
            refreshTimers.forEach(timer => clearTimeout(timer));
        };
    }, [updateInterviewCount, fixExistingInterviews]);
    // Refresh when applications data changes
    useEffect(() => {
        if (!applications || !Array.isArray(applications))
            return;
        // Update interview data when applications change
        updateInterviewCount();
        window.dispatchEvent(new Event(INTERVIEW_COUNT_UPDATE_EVENT));
    }, [applications, updateInterviewCount]);
    // Count applications with status "Interviewing" and load interview stages
    useEffect(() => {
        if (!applications || !Array.isArray(applications))
            return;
        // Fix any existing interviews with missing scheduled dates
        fixExistingInterviews();
        // Filter applications with status "Interviewing"
        const interviewingApps = applications.filter(app => app.status === 'Interviewing');
        console.log("Interviewing applications:", interviewingApps.map(app => ({ id: app.id, company: app.company || app.companyName })));
        // Load all interview stages from both localStorage key patterns
        let allStages = [];
        // DEBUG: Log all localStorage keys to help diagnose the issue
        const allKeys = [];
        let totalInterviewStages = 0;
        console.log("===== DEBUGGING INTERVIEW COUNT ISSUE =====");
        // First pass - collect all keys for interview stages
        const stageKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                allKeys.push(key);
                if (key.includes('mockInterviewStages_') || key.includes('mockStages_')) {
                    stageKeys.push(key);
                    // Count and log all interview stages
                    try {
                        const data = localStorage.getItem(key);
                        if (data) {
                            const stages = JSON.parse(data);
                            if (Array.isArray(stages)) {
                                totalInterviewStages += stages.length;
                                console.log(`Key ${key}: ${stages.length} stages`);
                                // Print details of each stage
                                stages.forEach((stage, idx) => {
                                    const date = stage.scheduledDate ? new Date(stage.scheduledDate) : null;
                                    const isInFuture = date ? date > new Date() : false;
                                    console.log(`  Stage ${idx + 1}: ID=${stage.id}, status=${stage.status}, outcome=${stage.outcome}, date=${stage.scheduledDate}, in future=${isInFuture}`);
                                });
                            }
                        }
                    }
                    catch (e) {
                        console.error(`Error processing key ${key}:`, e);
                    }
                }
            }
        }
        console.log(`Found ${stageKeys.length} stage keys and ${totalInterviewStages} total interview stages`);
        console.log(`All localStorage keys: ${allKeys.join(", ")}`);
        console.log("========================================");
        // Second pass - process all keys, now including all applications (not just interviewing)
        // This ensures we find all interviews even if application status is inconsistent
        stageKeys.forEach(key => {
            try {
                const stagesJson = localStorage.getItem(key);
                if (!stagesJson)
                    return;
                const parsedStages = JSON.parse(stagesJson);
                if (!Array.isArray(parsedStages) || parsedStages.length === 0)
                    return;
                // For each stage, determine which application it belongs to
                parsedStages.forEach((stage) => {
                    // Extract application ID from the key
                    let applicationId = null;
                    if (key.includes('mockStages_')) {
                        applicationId = key.replace('mockStages_', '');
                    }
                    else if (key.includes('mockInterviewStages_')) {
                        applicationId = key.replace('mockInterviewStages_', '');
                    }
                    if (applicationId) {
                        // Try to find the application - look in interviewing apps first
                        let app = interviewingApps.find(a => a.id.toString() === applicationId.toString());
                        // If not found and it's a valid interview stage, try to find in all applications
                        if (!app && (stage.status === 'scheduled' || stage.status === 'pending')) {
                            app = applications.find(a => a.id.toString() === applicationId.toString());
                        }
                        if (app) {
                            // Add application info to the stage
                            allStages.push({
                                ...stage,
                                applicationId: stage.applicationId || app.id,
                                application: app
                            });
                        }
                    }
                });
            }
            catch (error) {
                console.error(`Error processing ${key}:`, error);
            }
        });
        // Filter for upcoming interviews
        const upcomingStages = allStages.filter(stage => {
            // Ensure stage has a scheduled date
            if (!stage || !stage.scheduledDate)
                return false;
            // Check for scheduled or pending status/outcome
            const isScheduledOrPending = (stage.status === 'scheduled' ||
                stage.status === 'pending' ||
                stage.outcome === 'scheduled' ||
                stage.outcome === 'pending');
            // Check if the interview is in the future
            const isInFuture = new Date(stage.scheduledDate) > new Date();
            return isScheduledOrPending && isInFuture;
        });
        // Deduplicate stages - we might have the same stage from both mockStages_ and mockInterviewStages_
        const uniqueStages = [];
        const stageIds = new Set();
        // Only add stages with unique IDs to avoid duplicates
        upcomingStages.forEach(stage => {
            if (!stageIds.has(stage.id)) {
                stageIds.add(stage.id);
                uniqueStages.push(stage);
            }
        });
        // Sort by date
        const sortedStages = uniqueStages.sort((a, b) => {
            if (a.scheduledDate && b.scheduledDate) {
                return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
            }
            return 0;
        });
        // Update state with all upcoming interviews
        setUpcomingInterviews(sortedStages);
        // Set the count of interviews (from context if available, otherwise use local count)
        setInterviewCount(upcomingInterviewCount > 0 ? upcomingInterviewCount : sortedStages.length);
        // Update the central context with our findings
        updateInterviewCount();
        // Force a UI update by dispatching the update event
        window.dispatchEvent(new Event(INTERVIEW_COUNT_UPDATE_EVENT));
    }, [applications, upcomingInterviewCount, updateInterviewCount, fixExistingInterviews]);
    // Handle editing an interview
    const handleEditInterview = (stageId, applicationId) => {
        // Trigger an event to refresh the interview display when navigating back
        window.localStorage.setItem('lastEditedInterviewStage', stageId.toString());
        // Trigger interview update event
        window.dispatchEvent(new Event(INTERVIEW_COUNT_UPDATE_EVENT));
        // Navigate to edit page
        navigate(`/interview/${stageId}?edit=true`);
    };
    // Handle loading state
    if (isLoadingApplications) {
        return (_jsxs(Card, { className: "h-full", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-lg font-semibold", children: "Upcoming Interviews" }) }), _jsx(CardContent, { className: "pb-4", children: _jsx("div", { className: "flex justify-center items-center py-8", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) }) })] }));
    }
    // Show specific message when no interviews
    if (interviewCount === 0) {
        return (_jsxs(Card, { className: "h-full", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-lg font-semibold", children: "Upcoming Interviews" }) }), _jsx(CardContent, { className: "pb-4", children: _jsxs("div", { className: "text-center text-muted-foreground py-8 space-y-3", children: [_jsx("p", { children: "No upcoming interviews" }), _jsx(Link, { href: "/job-applications?filter=active", children: _jsx(Button, { variant: "secondary", size: "sm", children: "View Active Applications" }) })] }) })] }));
    }
    // Find applications in interviewing stage but without scheduled interviews
    const interviewingApplications = applications?.filter(app => app.status === 'Interviewing' &&
        !upcomingInterviews.some(interview => interview.applicationId === app.id)) || [];
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx(CardTitle, { className: "text-lg font-semibold", children: "Upcoming Interviews" }), _jsxs(Badge, { variant: "secondary", className: "text-xs", children: [interviewCount, " ", interviewCount === 1 ? 'interview' : 'interviews'] })] }) }), _jsx(CardContent, { className: "pb-4", children: upcomingInterviews.length > 0 ? (_jsx("div", { className: "space-y-4", children: upcomingInterviews.map((stage) => (_jsx(InterviewCard, { stage: stage, onEdit: handleEditInterview }, `interview-${stage.id}-${stage.applicationId}`))) })) : (_jsx("div", { className: "py-2 space-y-4", children: _jsxs("div", { className: "text-center p-6", children: [_jsx(Calendar, { className: "h-10 w-10 mx-auto text-muted-foreground mb-3" }), _jsx("h3", { className: "text-lg font-medium", children: "No scheduled interviews" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Scheduled or pending interviews will appear here" })] }) })) })] }));
}
