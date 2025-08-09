import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from '@/hooks/use-toast';
import EmailTester from '@/components/EmailTester';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
/**
 * Email Administration Dashboard
 * A management interface for email-related functionality
 */
export default function EmailAdmin() {
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [mailStatus, setMailStatus] = useState({
        configured: false,
        apiKey: false,
        domain: false
    });
    // Check if the current user is an admin
    const [isAdmin, setIsAdmin] = useState(false);
    useEffect(() => {
        // Check if user is admin
        const checkAdmin = async () => {
            try {
                const response = await apiRequest('GET', '/api/users/me');
                const userData = await response.json();
                if (userData && (userData.userType === 'admin' || userData.userType === 'university_admin')) {
                    setIsAdmin(true);
                }
                else {
                    toast({
                        title: "Access Denied",
                        description: "You need administrator privileges to access this page.",
                        variant: "destructive"
                    });
                    navigate('/dashboard');
                }
            }
            catch (error) {
                console.error('Error checking admin status:', error);
                navigate('/dashboard');
            }
        };
        // Check mail service status
        const checkMailStatus = async () => {
            try {
                const response = await apiRequest('GET', '/api/mail/status');
                const statusData = await response.json();
                setMailStatus(statusData);
            }
            catch (error) {
                console.error('Error checking mail status:', error);
                setMailStatus({
                    configured: false,
                    apiKey: false,
                    domain: false,
                    message: 'Failed to connect to mail service'
                });
            }
            finally {
                setLoading(false);
            }
        };
        checkAdmin();
        checkMailStatus();
    }, [navigate, toast]);
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" }) }));
    }
    if (!isAdmin) {
        return (_jsx("div", { className: "container mx-auto py-12 px-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Access Denied" }), _jsx(CardDescription, { children: "You need administrator privileges to access this page." })] }), _jsx(CardFooter, { children: _jsx(Button, { onClick: () => navigate('/dashboard'), children: "Return to Dashboard" }) })] }) }));
    }
    return (_jsxs("div", { className: "container mx-auto py-8 px-4", children: [_jsx("h1", { className: "text-3xl font-bold mb-2", children: "Email Administration" }), _jsx("p", { className: "text-muted-foreground mb-8", children: "Manage and test email functionality." }), _jsxs(Card, { className: "mb-8", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Mail Service Status" }), _jsx(CardDescription, { children: "Current status of the email service connection." })] }), _jsxs(CardContent, { children: [_jsxs(Alert, { variant: mailStatus.configured ? "default" : "destructive", className: "mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [mailStatus.configured ? _jsx(CheckCircle, { className: "h-5 w-5" }) : _jsx(XCircle, { className: "h-5 w-5" }), _jsxs(AlertTitle, { children: ["Mail Service: ", mailStatus.configured ? 'Configured' : 'Not Configured'] })] }), _jsx(AlertDescription, { children: mailStatus.message || (mailStatus.configured
                                            ? 'The mail service is properly configured and ready to send emails.'
                                            : 'The mail service is not properly configured. Please check your environment variables.') })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 border rounded-md", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [mailStatus.apiKey ? _jsx(CheckCircle, { className: "h-5 w-5 text-green-500" }) : _jsx(AlertCircle, { className: "h-5 w-5 text-red-500" }), _jsx("h3", { className: "font-medium", children: "API Key" })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: mailStatus.apiKey
                                                    ? 'Mailgun API key is properly configured.'
                                                    : 'Mailgun API key is missing or invalid.' })] }), _jsxs("div", { className: "p-4 border rounded-md", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [mailStatus.domain ? _jsx(CheckCircle, { className: "h-5 w-5 text-green-500" }) : _jsx(AlertCircle, { className: "h-5 w-5 text-yellow-500" }), _jsx("h3", { className: "font-medium", children: "Mail Domain" })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: mailStatus.domain
                                                    ? 'Mail domain is properly configured.'
                                                    : 'Using default mail domain: mail.ascentul.io' })] })] })] })] }), _jsxs(Tabs, { defaultValue: "tester", className: "w-full", children: [_jsxs(TabsList, { className: "mb-6", children: [_jsx(TabsTrigger, { value: "tester", children: "Email Tester" }), _jsx(TabsTrigger, { value: "logs", children: "Email Logs" }), _jsx(TabsTrigger, { value: "templates", children: "Email Templates" })] }), _jsx(TabsContent, { value: "tester", children: _jsx(EmailTester, {}) }), _jsx(TabsContent, { value: "logs", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Email Logs" }), _jsx(CardDescription, { children: "View recent email activity and delivery status." })] }), _jsx(CardContent, { children: _jsx("p", { className: "py-12 text-center text-muted-foreground", children: "Email logging functionality will be implemented in a future update." }) })] }) }), _jsx(TabsContent, { value: "templates", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Email Templates" }), _jsx(CardDescription, { children: "Manage and customize email templates used throughout the application." })] }), _jsx(CardContent, { children: _jsx("p", { className: "py-12 text-center text-muted-foreground", children: "Email template management will be implemented in a future update." }) })] }) })] })] }));
}
