import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, GraduationCap, Calendar, MapPin, Edit, Trash2, Sparkles } from 'lucide-react';
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
const educationHistorySchema = z.object({
    institution: z.string().min(1, { message: 'Institution name is required' }),
    degree: z.string().min(1, { message: 'Degree is required' }),
    fieldOfStudy: z.string().min(1, { message: 'Field of study is required' }),
    location: z.string().optional(),
    startDate: z.string().min(1, { message: 'Start date is required' }),
    endDate: z.string().optional(),
    current: z.boolean().default(false),
    description: z.string().optional(),
    achievements: z.array(z.string()).default([]),
    gpa: z.string().optional(),
});
export default function EducationHistory() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEducation, setEditingEducation] = useState(null);
    const [achievement, setAchievement] = useState('');
    // Fetch education history
    const { data: educationHistory, isLoading } = useQuery({
        queryKey: ['/api/education-history'],
    });
    const form = useForm({
        resolver: zodResolver(educationHistorySchema),
        defaultValues: {
            institution: '',
            degree: '',
            fieldOfStudy: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            description: '',
            achievements: [],
            gpa: '',
        }
    });
    const resetForm = () => {
        form.reset({
            institution: '',
            degree: '',
            fieldOfStudy: '',
            location: '',
            startDate: '',
            endDate: '',
            current: false,
            description: '',
            achievements: [],
            gpa: '',
        });
        setAchievement('');
    };
    // Open dialog for adding new education history
    const handleAddNew = () => {
        setEditingEducation(null);
        resetForm();
        setIsDialogOpen(true);
    };
    // Open dialog for editing education history
    const handleEdit = (item) => {
        setEditingEducation(item);
        form.reset({
            institution: item.institution,
            degree: item.degree,
            fieldOfStudy: item.fieldOfStudy,
            location: item.location || '',
            startDate: item.startDate ? format(new Date(item.startDate), 'yyyy-MM-dd') : '',
            endDate: item.current ? '' : (item.endDate ? format(new Date(item.endDate), 'yyyy-MM-dd') : ''),
            current: !!item.current,
            description: item.description || '',
            achievements: item.achievements || [],
            gpa: item.gpa || '',
        });
        setIsDialogOpen(true);
    };
    // Create education history mutation
    const createEducationHistoryMutation = useMutation({
        mutationFn: async (data) => {
            return apiRequest('POST', '/api/education-history', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/education-history'] });
            toast({
                title: 'Education History Added',
                description: 'Your education has been added successfully',
            });
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to add education history: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    // Update education history mutation
    const updateEducationHistoryMutation = useMutation({
        mutationFn: async (data) => {
            const { id, ...rest } = data;
            return apiRequest('PUT', `/api/education-history/${id}`, rest);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/education-history'] });
            toast({
                title: 'Education History Updated',
                description: 'Your education has been updated successfully',
            });
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to update education history: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    // Delete education history mutation
    const deleteEducationHistoryMutation = useMutation({
        mutationFn: async (id) => {
            return apiRequest('DELETE', `/api/education-history/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/education-history'] });
            toast({
                title: 'Education History Deleted',
                description: 'The education entry has been deleted successfully',
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to delete education history: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this education entry?')) {
            deleteEducationHistoryMutation.mutate(id);
        }
    };
    const onSubmit = (data) => {
        // If current is true, clear the endDate
        if (data.current) {
            data.endDate = undefined;
        }
        if (editingEducation) {
            updateEducationHistoryMutation.mutate({ ...data, id: editingEducation.id });
        }
        else {
            createEducationHistoryMutation.mutate(data);
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
    const formatDateRange = (startDate, endDate, current) => {
        const start = format(new Date(startDate), 'MMM yyyy');
        if (current)
            return `${start} - Present`;
        if (endDate)
            return `${start} - ${format(new Date(endDate), 'MMM yyyy')}`;
        return start;
    };
    return (_jsxs("div", { className: "container mx-auto", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold font-poppins", children: "Education History" }), _jsx("p", { className: "text-neutral-500", children: "Manage your educational background" })] }), _jsxs(Button, { className: "mt-4 md:mt-0", onClick: handleAddNew, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add Education"] })] }), isLoading ? (_jsx("div", { className: "flex justify-center items-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) })) : educationHistory && educationHistory.length > 0 ? (_jsx("div", { className: "space-y-6", children: educationHistory.map((item) => (_jsxs(Card, { className: "p-6 relative group", children: [_jsx("div", { className: "absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsxs("div", { className: "flex space-x-1", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => handleEdit(item), children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50", onClick: () => handleDelete(item.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) }), _jsxs("div", { className: "flex flex-col md:flex-row md:items-start gap-4", children: [_jsx("div", { className: "flex-shrink-0 w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center", children: _jsx(GraduationCap, { className: "h-6 w-6 text-primary" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between mb-2", children: [_jsxs("h2", { className: "text-xl font-semibold", children: [item.degree, " in ", item.fieldOfStudy] }), _jsxs("div", { className: "flex items-center space-x-2 mt-1 md:mt-0", children: [item.current && (_jsx(Badge, { variant: "outline", className: "bg-green-100 text-green-800 border-green-200", children: "Current" })), _jsxs("div", { className: "text-sm text-neutral-500 flex items-center", children: [_jsx(Calendar, { className: "h-4 w-4 mr-1" }), formatDateRange(item.startDate, item.endDate, item.current)] })] })] }), _jsxs("div", { className: "flex items-center text-primary font-medium mb-4", children: [_jsx("span", { children: item.institution }), item.location && (_jsxs(_Fragment, { children: [_jsx("span", { className: "mx-2", children: "\u2022" }), _jsxs("div", { className: "flex items-center text-neutral-500 font-normal", children: [_jsx(MapPin, { className: "h-4 w-4 mr-1" }), item.location] })] })), item.gpa && (_jsxs(_Fragment, { children: [_jsx("span", { className: "mx-2", children: "\u2022" }), _jsxs("div", { className: "text-neutral-500 font-normal", children: ["GPA: ", item.gpa] })] }))] }), item.description && (_jsx("div", { className: "mb-4", children: _jsx("p", { className: "text-neutral-700", children: item.description }) })), item.achievements && item.achievements.length > 0 && (_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-medium mb-2 flex items-center", children: [_jsx(Sparkles, { className: "h-4 w-4 mr-1 text-amber-500" }), "Achievements & Activities"] }), _jsx("ul", { className: "list-disc pl-5 space-y-1", children: item.achievements.map((achievement, index) => (_jsx("li", { className: "text-sm", children: achievement }, index))) })] }))] })] })] }, item.id))) })) : (_jsxs("div", { className: "text-center py-12 bg-white rounded-lg shadow-sm", children: [_jsx(GraduationCap, { className: "mx-auto h-12 w-12 text-neutral-300 mb-4" }), _jsx("h3", { className: "text-xl font-medium mb-2", children: "No Education History Added" }), _jsx("p", { className: "text-neutral-500 mb-4", children: "Add your educational background to showcase your academic achievements" }), _jsxs(Button, { onClick: handleAddNew, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add First Education"] })] })), _jsx(Dialog, { open: isDialogOpen, onOpenChange: setIsDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[600px] max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: editingEducation ? 'Edit Education' : 'Add Education' }) }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsx(FormField, { control: form.control, name: "institution", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Institution Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., University of Technology", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "degree", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Degree" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Bachelor of Science", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "fieldOfStudy", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Field of Study" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Computer Science", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "location", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Location" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Boston, MA", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "gpa", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "GPA (Optional)" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., 3.8/4.0", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "startDate", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Start Date" }), _jsx(FormControl, { children: _jsx(Input, { type: "date", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "endDate", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "End Date" }), _jsx(FormControl, { children: _jsx(Input, { type: "date", disabled: form.watch('current'), placeholder: form.watch('current') ? "Present" : "", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "current", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-start space-x-3 space-y-0", children: [_jsx(FormControl, { children: _jsx(Checkbox, { checked: field.value, onCheckedChange: field.onChange }) }), _jsx("div", { className: "space-y-1 leading-none", children: _jsx(FormLabel, { children: "I am currently studying here" }) })] })) }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Describe your studies, specializations, or thesis", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { children: [_jsx(FormLabel, { children: "Achievements & Activities" }), _jsxs("div", { className: "flex mt-2 mb-2 gap-2", children: [_jsx(Input, { placeholder: "e.g., Dean's List, Research Project, Student Organization", value: achievement, onChange: (e) => setAchievement(e.target.value), onKeyDown: (e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddAchievement();
                                                            }
                                                        } }), _jsx(Button, { type: "button", onClick: handleAddAchievement, children: "Add" })] }), form.watch('achievements').length > 0 && (_jsxs("div", { className: "mt-3", children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Added Achievements:" }), _jsx("ul", { className: "space-y-2", children: form.watch('achievements').map((item, index) => (_jsxs("li", { className: "flex items-center justify-between p-2 bg-muted rounded-md text-sm", children: [_jsx("span", { children: item }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50", onClick: () => handleRemoveAchievement(index), children: _jsx(Trash2, { className: "h-4 w-4" }) })] }, index))) })] }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsDialogOpen(false), children: "Cancel" }), _jsx(Button, { type: "submit", children: editingEducation ? 'Update Education' : 'Add Education' })] })] }) })] }) })] }));
}
