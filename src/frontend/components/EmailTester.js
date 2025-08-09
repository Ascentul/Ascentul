import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
/**
 * Email Tester Component for Developers and Admins
 * This component provides a simple interface to test various email types
 */
export default function EmailTester() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    // Test email state
    const [testEmail, setTestEmail] = useState('');
    const [testName, setTestName] = useState('');
    // Welcome email state
    const [welcomeEmail, setWelcomeEmail] = useState('');
    const [welcomeName, setWelcomeName] = useState('');
    // Application update email state
    const [applicationEmail, setApplicationEmail] = useState('');
    const [applicationName, setApplicationName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [positionTitle, setPositionTitle] = useState('');
    const [status, setStatus] = useState('Interviewing');
    // Custom email state
    const [customEmail, setCustomEmail] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [customText, setCustomText] = useState('');
    const [customHtml, setCustomHtml] = useState('');
    // Send test email
    const sendTestEmail = async () => {
        if (!testEmail) {
            toast({
                title: "Email Required",
                description: "Please enter an email address to send the test email to.",
                variant: "destructive"
            });
            return;
        }
        setLoading(true);
        try {
            const response = await apiRequest('POST', '/api/mail/test', {
                recipient: testEmail,
                name: testName
            });
            const data = await response.json();
            toast({
                title: "Test Email Sent",
                description: `Email sent successfully to ${testEmail}`,
            });
        }
        catch (error) {
            console.error('Error sending test email:', error);
            toast({
                title: "Email Failed",
                description: error.message || "Failed to send test email",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    // Send welcome email
    const sendWelcomeEmail = async () => {
        if (!welcomeEmail) {
            toast({
                title: "Email Required",
                description: "Please enter an email address to send the welcome email to.",
                variant: "destructive"
            });
            return;
        }
        setLoading(true);
        try {
            const response = await apiRequest('POST', '/api/mail/welcome', {
                email: welcomeEmail,
                name: welcomeName
            });
            const data = await response.json();
            toast({
                title: "Welcome Email Sent",
                description: `Email sent successfully to ${welcomeEmail}`,
            });
        }
        catch (error) {
            console.error('Error sending welcome email:', error);
            toast({
                title: "Email Failed",
                description: error.message || "Failed to send welcome email",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    // Send application update email
    const sendApplicationEmail = async () => {
        if (!applicationEmail || !companyName || !positionTitle || !status) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all required fields.",
                variant: "destructive"
            });
            return;
        }
        setLoading(true);
        try {
            const response = await apiRequest('POST', '/api/mail/application-update', {
                email: applicationEmail,
                name: applicationName,
                companyName,
                positionTitle,
                status
            });
            const data = await response.json();
            toast({
                title: "Application Update Email Sent",
                description: `Email sent successfully to ${applicationEmail}`,
            });
        }
        catch (error) {
            console.error('Error sending application update email:', error);
            toast({
                title: "Email Failed",
                description: error.message || "Failed to send application update email",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    // Send custom email
    const sendCustomEmail = async () => {
        if (!customEmail || !customSubject || (!customText && !customHtml)) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all required fields (to, subject, and either text or HTML content).",
                variant: "destructive"
            });
            return;
        }
        setLoading(true);
        try {
            const response = await apiRequest('POST', '/api/mail/custom', {
                to: customEmail,
                subject: customSubject,
                text: customText,
                html: customHtml
            });
            const data = await response.json();
            toast({
                title: "Custom Email Sent",
                description: `Email sent successfully to ${customEmail}`,
            });
        }
        catch (error) {
            console.error('Error sending custom email:', error);
            toast({
                title: "Email Failed",
                description: error.message || "Failed to send custom email",
                variant: "destructive"
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "container max-w-4xl mx-auto py-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Email Testing Tool" }), _jsxs("p", { className: "text-muted-foreground mb-6", children: ["This tool allows developers and administrators to test the email functionality. All emails are sent through Mailgun and will appear from the ", _jsx("code", { children: "no-reply@mail.ascentul.io" }), " address."] }), _jsxs(Tabs, { defaultValue: "test", className: "w-full", children: [_jsxs(TabsList, { className: "w-full grid grid-cols-4", children: [_jsx(TabsTrigger, { value: "test", children: "Test Email" }), _jsx(TabsTrigger, { value: "welcome", children: "Welcome Email" }), _jsx(TabsTrigger, { value: "application", children: "Application Update" }), _jsx(TabsTrigger, { value: "custom", children: "Custom Email" })] }), _jsx(TabsContent, { value: "test", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Send Test Email" }), _jsx(CardDescription, { children: "Send a simple test email to verify that the email service is working correctly." })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "test-email", children: "Recipient Email" }), _jsx(Input, { id: "test-email", type: "email", placeholder: "recipient@example.com", value: testEmail, onChange: (e) => setTestEmail(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "test-name", children: "Recipient Name (optional)" }), _jsx(Input, { id: "test-name", placeholder: "John Doe", value: testName, onChange: (e) => setTestName(e.target.value) })] })] }), _jsx(CardFooter, { children: _jsx(Button, { onClick: sendTestEmail, disabled: loading || !testEmail, children: loading ? "Sending..." : "Send Test Email" }) })] }) }), _jsx(TabsContent, { value: "welcome", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Send Welcome Email" }), _jsx(CardDescription, { children: "Send a welcome email to a user to simulate the onboarding process." })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "welcome-email", children: "Recipient Email" }), _jsx(Input, { id: "welcome-email", type: "email", placeholder: "recipient@example.com", value: welcomeEmail, onChange: (e) => setWelcomeEmail(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "welcome-name", children: "Recipient Name (optional)" }), _jsx(Input, { id: "welcome-name", placeholder: "John Doe", value: welcomeName, onChange: (e) => setWelcomeName(e.target.value) })] })] }), _jsx(CardFooter, { children: _jsx(Button, { onClick: sendWelcomeEmail, disabled: loading || !welcomeEmail, children: loading ? "Sending..." : "Send Welcome Email" }) })] }) }), _jsx(TabsContent, { value: "application", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Send Application Update Email" }), _jsx(CardDescription, { children: "Send an email notification about an application status change." })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "app-email", children: "Recipient Email" }), _jsx(Input, { id: "app-email", type: "email", placeholder: "recipient@example.com", value: applicationEmail, onChange: (e) => setApplicationEmail(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "app-name", children: "Recipient Name (optional)" }), _jsx(Input, { id: "app-name", placeholder: "John Doe", value: applicationName, onChange: (e) => setApplicationName(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "company-name", children: "Company Name" }), _jsx(Input, { id: "company-name", placeholder: "Acme Corp", value: companyName, onChange: (e) => setCompanyName(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "position-title", children: "Position Title" }), _jsx(Input, { id: "position-title", placeholder: "Software Engineer", value: positionTitle, onChange: (e) => setPositionTitle(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "status", children: "Application Status" }), _jsxs("select", { id: "status", className: "w-full p-2 border rounded-md", value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "Applied", children: "Applied" }), _jsx("option", { value: "Interviewing", children: "Interviewing" }), _jsx("option", { value: "Offer", children: "Offer Received" }), _jsx("option", { value: "Rejected", children: "Rejected" }), _jsx("option", { value: "Closed", children: "Closed" })] })] })] }), _jsx(CardFooter, { children: _jsx(Button, { onClick: sendApplicationEmail, disabled: loading || !applicationEmail || !companyName || !positionTitle || !status, children: loading ? "Sending..." : "Send Application Update Email" }) })] }) }), _jsx(TabsContent, { value: "custom", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Send Custom Email" }), _jsx(CardDescription, { children: "Send a fully customized email with your own subject and content." })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "custom-email", children: "Recipient Email" }), _jsx(Input, { id: "custom-email", type: "email", placeholder: "recipient@example.com", value: customEmail, onChange: (e) => setCustomEmail(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "custom-subject", children: "Subject" }), _jsx(Input, { id: "custom-subject", placeholder: "Your Email Subject", value: customSubject, onChange: (e) => setCustomSubject(e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "custom-text", children: "Plain Text Content" }), _jsx(Textarea, { id: "custom-text", placeholder: "Enter the plain text version of your email...", value: customText, onChange: (e) => setCustomText(e.target.value), rows: 4 })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "custom-html", children: "HTML Content (optional)" }), _jsx(Textarea, { id: "custom-html", placeholder: "Enter the HTML version of your email...", value: customHtml, onChange: (e) => setCustomHtml(e.target.value), rows: 6 })] })] }), _jsx(CardFooter, { children: _jsx(Button, { onClick: sendCustomEmail, disabled: loading || !customEmail || !customSubject || (!customText && !customHtml), children: loading ? "Sending..." : "Send Custom Email" }) })] }) })] })] }));
}
