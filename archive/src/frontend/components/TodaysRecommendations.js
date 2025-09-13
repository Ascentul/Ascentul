import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { ExternalLink, CheckCircle, Circle } from 'lucide-react';
// Function to determine correct link for recommendation type
function getRecommendationLink(recommendation) {
    if (!recommendation.relatedEntityId || !recommendation.relatedEntityType) {
        return null;
    }
    switch (recommendation.relatedEntityType) {
        case 'resume':
            return `/resumes/${recommendation.relatedEntityId}`;
        case 'job_application':
            return `/job-applications/${recommendation.relatedEntityId}`;
        case 'contact':
            return `/networking/${recommendation.relatedEntityId}`;
        case 'followup_action':
            return `/job-applications`; // Could be improved with specific ID
        case 'interview_stage':
            return `/application-tracker`; // Could be improved with specific ID
        case 'goal':
            return `/goals/${recommendation.relatedEntityId}`;
        default:
            return null;
    }
}
export default function TodaysRecommendations() {
    const { toast } = useToast();
    const [refreshing, setRefreshing] = useState(false);
    const queryClient = useQueryClient();
    // Fetch all recommendations
    const { data: recommendations = [], isLoading, error, refetch } = useQuery({
        queryKey: ['/api/recommendations/daily'],
        queryFn: async () => {
            try {
                const response = await apiRequest('GET', '/api/recommendations/daily');
                if (!response.ok)
                    throw new Error('Failed to fetch recommendations');
                return await response.json();
            }
            catch (error) {
                console.error('Error fetching recommendations:', error);
                return [];
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
    // Sort recommendations by completion status
    const sortedRecommendations = [...recommendations].sort((a, b) => {
        // Incomplete first, then by type
        return a.completed === b.completed
            ? a.type.localeCompare(b.type)
            : a.completed ? 1 : -1;
    });
    // Mutation to mark recommendation as complete
    const completeMutation = useMutation({
        mutationFn: async (id) => {
            const res = await apiRequest('POST', `/api/recommendations/${id}/complete`);
            if (!res.ok)
                throw new Error('Failed to complete recommendation');
            return await res.json();
        },
        onMutate: async (recommendationId) => {
            // Cancel any outgoing refetches 
            await queryClient.cancelQueries({ queryKey: ['/api/recommendations/daily'] });
            // Snapshot the previous value
            const previousRecommendations = queryClient.getQueryData(['/api/recommendations/daily']);
            // Optimistically update to the new value
            if (previousRecommendations) {
                queryClient.setQueryData(['/api/recommendations/daily'], previousRecommendations.map(rec => rec.id === recommendationId
                    ? { ...rec, completed: true, completedAt: new Date().toISOString() }
                    : rec));
            }
            return { previousRecommendations };
        },
        onSuccess: (data) => {
            // Show success toast
            toast({
                title: "Recommendation completed!",
                description: "You've earned 15 XP for completing this recommendation.",
            });
        },
        onError: (error, recommendationId, context) => {
            // If the mutation fails, roll back to the previous value
            if (context?.previousRecommendations) {
                queryClient.setQueryData(['/api/recommendations/daily'], context.previousRecommendations);
            }
            toast({
                title: "Failed to complete recommendation",
                description: error.message,
                variant: "destructive"
            });
        },
        onSettled: () => {
            // Always invalidate the query to ensure we have the latest data
            queryClient.invalidateQueries({ queryKey: ['/api/recommendations/daily'] });
        }
    });
    // Handle recommendation completion toggle
    const handleToggleComplete = (recommendation) => {
        if (!recommendation.completed) {
            completeMutation.mutate(recommendation.id);
        }
    };
    // Handle refresh recommendations
    const handleRefresh = async () => {
        if (refreshing)
            return;
        setRefreshing(true);
        try {
            // Call the refresh API endpoint to clear existing and generate new recommendations
            const res = await apiRequest('POST', '/api/recommendations/refresh');
            if (!res.ok) {
                throw new Error('Failed to refresh recommendations');
            }
            // Invalidate and refetch the daily recommendations
            await queryClient.invalidateQueries({ queryKey: ['/api/recommendations/daily'] });
            // Trigger a refetch to get the new recommendations
            await refetch();
            toast({
                title: "Recommendations refreshed",
                description: "New AI-powered recommendations have been generated based on your current career profile and goals.",
            });
        }
        catch (error) {
            console.error('Error refreshing recommendations:', error);
            toast({
                title: "Failed to refresh recommendations",
                description: "Please try again later.",
                variant: "destructive"
            });
        }
        finally {
            setRefreshing(false);
        }
    };
    return (_jsx(Card, { children: _jsxs(CardContent, { className: "p-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-lg font-semibold font-poppins", children: "Today's Recommendations" }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleRefresh, disabled: refreshing || isLoading, className: "h-8 px-2", children: [_jsx("span", { className: "sr-only", children: "Refresh" }), _jsxs("svg", { className: `h-4 w-4 ${refreshing ? 'animate-spin' : ''}`, xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), _jsx("path", { d: "M3 3v5h5" }), _jsx("path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" }), _jsx("path", { d: "M16 16h5v5" })] })] })] }), isLoading ? (
                // Loading skeleton
                _jsx("div", { className: "space-y-3", children: [...Array(4)].map((_, i) => (_jsxs("div", { className: "flex items-start p-3 bg-background rounded-lg border border-border", children: [_jsx(Skeleton, { className: "h-5 w-5 mr-3 rounded-full flex-shrink-0" }), _jsxs("div", { className: "space-y-2 flex-1", children: [_jsx(Skeleton, { className: "h-4 w-full" }), _jsx("div", { className: "flex", children: _jsx(Skeleton, { className: "h-4 w-16 rounded-full" }) })] })] }, i))) })) : error ? (
                // Error state
                _jsxs("div", { className: "p-5 text-center", children: [_jsx("p", { className: "text-red-500 mb-2", children: "Failed to load recommendations" }), _jsx(Button, { onClick: handleRefresh, variant: "outline", size: "sm", children: "Try Again" })] })) : sortedRecommendations.length === 0 ? (
                // Empty state
                _jsxs("div", { className: "text-center p-6 border border-dashed rounded-lg flex flex-col items-center", children: [_jsx("p", { className: "text-muted-foreground mb-2", children: "No recommendations for today" }), _jsx(Button, { variant: "outline", size: "sm", onClick: handleRefresh, children: "Generate Recommendations" })] })) : (
                // Recommendations list
                _jsx("ul", { className: "space-y-3", children: sortedRecommendations.map((recommendation) => {
                        const link = getRecommendationLink(recommendation);
                        return (_jsxs("li", { className: `flex items-start p-3 rounded-lg border transition-all duration-300 ${recommendation.completed
                                ? 'bg-green-50/50 text-muted-foreground border-border/50'
                                : 'bg-background border-border hover:border-primary/30'}`, children: [_jsx("div", { className: "mt-0.5 mr-3 flex-shrink-0 cursor-pointer", onClick: () => handleToggleComplete(recommendation), children: recommendation.completed ? (_jsx(CheckCircle, { className: "text-green-500 h-5 w-5" })) : (_jsx(Circle, { className: "text-muted-foreground h-5 w-5 hover:text-primary" })) }), _jsx("div", { className: "flex-1", children: _jsxs("div", { className: "flex flex-wrap items-start", children: [_jsx("span", { className: `text-sm ${recommendation.completed ? 'line-through' : ''}`, children: recommendation.text }), link && !recommendation.completed && (_jsx(Link, { to: link, className: "ml-2 inline-flex", children: _jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5 -mr-1", title: "Go to related item", children: _jsx(ExternalLink, { className: "h-3.5 w-3.5" }) }) }))] }) })] }, recommendation.id));
                    }) }))] }) }));
}
