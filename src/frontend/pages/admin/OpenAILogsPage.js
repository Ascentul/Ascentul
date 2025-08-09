import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DownloadCloud, BarChart2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
export default function AdminOpenAILogsPage() {
    const { isAdmin, isLoading: isAuthLoading } = useAuth();
    const [activeTab, setActiveTab] = useState('logs');
    // Fetch OpenAI logs from API
    const { data: logs, isLoading: isLogsLoading, error: logsError } = useQuery({
        queryKey: ['/api/admin/openai-logs'],
        queryFn: async () => {
            const response = await apiRequest({ url: '/api/admin/openai-logs' });
            return response;
        },
        refetchInterval: 60000, // Refetch every minute
    });
    // Fetch model stats from API
    const { data: modelStats, isLoading: isModelStatsLoading, error: modelStatsError } = useQuery({
        queryKey: ['/api/admin/openai-stats/models'],
        queryFn: async () => {
            const response = await apiRequest({ url: '/api/admin/openai-stats/models' });
            return response;
        },
        refetchInterval: 60000, // Refetch every minute
    });
    // Fetch user stats from API
    const { data: userStats, isLoading: isUserStatsLoading, error: userStatsError } = useQuery({
        queryKey: ['/api/admin/openai-stats/users'],
        queryFn: async () => {
            const response = await apiRequest({ url: '/api/admin/openai-stats/users' });
            return response;
        },
        refetchInterval: 60000, // Refetch every minute
    });
    // Function to handle log export
    const handleExportLogs = () => {
        window.open('/api/admin/openai-logs/export', '_blank');
    };
    // Format timestamp to relative time
    const formatTimestamp = (timestamp) => {
        try {
            return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
        }
        catch (e) {
            return timestamp;
        }
    };
    // Format cost as dollars
    const formatCost = (cost) => {
        return `$${cost.toFixed(5)}`;
    };
    // If user is not an admin, redirect to dashboard
    if (!isAuthLoading && !isAdmin) {
        return _jsx(Redirect, { to: "/" });
    }
    if (isAuthLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsx(Loader2, { className: "h-12 w-12 animate-spin text-primary" }) }));
    }
    const isLoading = isLogsLoading || isModelStatsLoading || isUserStatsLoading;
    const hasError = logsError || modelStatsError || userStatsError;
    return (_jsxs("div", { className: "p-6 max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "OpenAI API Usage Dashboard" }), _jsxs(Button, { onClick: handleExportLogs, variant: "outline", className: "flex items-center gap-2", children: [_jsx(DownloadCloud, { className: "h-4 w-4" }), "Export as CSV"] })] }), _jsxs(Tabs, { defaultValue: "logs", value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { className: "mb-6", children: [_jsx(TabsTrigger, { value: "logs", children: "API Logs" }), _jsx(TabsTrigger, { value: "models", children: "Model Usage" }), _jsx(TabsTrigger, { value: "users", children: "User Usage" })] }), _jsx(TabsContent, { value: "logs", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "API Call Logs" }), _jsx(CardDescription, { children: "Review recent OpenAI API calls made by users in the application." })] }), _jsx(CardContent, { children: isLogsLoading ? (_jsx("div", { className: "space-y-3", children: Array(5).fill(0).map((_, i) => (_jsx(Skeleton, { className: "h-12 w-full" }, i))) })) : logsError ? (_jsxs("div", { className: "bg-destructive/20 text-destructive p-4 rounded-md", children: ["Error loading logs: ", logsError.message] })) : logs && logs.length > 0 ? (_jsx("div", { className: "overflow-x-auto", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "User" }), _jsx(TableHead, { children: "Timestamp" }), _jsx(TableHead, { children: "Model" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { className: "text-right", children: "Tokens" })] }) }), _jsx(TableBody, { children: logs.map((log, index) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: log.userId }), _jsx(TableCell, { children: formatTimestamp(log.timestamp) }), _jsx(TableCell, { children: log.model }), _jsx(TableCell, { children: _jsx("span", { className: `px-2 py-1 text-xs rounded-full ${log.status === 'success'
                                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`, children: log.status || 'unknown' }) }), _jsx(TableCell, { className: "text-right", children: log.total_tokens.toLocaleString() })] }, index))) })] }) })) : (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "No API logs found. Logs will appear here once users start using OpenAI features." })) })] }) }), _jsx(TabsContent, { value: "models", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Model Usage Statistics" }), _jsx(CardDescription, { children: "Review token usage and costs broken down by AI model." })] }), _jsx(CardContent, { children: isModelStatsLoading ? (_jsx("div", { className: "space-y-3", children: Array(3).fill(0).map((_, i) => (_jsx(Skeleton, { className: "h-20 w-full" }, i))) })) : modelStatsError ? (_jsxs("div", { className: "bg-destructive/20 text-destructive p-4 rounded-md", children: ["Error loading model statistics: ", modelStatsError.message] })) : modelStats && Object.keys(modelStats).length > 0 ? (_jsx("div", { className: "overflow-x-auto", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Model" }), _jsx(TableHead, { className: "text-right", children: "Requests" }), _jsx(TableHead, { className: "text-right", children: "Success Rate" }), _jsx(TableHead, { className: "text-right", children: "Total Tokens" }), _jsx(TableHead, { className: "text-right", children: "Est. Cost" })] }) }), _jsxs(TableBody, { children: [Object.entries(modelStats).map(([modelId, stats]) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: modelId }), _jsx(TableCell, { className: "text-right", children: stats.requests.toLocaleString() }), _jsx(TableCell, { className: "text-right", children: stats.requests > 0
                                                                        ? `${((stats.success_requests / stats.requests) * 100).toFixed(1)}%`
                                                                        : 'N/A' }), _jsx(TableCell, { className: "text-right", children: stats.total_tokens.toLocaleString() }), _jsx(TableCell, { className: "text-right", children: formatCost(stats.estimated_cost) })] }, modelId))), Object.values(modelStats).length > 0 && (_jsxs(TableRow, { className: "font-bold bg-muted/50", children: [_jsx(TableCell, { children: "TOTAL" }), _jsx(TableCell, { className: "text-right", children: Object.values(modelStats).reduce((sum, stat) => sum + stat.requests, 0).toLocaleString() }), _jsxs(TableCell, { className: "text-right", children: [Object.values(modelStats).reduce((sum, stat) => sum + stat.success_requests, 0) /
                                                                            Object.values(modelStats).reduce((sum, stat) => sum + stat.requests, 0) * 100, "%"] }), _jsx(TableCell, { className: "text-right", children: Object.values(modelStats)
                                                                        .reduce((sum, stat) => sum + stat.total_tokens, 0)
                                                                        .toLocaleString() }), _jsx(TableCell, { className: "text-right", children: formatCost(Object.values(modelStats).reduce((sum, stat) => sum + stat.estimated_cost, 0)) })] }))] })] }) })) : (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "No model statistics available yet. They will appear here once users start using OpenAI features." })) })] }) }), _jsx(TabsContent, { value: "users", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "User Usage Statistics" }), _jsx(CardDescription, { children: "Review token usage and costs broken down by user." })] }), _jsx(CardContent, { children: isUserStatsLoading ? (_jsx("div", { className: "space-y-3", children: Array(5).fill(0).map((_, i) => (_jsx(Skeleton, { className: "h-12 w-full" }, i))) })) : userStatsError ? (_jsxs("div", { className: "bg-destructive/20 text-destructive p-4 rounded-md", children: ["Error loading user statistics: ", userStatsError.message] })) : userStats && Object.keys(userStats).length > 0 ? (_jsx("div", { className: "overflow-x-auto", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "User ID" }), _jsx(TableHead, { className: "text-right", children: "Requests" }), _jsx(TableHead, { className: "text-right", children: "Total Tokens" }), _jsx(TableHead, { children: "Models Used" }), _jsx(TableHead, { className: "text-right", children: "Est. Cost" })] }) }), _jsxs(TableBody, { children: [Object.entries(userStats).map(([userId, stats]) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: userId }), _jsx(TableCell, { className: "text-right", children: stats.requests.toLocaleString() }), _jsx(TableCell, { className: "text-right", children: stats.total_tokens.toLocaleString() }), _jsx(TableCell, { children: _jsx("div", { className: "flex flex-wrap gap-1", children: stats.models_used.map(model => (_jsx("span", { className: "px-2 py-1 text-xs bg-primary/10 rounded-full", children: model.split('-')[1] || model }, model))) }) }), _jsx(TableCell, { className: "text-right", children: formatCost(stats.estimated_cost) })] }, userId))), Object.values(userStats).length > 0 && (_jsxs(TableRow, { className: "font-bold bg-muted/50", children: [_jsx(TableCell, { children: "TOTAL" }), _jsx(TableCell, { className: "text-right", children: Object.values(userStats)
                                                                        .reduce((sum, stat) => sum + stat.requests, 0)
                                                                        .toLocaleString() }), _jsx(TableCell, { className: "text-right", children: Object.values(userStats)
                                                                        .reduce((sum, stat) => sum + stat.total_tokens, 0)
                                                                        .toLocaleString() }), _jsx(TableCell, { children: "-" }), _jsx(TableCell, { className: "text-right", children: formatCost(Object.values(userStats).reduce((sum, stat) => sum + stat.estimated_cost, 0)) })] }))] })] }) })) : (_jsx("div", { className: "text-center py-8 text-muted-foreground", children: "No user statistics available yet. They will appear here once users start using OpenAI features." })) })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mt-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total API Calls" }), _jsx(BarChart2, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: isLoading ? (_jsx(Skeleton, { className: "h-8 w-20" })) : logs ? (logs.length.toLocaleString()) : ('0') }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Total OpenAI API calls tracked" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Tokens Used" }), _jsx(BarChart2, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: isLoading ? (_jsx(Skeleton, { className: "h-8 w-20" })) : logs ? (logs
                                            .reduce((sum, log) => sum + log.total_tokens, 0)
                                            .toLocaleString()) : ('0') }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Across all models and requests" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Estimated Cost" }), _jsx(BarChart2, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: isLoading ? (_jsx(Skeleton, { className: "h-8 w-20" })) : modelStats ? (formatCost(Object.values(modelStats).reduce((sum, stat) => sum + stat.estimated_cost, 0))) : ('$0.00') }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Based on current OpenAI pricing" })] })] })] })] }));
}
