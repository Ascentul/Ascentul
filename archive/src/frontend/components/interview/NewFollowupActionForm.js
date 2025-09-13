import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
// Form schema
const formSchema = z.object({
    type: z.string().min(1, { message: "Type is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    dueDate: z.date().optional().nullable(),
    notes: z.string().optional(),
    stageId: z.number().optional().nullable(),
});
export function NewFollowupActionForm({ open, onClose, processId, stages = [] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Initialize form with default values
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: "",
            description: "",
            dueDate: null,
            notes: "",
            stageId: null,
        },
    });
    // Create mutation for submitting the new followup action
    const createFollowupActionMutation = useMutation({
        mutationFn: async (values) => {
            return apiRequest("POST", `/api/interview/processes/${values.processId}/followups`, values);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/interview/processes"] });
            // Also invalidate user statistics to update any related data
            queryClient.invalidateQueries({ queryKey: ["/api/users/statistics"] });
            toast({
                title: "Success",
                description: "Follow-up action has been added",
            });
            form.reset();
            onClose();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: `Failed to add follow-up action: ${error instanceof Error ? error.message : "Unknown error"}`,
                variant: "destructive",
            });
        },
        onSettled: () => {
            setIsSubmitting(false);
        },
    });
    // Handle form submission
    const onSubmit = (values) => {
        setIsSubmitting(true);
        createFollowupActionMutation.mutate({ ...values, processId });
    };
    return (_jsx(Dialog, { open: open, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx(DialogTitle, { children: "Add Follow-up Action" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: onClose, children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx(DialogDescription, { children: "Add a new follow-up task for this interview process." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6 pt-2", children: [_jsx(FormField, { control: form.control, name: "type", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Action Type*" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select action type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Thank You Email", children: "Thank You Email" }), _jsx(SelectItem, { value: "Prepare Questions", children: "Prepare Questions" }), _jsx(SelectItem, { value: "Follow Up Email", children: "Follow Up Email" }), _jsx(SelectItem, { value: "Send Documents", children: "Send Documents" }), _jsx(SelectItem, { value: "Technical Preparation", children: "Technical Preparation" }), _jsx(SelectItem, { value: "Research Company", children: "Research Company" }), _jsx(SelectItem, { value: "Negotiate Offer", children: "Negotiate Offer" }), _jsx(SelectItem, { value: "Other", children: "Other" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description*" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "What needs to be done?", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(FormField, { control: form.control, name: "dueDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Due Date" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground"), children: [field.value ? (format(field.value, "PPP")) : (_jsx("span", { children: "Pick a date" })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value || undefined, onSelect: field.onChange, initialFocus: true }) })] }), _jsx(FormMessage, {})] })) }), stages.length > 0 && (_jsx(FormField, { control: form.control, name: "stageId", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Related Interview Stage" }), _jsxs(Select, { onValueChange: (value) => field.onChange(value ? parseInt(value) : null), value: field.value ? field.value.toString() : "", children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a stage (optional)" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "", children: "None" }), stages.map((stage) => (_jsx(SelectItem, { value: stage.id.toString(), children: stage.type }, stage.id)))] })] }), _jsx(FormMessage, {})] })) }))] }), _jsx(FormField, { control: form.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Notes" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Additional details about this action...", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", type: "button", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? "Adding..." : "Add Action" })] })] }) })] }) }));
}
