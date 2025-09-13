import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
// UI Components
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
// Form validation schema
const formSchema = z.object({
    fullName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
    email: z.string().email({ message: 'Please enter a valid email' }).optional().nullable(),
    phone: z.string().optional().nullable(),
    jobTitle: z.string().optional().nullable(), // changed from position to jobTitle
    company: z.string().min(1, { message: 'Company name is required' }),
    linkedInUrl: z.string().url({ message: 'Please enter a valid URL' }).optional().nullable(), // changed from linkedinUrl to linkedInUrl
    relationshipType: z.string(),
    lastContactedDate: z.date().optional().nullable(), // changed from lastContactDate to lastContactedDate
    notes: z.string().optional().nullable(),
});
export default function ContactForm({ onSuccess, onCancel, initialData, isEdit = false, }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Set up form with default values
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: initialData?.fullName || '',
            email: initialData?.email || '',
            phone: initialData?.phone || '',
            jobTitle: initialData?.jobTitle || '', // Changed from position to jobTitle
            company: initialData?.company || '',
            linkedInUrl: initialData?.linkedInUrl || '', // Changed from linkedinUrl to linkedInUrl
            relationshipType: initialData?.relationshipType || '',
            lastContactedDate: initialData?.lastContactedDate ? new Date(initialData.lastContactedDate) : null, // Changed from lastContactDate to lastContactedDate
            notes: initialData?.notes || '',
        },
    });
    // Create or update contact mutation
    const mutation = useMutation({
        mutationFn: async (values) => {
            if (isEdit && initialData?.id) {
                return apiRequest({
                    url: `/api/contacts/${initialData.id}`,
                    method: 'PUT',
                    data: values
                });
            }
            else {
                return apiRequest({
                    url: '/api/contacts',
                    method: 'POST',
                    data: values
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
            queryClient.invalidateQueries({ queryKey: ['/api/contacts/need-followup'] });
            toast({
                title: isEdit ? 'Contact updated' : 'Contact added',
                description: isEdit
                    ? 'The contact has been successfully updated.'
                    : 'The contact has been added to your network.',
            });
            onSuccess();
        },
        onError: () => {
            toast({
                title: 'Error',
                description: isEdit
                    ? 'Failed to update the contact. Please try again.'
                    : 'Failed to add the contact. Please try again.',
                variant: 'destructive',
            });
        },
    });
    // Submit form
    const onSubmit = (values) => {
        mutation.mutate(values);
    };
    return (_jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "fullName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Full Name*" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "John Doe", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "john.doe@example.com", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "phone", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Phone" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "+1 (555) 123-4567", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "jobTitle", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Position" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Software Engineer", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "company", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Company*" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Acme Inc.", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: _jsx(FormField, { control: form.control, name: "linkedInUrl", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "LinkedIn URL" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "https://linkedin.com/in/johndoe", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }) }), _jsx(FormField, { control: form.control, name: "relationshipType", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Relationship Type*" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a relationship type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Current Colleague", children: "Current Colleague" }), _jsx(SelectItem, { value: "Former Colleague", children: "Former Colleague" }), _jsx(SelectItem, { value: "Industry Expert", children: "Industry Expert" }), _jsx(SelectItem, { value: "Mentor", children: "Mentor" }), _jsx(SelectItem, { value: "Client", children: "Client" }), _jsx(SelectItem, { value: "Recruiter", children: "Recruiter" }), _jsx(SelectItem, { value: "Hiring Manager", children: "Hiring Manager" }), _jsx(SelectItem, { value: "Friend", children: "Friend" }), _jsx(SelectItem, { value: "Other", children: "Other" })] })] }), _jsx(FormMessage, {})] })) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: _jsx(FormField, { control: form.control, name: "lastContactedDate", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Last Contact Date" }), _jsx(FormControl, { children: _jsx("div", { className: "relative w-[160px]", children: _jsx(Input, { type: "date", className: "w-full", ...field, value: field.value ? format(new Date(field.value), 'yyyy-MM-dd') : '', onChange: (e) => {
                                                const date = e.target.value ? new Date(e.target.value) : null;
                                                field.onChange(date);
                                            } }) }) }), _jsx(FormMessage, {})] })) }) }), _jsx(FormField, { control: form.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Notes" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Add any additional notes about this contact", className: "min-h-[100px]", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "flex justify-end space-x-2 pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onCancel, children: "Cancel" }), _jsxs(Button, { type: "submit", disabled: mutation.isPending, children: [mutation.isPending && _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), isEdit ? 'Update Contact' : 'Add Contact'] })] })] }) }));
}
