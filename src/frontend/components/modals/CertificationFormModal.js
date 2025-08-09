import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger, } from '@/components/ui/popover';
// Define the form schema
const certificationFormSchema = z.object({
    name: z.string().min(1, { message: 'Certification name is required' }),
    issuingOrganization: z.string().min(1, { message: 'Issuing organization is required' }),
    // issueDate is a required field in the database schema
    issueDate: z.date({ required_error: 'Issue date is required' }),
    expiryDate: z.date().nullable().optional(),
    noExpiration: z.boolean().default(false),
    credentialID: z.string().nullable().optional(),
    credentialURL: z.string().url().nullable().optional().or(z.literal('')),
});
export function CertificationFormModal({ open, onOpenChange, defaultValues = {
    name: '',
    issuingOrganization: '',
    issueDate: new Date(), // Set today's date as default for the required field
    expiryDate: null,
    noExpiration: false,
    credentialID: '',
    credentialURL: '',
}, mode = 'add', certificationId, onSuccess, }) {
    const { toast } = useToast();
    // Initialize the form
    const form = useForm({
        resolver: zodResolver(certificationFormSchema),
        defaultValues,
    });
    // Get the current values from the form to use for conditional rendering
    const noExpiration = form.watch('noExpiration');
    // Form submission mutation
    const mutation = useMutation({
        mutationFn: async (values) => {
            // If noExpiration is true, set expiryDate to null
            if (values.noExpiration) {
                values.expiryDate = null;
            }
            // Ensure empty URL is null
            if (values.credentialURL === '') {
                values.credentialURL = null;
            }
            // Convert Date objects to ISO string format for the backend
            // The database schema expects text for date fields
            const formattedValues = {
                ...values,
                issueDate: values.issueDate ? values.issueDate.toISOString().split('T')[0] : null,
                expiryDate: values.expiryDate ? values.expiryDate.toISOString().split('T')[0] : null
            };
            let response;
            if (mode === 'add') {
                response = await apiRequest('POST', '/api/career-data/certifications', formattedValues);
            }
            else {
                response = await apiRequest('PUT', `/api/career-data/certifications/${certificationId}`, formattedValues);
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save certification');
            }
            return await response.json();
        },
        onSuccess: () => {
            // Show success toast
            toast({
                title: mode === 'add' ? 'Certification added' : 'Certification updated',
                description: 'Your changes have been saved successfully.',
            });
            // Invalidate queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ['/api/career-data'] });
            // Close the modal
            onOpenChange(false);
            // Call the onSuccess callback if provided
            if (onSuccess) {
                onSuccess();
            }
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
        mutation.mutate(values);
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: mode === 'add' ? 'Add Certification' : 'Edit Certification' }), _jsx(DialogDescription, { children: "Add details about your certifications, licenses, or credentials." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Certification Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. AWS Certified Solutions Architect", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "issuingOrganization", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Issuing Organization" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. Amazon Web Services", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "issueDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Issue Date" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: "pl-3 text-left font-normal", children: [field.value ? (format(field.value, 'PPP')) : (_jsx("span", { children: "Pick a date" })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value || undefined, onSelect: field.onChange, disabled: (date) => date > new Date() || date < new Date('1900-01-01'), initialFocus: true }) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "noExpiration", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-center justify-between space-y-0", children: [_jsx(FormLabel, { children: "No Expiration" }), _jsx(FormControl, { children: _jsx(Switch, { checked: field.value, onCheckedChange: field.onChange }) })] })) }), !noExpiration && (_jsx(FormField, { control: form.control, name: "expiryDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsxs(FormLabel, { children: ["Expiry Date ", _jsx("span", { className: "text-muted-foreground", children: "(Optional)" })] }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: "pl-3 text-left font-normal", children: [field.value ? (format(field.value, 'PPP')) : (_jsx("span", { children: "Pick a date" })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value || undefined, onSelect: field.onChange, disabled: (date) => date < new Date('1900-01-01'), initialFocus: true }) })] }), _jsx(FormMessage, {})] })) })), _jsx(FormField, { control: form.control, name: "credentialID", render: ({ field }) => (_jsxs(FormItem, { children: [_jsxs(FormLabel, { children: ["Credential ID ", _jsx("span", { className: "text-muted-foreground", children: "(Optional)" })] }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. ABC123XYZ", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "credentialURL", render: ({ field }) => (_jsxs(FormItem, { children: [_jsxs(FormLabel, { children: ["Credential URL ", _jsx("span", { className: "text-muted-foreground", children: "(Optional)" })] }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. https://verify.credential.com/abc123", ...field, value: field.value || '' }) }), _jsx(FormDescription, { children: "If available, enter the URL where others can verify this credential." }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: mutation.isPending, children: mutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : ('Save') })] })] }) })] }) }));
}
