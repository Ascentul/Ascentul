import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { HelpCircle } from "lucide-react";
export function SupportAnalytics() {
    // Fetch real support analytics data
    const { data: supportData, isLoading } = useQuery({
        queryKey: ["/api/admin/support/analytics"],
        queryFn: async () => {
            const response = await apiRequest("/api/admin/support/analytics");
            return response;
        }
    });
    // Loading state
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-[400px]", children: _jsx("div", { className: "animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" }) }));
    }
    // Empty state if no support data
    if (!supportData) {
        return (_jsx("div", { className: "max-w-4xl mx-auto p-4 md:p-6", children: _jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center p-10 text-center", children: [_jsx("div", { className: "rounded-full bg-muted p-6 mb-4", children: _jsx(HelpCircle, { className: "h-10 w-10 text-muted-foreground" }) }), _jsx("h3", { className: "text-xl font-medium mb-2", children: "No Support Data Available" }), _jsx("p", { className: "text-muted-foreground mb-6", children: "Support analytics will appear when users start creating support tickets." })] }) }) }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Open Tickets" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: supportData?.openTickets || 0 }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Currently open tickets" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Avg Response Time" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: supportData?.avgResponseTime || "N/A" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Average response time" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Resolved Today" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: supportData?.resolvedToday || 0 }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Tickets resolved today" })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium", children: "Customer Satisfaction" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold", children: [supportData?.satisfaction || "N/A", "%"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Customer satisfaction rate" })] })] })] }), _jsxs(Card, { className: "col-span-4", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Support Tickets Overview" }) }), _jsx(CardContent, { className: "pl-2", children: _jsx(ResponsiveContainer, { width: "100%", height: 350, children: _jsxs(BarChart, { data: supportData?.chartData || [], children: [_jsx(XAxis, { dataKey: "name", stroke: "#888888", fontSize: 12, tickLine: false, axisLine: false }), _jsx(YAxis, { stroke: "#888888", fontSize: 12, tickLine: false, axisLine: false }), _jsx(Bar, { dataKey: "tickets", fill: "#adfa1d", radius: [4, 4, 0, 0] })] }) }) })] })] }));
}
