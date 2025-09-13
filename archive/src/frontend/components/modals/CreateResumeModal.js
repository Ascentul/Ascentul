import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
// Form schema
const formSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100),
    targetJobTitle: z.string().min(2, 'Job title must be at least 2 characters').max(100),
    targetCompany: z.string().optional(),
    industry: z.string().min(2, 'Industry must be at least 2 characters'),
    summary: z.string().min(20, 'Summary should be at least 20 characters'),
    template: z.enum(['modern', 'professional', 'creative', 'minimal']),
});
export default function CreateResumeModal({ isOpen, onClose }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Default form values
    const defaultValues = {
        title: '',
        targetJobTitle: '',
        targetCompany: '',
        industry: '',
        summary: '',
        template: 'modern',
    };
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues,
    });
    const createResumeMutation = useMutation({
        mutationFn: async (data) => {
            const response = await apiRequest('POST', '/api/resumes', data);
            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch resumes query
            queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
            // Show success message
            toast({
                title: "Resume created",
                description: "Your resume has been created successfully.",
            });
            // Reset form and close modal
            form.reset();
            onClose();
        },
        onError: (error) => {
            toast({
                title: "Failed to create resume",
                description: error.message || "There was a problem creating your resume. Please try again.",
                variant: "destructive",
            });
        },
    });
    const onSubmit = (data) => {
        createResumeMutation.mutate(data);
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create New Resume" }), _jsx(DialogDescription, { children: "Create a professional resume tailored to your target job." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "title", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Resume Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Frontend Developer Resume", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "targetJobTitle", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Target Job Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Frontend Developer", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "targetCompany", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Target Company (Optional)" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Google", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "industry", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Industry" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Technology", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "summary", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Professional Summary" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Skilled frontend developer with 5 years of experience...", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "template", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Template" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select template style" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "modern", children: "Modern" }), _jsx(SelectItem, { value: "professional", children: "Professional" }), _jsx(SelectItem, { value: "creative", children: "Creative" }), _jsx(SelectItem, { value: "minimal", children: "Minimal" })] })] }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "mt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: createResumeMutation.isPending, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: createResumeMutation.isPending, children: createResumeMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Creating..."] })) : ("Create Resume") })] })] }) })] }) }));
}
