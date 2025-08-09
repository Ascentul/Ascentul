import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Linkedin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
const linkedInProfileFormSchema = z.object({
    linkedInUrl: z
        .string()
        .url({ message: "Please enter a valid URL" })
        .min(1, { message: "LinkedIn profile URL is required" })
        .refine((url) => url.includes('linkedin.com'), {
        message: "URL must be from linkedin.com"
    })
});
export function LinkedInProfileFormModal({ open, onOpenChange, onClose, defaultValue = '', onSuccess }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const form = useForm({
        resolver: zodResolver(linkedInProfileFormSchema),
        defaultValues: {
            linkedInUrl: defaultValue || ''
        }
    });
    // Reset form when modal opens/closes or defaultValue changes
    React.useEffect(() => {
        if (open) {
            form.reset({
                linkedInUrl: defaultValue || ''
            });
        }
    }, [open, defaultValue, form]);
    const handleSubmit = async (values) => {
        setIsSubmitting(true);
        try {
            // Send to backend
            const response = await apiRequest('POST', '/api/career-data/linkedin-url', {
                linkedInUrl: values.linkedInUrl
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save LinkedIn profile URL');
            }
            toast({
                title: "LinkedIn Profile Updated",
                description: "Your LinkedIn profile URL has been saved successfully.",
            });
            // Close modal
            if (onOpenChange) {
                onOpenChange(false);
            }
            else if (onClose) {
                onClose();
            }
            // Call success callback if provided
            if (onSuccess) {
                onSuccess();
            }
        }
        catch (error) {
            toast({
                title: "Update Failed",
                description: error.message,
                variant: "destructive"
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center", children: [_jsx(Linkedin, { className: "h-5 w-5 mr-2 text-blue-600" }), "LinkedIn Profile"] }), _jsx(DialogDescription, { children: "Add your LinkedIn profile URL to enhance your professional presence." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(handleSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "linkedInUrl", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "LinkedIn URL" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "https://www.linkedin.com/in/yourprofile", ...field }) }), _jsx(FormDescription, { children: "Enter the full URL to your LinkedIn profile" }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "mt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => onOpenChange && onOpenChange(false), disabled: isSubmitting, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : (_jsx(_Fragment, { children: "Save" })) })] })] }) })] }) }));
}
