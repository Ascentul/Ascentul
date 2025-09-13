import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
const coverLetterSchema = z.object({
    name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
    jobTitle: z.string().optional(),
    template: z.string().default('standard'),
    content: z.object({
        header: z.object({
            fullName: z.string().min(1, { message: 'Full name is required' }),
            email: z.string().email({ message: 'Please enter a valid email' }),
            phone: z.string().optional(),
            location: z.string().optional(),
            date: z.string().optional(),
        }),
        recipient: z.object({
            name: z.string().optional(),
            company: z.string().optional(),
            position: z.string().optional(),
            address: z.string().optional(),
        }),
        body: z.string().min(1, { message: 'Letter content is required' }),
        closing: z.string().optional(),
    }).default({
        header: {
            fullName: '',
            email: '',
            phone: '',
            location: '',
            date: new Date().toLocaleDateString(),
        },
        recipient: {
            name: '',
            company: '',
            position: '',
            address: '',
        },
        body: '',
        closing: 'Sincerely,',
    }),
});
export default function CoverLetterForm({ coverLetter, onSuccess, onSubmit, initialData }) {
    // Use initialData as fallback if provided instead of coverLetter
    const letterData = coverLetter || initialData;
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const defaultValues = {
        name: letterData?.name || '',
        jobTitle: letterData?.jobTitle || '',
        template: letterData?.template || 'standard',
        content: letterData?.content || {
            header: {
                fullName: '',
                email: '',
                phone: '',
                location: '',
                date: new Date().toLocaleDateString(),
            },
            recipient: {
                name: '',
                company: '',
                position: '',
                address: '',
            },
            body: '',
            closing: 'Sincerely,',
        },
    };
    const form = useForm({
        resolver: zodResolver(coverLetterSchema),
        defaultValues,
    });
    const createCoverLetterMutation = useMutation({
        mutationFn: async (data) => {
            return apiRequest('POST', '/api/cover-letters', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
            toast({
                title: 'Cover Letter Created',
                description: 'Your cover letter has been created successfully',
            });
            if (onSuccess)
                onSuccess();
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to create cover letter: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    const updateCoverLetterMutation = useMutation({
        mutationFn: async (data) => {
            return apiRequest('PUT', `/api/cover-letters/${letterData?.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
            toast({
                title: 'Cover Letter Updated',
                description: 'Your cover letter has been updated successfully',
            });
            if (onSuccess)
                onSuccess();
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to update cover letter: ${error.message}`,
                variant: 'destructive',
            });
        },
    });
    const handleFormSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // If parent component provided onSubmit callback, use that
            if (onSubmit) {
                await onSubmit(data);
                if (onSuccess)
                    onSuccess();
            }
            // Otherwise use our internal mutation
            else {
                if (letterData?.id) {
                    await updateCoverLetterMutation.mutateAsync(data);
                }
                else {
                    await createCoverLetterMutation.mutateAsync(data);
                }
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(handleFormSubmit), className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 gap-4", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Cover Letter Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Software Developer Application", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "jobTitle", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Salesforce Administrator", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: _jsx(FormField, { control: form.control, name: "template", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Template" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select template" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "standard", children: "Standard" }), _jsx(SelectItem, { value: "modern", children: "Modern" }), _jsx(SelectItem, { value: "creative", children: "Creative" }), _jsx(SelectItem, { value: "minimalist", children: "Minimalist" })] })] }), _jsx(FormMessage, {})] })) }) }), _jsxs(Tabs, { defaultValue: "sender", children: [_jsxs(TabsList, { className: "grid grid-cols-3", children: [_jsx(TabsTrigger, { value: "sender", children: "Your Information" }), _jsx(TabsTrigger, { value: "recipient", children: "Recipient" }), _jsx(TabsTrigger, { value: "content", children: "Letter Content" })] }), _jsx(TabsContent, { value: "sender", children: _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsx(FormField, { control: form.control, name: "content.header.fullName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Full Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "John Doe", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "content.header.email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "john.doe@example.com", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "content.header.phone", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Phone" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "(123) 456-7890", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "content.header.location", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Location" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "City, State ZIP", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "content.header.date", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Date" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., June 1, 2023", ...field, defaultValue: new Date().toLocaleDateString() }) }), _jsx(FormMessage, {})] })) })] }) }) }), _jsx(TabsContent, { value: "recipient", children: _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsx(FormField, { control: form.control, name: "content.recipient.name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Recipient's Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Jane Smith", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "content.recipient.position", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Recipient's Position" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Hiring Manager", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "content.recipient.company", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Company Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Example Corporation", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "content.recipient.address", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Company Address" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "123 Business St, City, State ZIP", ...field }) }), _jsx(FormMessage, {})] })) })] }) }) }), _jsx(TabsContent, { value: "content", children: _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6 space-y-4", children: [_jsx(FormField, { control: form.control, name: "content.body", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Letter Body" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Write your cover letter content here...", className: "min-h-[300px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "content.closing", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Closing" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Sincerely,", ...field, defaultValue: "Sincerely," }) }), _jsx(FormMessage, {})] })) })] }) }) })] }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? 'Saving...' : letterData?.id ? 'Update Cover Letter' : 'Create Cover Letter' }) })] }) }));
}
