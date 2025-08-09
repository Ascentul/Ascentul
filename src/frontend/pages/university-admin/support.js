import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from "@/lib/queryClient";
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/lib/useUserData';
const supportFormSchema = z.object({
    subject: z.string().min(5, { message: 'Subject must be at least 5 characters' }),
    issueType: z.string().min(1, { message: 'Please select a category' }),
    description: z.string().min(20, { message: 'Description must be at least 20 characters' }),
    priority: z.enum(['low', 'medium', 'high', 'urgent'], {
        errorMap: () => ({ message: 'Please select a priority level' })
    }),
    department: z.string().optional(),
    contactPerson: z.string().optional(),
});
export default function UniversityAdminSupportPage() {
    const { toast } = useToast();
    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const form = useForm({
        resolver: zodResolver(supportFormSchema),
        defaultValues: {
            subject: '',
            issueType: '',
            description: '',
            priority: 'medium',
            department: '',
            contactPerson: '',
        },
    });
    async function onSubmit(data) {
        setIsSubmitting(true);
        try {
            // Get university name from user data if available
            const universityName = user?.universityName || 'Unknown University';
            await apiRequest('POST', '/api/in-app/support', {
                ...data,
                source: 'university-admin',
                name: user?.name,
                email: user?.email,
                universityName: universityName,
                department: data.department || '',
                contactPerson: data.contactPerson || ''
            });
            setIsSuccess(true);
            toast({
                title: 'Support request submitted',
                description: 'Our team will get back to you as soon as possible.',
            });
            form.reset();
        }
        catch (error) {
            toast({
                title: 'Something went wrong',
                description: 'Your support request could not be submitted. Please try again.',
                variant: 'destructive',
            });
        }
        finally {
            setIsSubmitting(false);
        }
    }
    const resetForm = () => {
        setIsSuccess(false);
        form.reset();
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Contact Support" }), _jsx("p", { className: "text-muted-foreground", children: "Have a question or issue? Submit a support ticket and our team will assist you." })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs(Card, { className: "lg:col-span-2", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Submit a Support Request" }), _jsx(CardDescription, { children: "Please provide detailed information about your issue or question." })] }), _jsx(CardContent, { children: isSuccess ? (_jsxs("div", { className: "text-center py-10 space-y-4", children: [_jsxs("div", { className: "bg-green-100 text-green-800 p-4 rounded-md inline-flex items-center justify-center mb-4", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6 mr-2", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }), "Support request submitted"] }), _jsx("h3", { className: "text-xl font-semibold", children: "Thank you for reaching out!" }), _jsx("p", { className: "text-muted-foreground", children: "We've received your support request and will get back to you as soon as possible." }), _jsx(Button, { onClick: resetForm, children: "Submit Another Request" })] })) : (_jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsx(FormField, { control: form.control, name: "subject", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Subject" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Briefly describe your issue", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(FormField, { control: form.control, name: "issueType", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Category" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a category" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "account_access", children: "Account Access" }), _jsx(SelectItem, { value: "student_management", children: "Student Management" }), _jsx(SelectItem, { value: "invitation_issue", children: "Invitation Issues" }), _jsx(SelectItem, { value: "data_analytics", children: "Data & Analytics" }), _jsx(SelectItem, { value: "university_profile", children: "University Profile" }), _jsx(SelectItem, { value: "feature_request", children: "Feature Request" }), _jsx(SelectItem, { value: "bug_report", children: "Bug Report" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "priority", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Priority" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select priority" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "low", children: "Low" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "high", children: "High" }), _jsx(SelectItem, { value: "urgent", children: "Urgent" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 my-4", children: [_jsx(FormField, { control: form.control, name: "department", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Department" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "E.g. Admissions, Career Services", ...field }) }), _jsx(FormDescription, { children: "Which university department is affected?" }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "contactPerson", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Contact Person" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Name of primary contact for this issue", ...field }) }), _jsx(FormDescription, { children: "Who should we contact about this issue?" }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Please provide detailed information about your issue...", className: "min-h-[150px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "submit", className: "w-full", disabled: isSubmitting, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Submitting..."] })) : ('Submit Support Request') })] }) })) })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Support Hours" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "text-sm", children: [_jsx("span", { className: "font-medium", children: "Monday - Friday:" }), _jsx("br", {}), "9:00 AM - 6:00 PM EST"] }), _jsxs("p", { className: "text-sm", children: [_jsx("span", { className: "font-medium", children: "Response Time:" }), _jsx("br", {}), "Within 24 hours (business days)"] }), _jsx("p", { className: "text-sm text-muted-foreground mt-4", children: "Urgent issues will receive priority response." })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Common Issues" }) }), _jsx(CardContent, { children: _jsxs("ul", { className: "space-y-2 list-disc list-inside text-sm", children: [_jsx("li", { children: "Student invitation emails not received" }), _jsx("li", { children: "Student account access issues" }), _jsx("li", { children: "Data export functionality" }), _jsx("li", { children: "Analytics dashboard questions" }), _jsx("li", { children: "University profile updates" })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Resources" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-3", children: [_jsx("a", { href: "https://ascentul.com/university-admin-guide", target: "_blank", rel: "noopener noreferrer", className: "block text-sm text-primary hover:underline", children: "University Administrator Guide" }), _jsx("a", { href: "https://ascentul.com/university-faq", target: "_blank", rel: "noopener noreferrer", className: "block text-sm text-primary hover:underline", children: "Frequently Asked Questions" }), _jsx("a", { href: "https://ascentul.com/university-best-practices", target: "_blank", rel: "noopener noreferrer", className: "block text-sm text-primary hover:underline", children: "Best Practices & Tips" })] }) }), _jsx(CardFooter, { children: _jsx(Button, { variant: "outline", className: "w-full", onClick: () => window.open('https://ascentul.com/university-help', '_blank'), children: "Visit Help Center" }) })] })] })] })] }));
}
