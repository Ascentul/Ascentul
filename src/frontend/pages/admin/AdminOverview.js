import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, BarChart4, Building, Calendar, TrendingUp, CreditCard, DollarSign, Percent, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
export default function AdminOverview() {
    // Consistent color palette as requested
    const COLORS = {
        FREE: "#1E90FF", // Blue
        PREMIUM: "#28A745", // Green
        UNIVERSITY: "#F4B400", // Orange
        REGULAR: "#6F42C1" // Purple
    };
    // Fetch real admin analytics data
    const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
        queryKey: ["/api/admin/analytics"],
        queryFn: async () => {
            const response = await apiRequest("/api/admin/analytics");
            return response;
        }
    });
    // Fetch user statistics
    const { data: userStats, isLoading: statsLoading } = useQuery({
        queryKey: ["/api/admin/users/stats"],
        queryFn: async () => {
            const response = await apiRequest("/api/admin/users/stats");
            return response;
        }
    });
    // Fetch subscription analytics
    const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
        queryKey: ["/api/admin/subscription-analytics"],
        queryFn: async () => {
            const response = await apiRequest("/api/admin/subscription-analytics");
            return response;
        }
    });
    // Loading state
    if (analyticsLoading || statsLoading || subscriptionLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" }) }));
    }
    // If no data available, show empty state
    if (!analyticsData || !userStats || !subscriptionData) {
        return (_jsx("div", { className: "max-w-4xl mx-auto p-4 md:p-6", children: _jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center p-10 text-center", children: [_jsx("div", { className: "rounded-full bg-muted p-6 mb-4", children: _jsx(BarChart4, { className: "h-10 w-10 text-muted-foreground" }) }), _jsx("h3", { className: "text-xl font-medium mb-2", children: "No Analytics Data Available" }), _jsx("p", { className: "text-muted-foreground mb-6", children: "Analytics data will appear as users begin using the platform." })] }) }) }));
    }
    // Transform data for charts
    const userGrowthData = analyticsData?.userGrowth || [];
    const userTypeData = Object.entries(analyticsData?.userTypeDistribution || {}).map(([type, count]) => ({
        name: type === "user"
            ? "Regular"
            : type === "university_user"
                ? "University"
                : type,
        value: count
    }));
    const planData = [
        { name: "Free", value: userStats?.freeUsers || 0 },
        { name: "Premium", value: userStats?.premiumUsers || 0 },
        { name: "University", value: userStats?.universityUsers || 0 }
    ];
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Admin Overview" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "Last updated:" }), _jsx("span", { className: "text-sm font-medium", children: new Date().toLocaleDateString() })] })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8", children: [_jsx(StatCard, { icon: _jsx(DollarSign, { className: "h-5 w-5 text-green-500" }), title: "Monthly Revenue", value: `$${(subscriptionData?.totalMRR || 0).toLocaleString()}`, trend: "Total MRR", trendUp: true }), _jsx(StatCard, { icon: _jsx(Target, { className: "h-5 w-5 text-blue-500" }), title: "Active Subscriptions", value: (subscriptionData?.activeSubscriptions || 0).toLocaleString(), trend: "Paying customers", trendUp: true }), _jsx(StatCard, { icon: _jsx(Percent, { className: "h-5 w-5 text-purple-500" }), title: "Conversion Rate", value: `${subscriptionData?.conversionRate || '0.0'}%`, trend: "Free to paid", trendUp: true }), _jsx(StatCard, { icon: _jsx(Users, { className: "h-5 w-5 text-primary" }), title: "Total Users", value: (subscriptionData?.totalUsers || 0).toLocaleString(), trend: "All registered users", trendUp: true })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8", children: [_jsx(StatCard, { icon: _jsx(Users, { className: "h-5 w-5 text-gray-500" }), title: "Free Users", value: (subscriptionData?.freeUsers || 0).toLocaleString(), trend: "On free plan", trendUp: false }), _jsx(StatCard, { icon: _jsx(CreditCard, { className: "h-5 w-5 text-amber-500" }), title: "Premium Users", value: (subscriptionData?.premiumUsers || 0).toLocaleString(), trend: `$${subscriptionData?.premiumMRR || 0} MRR`, trendUp: true }), _jsx(StatCard, { icon: _jsx(Building, { className: "h-5 w-5 text-blue-500" }), title: "University Users", value: (subscriptionData?.universityUsers || 0).toLocaleString(), trend: `$${subscriptionData?.universityMRR || 0} MRR`, trendUp: true }), _jsx(StatCard, { icon: _jsx(Activity, { className: "h-5 w-5 text-red-500" }), title: "Past Due", value: (subscriptionData?.pastDueSubscriptions || 0).toLocaleString(), trend: "Needs attention", trendUp: false })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { className: "h-5 w-5" }), "Subscription Growth (30 Days)"] }) }), _jsx(CardContent, { children: subscriptionData?.subscriptionGrowth?.length > 0 ? (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: subscriptionData.subscriptionGrowth, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date", tickFormatter: (value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }), _jsx(YAxis, {}), _jsx(Tooltip, { labelFormatter: (value) => new Date(value).toLocaleDateString(), formatter: (value, name) => [
                                                    name === 'newSubscriptions' ? `${value} new subs` : `$${value}`,
                                                    name === 'newSubscriptions' ? 'New Subscriptions' : 'MRR Impact'
                                                ] }), _jsx(Line, { type: "monotone", dataKey: "newSubscriptions", stroke: "#8884d8", strokeWidth: 2, name: "newSubscriptions" }), _jsx(Line, { type: "monotone", dataKey: "mrr", stroke: "#82ca9d", strokeWidth: 2, name: "mrr" })] }) })) : (_jsx("div", { className: "flex items-center justify-center h-[300px] text-muted-foreground", children: "No subscription growth data available" })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(BarChart4, { className: "h-5 w-5" }), "Subscription Plan Distribution"] }) }), _jsx(CardContent, { children: subscriptionData?.planDistribution?.length > 0 ? (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: subscriptionData.planDistribution, cx: "50%", cy: "50%", labelLine: false, label: ({ name, percentage }) => `${name}: ${percentage}%`, outerRadius: 80, fill: "#8884d8", dataKey: "value", children: subscriptionData.planDistribution.map((entry, index) => (_jsx(Cell, { fill: [
                                                        '#94a3b8', // Free - gray
                                                        '#f59e0b', // Premium - amber
                                                        '#3b82f6' // University - blue
                                                    ][index % 3] }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value, name) => [`${value} users`, name] })] }) })) : (_jsx("div", { className: "flex items-center justify-center h-[300px] text-muted-foreground", children: "No plan distribution data available" })) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-5 w-5" }), "Billing Cycle Distribution"] }) }), _jsx(CardContent, { children: subscriptionData?.billingCycleDistribution?.length > 0 ? (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: subscriptionData.billingCycleDistribution, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, { formatter: (value) => [`${value} users`, 'Count'] }), _jsx(Bar, { dataKey: "value", fill: "#8b5cf6" })] }) })) : (_jsx("div", { className: "flex items-center justify-center h-[300px] text-muted-foreground", children: "No billing cycle data available" })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Activity, { className: "h-5 w-5" }), "Subscription Status"] }) }), _jsx(CardContent, { children: subscriptionData?.subscriptionStatusBreakdown?.length > 0 ? (_jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: subscriptionData.subscriptionStatusBreakdown, cx: "50%", cy: "50%", labelLine: false, label: ({ name, value }) => `${name}: ${value}`, outerRadius: 80, fill: "#8884d8", dataKey: "value", children: subscriptionData.subscriptionStatusBreakdown.map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value, name) => [`${value} subscriptions`, name] })] }) })) : (_jsx("div", { className: "flex items-center justify-center h-[300px] text-muted-foreground", children: "No subscription status data available" })) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-lg", children: "Feature Usage" }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-96", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: [
                                        { name: "Application Tracker", usage: 83 },
                                        { name: "Career Goal Tracker", usage: 72 },
                                        { name: "Network Hub", usage: 68 },
                                        { name: "CareerPath Explorer", usage: 76 },
                                        { name: "Project Portfolio", usage: 70 },
                                        { name: "Resume Studio", usage: 78 },
                                        { name: "Cover Letter Studio", usage: 65 },
                                        { name: "AI Career Coach", usage: 91 }
                                    ], margin: { top: 5, right: 30, left: 20, bottom: 80 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name", angle: -45, textAnchor: "end", height: 80, tick: { fontSize: 12 } }), _jsx(YAxis, { label: {
                                                value: "Usage %",
                                                angle: -90,
                                                position: "insideLeft"
                                            } }), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "usage", fill: "#0C29AB" })] }) }) }) })] })] }));
}
function StatCard({ icon, title, value, trend, trendUp }) {
    return (_jsx(Card, { children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "bg-muted/50 p-2 rounded-md", children: icon }), _jsxs("div", { className: `flex items-center text-xs font-medium ${trendUp ? "text-green-500" : "text-red-500"}`, children: [trendUp ? (_jsx(TrendingUp, { className: "mr-1 h-3 w-3" })) : (_jsx(TrendingUp, { className: "mr-1 h-3 w-3 transform rotate-180" })), _jsx("span", { children: trend })] })] }), _jsxs("div", { className: "mt-4", children: [_jsx("p", { className: "text-sm font-medium text-muted-foreground", children: title }), _jsx("p", { className: "text-2xl font-bold", children: value })] })] }) }));
}
