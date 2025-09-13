import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useUser } from "@/lib/useUserData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Eye, AlertTriangle, Key, Activity, RefreshCw, Database, Server, Bell } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
export default function SystemSecurity() {
    const { user } = useUser();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("overview");
    // Check if user is super admin
    const isSuperAdmin = user?.role === "super_admin";
    if (!isSuperAdmin) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-96", children: [_jsx(Shield, { className: "h-16 w-16 text-gray-400 mb-4" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Access Restricted" }), _jsx("p", { className: "text-gray-600", children: "Super Administrator privileges required to access security settings." })] }));
    }
    // Mock data for security events
    const securityEvents = [
        {
            id: "1",
            type: "login_attempt",
            severity: "high",
            description: "Multiple failed login attempts from suspicious IP",
            user: "unknown",
            ip: "192.168.1.100",
            timestamp: "2024-01-15 14:30:22",
            status: "blocked"
        },
        {
            id: "2",
            type: "permission_change",
            severity: "medium",
            description: "Admin privileges granted to user",
            user: "admin@university.edu",
            ip: "10.0.0.15",
            timestamp: "2024-01-15 13:15:10",
            status: "allowed"
        },
        {
            id: "3",
            type: "data_access",
            severity: "low",
            description: "Bulk data export requested",
            user: "staff@ascentul.com",
            ip: "203.0.113.0",
            timestamp: "2024-01-15 12:45:33",
            status: "flagged"
        }
    ];
    const [securitySettings, setSecuritySettings] = useState({
        mfaRequired: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        ipWhitelisting: false,
        auditLogging: true,
        dataEncryption: true,
        apiRateLimit: 1000
    });
    const updateSecuritySetting = (key, value) => {
        setSecuritySettings((prev) => ({
            ...prev,
            [key]: value
        }));
        toast({
            title: "Security Setting Updated",
            description: `${key} has been updated successfully.`
        });
    };
    const getSeverityColor = (severity) => {
        switch (severity) {
            case "critical":
                return "bg-red-100 text-red-800 border-red-200";
            case "high":
                return "bg-orange-100 text-orange-800 border-orange-200";
            case "medium":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "low":
                return "bg-blue-100 text-blue-800 border-blue-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case "blocked":
                return "bg-red-100 text-red-800";
            case "allowed":
                return "bg-green-100 text-green-800";
            case "flagged":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    return (_jsxs("div", { className: "max-w-7xl mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold tracking-tight flex items-center gap-3", children: [_jsx(Shield, { className: "h-8 w-8 text-blue-600" }), "System Security"] }), _jsx("p", { className: "text-muted-foreground", children: "Monitor and configure security settings for the entire platform" })] }), _jsxs(Button, { variant: "outline", className: "gap-2", children: [_jsx(RefreshCw, { className: "h-4 w-4" }), "Refresh Data"] })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "space-y-6", children: [_jsxs(TabsList, { className: "grid grid-cols-4 w-full max-w-2xl", children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "events", children: "Security Events" }), _jsx(TabsTrigger, { value: "settings", children: "Settings" }), _jsx(TabsTrigger, { value: "monitoring", children: "Monitoring" })] }), _jsxs(TabsContent, { value: "overview", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Security Score" }), _jsx(Shield, { className: "h-4 w-4 text-green-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: "94%" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Excellent security posture" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Active Threats" }), _jsx(AlertTriangle, { className: "h-4 w-4 text-orange-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: "3" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "2 blocked, 1 monitoring" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Failed Logins" }), _jsx(Lock, { className: "h-4 w-4 text-red-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: "47" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Last 24 hours" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "System Uptime" }), _jsx(Activity, { className: "h-4 w-4 text-blue-600" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: "99.9%" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "30-day average" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Recent Security Events" }), _jsx(CardDescription, { children: "Latest security incidents and activities" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: securityEvents.slice(0, 5).map((event) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium", children: event.description }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [event.user, " \u2022 ", event.timestamp] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Badge, { className: getSeverityColor(event.severity), children: event.severity }), _jsx(Badge, { variant: "outline", className: getStatusColor(event.status), children: event.status })] })] }, event.id))) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Security Configuration" }), _jsx(CardDescription, { children: "Current security settings status" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Key, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: "Multi-Factor Authentication" })] }), _jsx(Badge, { variant: securitySettings.mfaRequired ? "default" : "secondary", children: securitySettings.mfaRequired ? "Enabled" : "Disabled" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Database, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: "Data Encryption" })] }), _jsx(Badge, { variant: securitySettings.dataEncryption ? "default" : "secondary", children: securitySettings.dataEncryption ? "Active" : "Inactive" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Eye, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: "Audit Logging" })] }), _jsx(Badge, { variant: securitySettings.auditLogging ? "default" : "secondary", children: securitySettings.auditLogging ? "Enabled" : "Disabled" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Server, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: "Session Timeout" })] }), _jsxs(Badge, { variant: "outline", children: [securitySettings.sessionTimeout, " minutes"] })] })] })] })] })] }), _jsx(TabsContent, { value: "events", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Security Events Log" }), _jsx(CardDescription, { children: "Comprehensive log of all security-related events and activities" })] }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Timestamp" }), _jsx(TableHead, { children: "Event Type" }), _jsx(TableHead, { children: "Description" }), _jsx(TableHead, { children: "User" }), _jsx(TableHead, { children: "IP Address" }), _jsx(TableHead, { children: "Severity" }), _jsx(TableHead, { children: "Status" })] }) }), _jsx(TableBody, { children: securityEvents.map((event) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-mono text-xs", children: event.timestamp }), _jsx(TableCell, { children: _jsx(Badge, { variant: "outline", children: event.type.replace("_", " ") }) }), _jsx(TableCell, { children: event.description }), _jsx(TableCell, { className: "font-mono text-sm", children: event.user }), _jsx(TableCell, { className: "font-mono text-sm", children: event.ip }), _jsx(TableCell, { children: _jsx(Badge, { className: getSeverityColor(event.severity), children: event.severity }) }), _jsx(TableCell, { children: _jsx(Badge, { className: getStatusColor(event.status), children: event.status }) })] }, event.id))) })] }) })] }) }), _jsx(TabsContent, { value: "settings", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Authentication Settings" }), _jsx(CardDescription, { children: "Configure login and authentication requirements" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "mfa-required", children: "Require Multi-Factor Authentication" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Force MFA for all admin accounts" })] }), _jsx(Switch, { id: "mfa-required", checked: securitySettings.mfaRequired, onCheckedChange: (checked) => updateSecuritySetting("mfaRequired", checked) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "session-timeout", children: "Session Timeout (minutes)" }), _jsx(Input, { id: "session-timeout", type: "number", value: securitySettings.sessionTimeout, onChange: (e) => updateSecuritySetting("sessionTimeout", parseInt(e.target.value)), className: "w-32" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "max-login-attempts", children: "Max Login Attempts" }), _jsx(Input, { id: "max-login-attempts", type: "number", value: securitySettings.maxLoginAttempts, onChange: (e) => updateSecuritySetting("maxLoginAttempts", parseInt(e.target.value)), className: "w-32" })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Security Monitoring" }), _jsx(CardDescription, { children: "Configure monitoring and logging settings" })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "audit-logging", children: "Enable Audit Logging" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Log all admin actions and data access" })] }), _jsx(Switch, { id: "audit-logging", checked: securitySettings.auditLogging, onCheckedChange: (checked) => updateSecuritySetting("auditLogging", checked) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "ip-whitelisting", children: "IP Whitelisting" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Restrict admin access by IP address" })] }), _jsx(Switch, { id: "ip-whitelisting", checked: securitySettings.ipWhitelisting, onCheckedChange: (checked) => updateSecuritySetting("ipWhitelisting", checked) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "api-rate-limit", children: "API Rate Limit (requests/hour)" }), _jsx(Input, { id: "api-rate-limit", type: "number", value: securitySettings.apiRateLimit, onChange: (e) => updateSecuritySetting("apiRateLimit", parseInt(e.target.value)), className: "w-32" })] })] })] })] }) }), _jsx(TabsContent, { value: "monitoring", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Real-time Alerts" }), _jsx(CardDescription, { children: "Active security monitoring alerts" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3 p-3 border rounded-lg border-orange-200 bg-orange-50", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-orange-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Suspicious Login Activity" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Multiple failed attempts detected" })] })] }), _jsxs("div", { className: "flex items-center gap-3 p-3 border rounded-lg border-blue-200 bg-blue-50", children: [_jsx(Bell, { className: "h-5 w-5 text-blue-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "System Update Available" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Security patch ready for deployment" })] })] })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "System Health" }), _jsx(CardDescription, { children: "Current system security status" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Database Security" }), _jsx(Badge, { className: "bg-green-100 text-green-800", children: "Optimal" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Network Security" }), _jsx(Badge, { className: "bg-green-100 text-green-800", children: "Secure" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Application Security" }), _jsx(Badge, { className: "bg-yellow-100 text-yellow-800", children: "Monitoring" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Data Encryption" }), _jsx(Badge, { className: "bg-green-100 text-green-800", children: "Active" })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Quick Actions" }), _jsx(CardDescription, { children: "Emergency security controls" })] }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "w-full justify-start", children: [_jsx(Lock, { className: "h-4 w-4 mr-2" }), "Lock All Sessions"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "w-full justify-start", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2" }), "Reset API Keys"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "w-full justify-start", children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), "Generate Audit Report"] }), _jsxs(Button, { variant: "destructive", size: "sm", className: "w-full justify-start", children: [_jsx(AlertTriangle, { className: "h-4 w-4 mr-2" }), "Emergency Lockdown"] })] })] })] }) })] })] }));
}
