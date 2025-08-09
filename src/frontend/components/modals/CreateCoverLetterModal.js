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
    jobTitle: z.string().min(2, 'Job title must be at least 2 characters').max(100),
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    contactPerson: z.string().optional(),
    keyPoints: z.string().min(10, 'Key points should be at least 10 characters'),
    tone: z.enum(['professional', 'enthusiastic', 'formal', 'conversational']),
});
export default function CreateCoverLetterModal({ isOpen, onClose }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Default form values
    const defaultValues = {
        title: '',
        jobTitle: '',
        companyName: '',
        contactPerson: '',
        keyPoints: '',
        tone: 'professional',
    };
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues,
    });
    const createCoverLetterMutation = useMutation({
        mutationFn: async (data) => {
            const response = await apiRequest('POST', '/api/cover-letters', data);
            return response.json();
        },
        onSuccess: () => {
            // Invalidate and refetch cover letters query
            queryClient.invalidateQueries({ queryKey: ['/api/cover-letters'] });
            // Show success message
            toast({
                title: "Cover letter created",
                description: "Your cover letter has been created successfully.",
            });
            // Reset form and close modal
            form.reset();
            onClose();
        },
        onError: (error) => {
            toast({
                title: "Failed to create cover letter",
                description: error.message || "There was a problem creating your cover letter. Please try again.",
                variant: "destructive",
            });
        },
    });
    const onSubmit = (data) => {
        createCoverLetterMutation.mutate(data);
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Create Cover Letter" }), _jsx(DialogDescription, { children: "Create a personalized cover letter for your job application." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "title", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Cover Letter Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Product Manager - Acme Corp", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "jobTitle", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Job Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Product Manager", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "companyName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Company Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Acme Corporation", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "contactPerson", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Contact Person (Optional)" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "John Smith", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "keyPoints", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Key Points to Highlight" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "5 years experience in product management, led a team of 7, increased revenue by 30%...", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "tone", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Tone" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select tone" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "professional", children: "Professional" }), _jsx(SelectItem, { value: "enthusiastic", children: "Enthusiastic" }), _jsx(SelectItem, { value: "formal", children: "Formal" }), _jsx(SelectItem, { value: "conversational", children: "Conversational" })] })] }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "mt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: createCoverLetterMutation.isPending, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: createCoverLetterMutation.isPending, children: createCoverLetterMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Creating..."] })) : ("Create Cover Letter") })] })] }) })] }) }));
}
