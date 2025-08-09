import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Mail, Users, AlertCircle, Copy, Check, Upload, Loader2 } from 'lucide-react';
// Form schema for inviting students
const inviteFormSchema = z.object({
    emailAddresses: z.string()
        .min(1, "Email addresses are required")
        .refine(emails => {
        const emailList = emails.split(',').map(email => email.trim());
        return emailList.every(email => {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        });
    }, {
        message: "Please enter valid email addresses separated by commas"
    }),
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(1, "Message is required"),
    program: z.string().min(1, "Program is required"),
    sendCopy: z.boolean().default(false),
    expirationDays: z.string().min(1, "Expiration period is required"),
});
export default function Invite() {
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [inviteSent, setInviteSent] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    // Fetch academic programs data from the API
    const { data: programs, isLoading, error } = useQuery({
        queryKey: ['/academic-programs'],
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
    const form = useForm({
        resolver: zodResolver(inviteFormSchema),
        defaultValues: {
            emailAddresses: "",
            subject: "Invitation to Ascentul Career Platform",
            message: "Dear Student,\n\nYou have been invited to join the Ascentul Career Development Platform by your university. This platform will help you prepare for your career journey with AI-powered tools for resume building, interview preparation, and more.\n\nPlease click the link below to create your account and get started.\n\nBest regards,\nCareer Services Team",
            program: "",
            sendCopy: true,
            expirationDays: "30",
        }
    });
    const handleCsvUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setCsvFile(file);
            toast({
                title: "CSV File Selected",
                description: `${file.name} has been selected. Click "Parse Emails" to extract email addresses.`,
            });
        }
    };
    const parseCsvFile = () => {
        if (!csvFile) {
            toast({
                title: "No CSV File",
                description: "Please upload a CSV file first.",
                variant: "destructive",
            });
            return;
        }
        // In a real implementation, we would parse the CSV file
        // For demo purposes, we'll just set some sample emails
        const sampleEmails = "student1@stanford.edu, student2@stanford.edu, student3@stanford.edu, student4@stanford.edu, student5@stanford.edu";
        form.setValue("emailAddresses", sampleEmails);
        toast({
            title: "Emails Extracted",
            description: `Successfully extracted ${sampleEmails.split(',').length} email addresses from the CSV file.`,
        });
    };
    const copyInviteLink = () => {
        // In a real implementation, we would generate an actual invite link
        const inviteLink = "https://app.ascentul.com/invite/abc123xyz456";
        navigator.clipboard.writeText(inviteLink);
        setIsCopied(true);
        toast({
            title: "Invite Link Copied",
            description: "The invite link has been copied to your clipboard.",
        });
        setTimeout(() => {
            setIsCopied(false);
        }, 3000);
    };
    const onSubmit = (data) => {
        console.log("Form data:", data);
        // Count the number of emails
        const emailCount = data.emailAddresses.split(',').filter(email => email.trim().length > 0).length;
        toast({
            title: "Invitations Sent",
            description: `Successfully sent ${emailCount} invitations to students.`,
        });
        setInviteSent(true);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Invite Students" }), _jsx("p", { className: "text-muted-foreground", children: "Send invitations to students to join the Ascentul Career Development Platform." })] }), _jsxs("div", { className: "grid md:grid-cols-3 gap-6", children: [_jsx("div", { className: "md:col-span-2", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Send Invitations" }), _jsx(CardDescription, { children: "Invite students via email to create their accounts on the platform." })] }), _jsx(CardContent, { children: _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsx(FormField, { control: form.control, name: "emailAddresses", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email Addresses" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Enter email addresses separated by commas", className: "min-h-32", ...field }) }), _jsx(FormDescription, { children: "Enter student email addresses separated by commas, or upload a CSV file." }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { type: "button", variant: "outline", asChild: true, children: _jsxs("label", { className: "cursor-pointer", children: [_jsx(Upload, { className: "mr-2 h-4 w-4" }), "Upload CSV", _jsx("input", { type: "file", accept: ".csv", className: "hidden", onChange: handleCsvUpload })] }) }), _jsx(Button, { type: "button", variant: "outline", onClick: parseCsvFile, disabled: !csvFile, children: "Parse Emails" }), csvFile && (_jsx("p", { className: "text-sm text-muted-foreground", children: csvFile.name }))] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6", children: [_jsx(FormField, { control: form.control, name: "program", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Program" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a program" }) }) }), _jsx(SelectContent, { children: isLoading ? (_jsx("div", { className: "flex items-center justify-center py-6", children: _jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) })) : error ? (_jsxs("div", { className: "flex items-center justify-center py-6 text-destructive", children: [_jsx(AlertCircle, { className: "h-5 w-5 mr-2" }), _jsx("span", { children: "Failed to load programs" })] })) : !programs || programs.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-6 text-muted-foreground", children: [_jsx("p", { children: "No programs found" }), _jsx("p", { className: "text-xs mt-1", children: "Add programs in Settings" })] })) : (_jsxs(_Fragment, { children: [_jsxs(SelectGroup, { children: [_jsx(SelectLabel, { children: "Undergraduate Programs" }), programs
                                                                                                    .filter(program => program.active &&
                                                                                                    ["Associate", "Bachelor"].includes(program.degreeType))
                                                                                                    .map(program => (_jsxs(SelectItem, { value: program.id.toString(), children: [program.programName, " (", program.degreeType, ")"] }, program.id)))] }), _jsxs(SelectGroup, { children: [_jsx(SelectLabel, { children: "Graduate Programs" }), programs
                                                                                                    .filter(program => program.active &&
                                                                                                    ["Master", "Doctorate", "Certificate"].includes(program.degreeType))
                                                                                                    .map(program => (_jsxs(SelectItem, { value: program.id.toString(), children: [program.programName, " (", program.degreeType, ")"] }, program.id)))] })] })) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "expirationDays", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Invitation Expiration" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select expiration period" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "7", children: "7 days" }), _jsx(SelectItem, { value: "14", children: "14 days" }), _jsx(SelectItem, { value: "30", children: "30 days" }), _jsx(SelectItem, { value: "60", children: "60 days" }), _jsx(SelectItem, { value: "90", children: "90 days" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "subject", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email Subject" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Email subject line", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "message", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email Message" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Enter email message content", className: "min-h-32", ...field }) }), _jsx(FormDescription, { children: "Customize the invitation message sent to students." }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "sendCopy", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4", children: [_jsx(FormControl, { children: _jsx(Checkbox, { checked: field.value, onCheckedChange: field.onChange }) }), _jsxs("div", { className: "space-y-1 leading-none", children: [_jsx(FormLabel, { children: "Send me a copy" }), _jsx(FormDescription, { children: "Receive a copy of the invitation email for your records." })] })] })) }), _jsxs(Button, { type: "submit", children: [_jsx(Mail, { className: "mr-2 h-4 w-4" }), "Send Invitations"] })] }) }) })] }) }), _jsxs("div", { className: "md:col-span-1 space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Invite Link" }), _jsx(CardDescription, { children: "Generate a shareable invite link that can be used by multiple students." })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("div", { className: "grid flex-1 gap-2", children: [_jsx("div", { className: "font-medium", children: "Ascentul Invite Link" }), _jsx("div", { className: "truncate text-sm text-muted-foreground", children: "https://app.ascentul.com/invite/abc123xyz456" })] }), _jsx(Button, { variant: "outline", size: "icon", onClick: copyInviteLink, children: isCopied ? (_jsx(Check, { className: "h-4 w-4" })) : (_jsx(Copy, { className: "h-4 w-4" })) })] }), _jsx(Button, { className: "w-full", variant: "outline", onClick: copyInviteLink, children: isCopied ? "Copied!" : "Copy Invite Link" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Recent Activity" }), _jsx(CardDescription, { children: "Recent student invitation activity." })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "25 Students" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Invited this month" })] }), _jsx(Users, { className: "h-8 w-8 text-primary opacity-80" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-sm font-medium", children: "Recent Invites" }), _jsxs("div", { className: "text-sm", children: [_jsxs("p", { className: "flex justify-between py-1", children: [_jsx("span", { children: "Computer Science (BS)" }), _jsx("span", { className: "text-muted-foreground", children: "12 students" })] }), _jsxs("p", { className: "flex justify-between py-1", children: [_jsx("span", { children: "MBA Program" }), _jsx("span", { className: "text-muted-foreground", children: "8 students" })] }), _jsxs("p", { className: "flex justify-between py-1", children: [_jsx("span", { children: "Engineering (MS)" }), _jsx("span", { className: "text-muted-foreground", children: "5 students" })] })] })] })] }) })] })] })] }), inviteSent && (_jsxs(Alert, { children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx(AlertTitle, { children: "Success!" }), _jsx(AlertDescription, { children: "Invitations have been sent successfully. Students will receive an email with instructions to join the platform." })] }))] }));
}
