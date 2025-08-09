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
    scheduledDate: z.date().optional().nullable(),
    location: z.string().optional(),
    interviewers: z.string().optional(), // Will be split into array later
    notes: z.string().optional(),
});
export function NewInterviewStageForm({ open, onClose, processId }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Initialize form with default values
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: "",
            scheduledDate: null,
            location: "",
            interviewers: "",
            notes: "",
        },
    });
    // Create mutation for submitting the new interview stage
    const createInterviewStageMutation = useMutation({
        mutationFn: async (values) => {
            // Process interviewers into an array if present
            const formattedValues = {
                ...values,
                // The scheduledDate is already a Date object (or null), so we don't need to convert it
                interviewers: values.interviewers ? values.interviewers.split(',').map(name => name.trim()) : []
            };
            console.log('Submitting interview stage with data:', formattedValues);
            const response = await apiRequest("POST", `/api/interview/processes/${processId}/stages`, formattedValues);
            // Also invalidate upcoming interviews data
            queryClient.invalidateQueries({ queryKey: ["/api/users/statistics"] });
            return response;
        },
        onSuccess: () => {
            // Invalidate both interview processes and stages queries to refresh all related data
            queryClient.invalidateQueries({ queryKey: ["/api/interview/processes"] });
            queryClient.invalidateQueries({ queryKey: ["/api/interview/processes", processId, "stages"] });
            toast({
                title: "Success",
                description: "Interview stage has been added",
            });
            form.reset();
            onClose();
        },
        onError: (error) => {
            console.error('Error adding interview stage:', error);
            toast({
                title: "Error",
                description: `Failed to add interview stage: ${error instanceof Error ? error.message : "Unknown error"}`,
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
        createInterviewStageMutation.mutate({ ...values, processId });
    };
    return (_jsx(Dialog, { open: open, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx(DialogTitle, { children: "Add Interview Stage" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: onClose, children: _jsx(X, { className: "h-4 w-4" }) })] }), _jsx(DialogDescription, { children: "Add a new stage to this interview process." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6 pt-2", children: [_jsx(FormField, { control: form.control, name: "type", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Stage Type*" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select stage type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Phone Screening", children: "Phone Screening" }), _jsx(SelectItem, { value: "Technical Assessment", children: "Technical Assessment" }), _jsx(SelectItem, { value: "Technical Interview", children: "Technical Interview" }), _jsx(SelectItem, { value: "Behavioral Interview", children: "Behavioral Interview" }), _jsx(SelectItem, { value: "Onsite Interview", children: "Onsite Interview" }), _jsx(SelectItem, { value: "System Design Interview", children: "System Design Interview" }), _jsx(SelectItem, { value: "HR Interview", children: "HR Interview" }), _jsx(SelectItem, { value: "Final Interview", children: "Final Interview" }), _jsx(SelectItem, { value: "Other", children: "Other" })] })] }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(FormField, { control: form.control, name: "scheduledDate", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-col", children: [_jsx(FormLabel, { children: "Scheduled Date" }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(FormControl, { children: _jsxs(Button, { variant: "outline", className: cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground"), children: [field.value ? (format(field.value, "PPP")) : (_jsx("span", { children: "Pick a date" })), _jsx(CalendarIcon, { className: "ml-auto h-4 w-4 opacity-50" })] }) }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: field.value || undefined, onSelect: field.onChange, initialFocus: true }) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "location", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Location" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Virtual / Office Address", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "interviewers", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Interviewers" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Names separated by commas", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Notes" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Additional details about this stage...", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", type: "button", onClick: onClose, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? "Adding..." : "Add Stage" })] })] }) })] }) }));
}
