import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// Define the form schema
const careerSummaryFormSchema = z.object({
    summary: z
        .string()
        .min(1, { message: "Career summary is required" })
        .max(750, {
        message: "Career summary must not exceed 750 characters"
    })
});
export function CareerSummaryFormModal({ open, onOpenChange, onClose, defaultValue = "", onSuccess }) {
    const { toast } = useToast();
    // Initialize the form
    const form = useForm({
        resolver: zodResolver(careerSummaryFormSchema),
        defaultValues: {
            summary: defaultValue || ""
        }
    });
    // Update form when defaultValue changes or dialog opens
    React.useEffect(() => {
        if (open) {
            form.reset({
                summary: defaultValue || ""
            });
        }
    }, [open, defaultValue, form]);
    // Form submission mutation
    const mutation = useMutation({
        mutationFn: async (values) => {

            const response = await apiRequest("PUT", "/api/career-data/career-summary", {
                careerSummary: values.summary
            });
            if (!response.ok) {
                console.error("❌ API request failed with status:", response.status);
                // Try to get more detailed error information
                try {
                    const errorData = await response.json();
                    console.error("Error details:", errorData);
                    throw new Error(errorData.error ||
                        errorData.message ||
                        "Failed to save career summary");
                }
                catch (parseError) {
                    console.error("Could not parse error response:", parseError);
                    throw new Error(`Failed to save career summary (${response.status}: ${response.statusText})`);
                }
            }

            return await response.json();
        },
        onSuccess: () => {
            // Show success toast
            toast({
                title: "Career summary updated",
                description: "Your career summary has been saved successfully."
            });
            // Invalidate queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ["/api/career-data"] });
            // Close the modal
            handleDialogOpenChange(false);
            // Call the onSuccess callback if provided
            if (onSuccess) {
                onSuccess();
            }
        },
        onError: (error) => {
            console.error("❌ Mutation error:", error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    });
    // Custom handler for dialog close events
    const handleDialogOpenChange = (openState) => {
        if (onOpenChange) {
            onOpenChange(openState);
        }
        else if (!openState && onClose) {
            onClose();
        }
    };
    // Submit handler
    const onSubmit = (values) => {
        mutation.mutate(values);
    };
    return (_jsx(Dialog, { open: open, onOpenChange: handleDialogOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit Career Summary" }), _jsx(DialogDescription, { children: "Provide a concise overview of your professional background, skills, and career aspirations." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsx(FormField, { control: form.control, name: "summary", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Career Summary" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Write a professional summary that highlights your experience, skills, and career goals...", className: "min-h-[200px]", ...field }) }), _jsxs(FormDescription, { children: [form.watch("summary")?.length || 0, "/750 characters"] }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => handleDialogOpenChange(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: mutation.isPending, children: mutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : ("Save Summary") })] })] }) })] }) }));
}
