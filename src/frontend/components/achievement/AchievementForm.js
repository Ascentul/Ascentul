import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Award, Briefcase, GraduationCap, Medal, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertUserPersonalAchievementSchema } from "@/utils/schema";
import { DatePicker } from "@/components/ui/date-picker";
// Icons mapping
const iconComponents = {
    award: Award,
    briefcase: Briefcase,
    graduation: GraduationCap,
    medal: Medal,
    star: Star,
    trophy: Trophy,
};
// Categories
const categories = [
    { value: "professional", label: "Professional" },
    { value: "academic", label: "Academic" },
    { value: "personal", label: "Personal" },
    { value: "certification", label: "Certification" },
    { value: "award", label: "Award" },
];
// Extend the schema for the form validation
const formSchema = insertUserPersonalAchievementSchema.extend({
// Optional validation rules can be added here
});
export function AchievementForm({ onSuccess, defaultValues, achievementId, closeDialog, onCancel, }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [iconPreview, setIconPreview] = useState(defaultValues?.icon || "award");
    // Initialize the form
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            category: "professional",
            icon: "award",
            achievementDate: new Date(),
            issuingOrganization: "",
            proofUrl: "",
            skills: "",
            xpValue: 50,
            isHighlighted: false,
            ...defaultValues,
        },
    });
    // Create or update mutation
    const mutation = useMutation({
        mutationFn: async (values) => {
            if (achievementId) {
                // Update existing achievement
                const res = await apiRequest("PUT", `/api/personal-achievements/${achievementId}`, values);
                return await res.json();
            }
            else {
                // Create new achievement
                const res = await apiRequest("POST", "/api/personal-achievements", values);
                return await res.json();
            }
        },
        onSuccess: () => {
            // Invalidate queries to refresh the achievements list
            queryClient.invalidateQueries({ queryKey: ["/api/personal-achievements"] });
            queryClient.invalidateQueries({ queryKey: ["/api/users/statistics"] });
            // Show success message
            toast({
                title: achievementId ? "Achievement updated" : "Achievement created",
                description: achievementId
                    ? "Your achievement has been updated successfully."
                    : "Your achievement has been added successfully.",
            });
            // Reset form if creating
            if (!achievementId) {
                form.reset({
                    title: "",
                    description: "",
                    category: "professional",
                    icon: "award",
                    achievementDate: new Date(),
                    issuingOrganization: "",
                    proofUrl: "",
                    skills: "",
                    xpValue: 50,
                    isHighlighted: false,
                });
            }
            // Call the onSuccess callback if provided
            if (onSuccess) {
                onSuccess();
            }
            // Close dialog if provided
            if (closeDialog) {
                closeDialog();
            }
        },
        onError: (error) => {
            console.error("Error saving achievement:", error);
            toast({
                title: "Error",
                description: "Failed to save the achievement. Please try again.",
                variant: "destructive",
            });
        },
    });
    // Submit handler
    function onSubmit(values) {
        mutation.mutate(values);
    }
    return (_jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-2", children: [_jsxs("div", { className: "space-y-6 md:col-span-2", children: [_jsx(FormField, { control: form.control, name: "title", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Achievement Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Completed Project Leadership Certification", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Describe your achievement and its significance...", className: "min-h-[120px]", ...field }) }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "category", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Category" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value ?? undefined, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a category" }) }) }), _jsx(SelectContent, { children: categories.map((category) => (_jsx(SelectItem, { value: category.value, children: category.label }, category.value))) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "achievementDate", render: ({ field }) => (_jsxs(FormItem, { className: "w-full", children: [_jsx(FormLabel, { children: "Date Achieved" }), _jsx(FormControl, { children: _jsx("div", { className: "w-full", children: _jsx(DatePicker, { date: field.value instanceof Date ? field.value : new Date(field.value), setDate: field.onChange }) }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "issuingOrganization", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Issuing Organization (Optional)" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Microsoft, Google, or University name", ...field, value: field.value ?? '' }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "icon", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Icon" }), _jsxs(Select, { onValueChange: (value) => {
                                            field.onChange(value);
                                            setIconPreview(value);
                                        }, defaultValue: field.value ?? undefined, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select an icon" }) }) }), _jsx(SelectContent, { children: Object.entries(iconComponents).map(([key, Icon]) => (_jsx(SelectItem, { value: key, children: _jsxs("div", { className: "flex items-center", children: [_jsx(Icon, { className: "mr-2 h-4 w-4" }), _jsx("span", { className: "capitalize", children: key })] }) }, key))) })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "proofUrl", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Proof URL (Optional)" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "https://example.com/certificate", ...field, value: field.value ?? '' }) }), _jsx(FormDescription, { children: "Link to certificate or proof of achievement" }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "skills", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Related Skills (Optional)" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Leadership, Python, Project Management", ...field, value: field.value ?? '' }) }), _jsx(FormDescription, { children: "Comma-separated list of related skills" }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "flex justify-end space-x-4", children: [onCancel && (_jsx(Button, { type: "button", variant: "outline", onClick: onCancel, children: "Cancel" })), _jsx(Button, { type: "submit", disabled: mutation.isPending, className: "px-6", children: mutation.isPending ? "Saving..." : achievementId ? "Update Achievement" : "Add Achievement" })] })] }) }));
}
