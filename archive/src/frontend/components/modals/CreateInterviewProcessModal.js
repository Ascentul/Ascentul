import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
// Form schema
const formSchema = z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    jobTitle: z.string().min(2, 'Job title must be at least 2 characters'),
    status: z.enum(['applied', 'screening', 'interviewing', 'offer', 'rejected', 'accepted']),
    applicationDate: z.date(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional().or(z.literal('')),
    jobDescription: z.string().optional(),
    notes: z.string().optional(),
});
export default function CreateInterviewProcessModal({ isOpen, onClose }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Default form values
    const defaultValues = {
        companyName: '',
        jobTitle: '',
        status: 'applied',
        applicationDate: new Date(),
        contactName: '',
        contactEmail: '',
        jobDescription: '',
        notes: '',
    };
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues,
    });
    const createProcessMutation = useMutation({
        mutationFn: async (data) => {
            const formattedData = {
                ...data,
                applicationDate: data.applicationDate.toISOString(),
            };
            const response = await apiRequest('POST', '/api/interview/processes', formattedData);
            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch interview processes query
            queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            // Also invalidate user statistics to update any related data
            queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
            // Show success message
            toast({
                title: "Interview process created",
                description: "Your interview process has been created successfully.",
            });
            // Reset form and close modal
            form.reset();
            onClose();
        },
        onError: (error) => {
            toast({
                title: "Failed to create interview process",
                description: error.message || "There was a problem creating your interview process. Please try again.",
                variant: "destructive",
            });
        },
    });
    const onSubmit = (data) => {
        createProcessMutation.mutate(data);
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Track New Interview Process" }), _jsx(DialogDescription, { children: "Create a new job application tracking process." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "companyName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Company Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Google", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "jobTitle", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Software Engineer", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "status", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Status" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select status" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "applied", children: "Applied" }), _jsx(SelectItem, { value: "screening", children: "Screening" }), _jsx(SelectItem, { value: "interviewing", children: "Interviewing" }), _jsx(SelectItem, { value: "offer", children: "Received Offer" }), _jsx(SelectItem, { value: "rejected", children: "Rejected" }), _jsx(SelectItem, { value: "accepted", children: "Accepted" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "applicationDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Application Date" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: "pl-3 text-left font-normal", children: [field.value ? (format(field.value, "PPP")) : (_jsx("span", { className: "text-muted-foreground", children: "Select date" })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value, onSelect: field.onChange, initialFocus: true }) })] }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "contactName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Contact Name (Optional)" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "John Smith", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "contactEmail", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Contact Email (Optional)" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "john@example.com", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "jobDescription", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job Description (Optional)" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Paste the job description here...", className: "min-h-[80px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Notes (Optional)" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Any additional notes about this application...", className: "min-h-[80px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "mt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: createProcessMutation.isPending, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: createProcessMutation.isPending, children: createProcessMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Creating..."] })) : ("Start Tracking") })] })] }) })] }) }));
}
