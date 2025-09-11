import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from '@/lib/queryClient';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
const interviewStageSchema = z.object({
    type: z.string().min(1, { message: "Please select an interview type" }),
    scheduledDate: z.date().nullable(),
    location: z.string().nullable(),
    interviewers: z.string().transform(val => val.length > 0 ? val.split(',').map(v => v.trim()) : []),
    notes: z.string().nullable(),
    outcome: z.string().nullable(),
    feedback: z.string().nullable(),
});
export function EditInterviewStageForm({ isOpen, onClose, stage, applicationId, onSuccess }) {
    const [isPending, setIsPending] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    // Initialize form with stage values
    const form = useForm({
        resolver: zodResolver(interviewStageSchema),
        defaultValues: {
            type: stage.type || 'phone_screen',
            scheduledDate: stage.scheduledDate ? new Date(stage.scheduledDate) : null,
            location: stage.location || null,
            interviewers: stage.interviewers && stage.interviewers.length > 0 ? stage.interviewers.join(', ') : '',
            notes: stage.notes || null,
            outcome: stage.outcome || null,
            feedback: stage.feedback || null,
        },
    });
    const updateStageMutation = useMutation({
        mutationFn: async (values) => {
            try {
                // First try to update on server
                const response = await apiRequest('PATCH', `/api/applications/${applicationId}/stages/${stage.id}`, values);
                return await response.json();
            }
            catch (error) {
                console.error(`Error updating interview stage via API:`, error);
                // If API call fails (for localStorage apps), update in localStorage
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.includes('not found') || errorMessage.includes('404')) {

                    // Get existing stages
                    const mockStages = JSON.parse(localStorage.getItem(`mockInterviewStages_${applicationId}`) || '[]');
                    const stageIndex = mockStages.findIndex((s) => s.id === stage.id);
                    if (stageIndex === -1) {
                        throw new Error('Interview stage not found in localStorage');
                    }
                    // Update the stage with new values
                    mockStages[stageIndex] = {
                        ...mockStages[stageIndex],
                        ...values,
                        updatedAt: new Date().toISOString(),
                    };
                    // Save back to both localStorage keys for compatibility
                    localStorage.setItem(`mockInterviewStages_${applicationId}`, JSON.stringify(mockStages));
                    localStorage.setItem(`mockStages_${applicationId}`, JSON.stringify(mockStages));
                    return mockStages[stageIndex];
                }
                throw error;
            }
        },
        onSuccess: () => {
            // Invalidate relevant queries
            if (applicationId) {
                queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/stages`] });
            }
            // Close form and call success callback
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        }
    });
    const deleteStageMutation = useMutation({
        mutationFn: async () => {

            // Always attempt to delete from both localStorage keys first to ensure UI updates immediately
            try {
                // Get stages from all known localStorage keys
                const deleteFromLocalStorage = () => {

                    let updated = false;
                    // Try both localStorage keys
                    ['mockStages_', 'mockInterviewStages_'].forEach(keyPrefix => {
                        try {
                            const key = `${keyPrefix}${applicationId}`;
                            const stagesStr = localStorage.getItem(key);
                            if (!stagesStr)
                                return;
                            const stages = JSON.parse(stagesStr);
                            if (!Array.isArray(stages))
                                return;

                            const stageIndex = stages.findIndex((s) => s.id === stage.id);
                            if (stageIndex !== -1) {

                                stages.splice(stageIndex, 1);
                                localStorage.setItem(key, JSON.stringify(stages));
                                updated = true;
                            }
                        }
                        catch (e) {
                            console.error(`Error processing ${keyPrefix}${applicationId}:`, e);
                        }
                    });
                    return updated;
                };
                // Delete from localStorage
                const localStorageUpdated = deleteFromLocalStorage();

            }
            catch (localError) {
                console.error(`Error deleting from localStorage:`, localError);
            }
            // Then try to delete from server
            try {

                const response = await apiRequest('DELETE', `/api/applications/${applicationId}/stages/${stage.id}`);
                if (response.ok) {

                    return true;
                }
                console.error(`Server API returned ${response.status}: ${response.statusText}`);
                // Don't throw here, since we may have already deleted from localStorage
            }
            catch (apiError) {
                console.error(`API delete request failed:`, apiError);
                // Don't throw here, since we may have already deleted from localStorage
            }
            // If we get here, at least the localStorage delete should have worked
            return true;
        },
        onSuccess: () => {
            // Invalidate relevant queries
            if (applicationId) {
                queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/stages`] });
            }
            // Show success message
            toast({
                title: "Interview deleted",
                description: "The interview has been deleted successfully."
            });
            // Close form and call success callback
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        },
        onError: (error) => {
            console.error("Error deleting interview stage:", error);
            toast({
                title: "Error",
                description: "Failed to delete the interview. Please try again.",
                variant: "destructive"
            });
            setIsDeleting(false);
        }
    });
    const onSubmit = (data) => {
        setIsPending(true);
        // Convert the form data to the expected format for the API
        const values = {
            ...data,
            // interviewers is already transformed by the schema
        };

        // First, update the stage in localStorage immediately for better UX
        try {
            if (applicationId) {
                // Get current stages from both possible localStorage keys
                let mockStages = [];
                // First try mockInterviewStages_${applicationId}
                try {
                    const interviewStagesJson = localStorage.getItem(`mockInterviewStages_${applicationId}`);
                    if (interviewStagesJson) {
                        mockStages = JSON.parse(interviewStagesJson);

                    }
                }
                catch (e) {
                    console.error("Error parsing mockInterviewStages_:", e);
                }
                // If that didn't work, try mockStages_${applicationId}
                if (!Array.isArray(mockStages) || mockStages.length === 0) {
                    try {
                        const stagesJson = localStorage.getItem(`mockStages_${applicationId}`);
                        if (stagesJson) {
                            mockStages = JSON.parse(stagesJson);

                        }
                    }
                    catch (e) {
                        console.error("Error parsing mockStages_:", e);
                    }
                }
                // Ensure we have a valid array
                if (!Array.isArray(mockStages)) {
                    mockStages = [];
                }

                // Find the index of the stage to update
                const stageIndex = mockStages.findIndex((s) => s.id === stage.id);
                if (stageIndex !== -1) {
                    // Update the stage with new values while preserving existing ones
                    mockStages[stageIndex] = {
                        ...mockStages[stageIndex],
                        ...values,
                        updatedAt: new Date().toISOString()
                    };

                    // Save back to both localStorage keys
                    localStorage.setItem(`mockInterviewStages_${applicationId}`, JSON.stringify(mockStages));
                    localStorage.setItem(`mockStages_${applicationId}`, JSON.stringify(mockStages));
                    // Force UI update
                    queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/stages`] });
                }
                else {

                    // If stage doesn't exist in localStorage yet, add it
                    mockStages.push({
                        ...stage,
                        ...values,
                        updatedAt: new Date().toISOString()
                    });
                    // Save back to both localStorage keys for compatibility
                    localStorage.setItem(`mockInterviewStages_${applicationId}`, JSON.stringify(mockStages));
                    localStorage.setItem(`mockStages_${applicationId}`, JSON.stringify(mockStages));
                    // Force UI update
                    queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/stages`] });
                }
            }
        }
        catch (localStorageError) {
            console.error("Error updating localStorage:", localStorageError);
        }
        // Also try to update on the server
        updateStageMutation.mutate(values, {
            onSuccess: () => {
                // Call the onSuccess callback
                if (onSuccess) {
                    onSuccess();
                }
                onClose();
            },
            onError: (error) => {
                console.error("Error updating interview stage via API:", error);
                // Even if the API update fails, the localStorage update should have worked,
                // so we can still call the success callback
                if (onSuccess) {
                    onSuccess();
                }
                onClose();
            },
            onSettled: () => setIsPending(false)
        });
    };
    return (_jsxs(_Fragment, { children: [_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit Interview Stage" }), _jsx(DialogDescription, { children: "Update the details of this interview stage." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "type", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Interview Type" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select interview type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "phone_screen", children: "Phone Screen" }), _jsx(SelectItem, { value: "technical", children: "Technical Interview" }), _jsx(SelectItem, { value: "behavioral", children: "Behavioral Interview" }), _jsx(SelectItem, { value: "onsite", children: "Onsite Interview" }), _jsx(SelectItem, { value: "panel", children: "Panel Interview" }), _jsx(SelectItem, { value: "final", children: "Final Round" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "scheduledDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Interview Date" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground"), children: [field.value ? (format(field.value, "PPP")) : (_jsx("span", { children: "Pick a date" })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value || undefined, onSelect: field.onChange, disabled: (date) => date < new Date("1900-01-01"), initialFocus: true }) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "location", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Location" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Online / Zoom / Office location", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "interviewers", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Interviewers" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Names of interviewers (separate with commas)", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "outcome", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Outcome" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value || '', children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select an outcome" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "pending", children: "Pending" }), _jsx(SelectItem, { value: "scheduled", children: "Scheduled" }), _jsx(SelectItem, { value: "passed", children: "Passed" }), _jsx(SelectItem, { value: "failed", children: "Rejected" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "feedback", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Feedback Received" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Any feedback received from the interview", className: "min-h-[80px]", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Notes" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Additional notes about this interview stage", className: "min-h-[80px]", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "flex justify-between w-full", children: [_jsxs(Button, { type: "button", variant: "destructive", onClick: () => setIsDeleteDialogOpen(true), className: "mr-auto flex items-center", disabled: isDeleting, children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), "Delete"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isPending, children: isPending ? "Updating..." : "Update Interview" })] })] })] }) })] }) }), _jsx(AlertDialog, { open: isDeleteDialogOpen, onOpenChange: setIsDeleteDialogOpen, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Are you sure?" }), _jsx(AlertDialogDescription, { children: "This action cannot be undone. This will permanently delete this interview stage." })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { disabled: isDeleting, children: "Cancel" }), _jsx(AlertDialogAction, { onClick: (e) => {
                                        e.preventDefault();
                                        setIsDeleting(true);
                                        deleteStageMutation.mutate();
                                    }, className: "bg-destructive hover:bg-destructive/90", disabled: isDeleting, children: isDeleting ? "Deleting..." : "Delete" })] })] }) })] }));
}
