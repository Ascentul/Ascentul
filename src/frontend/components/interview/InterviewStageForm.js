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
import { addInterviewStageForApplication, notifyInterviewDataChanged } from '@/lib/interview-utils';
// Form schema for interview stage
const interviewStageSchema = z.object({
    type: z.string().min(1, "Interview type is required"),
    scheduledDate: z.date({
        required_error: "Interview date is required",
        invalid_type_error: "Please select a valid date",
    }),
    location: z.string().optional(),
    interviewers: z.string().optional(), // This is a comma-separated string in the form
    notes: z.string().optional(),
    // Add these fields for TypeScript compatibility
    applicationId: z.number().optional(),
    processId: z.number().optional(),
});
// Default form values
const defaultValues = {
    type: '',
    location: '',
    interviewers: '',
    notes: '',
};
export function InterviewStageForm({ isOpen, onClose, processId, applicationId, onSuccess }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const form = useForm({
        resolver: zodResolver(interviewStageSchema),
        defaultValues,
    });
    // Create interview stage mutation
    const createStageMutation = useMutation({
        mutationFn: async (values) => {
            // Format the interviewers as an array if it's provided
            const interviewersArray = values.interviewers
                ? values.interviewers.split(',').map(i => i.trim())
                : [];
            // Create properly typed data object for the stage
            const stageData = {
                ...values,
                interviewers: interviewersArray,
                applicationId: applicationId,
                processId: processId
            };
            // Add the appropriate ID based on what's available
            if (applicationId) {
                stageData.applicationId = applicationId;
                try {
                    // Try to save the interview stage to the server
                    const response = await apiRequest('POST', `/api/applications/${applicationId}/stages`, stageData);
                    return await response.json();
                }
                catch (error) {
                    console.error(`Error adding interview stage to application ${applicationId}:`, error);
                    // Check if error is "Application not found" (indicating localStorage-only application)
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                        // Fallback to localStorage for applications that exist only there
                        console.log('Application not found on server, adding interview stage to localStorage application');
                        // Get applications from localStorage
                        const storedApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
                        const appIndex = storedApplications.findIndex((app) => app.id === applicationId);
                        if (appIndex === -1) {
                            throw new Error('Application not found in localStorage either');
                        }
                        // Create a mock interview stage
                        const now = new Date().toISOString();
                        // We now require a scheduled date, so we can directly use it
                        let scheduledDate = stageData.scheduledDate;
                        // Note: The form validation ensures we always have a date at this point
                        const mockStage = {
                            id: Date.now(), // Use timestamp as mock ID
                            applicationId: applicationId,
                            type: stageData.type,
                            status: 'scheduled',
                            scheduledDate: new Date(scheduledDate).toISOString(), // Always ensure a valid date
                            completedDate: null,
                            location: stageData.location || null,
                            interviewers: stageData.interviewers || [],
                            notes: stageData.notes || null,
                            outcome: 'scheduled', // Set outcome to scheduled for dashboard display
                            createdAt: now,
                            updatedAt: now
                        };
                        // Update application status to "Interviewing"
                        storedApplications[appIndex].status = 'Interviewing';
                        storedApplications[appIndex].updatedAt = now;
                        // Use the new utility to save the interview stage
                        addInterviewStageForApplication(applicationId, mockStage);
                        // Save updated application
                        localStorage.setItem('mockJobApplications', JSON.stringify(storedApplications));
                        // Notify components that interview data has changed
                        notifyInterviewDataChanged();
                        console.log('Saved mock interview stage in localStorage:', mockStage);
                        return mockStage;
                    }
                    // If it's another error, rethrow
                    throw error;
                }
            }
            else if (processId) {
                stageData.processId = processId;
                const response = await apiRequest('POST', `/api/interview/processes/${processId}/stages`, stageData);
                return await response.json();
            }
            else {
                throw new Error('Either applicationId or processId must be provided');
            }
        },
        onSuccess: () => {
            // Invalidate queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ['/api/interview/stages'] });
            if (processId) {
                queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${processId}/stages`] });
                queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
            }
            if (applicationId) {
                queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/stages`] });
                queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
                queryClient.invalidateQueries({ queryKey: ['/api/job-applications'] });
            }
            toast({
                title: 'Success',
                description: 'Interview stage added successfully',
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
                description: `Failed to add interview stage: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        },
    });
    const onSubmit = (values) => {
        console.log("Submitting new interview stage:", values);
        // The date is now required in the form schema, so we don't need to set a default
        // Use the mutation to handle the interview stage creation
        // The mutation will try the API first, then fall back to localStorage if needed
        createStageMutation.mutate(values);
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add Interview Stage" }), _jsx(DialogDescription, { children: "Add a new interview stage to track your progress with this application." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-5", children: [_jsx(FormField, { control: form.control, name: "type", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Interview Type*" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select interview type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "phone_screen", children: "Phone Screen" }), _jsx(SelectItem, { value: "technical", children: "Technical Interview" }), _jsx(SelectItem, { value: "behavioral", children: "Behavioral Interview" }), _jsx(SelectItem, { value: "culture_fit", children: "Culture Fit" }), _jsx(SelectItem, { value: "take_home", children: "Take-Home Assignment" }), _jsx(SelectItem, { value: "onsite", children: "Onsite Interview" }), _jsx(SelectItem, { value: "panel", children: "Panel Interview" }), _jsx(SelectItem, { value: "final", children: "Final Round" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "scheduledDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Date*" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground"), children: [field.value ? (format(field.value, "PPP")) : (_jsx("span", { children: "Select interview date" })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value, onSelect: field.onChange, initialFocus: true }) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "location", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Location" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter interview location (e.g., Zoom, Company Office)", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "interviewers", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Interviewers" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter interviewer names (comma-separated)", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Notes" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Enter any notes about this interview stage", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: createStageMutation.isPending, children: createStageMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Adding..."] })) : ('Add Interview Stage') })] })] }) })] }) }));
}
