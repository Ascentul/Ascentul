import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, BriefcaseBusiness, Calendar, MapPin, Edit, Trash2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
const workHistorySchema = z.object({
    company: z.string().min(1, { message: 'Company name is required' }),
    position: z.string().min(1, { message: 'Position is required' }),
    location: z.string().optional(),
    startDate: z.string().min(1, { message: 'Start date is required' }),
    endDate: z.string().optional(),
    currentJob: z.boolean().default(false),
    description: z.string().optional(),
    achievements: z.array(z.string()).default([]),
});
export default function WorkHistory() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingWorkHistory, setEditingWorkHistory] = useState(null);
    const [achievement, setAchievement] = useState('');
    // Fetch work history
    const { data: workHistory, isLoading } = useQuery({
        queryKey: ['/api/work-history'],
    });
    const form = useForm({
        resolver: zodResolver(workHistorySchema),
        defaultValues: {
            company: '',
            position: '',
            location: '',
            startDate: '',
            endDate: '',
            currentJob: false,
            description: '',
            achievements: [],
        }
    });
    const resetForm = () => {
        form.reset({
            company: '',
            position: '',
            location: '',
            startDate: '',
            endDate: '',
            currentJob: false,
            description: '',
            achievements: [],
        });
        setAchievement('');
    };
    // Open dialog for adding new work history
    const handleAddNew = () => {
        setEditingWorkHistory(null);
        resetForm();
        setIsDialogOpen(true);
    };
    // Open dialog for editing work history
    const handleEdit = (item) => {
        setEditingWorkHistory(item);
        form.reset({
            company: item.company,
            position: item.position,
            location: item.location || '',
            startDate: item.startDate ? format(new Date(item.startDate), 'yyyy-MM-dd') : '',
            endDate: item.currentJob ? '' : (item.endDate ? format(new Date(item.endDate), 'yyyy-MM-dd') : ''),
            currentJob: !!item.currentJob,
            description: item.description || '',
            achievements: item.achievements || [],
        });
        setIsDialogOpen(true);
    };
    // Create work history mutation
    const createWorkHistoryMutation = useMutation({
        mutationFn: async (data) => {
            return apiRequest('POST', '/api/work-history', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/work-history'] });
            toast({
                title: 'Work History Added',
                description: 'Your work experience has been added successfully',
            });
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to add work history: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    // Update work history mutation
    const updateWorkHistoryMutation = useMutation({
        mutationFn: async (data) => {
            const { id, ...rest } = data;
            return apiRequest('PUT', `/api/work-history/${id}`, rest);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/work-history'] });
            toast({
                title: 'Work History Updated',
                description: 'Your work experience has been updated successfully',
            });
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to update work history: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    // Delete work history mutation
    const deleteWorkHistoryMutation = useMutation({
        mutationFn: async (id) => {
            return apiRequest('DELETE', `/api/work-history/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/work-history'] });
            toast({
                title: 'Work History Deleted',
                description: 'The work experience has been deleted successfully',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to delete work history: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this work experience?')) {
            deleteWorkHistoryMutation.mutate(id);
        }
    };
    const onSubmit = (data) => {
        // If currentJob is true, clear the endDate
        if (data.currentJob) {
            data.endDate = undefined;
        }
        if (editingWorkHistory) {
            updateWorkHistoryMutation.mutate({ ...data, id: editingWorkHistory.id });
        }
        else {
            createWorkHistoryMutation.mutate(data);
        }
    };
    // Add achievement to the form
    const handleAddAchievement = () => {
        if (!achievement.trim())
            return;
        const currentAchievements = form.getValues('achievements') || [];
        form.setValue('achievements', [...currentAchievements, achievement.trim()]);
        setAchievement('');
    };
    // Remove achievement from the form
    const handleRemoveAchievement = (index) => {
        const currentAchievements = form.getValues('achievements') || [];
        form.setValue('achievements', currentAchievements.filter((_, i) => i !== index));
    };
    // Format date range for display
    const formatDateRange = (startDate, endDate, currentJob) => {
        const start = format(new Date(startDate), 'MMM yyyy');
        if (currentJob)
            return `${start} - Present`;
        if (endDate)
            return `${start} - ${format(new Date(endDate), 'MMM yyyy')}`;
        return start;
    };
    return (_jsxs("div", { className: "container mx-auto", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold font-poppins", children: "Work History" }), _jsx("p", { className: "text-neutral-500", children: "Manage your professional experience" })] }), _jsxs(Button, { className: "mt-4 md:mt-0", onClick: handleAddNew, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add Experience"] })] }), isLoading ? (_jsx("div", { className: "flex justify-center items-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) })) : workHistory && workHistory.length > 0 ? (_jsx("div", { className: "space-y-6", children: workHistory.map((item) => (_jsxs(Card, { className: "p-6 relative group", children: [_jsx("div", { className: "absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsxs("div", { className: "flex space-x-1", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => handleEdit(item), children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50", onClick: () => handleDelete(item.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) }), _jsxs("div", { className: "flex flex-col md:flex-row md:items-start gap-4", children: [_jsx("div", { className: "flex-shrink-0 w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center", children: _jsx(BriefcaseBusiness, { className: "h-6 w-6 text-primary" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between mb-2", children: [_jsx("h2", { className: "text-xl font-semibold", children: item.position }), _jsxs("div", { className: "flex items-center space-x-2 mt-1 md:mt-0", children: [item.currentJob && (_jsx(Badge, { variant: "outline", className: "bg-green-100 text-green-800 border-green-200", children: "Current" })), _jsxs("div", { className: "text-sm text-neutral-500 flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1" }), formatDateRange(item.startDate, item.endDate, item.currentJob)] })] })] }), _jsxs("div", { className: "flex items-center text-primary font-medium mb-4", children: [_jsx("span", { children: item.company }), item.location && (_jsxs(_Fragment, { children: [_jsx("span", { className: "mx-2", children: "\u2022" }), _jsxs("div", { className: "flex items-center text-neutral-500 font-normal", children: [_jsx(MapPin, { className: "h-4 w-4 mr-1" }), item.location] })] }))] }), item.description && (_jsx("div", { className: "mb-4", children: _jsx("p", { className: "text-neutral-700", children: item.description }) })), item.achievements && item.achievements.length > 0 && (_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-medium mb-2 flex items-center", children: [_jsx(Sparkles, { className: "h-4 w-4 mr-1 text-amber-500" }), "Key Achievements"] }), _jsx("ul", { className: "list-disc pl-5 space-y-1", children: item.achievements.map((achievement, index) => (_jsx("li", { className: "text-sm", children: achievement }, index))) })] }))] })] })] }, item.id))) })) : (_jsxs("div", { className: "text-center py-12 bg-white rounded-lg shadow-sm", children: [_jsx(BriefcaseBusiness, { className: "mx-auto h-12 w-12 text-neutral-300 mb-4" }), _jsx("h3", { className: "text-xl font-medium mb-2", children: "No Work Experience Added" }), _jsx("p", { className: "text-neutral-500 mb-4", children: "Add your professional experience to showcase your career journey" }), _jsxs(Button, { onClick: handleAddNew, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add First Experience"] })] })), _jsx(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[600px] max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: editingWorkHistory ? 'Edit Work Experience' : 'Add Work Experience' }) }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "company", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Company Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Acme Corporation", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "position", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Software Engineer", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "location", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Location" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., San Francisco, CA", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "startDate", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Start Date" }), _jsx(FormControl, { children: _jsx(Input, { type: "date", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "endDate", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "End Date" }), _jsx(FormControl, { children: _jsx(Input, { type: "date", disabled: form.watch('currentJob'), placeholder: form.watch('currentJob') ? "Present" : "", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "currentJob", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-start space-x-3 space-y-0", children: [_jsx(FormControl, { children: _jsx(Checkbox, { checked: field.value, onCheckedChange: field.onChange }) }), _jsx("div", { className: "space-y-1 leading-none", children: _jsx(FormLabel, { children: "This is my current job" }) })] })) }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Describe your responsibilities and role...", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx(FormLabel, { children: "Key Achievements" }), _jsx("div", { className: "text-xs text-neutral-500", children: "Highlight your accomplishments" })] }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx(Input, { placeholder: "e.g., Increased sales by 20% in 6 months", value: achievement, onChange: (e) => setAchievement(e.target.value), onKeyDown: (e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddAchievement();
                                                            }
                                                        } }), _jsx(Button, { type: "button", onClick: handleAddAchievement, children: "Add" })] }), form.watch('achievements').length > 0 && (_jsx("div", { className: "bg-neutral-50 p-3 rounded-md border", children: _jsx("ul", { className: "space-y-2", children: form.watch('achievements').map((item, index) => (_jsxs("li", { className: "flex items-center justify-between text-sm", children: [_jsxs("span", { children: ["\u2022 ", item] }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => handleRemoveAchievement(index), className: "h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }, index))) }) }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                                    setIsDialogOpen(false);
                                                    resetForm();
                                                }, children: "Cancel" }), _jsx(Button, { type: "submit", children: editingWorkHistory ? 'Update Experience' : 'Add Experience' })] })] }) })] }) })] }));
}
