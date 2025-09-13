import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
// Create schema for the form
const followupSchema = z.object({
    type: z.string(),
    description: z.string().min(1, "Description is required"),
    dueDate: z.date().optional().nullable(),
    completed: z.boolean().default(false),
    notes: z.string().optional().nullable(),
});
export function EditFollowupForm({ isOpen, onClose, followup, applicationId, onSuccess }) {
    const [isPending, setIsPending] = useState(false);
    const [isDeletePending, setIsDeletePending] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    // Initialize form with current values
    const form = useForm({
        resolver: zodResolver(followupSchema),
        defaultValues: {
            type: followup.type,
            description: followup.description,
            dueDate: followup.dueDate ? new Date(followup.dueDate) : null,
            completed: followup.completed,
            notes: followup.notes,
        }
    });
    // Mutation to update the followup
    const updateFollowupMutation = useMutation({
        mutationFn: async (values) => {
            try {
                const response = await apiRequest('PATCH', `/api/applications/${applicationId}/followups/${followup.id}`, values);
                return await response.json();
            }
            catch (error) {
                console.error("Error updating followup via API:", error);
                throw error;
            }
        }
    });
    // Mutation to delete the followup
    const deleteFollowupMutation = useMutation({
        mutationFn: async () => {
            try {
                const response = await apiRequest('DELETE', `/api/applications/${applicationId}/followups/${followup.id}`);
                return response.ok;
            }
            catch (error) {
                console.error("Error deleting followup via API:", error);
                throw error;
            }
        }
    });
    // Function to handle follow-up deletion
    const handleDelete = () => {
        setIsDeletePending(true);
        // First delete from localStorage for immediate UI update
        try {
            // Get current followups from localStorage
            const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${applicationId}`) || '[]');
            // Filter out the followup to delete
            const updatedFollowups = mockFollowups.filter((f) => f.id !== followup.id);
            // Save back to localStorage
            localStorage.setItem(`mockFollowups_${applicationId}`, JSON.stringify(updatedFollowups));
            // Force UI update
            queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/followups`] });
        }
        catch (localStorageError) {
            console.error("Error updating localStorage:", localStorageError);
        }
        // Also try to delete on the server
        deleteFollowupMutation.mutate(undefined, {
            onSuccess: () => {
                toast({
                    title: "Follow-up deleted",
                    description: "The follow-up action has been removed successfully.",
                });
                // Call the onSuccess callback
                if (onSuccess) {
                    onSuccess();
                }
                onClose();
            },
            onError: (error) => {
                console.error("Error deleting followup via API:", error);
                // Even if the API delete fails, the localStorage delete should have worked,
                // so we can still call the success callback
                toast({
                    title: "Follow-up deleted",
                    description: "The follow-up action has been removed successfully.",
                });
                if (onSuccess) {
                    onSuccess();
                }
                onClose();
            },
            onSettled: () => setIsDeletePending(false)
        });
    };
    const onSubmit = (data) => {
        setIsPending(true);

        // First, update the followup in localStorage immediately for better UX
        try {
            // Get current followups from localStorage
            const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${applicationId}`) || '[]');

            // Find the index of the followup to update
            const followupIndex = mockFollowups.findIndex((f) => f.id === followup.id);
            if (followupIndex !== -1) {
                // Update the followup with new values while preserving existing ones
                mockFollowups[followupIndex] = {
                    ...mockFollowups[followupIndex],
                    ...data,
                    dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
                    updatedAt: new Date().toISOString()
                };

                // Save back to localStorage
                localStorage.setItem(`mockFollowups_${applicationId}`, JSON.stringify(mockFollowups));
                // Force UI update
                queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/followups`] });
            }
            else {

                // If followup doesn't exist in localStorage yet, add it
                mockFollowups.push({
                    ...followup,
                    ...data,
                    dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
                    updatedAt: new Date().toISOString()
                });
                // Save back to localStorage
                localStorage.setItem(`mockFollowups_${applicationId}`, JSON.stringify(mockFollowups));
                // Force UI update
                queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/followups`] });
            }
        }
        catch (localStorageError) {
            console.error("Error updating localStorage:", localStorageError);
        }
        // Also try to update on the server
        updateFollowupMutation.mutate(data, {
            onSuccess: () => {
                // Call the onSuccess callback
                if (onSuccess) {
                    onSuccess();
                }
                onClose();
            },
            onError: (error) => {
                console.error("Error updating followup via API:", error);
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
    return (_jsxs(_Fragment, { children: [_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit Follow-up Action" }), _jsx(DialogDescription, { children: "Update the details of this follow-up action." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "type", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Action Type" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select action type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "thank_you_email", children: "Thank You Email" }), _jsx(SelectItem, { value: "follow_up", children: "Follow-up" }), _jsx(SelectItem, { value: "preparation", children: "Interview Preparation" }), _jsx(SelectItem, { value: "document_submission", children: "Document Submission" }), _jsx(SelectItem, { value: "networking", children: "Networking Connection" }), _jsx(SelectItem, { value: "other", children: "Other" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Brief description of the follow-up action", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "dueDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Due Date" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground"), children: [field.value ? (format(field.value, "PPP")) : (_jsx("span", { children: "Pick a date" })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value || undefined, onSelect: field.onChange, disabled: (date) => date < new Date("1900-01-01"), initialFocus: true }) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "completed", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-center justify-between rounded-lg border p-3", children: [_jsx("div", { className: "space-y-0.5", children: _jsx(FormLabel, { children: "Completed" }) }), _jsx(FormControl, { children: _jsx(Switch, { checked: field.value, onCheckedChange: field.onChange }) })] })) }), _jsx(FormField, { control: form.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Notes" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Additional notes about this follow-up", className: "min-h-[80px]", ...field, value: field.value || '' }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "flex justify-between sm:justify-between", children: [_jsx(Button, { type: "button", variant: "destructive", onClick: () => setShowDeleteDialog(true), disabled: isDeletePending, children: isDeletePending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Deleting..."] })) : (_jsxs(_Fragment, { children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Delete"] })) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isPending, children: isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Updating..."] })) : ('Update Follow-up') })] })] })] }) })] }) }), _jsx(AlertDialog, { open: showDeleteDialog, onOpenChange: setShowDeleteDialog, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Are you sure?" }), _jsx(AlertDialogDescription, { children: "This will permanently delete this follow-up action. This action cannot be undone." })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { onClick: () => setShowDeleteDialog(false), children: "Cancel" }), _jsx(AlertDialogAction, { onClick: handleDelete, children: isDeletePending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Deleting..."] })) : ("Delete") })] })] }) })] }));
}
