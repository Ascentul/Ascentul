import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Loader2, Send, Info, Mail, Building } from 'lucide-react';
// Zod schema for the test email form
const testEmailSchema = z.object({
    recipient: z.string().email({ message: "Please enter a valid email address" }),
    subject: z.string().min(1, { message: "Subject is required" }),
    template: z.string().optional(),
    content: z.string().min(1, { message: "Email content is required" }),
});
// Zod schema for the university invite form
const universityInviteSchema = z.object({
    universityName: z.string().min(1, { message: "University name is required" }),
    adminEmail: z.string().email({ message: "Please enter a valid email address" }),
    adminName: z.string().min(1, { message: "Admin name is required" }),
});
export default function TestEmailPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [testResult, setTestResult] = useState(null);
    // General test email form
    const form = useForm({
        resolver: zodResolver(testEmailSchema),
        defaultValues: {
            recipient: "",
            subject: "Test Email from CareerTracker",
            template: "general",
            content: "This is a test email from the CareerTracker admin panel. If you're seeing this, the email system is working correctly.",
        },
    });
    // University invite form
    const inviteForm = useForm({
        resolver: zodResolver(universityInviteSchema),
        defaultValues: {
            universityName: "",
            adminEmail: "",
            adminName: "",
        },
    });
    // Submit handler for general test email
    const onSubmit = async (values) => {
        setIsLoading(true);
        setTestResult(null);
        try {
            const response = await apiRequest("POST", "/api/admin/test-email", values);
            const data = await response.json();
            setTestResult({
                success: response.ok,
                message: response.ok ? "Email sent successfully!" : "Failed to send email",
                details: data.message || JSON.stringify(data),
            });
            if (response.ok) {
                toast({
                    title: "Email Sent",
                    description: "Test email was sent successfully.",
                });
            }
            else {
                toast({
                    title: "Error",
                    description: "Failed to send test email. See details below.",
                    variant: "destructive",
                });
            }
        }
        catch (error) {
            setTestResult({
                success: false,
                message: "Error sending email",
                details: error instanceof Error ? error.message : String(error),
            });
            toast({
                title: "Error",
                description: "An error occurred while sending the test email.",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    // Submit handler for university invite test
    const onInviteSubmit = async (values) => {
        setIsLoading(true);
        setTestResult(null);
        try {
            const response = await apiRequest("POST", "/api/admin/test-university-invite", values);
            const data = await response.json();
            setTestResult({
                success: response.ok,
                message: response.ok ? "University invite email sent successfully!" : "Failed to send university invite",
                details: data.message || JSON.stringify(data),
            });
            if (response.ok) {
                toast({
                    title: "Invite Sent",
                    description: "University invite email was sent successfully.",
                });
            }
            else {
                toast({
                    title: "Error",
                    description: "Failed to send university invite. See details below.",
                    variant: "destructive",
                });
            }
        }
        catch (error) {
            setTestResult({
                success: false,
                message: "Error sending university invite",
                details: error instanceof Error ? error.message : String(error),
            });
            toast({
                title: "Error",
                description: "An error occurred while sending the university invite.",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex justify-between items-center", children: _jsx("h1", { className: "text-2xl font-bold", children: "Email Testing Tools" }) }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsxs(TabsTrigger, { value: "general", children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), "General Test Email"] }), _jsxs(TabsTrigger, { value: "university", children: [_jsx(Building, { className: "w-4 h-4 mr-2" }), "University Invite"] })] }), _jsxs(TabsContent, { value: "general", className: "space-y-4 mt-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Send Test Email" }), _jsx(CardDescription, { children: "Test the email delivery system by sending a test email." })] }), _jsx(CardContent, { children: _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "recipient", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Recipient Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "test@example.com", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "subject", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Subject" }), _jsx(FormControl, { children: _jsx(Input, { ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "template", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email Template (Optional)" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a template" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "general", children: "General" }), _jsx(SelectItem, { value: "welcome", children: "Welcome" }), _jsx(SelectItem, { value: "password-reset", children: "Password Reset" }), _jsx(SelectItem, { value: "verification", children: "Email Verification" })] })] }), _jsx(FormDescription, { children: "Select a template or leave as General for a basic test email." }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "content", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email Content" }), _jsx(FormControl, { children: _jsx(Textarea, { rows: 5, className: "resize-none", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Sending..."] })) : (_jsxs(_Fragment, { children: [_jsx(Send, { className: "mr-2 h-4 w-4" }), "Send Test Email"] })) })] }) }) })] }), testResult && (_jsxs(Card, { className: testResult.success ? "border-green-500" : "border-red-500", children: [_jsx(CardHeader, { className: testResult.success ? "bg-green-50" : "bg-red-50", children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Info, { className: "mr-2 h-5 w-5" }), testResult.message] }) }), testResult.details && (_jsx(CardContent, { children: _jsx("pre", { className: "bg-muted p-4 rounded-md overflow-auto text-sm", children: testResult.details }) }))] }))] }), _jsxs(TabsContent, { value: "university", className: "space-y-4 mt-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Test University Invite" }), _jsx(CardDescription, { children: "Test the university admin invitation email system." })] }), _jsx(CardContent, { children: _jsx(Form, { ...inviteForm, children: _jsxs("form", { onSubmit: inviteForm.handleSubmit(onInviteSubmit), className: "space-y-4", children: [_jsx(FormField, { control: inviteForm.control, name: "universityName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "University Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Example University", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: inviteForm.control, name: "adminEmail", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Admin Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "admin@university.edu", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: inviteForm.control, name: "adminName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Admin Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "John Smith", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Sending..."] })) : (_jsxs(_Fragment, { children: [_jsx(Send, { className: "mr-2 h-4 w-4" }), "Send University Invite"] })) })] }) }) })] }), testResult && (_jsxs(Card, { className: testResult.success ? "border-green-500" : "border-red-500", children: [_jsx(CardHeader, { className: testResult.success ? "bg-green-50" : "bg-red-50", children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Info, { className: "mr-2 h-5 w-5" }), testResult.message] }) }), testResult.details && (_jsx(CardContent, { children: _jsx("pre", { className: "bg-muted p-4 rounded-md overflow-auto text-sm", children: testResult.details }) }))] }))] })] })] }));
}
