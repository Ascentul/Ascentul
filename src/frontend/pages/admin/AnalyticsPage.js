import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, subMonths, startOfDay, endOfDay, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart as BarChartIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82ca9d"
];
export default function AnalyticsPage() {
    // State for filters
    const [dateRange, setDateRange] = useState("30d");
    const [customStartDate, setCustomStartDate] = useState(null);
    const [customEndDate, setCustomEndDate] = useState(null);
    const [userType, setUserType] = useState("all");
    const [featureFilter, setFeatureFilter] = useState("all");
    const [showCumulative, setShowCumulative] = useState(true);
    // Function to calculate date range based on selection
    const getDateRange = () => {
        const today = new Date();
        if (customStartDate && customEndDate) {
            return {
                start: startOfDay(customStartDate),
                end: endOfDay(customEndDate)
            };
        }
        switch (dateRange) {
            case "7d":
                return {
                    start: startOfDay(subDays(today, 7)),
                    end: endOfDay(today)
                };
            case "30d":
                return {
                    start: startOfDay(subDays(today, 30)),
                    end: endOfDay(today)
                };
            case "90d":
                return {
                    start: startOfDay(subDays(today, 90)),
                    end: endOfDay(today)
                };
            case "12m":
                return {
                    start: startOfDay(subMonths(today, 12)),
                    end: endOfDay(today)
                };
            case "ytd":
                return {
                    start: startOfDay(new Date(today.getFullYear(), 0, 1)),
                    end: endOfDay(today)
                };
            default:
                return {
                    start: startOfDay(subDays(today, 30)),
                    end: endOfDay(today)
                };
        }
    };
    // Fetch analytics data
    const { data: analyticsData, isLoading } = useQuery({
        queryKey: [
            "analyticsData",
            dateRange,
            customStartDate,
            customEndDate,
            userType
        ],
        queryFn: async () => {
            const response = await apiRequest("/api/admin/analytics");
            return response;
        }
    });
    // Helper function to format dates for display
    const formatDateForDisplay = (date) => {
        return format(date, "MMM d, yyyy");
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex h-full w-full items-center justify-center", children: _jsx("div", { className: "animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" }) }));
    }
    // Empty state for when no analytics data is available
    if (!analyticsData) {
        return (_jsx("div", { className: "max-w-4xl mx-auto p-4 md:p-6", children: _jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center p-10 text-center", children: [_jsx("div", { className: "rounded-full bg-muted p-6 mb-4", children: _jsx(BarChartIcon, { className: "h-10 w-10 text-muted-foreground" }) }), _jsx("h3", { className: "text-xl font-medium mb-2", children: "No Analytics Data Available" }), _jsx("p", { className: "text-muted-foreground mb-6", children: "Analytics data will appear as users begin using the platform." })] }) }) }));
    }
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Analytics" }), _jsx("p", { className: "text-muted-foreground", children: "Monitor your platform's performance and user activity" })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2 mt-4 md:mt-0", children: [_jsx("div", { className: "w-full sm:w-auto", children: _jsxs(Select, { value: dateRange, onValueChange: (value) => setDateRange(value), children: [_jsx(SelectTrigger, { className: "w-[160px]", children: _jsx(SelectValue, { placeholder: "Date Range" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "7d", children: "Last 7 days" }), _jsx(SelectItem, { value: "30d", children: "Last 30 days" }), _jsx(SelectItem, { value: "90d", children: "Last 90 days" }), _jsx(SelectItem, { value: "12m", children: "Last 12 months" }), _jsx(SelectItem, { value: "ytd", children: "Year to date" })] })] }) }), _jsx("div", { className: "w-full sm:w-auto", children: _jsxs(Select, { value: userType, onValueChange: (value) => setUserType(value), children: [_jsx(SelectTrigger, { className: "w-[160px]", children: _jsx(SelectValue, { placeholder: "User Type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Users" }), _jsx(SelectItem, { value: "free", children: "Free Users" }), _jsx(SelectItem, { value: "pro", children: "Pro Users" }), _jsx(SelectItem, { value: "university", children: "University Users" })] })] }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Total Users" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: analyticsData?.userSegmentation
                                            .reduce((total, segment) => total + segment.count, 0)
                                            .toLocaleString() }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [_jsxs("span", { className: "text-green-500", children: ["+", analyticsData?.recentSignups || 0] }), " ", "new in last 30 days"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Active Users (DAU/WAU)" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: analyticsData?.activeUsers[analyticsData.activeUsers.length - 1].dailyActive.toLocaleString() }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [_jsx("span", { className: "text-green-500", children: analyticsData?.activeUsers[analyticsData.activeUsers.length - 1].weeklyActive.toLocaleString() }), " ", "weekly active users"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Avg. Session Time" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: analyticsData?.activeUsers &&
                                            analyticsData.activeUsers.length > 0
                                            ? `${Math.round(analyticsData.activeUsers[analyticsData.activeUsers.length - 1].averageSessionTime / 60)}m ${analyticsData.activeUsers[analyticsData.activeUsers.length - 1].averageSessionTime % 60}s`
                                            : "0m 0s" }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Across all user segments" })] })] })] }), _jsxs(Card, { className: "col-span-1 md:col-span-2", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "User Growth" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Switch, { id: "cumulative-toggle", checked: showCumulative, onCheckedChange: setShowCumulative }), _jsx(Label, { htmlFor: "cumulative-toggle", children: "Cumulative" })] })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: analyticsData?.userGrowth || [], children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date", tickFormatter: (value) => {
                                                return format(new Date(value), "MMM yyyy");
                                            } }), _jsx(YAxis, {}), _jsx(Tooltip, { formatter: (value) => [
                                                `${value} users`,
                                                showCumulative ? "Total Users" : "New Signups"
                                            ], labelFormatter: (label) => format(new Date(label), "MMMM yyyy") }), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: showCumulative ? "cumulative" : "signups", stroke: "#8884d8", strokeWidth: 2, activeDot: { r: 8 }, name: showCumulative ? "Total Users" : "New Signups" })] }) }) }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { children: "User Segmentation" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex flex-col items-center h-80", children: [_jsx(ResponsiveContainer, { width: "100%", height: "70%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: analyticsData?.userSegmentation || [], cx: "50%", cy: "50%", outerRadius: 80, fill: "#8884d8", dataKey: "count", nameKey: "type", label: ({ type, count, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`, children: analyticsData?.userSegmentation?.map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value, name, props) => [
                                                            `${value.toLocaleString()} users`,
                                                            name
                                                        ] }), _jsx(Legend, {})] }) }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-2 w-full mt-4", children: analyticsData?.userSegmentation?.map((segment, index) => (_jsxs("div", { className: "flex flex-col items-center", children: [_jsx(Badge, { className: "px-4 py-1", style: {
                                                            backgroundColor: segment.color + "20",
                                                            color: segment.color,
                                                            borderColor: segment.color + "20"
                                                        }, children: segment.type }), _jsx("span", { className: "text-lg font-semibold mt-1", children: segment.count.toLocaleString() })] }, index))) })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "Feature Usage" }), _jsxs(Select, { value: featureFilter, onValueChange: (value) => setFeatureFilter(value), children: [_jsx(SelectTrigger, { className: "w-[120px] h-8", children: _jsx(SelectValue, { placeholder: "Segment" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Users" }), _jsx(SelectItem, { value: "free", children: "Free Users" }), _jsx(SelectItem, { value: "pro", children: "Pro Users" }), _jsx(SelectItem, { value: "university", children: "University" })] })] })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-96", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: [
                                                {
                                                    feature: "Application Tracker",
                                                    allUsers: 3452,
                                                    free: 1850,
                                                    pro: 1120,
                                                    university: 482
                                                },
                                                {
                                                    feature: "Career Goal Tracker",
                                                    allUsers: 2835,
                                                    free: 1230,
                                                    pro: 1060,
                                                    university: 545
                                                },
                                                {
                                                    feature: "Network Hub",
                                                    allUsers: 2540,
                                                    free: 1100,
                                                    pro: 950,
                                                    university: 490
                                                },
                                                {
                                                    feature: "CareerPath Explorer",
                                                    allUsers: 2105,
                                                    free: 580,
                                                    pro: 985,
                                                    university: 540
                                                },
                                                {
                                                    feature: "Project Portfolio",
                                                    allUsers: 1985,
                                                    free: 920,
                                                    pro: 780,
                                                    university: 285
                                                },
                                                {
                                                    feature: "Resume Studio",
                                                    allUsers: 3680,
                                                    free: 1950,
                                                    pro: 1180,
                                                    university: 550
                                                },
                                                {
                                                    feature: "Cover Letter Studio",
                                                    allUsers: 2890,
                                                    free: 1050,
                                                    pro: 1350,
                                                    university: 490
                                                },
                                                {
                                                    feature: "AI Career Coach",
                                                    allUsers: 2150,
                                                    free: 450,
                                                    pro: 1450,
                                                    university: 250
                                                },
                                                {
                                                    feature: "Voice Practice",
                                                    allUsers: 1850,
                                                    free: 320,
                                                    pro: 1280,
                                                    university: 250
                                                }
                                            ], layout: "vertical", margin: { left: 20, right: 20 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { type: "number" }), _jsx(YAxis, { type: "category", dataKey: "feature", width: 150 }), _jsx(Tooltip, { formatter: (value) => [
                                                        `${value.toLocaleString()} sessions`,
                                                        "Usage"
                                                    ] }), _jsx(Legend, {}), _jsx(Bar, { dataKey: featureFilter === "all"
                                                        ? "allUsers"
                                                        : featureFilter === "free"
                                                            ? "free"
                                                            : featureFilter === "pro"
                                                                ? "pro"
                                                                : "university", fill: "#1333c2", name: `${featureFilter === "all"
                                                        ? "All Users"
                                                        : featureFilter === "free"
                                                            ? "Free Users"
                                                            : featureFilter === "pro"
                                                                ? "Pro Users"
                                                                : "University Users"} (Sessions)` })] }) }) }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { children: "University License Usage" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: analyticsData?.universityLicenses?.map((university, index) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium", children: university.name }), _jsxs("div", { className: "text-sm text-muted-foreground", children: [university.seatsUsed, " / ", university.totalSeats, " seats used"] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("span", { className: "font-medium", children: [university.utilization, "%"] }), _jsx("div", { className: "text-sm text-muted-foreground", children: university.expiresIn <= 30 ? (_jsxs("span", { className: "text-orange-500", children: ["Expires in ", university.expiresIn, " days"] })) : (_jsxs("span", { children: ["Expires in ", university.expiresIn, " days"] })) })] })] }), _jsx(Progress, { value: university.utilization, className: university.expiresIn <= 30 ? "h-2 bg-orange-100" : "h-2" })] }, index))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { children: "Daily & Weekly Active Users" }) }), _jsx(CardContent, { children: _jsx("div", { className: "h-80", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(AreaChart, { data: analyticsData?.activeUsers || [], children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date", tickFormatter: (value) => format(new Date(value), "MMM d") }), _jsx(YAxis, {}), _jsx(Tooltip, { formatter: (value) => [
                                                        `${value.toLocaleString()} users`
                                                    ], labelFormatter: (label) => format(new Date(label), "MMMM d, yyyy") }), _jsx(Legend, {}), _jsx(Area, { type: "monotone", dataKey: "dailyActive", stackId: "1", stroke: "#8884d8", fill: "#8884d8", name: "Daily Active Users" }), _jsx(Area, { type: "monotone", dataKey: "weeklyActive", stackId: "2", stroke: "#82ca9d", fill: "#82ca9d", name: "Weekly Active Users" })] }) }) }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { children: "Top Users" }) }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Name" }), _jsx(TableHead, { children: "Email" }), _jsx(TableHead, { children: "Plan" }), _jsx(TableHead, { children: "Last Login" }), _jsx(TableHead, { children: "Total Sessions" }), _jsx(TableHead, { children: "Avg. Session" }), _jsx(TableHead, { children: "Features Used" })] }) }), _jsx(TableBody, { children: analyticsData?.topUsers?.map((user, index) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: user.name }), _jsx(TableCell, { children: user.email }), _jsx(TableCell, { children: _jsx(Badge, { variant: "outline", className: user.plan === "Free"
                                                        ? "bg-blue-500/20 text-blue-700 border-blue-500/20"
                                                        : user.plan === "Pro"
                                                            ? "bg-purple-500/20 text-purple-700 border-purple-500/20"
                                                            : "bg-green-500/20 text-green-700 border-green-500/20", children: user.plan }) }), _jsx(TableCell, { children: format(new Date(user.lastLogin), "MMM d, yyyy") }), _jsx(TableCell, { children: user.totalSessions }), _jsx(TableCell, { children: user.averageSessionTime }), _jsx(TableCell, { children: _jsxs("div", { className: "flex flex-wrap gap-1", children: [user.featuresUsed.slice(0, 2).map((feature, i) => (_jsx(Badge, { variant: "outline", className: "bg-primary/10 text-xs", children: feature }, i))), user.featuresUsed.length > 2 && (_jsxs(Badge, { variant: "outline", className: "bg-primary/10 text-xs", children: ["+", user.featuresUsed.length - 2, " more"] }))] }) })] }, index))) })] }) })] })] }));
}
