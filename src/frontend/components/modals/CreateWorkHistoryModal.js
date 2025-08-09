import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
// Form schema
const formSchema = z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    position: z.string().min(2, 'Position must be at least 2 characters'),
    location: z.string().min(2, 'Location must be at least 2 characters'),
    startDate: z.date(),
    endDate: z.date().optional().nullable(),
    isCurrent: z.boolean().default(false),
    description: z.string().min(20, 'Please provide at least 20 characters describing your responsibilities'),
    achievements: z.string().optional(),
    skills: z.string().optional(),
});
export default function CreateWorkHistoryModal({ isOpen, onClose }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Default form values
    const defaultValues = {
        companyName: '',
        position: '',
        location: '',
        startDate: new Date(),
        endDate: null,
        isCurrent: false,
        description: '',
        achievements: '',
        skills: '',
    };
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues,
    });
    // Watch for isCurrent to disable endDate when it's checked
    const isCurrentPosition = form.watch('isCurrent');
    // Effect to clear endDate when isCurrent is checked
    useEffect(() => {
        if (isCurrentPosition) {
            form.setValue('endDate', null);
        }
    }, [isCurrentPosition, form]);
    const createWorkHistoryMutation = useMutation({
        mutationFn: async (data) => {
            const formattedData = {
                ...data,
                startDate: data.startDate.toISOString(),
                endDate: data.isCurrent ? null : data.endDate ? data.endDate.toISOString() : null,
            };
            const response = await apiRequest('POST', '/api/work-history', formattedData);
            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch work history query
            queryClient.invalidateQueries({ queryKey: ['/api/work-history'] });
            // Show success message
            toast({
                title: "Work history added",
                description: "Your work experience has been added successfully.",
            });
            // Reset form and close modal
            form.reset();
            onClose();
        },
        onError: (error) => {
            toast({
                title: "Failed to add work history",
                description: error.message || "There was a problem adding your work experience. Please try again.",
                variant: "destructive",
            });
        },
    });
    const onSubmit = (data) => {
        createWorkHistoryMutation.mutate(data);
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add Work Experience" }), _jsx(DialogDescription, { children: "Add details about your work experience to showcase in your resumes." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "companyName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Company Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Acme Corporation", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "position", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Position/Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Software Engineer", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "location", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Location" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "San Francisco, CA", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "startDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Start Date" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: "pl-3 text-left font-normal", children: [field.value ? (format(field.value, "MMM yyyy")) : (_jsx("span", { className: "text-muted-foreground", children: "Select date" })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value, onSelect: field.onChange, initialFocus: true }) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "endDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "End Date" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, disabled: isCurrentPosition, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: `pl-3 text-left font-normal ${isCurrentPosition ? 'opacity-50 cursor-not-allowed' : ''}`, disabled: isCurrentPosition, children: [field.value ? (format(field.value, "MMM yyyy")) : (_jsx("span", { className: "text-muted-foreground", children: isCurrentPosition ? 'Present' : 'Select date' })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value || undefined, onSelect: field.onChange, disabled: (date) => date < form.getValues('startDate'), initialFocus: true }) })] }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "isCurrent", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3", children: [_jsx(FormControl, { children: _jsx(Checkbox, { checked: field.value, onCheckedChange: field.onChange }) }), _jsxs("div", { className: "space-y-1 leading-none", children: [_jsx(FormLabel, { children: "Current Position" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Check if you currently work at this company" })] })] })) }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Describe your responsibilities and day-to-day activities...", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "achievements", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Key Achievements (Optional)" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "List your key achievements, one per line. Be specific and quantify results where possible...", className: "min-h-[80px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "skills", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Skills Used (Optional)" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "List skills you utilized, separated by commas (e.g., Java, Project Management, Leadership)...", className: "min-h-[60px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "mt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: createWorkHistoryMutation.isPending, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: createWorkHistoryMutation.isPending, children: createWorkHistoryMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Adding..."] })) : ("Add Work Experience") })] })] }) })] }) }));
}
