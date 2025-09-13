import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
// Form schema for follow-up action
const followupActionSchema = z.object({
    type: z.string().min(1, "Follow-up type is required"),
    description: z.string().min(1, "Description is required"),
    dueDate: z.date().optional(),
    notes: z.string().optional(),
});
// Default form values
const defaultValues = {
    type: '',
    description: '',
    notes: '',
};
export function FollowupActionForm({ isOpen, onClose, processId, applicationId, stageId, onSuccess }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const form = useForm({
        resolver: zodResolver(followupActionSchema),
        defaultValues,
    });
    // Create follow-up action mutation
    const createFollowupMutation = useMutation({
        mutationFn: async (values) => {
            let followupData = {
                ...values,
                ...(stageId && { stageId }),
            };
            // Add the appropriate ID based on what's available
            if (applicationId) {
                followupData = {
                    ...followupData,
                    applicationId,
                };
                try {
                    // Try to save the followup action to the server
                    const response = await apiRequest('POST', `/api/applications/${applicationId}/followups`, followupData);
                    return await response.json();
                }
                catch (error) {
                    console.error(`Error adding followup action to application ${applicationId}:`, error);
                    // Check if error is "Application not found" (indicating localStorage-only application)
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                        // Fallback to localStorage for applications that exist only there

                        // Get applications from localStorage
                        const storedApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
                        const appIndex = storedApplications.findIndex((app) => app.id === applicationId);
                        if (appIndex === -1) {
                            throw new Error('Application not found in localStorage either');
                        }
                        // Create a mock followup action
                        const now = new Date().toISOString();
                        const mockFollowup = {
                            id: Date.now(), // Use timestamp as mock ID
                            applicationId: applicationId,
                            processId: null,
                            stageId: stageId || null,
                            type: followupData.type,
                            description: followupData.description,
                            dueDate: followupData.dueDate ? new Date(followupData.dueDate).toISOString() : null,
                            completed: false,
                            completedDate: null,
                            notes: followupData.notes || null,
                            createdAt: now,
                            updatedAt: now
                        };
                        // Store mock followup action in localStorage
                        const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${applicationId}`) || '[]');
                        mockFollowups.push(mockFollowup);
                        localStorage.setItem(`mockFollowups_${applicationId}`, JSON.stringify(mockFollowups));

                        return mockFollowup;
                    }
                    // If it's another error, rethrow
                    throw error;
                }
            }
            else if (processId) {
                followupData = {
                    ...followupData,
                    processId,
                };
                const response = await apiRequest('POST', `/api/interview/processes/${processId}/followups`, followupData);
                return await response.json();
            }
            else {
                throw new Error('Either applicationId or processId must be provided');
            }
        },
        onSuccess: () => {
            // Invalidate queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ['/api/interview/followups'] });
            if (processId) {
                queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${processId}/followups`] });
                queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            }
            if (applicationId) {
                queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/followups`] });
                queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
                queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
            }
            toast({
                title: 'Success',
                description: 'Follow-up action added successfully',
            });
            form.reset();
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to add follow-up action: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        },
    });
    const onSubmit = (values) => {
        createFollowupMutation.mutate(values);
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add Follow-up Action" }), _jsx(DialogDescription, { children: "Add a new follow-up action to stay on top of your application process." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-5", children: [_jsx(FormField, { control: form.control, name: "type", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Follow-up Type*" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select follow-up type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "thank_you_email", children: "Thank You Email" }), _jsx(SelectItem, { value: "follow_up", children: "General Follow-Up" }), _jsx(SelectItem, { value: "preparation", children: "Interview Preparation" }), _jsx(SelectItem, { value: "document_submission", children: "Document Submission" }), _jsx(SelectItem, { value: "networking", children: "Networking Connection" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description*" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter a description of the follow-up action", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "dueDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Due Date" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground"), children: [field.value ? (format(field.value, "PPP")) : (_jsx("span", { children: "Select due date" })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value, onSelect: field.onChange, initialFocus: true }) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Notes" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Enter any additional notes", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: createFollowupMutation.isPending, children: createFollowupMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Adding..."] })) : ('Add Follow-up Action') })] })] }) })] }) }));
}
