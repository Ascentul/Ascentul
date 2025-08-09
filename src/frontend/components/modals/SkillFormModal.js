import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
// Define the form schema
const skillFormSchema = z.object({
    name: z.string().min(1, { message: 'Skill name is required' }),
    proficiencyLevel: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
});
export function SkillFormModal({ open, onOpenChange, defaultValues = {
    name: '',
    proficiencyLevel: null,
    category: null,
}, onSuccess, }) {
    const { toast } = useToast();
    // Initialize the form
    const form = useForm({
        resolver: zodResolver(skillFormSchema),
        defaultValues,
    });
    // Predefined skill categories
    const skillCategories = [
        "Technical",
        "Programming",
        "Design",
        "Marketing",
        "Management",
        "Communication",
        "Leadership",
        "Project Management",
        "Sales",
        "Finance",
        "Data",
        "Other"
    ];
    // Proficiency levels with corresponding numeric values
    const proficiencyLevels = [
        { label: "Beginner", value: "1" },
        { label: "Intermediate", value: "2" },
        { label: "Advanced", value: "3" },
        { label: "Expert", value: "4" }
    ];
    // Form submission mutation
    const mutation = useMutation({
        mutationFn: async (values) => {
            const response = await apiRequest('POST', '/api/career-data/skills', values);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add skill');
            }
            return await response.json();
        },
        onSuccess: () => {
            // Show success toast
            toast({
                title: 'Skill added',
                description: 'Your skill has been added successfully.',
            });
            // Invalidate queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ['/api/career-data'] });
            // Close the modal
            onOpenChange(false);
            // Call the onSuccess callback if provided
            if (onSuccess) {
                onSuccess();
            }
            // Reset the form
            form.reset({
                name: '',
                proficiencyLevel: null,
                category: null,
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
    // Submit handler
    const onSubmit = (values) => {
        // Ensure proficiencyLevel and category have defaults if not provided
        const valuesToSubmit = {
            ...values,
            proficiencyLevel: values.proficiencyLevel || "1", // Default to level 1 (Beginner) if not selected
            category: values.category || "Technical" // Default to Technical if not selected
        };
        mutation.mutate(valuesToSubmit);
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add Skill" }), _jsx(DialogDescription, { children: "Add a new skill to your profile. These skills will be used in your resume and profile." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Skill Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. React, Project Management, Python", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "category", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Category" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value || undefined, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a category" }) }) }), _jsx(SelectContent, { children: skillCategories.map((category) => (_jsx(SelectItem, { value: category, children: category }, category))) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "proficiencyLevel", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Proficiency" }), _jsxs(Select, { onValueChange: field.onChange, value: field.value || undefined, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select level", children: field.value && proficiencyLevels.find(level => level.value === field.value)?.label }) }) }), _jsx(SelectContent, { children: proficiencyLevels.map((level) => (_jsx(SelectItem, { value: level.value, children: level.label }, level.value))) })] }), _jsx(FormMessage, {})] })) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: mutation.isPending, children: mutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Adding..."] })) : ('Add Skill') })] })] }) })] }) }));
}
