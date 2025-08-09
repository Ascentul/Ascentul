import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
// Define the form schema
const workHistoryFormSchema = z.object({
    position: z.string().min(1, { message: 'Job title is required' }),
    company: z.string().min(1, { message: 'Company name is required' }),
    startDate: z.date({ required_error: 'Start date is required' }),
    endDate: z.date().nullable().optional(),
    currentJob: z.boolean().default(false),
    location: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    achievements: z.array(z.string()).nullable().optional(),
});
export function WorkHistoryFormModal({ open, onOpenChange, onClose, defaultValues = {
    position: '',
    company: '',
    startDate: new Date(),
    endDate: null,
    currentJob: false,
    location: '',
    description: '',
    achievements: [],
}, mode = 'add', workHistoryId, id, // For compatibility with existing code
onSuccess, }) {
    const [achievementInput, setAchievementInput] = useState('');
    const { toast } = useToast();
    // Initialize the form
    const form = useForm({
        resolver: zodResolver(workHistoryFormSchema),
        defaultValues,
    });
    // Get the current values from the form to use for conditional rendering
    const currentJob = form.watch('currentJob');
    // Add achievement to the array
    const handleAddAchievement = () => {
        if (!achievementInput.trim())
            return;
        const currentAchievements = form.getValues('achievements') || [];
        form.setValue('achievements', [...currentAchievements, achievementInput.trim()]);
        setAchievementInput('');
    };
    // Remove achievement from the array
    const handleRemoveAchievement = (index) => {
        const achievements = form.getValues('achievements') || [];
        form.setValue('achievements', achievements.filter((_, i) => i !== index));
    };
    // Form submission mutation
    const mutation = useMutation({
        mutationFn: async (values) => {
            // If currentJob is true, set endDate to null
            if (values.currentJob) {
                values.endDate = null;
            }
            console.log("WorkHistoryFormModal - Submitting data:", JSON.stringify(values, null, 2));
            let response;
            if (mode === 'add') {
                response = await apiRequest('POST', '/api/career-data/work-history', values);
            }
            else {
                response = await apiRequest('PUT', `/api/career-data/work-history/${workHistoryId}`, values);
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save work history');
            }
            const responseData = await response.json();
            console.log("WorkHistoryFormModal - Received response:", JSON.stringify(responseData, null, 2));
            return responseData;
        },
        onSuccess: (data) => {
            // Show success toast
            toast({
                title: mode === 'add' ? 'Work history added' : 'Work history updated',
                description: 'Your changes have been saved successfully.',
            });
            console.log("WorkHistoryFormModal - Success, invalidating queries for '/api/career-data'");
            // Invalidate queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ['/api/career-data'] });
            // Explicitly refetch career data to ensure we have the latest
            setTimeout(() => {
                console.log("WorkHistoryFormModal - Performing manual refetch after timeout");
                queryClient.refetchQueries({ queryKey: ['/api/career-data'] });
            }, 500);
            // Close the modal
            handleDialogOpenChange(false);
            // Call the onSuccess callback if provided
            if (onSuccess) {
                onSuccess();
            }
        },
        onError: (error) => {
            console.error("WorkHistoryFormModal - Error submitting form:", error);
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
    // Submit handler
    const onSubmit = (values) => {
        mutation.mutate(values);
    };
    // Custom handler for dialog close events
    const handleDialogOpenChange = (openState) => {
        if (onOpenChange) {
            onOpenChange(openState);
        }
        else if (!openState && onClose) {
            onClose();
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: handleDialogOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-[600px] max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: mode === 'add' ? 'Add Work History' : 'Edit Work History' }), _jsx(DialogDescription, { children: "Add details about your professional experience. This information will be used in your resume and profile." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsx(FormField, { control: form.control, name: "position", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. Software Engineer", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "company", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Company" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. Acme Corporation", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "startDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Start Date" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: "pl-3 text-left font-normal", children: [field.value ? (format(field.value, 'PPP')) : (_jsx("span", { children: "Pick a date" })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value, onSelect: field.onChange, disabled: (date) => date > new Date() || date < new Date('1900-01-01'), initialFocus: true }) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "currentJob", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-center justify-between space-y-0 pt-7", children: [_jsx(FormLabel, { children: "Current Job" }), _jsx(FormControl, { children: _jsx(Switch, { checked: field.value, onCheckedChange: field.onChange }) })] })) })] }), !currentJob && (_jsx(FormField, { control: form.control, name: "endDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "End Date" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: "pl-3 text-left font-normal", children: [field.value ? (format(field.value, 'PPP')) : (_jsx("span", { children: "Pick a date" })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value ?? undefined, onSelect: field.onChange, disabled: (date) => date > new Date() || date < form.getValues('startDate') || date < new Date('1900-01-01'), initialFocus: true }) })] }), _jsx(FormMessage, {})] })) })), _jsx(FormField, { control: form.control, name: "location", render: ({ field }) => (_jsxs(FormItem, { children: [_jsxs(FormLabel, { children: ["Location ", _jsx("span", { className: "text-muted-foreground", children: "(Optional)" })] }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. New York, NY", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsxs(FormLabel, { children: ["Description ", _jsx("span", { className: "text-muted-foreground", children: "(Optional)" })] }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Describe your role, responsibilities, and achievements...", className: "min-h-[120px]", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { children: [_jsxs(FormLabel, { children: ["Key Achievements ", _jsx("span", { className: "text-muted-foreground", children: "(Optional)" })] }), _jsxs("div", { className: "flex mt-2", children: [_jsx(Input, { placeholder: "Add an achievement...", value: achievementInput, onChange: (e) => setAchievementInput(e.target.value), className: "flex-1" }), _jsx(Button, { type: "button", variant: "outline", onClick: handleAddAchievement, className: "ml-2", children: "Add" })] }), _jsx("div", { className: "mt-2 space-y-2", children: form.watch('achievements')?.map((achievement, index) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-secondary rounded-md", children: [_jsx("span", { className: "text-sm", children: achievement }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => handleRemoveAchievement(index), className: "text-destructive h-6 w-6 p-0", children: "\u00D7" })] }, index))) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => handleDialogOpenChange(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: mutation.isPending, children: mutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : ('Save') })] })] }) })] }) }));
}
