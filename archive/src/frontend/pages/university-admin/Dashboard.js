import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/useUserData";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Users, GraduationCap, CalendarDays, TrendingUp, Bell, FileText, BookOpen, Activity, Calendar, Mail, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
// Data for charts
const usageData = [
    { name: 'Jan', logins: 1200, activities: 3400 },
    { name: 'Feb', logins: 1350, activities: 3800 },
    { name: 'Mar', logins: 1500, activities: 4200 },
    { name: 'Apr', logins: 1650, activities: 4600 },
    { name: 'May', logins: 1800, activities: 5000 },
];
const featureUsageData = [
    { name: 'Resume Builder', value: 420 },
    { name: 'Career Paths', value: 350 },
    { name: 'Interview Prep', value: 280 },
    { name: 'AI Coaching', value: 250 },
    { name: 'Job Search', value: 200 },
];
const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];
// Define validation schema for email form
const emailFormSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(1, "Message is required"),
});
export default function Dashboard() {
    const { user } = useUser();
    const { toast } = useToast();
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    // Initialize form with react-hook-form
    const form = useForm({
        resolver: zodResolver(emailFormSchema),
        defaultValues: {
            subject: "",
            message: "",
        },
    });
    // Handle email form submission
    const handleSendEmail = async (data) => {
        setIsSending(true);
        try {
            // In a real application, this would make an API call
            // await apiRequest('POST', '/api/email/send-mass', {
            //   subject: data.subject,
            //   message: data.message,
            //   recipients: 'all'
            // });
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast({
                title: "Email Sent Successfully",
                description: `Email sent to all students with subject "${data.subject}"`,
                variant: "default",
            });
            form.reset();
            setEmailDialogOpen(false);
        }
        catch (error) {
            toast({
                title: "Failed to Send Email",
                description: "There was an error sending the email. Please try again.",
                variant: "destructive",
            });
        }
        setIsSending(false);
    };
    // Mock stats for the university
    const mockStats = {
        totalStudents: 1500,
        activeStudents: 1280,
        totalSeats: 2000,
        contractExpirationDate: 'May 15, 2026',
        avgEngagementScore: 7.8,
        recentLogins: [
            {
                id: 1,
                studentName: 'Emma Johnson',
                email: 'emma.johnson@stanford.edu',
                lastLoginTime: '2 minutes ago',
                profileImage: 'https://i.pravatar.cc/150?img=1'
            },
            {
                id: 2,
                studentName: 'Michael Chang',
                email: 'michael.chang@stanford.edu',
                lastLoginTime: '15 minutes ago',
                profileImage: 'https://i.pravatar.cc/150?img=2'
            },
            {
                id: 3,
                studentName: 'Sophia Martinez',
                email: 'sophia.martinez@stanford.edu',
                lastLoginTime: '37 minutes ago',
                profileImage: 'https://i.pravatar.cc/150?img=3'
            },
            {
                id: 4,
                studentName: 'James Wilson',
                email: 'james.wilson@stanford.edu',
                lastLoginTime: '1 hour ago',
                profileImage: 'https://i.pravatar.cc/150?img=4'
            },
            {
                id: 5,
                studentName: 'Olivia Brown',
                email: 'olivia.brown@stanford.edu',
                lastLoginTime: '2 hours ago',
                profileImage: 'https://i.pravatar.cc/150?img=5'
            }
        ]
    };
    // Function to get initials from name
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase();
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "University Dashboard" }), _jsxs("p", { className: "text-muted-foreground", children: ["Overview of ", user?.universityName || 'Stanford University', "'s platform usage and student engagement."] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Total Students" }), _jsx(Users, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: mockStats.totalStudents }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [Math.round((mockStats.activeStudents / mockStats.totalStudents) * 100), "% active this month"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "License Utilization" }), _jsx(GraduationCap, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "text-2xl font-bold", children: [mockStats.totalStudents, "/", mockStats.totalSeats] }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [Math.round((mockStats.totalStudents / mockStats.totalSeats) * 100), "% of licensed seats used"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Contract Expiration" }), _jsx(CalendarDays, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: mockStats.contractExpirationDate }), _jsx("p", { className: "text-xs text-muted-foreground", children: "One year institutional license" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Avg. Engagement Score" }), _jsx(TrendingUp, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: mockStats.avgEngagementScore }), _jsx("p", { className: "text-xs text-muted-foreground", children: "+12% from last month" })] })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs(Card, { className: "col-span-1", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Platform Usage" }), _jsx(CardDescription, { children: "Monthly logins and activities over the last 5 months" })] }), _jsx(CardContent, { children: _jsx("div", { className: "h-[300px]", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: usageData, margin: {
                                                top: 5,
                                                right: 30,
                                                left: 20,
                                                bottom: 5,
                                            }, children: [_jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Line, { type: "monotone", dataKey: "logins", stroke: "#8884d8", strokeWidth: 2 }), _jsx(Line, { type: "monotone", dataKey: "activities", stroke: "#82ca9d", strokeWidth: 2 })] }) }) }) })] }), _jsxs(Card, { className: "col-span-1", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Feature Usage" }), _jsx(CardDescription, { children: "Most popular features among students" })] }), _jsx(CardContent, { children: _jsx("div", { className: "h-[300px]", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: featureUsageData, cx: "50%", cy: "50%", labelLine: false, label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`, outerRadius: 100, fill: "#8884d8", dataKey: "value", children: featureUsageData.map((entry, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, {})] }) }) }) })] })] }), _jsxs("div", { className: "grid gap-4 md:grid-cols-7", children: [_jsxs(Card, { className: "md:col-span-4", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Recent Student Logins" }), _jsx(CardDescription, { children: "Students who recently accessed the platform" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: mockStats.recentLogins.map(login => (_jsxs("div", { className: "flex items-center", children: [_jsxs(Avatar, { className: "h-9 w-9 mr-3", children: [_jsx(AvatarImage, { src: login.profileImage, alt: login.studentName }), _jsx(AvatarFallback, { children: getInitials(login.studentName) })] }), _jsxs("div", { className: "flex-1 space-y-1", children: [_jsx("p", { className: "text-sm font-medium leading-none", children: login.studentName }), _jsx("p", { className: "text-sm text-muted-foreground", children: login.email })] }), _jsx("div", { className: "text-sm text-muted-foreground", children: login.lastLoginTime })] }, login.id))) }) })] }), _jsxs(Card, { className: "md:col-span-3", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Notifications" }), _jsx(CardDescription, { children: "Recent alerts and upcoming events" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "mr-3 mt-0.5", children: _jsx(Bell, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium leading-none", children: "License Renewal Reminder" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Your institutional license expires in 375 days" })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "mr-3 mt-0.5", children: _jsx(FileText, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium leading-none", children: "Monthly Usage Report" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "May 2025 report has been generated" })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "mr-3 mt-0.5", children: _jsx(Calendar, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium leading-none", children: "Career Fair Scheduled" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "May 15, 2025 - Reminder sent to all students" })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "mr-3 mt-0.5", children: _jsx(BookOpen, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium leading-none", children: "New Learning Module Available" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Interview Preparation course now available" })] })] }), _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "mr-3 mt-0.5", children: _jsx(Activity, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium leading-none", children: "Engagement Milestone" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Over 1,000 resumes created this month!" })] })] })] }) })] })] }), _jsx(Dialog, { open: emailDialogOpen, onOpenChange: setEmailDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Email All Students" }), _jsx(DialogDescription, { children: "Send an email to all students enrolled in your university." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(handleSendEmail), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "subject", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Subject" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter email subject", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "message", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Message" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Type your message here...", className: "min-h-[150px] resize-none", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "mt-6", children: [_jsx(Button, { variant: "outline", type: "button", onClick: () => setEmailDialogOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isSending, children: isSending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Sending..."] })) : (_jsxs(_Fragment, { children: [_jsx(Mail, { className: "mr-2 h-4 w-4" }), "Send Email"] })) })] })] }) })] }) })] }));
}
