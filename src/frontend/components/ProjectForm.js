import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertProjectSchema } from "@/utils/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription, } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Image, X } from 'lucide-react';
export default function ProjectForm({ onSubmit, initialData }) {
    const [imagePreview, setImagePreview] = useState(initialData?.imageUrl ? String(initialData.imageUrl) : null);
    const form = useForm({
        resolver: zodResolver(insertProjectSchema),
        defaultValues: initialData || {
            title: '',
            role: '',
            description: '',
            clientOrCompany: '',
            projectUrl: '',
            projectType: 'personal',
            isPublic: false,
            skillsUsed: [],
            tags: [],
            imageUrl: '',
        },
    });
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Convert to base64 for storage and preview
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setImagePreview(base64String);
                form.setValue('imageUrl', base64String);
            };
            reader.readAsDataURL(file);
        }
    };
    const clearImage = () => {
        setImagePreview(null);
        form.setValue('imageUrl', '');
    };
    return (_jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "title", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Project Title" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter project title", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "role", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Your Role" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g. Lead Developer, Project Manager", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "startDate", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Start Date" }), _jsx(FormControl, { children: _jsx(DatePicker, { date: field.value ? new Date(field.value) : undefined, setDate: (date) => field.onChange(date) }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "endDate", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "End Date" }), _jsx(FormControl, { children: _jsx(DatePicker, { date: field.value ? new Date(field.value) : undefined, setDate: (date) => field.onChange(date) }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "clientOrCompany", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Client or Company" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter client or company name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "projectUrl", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Project URL" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "https://example.com", value: field.value || '', onChange: field.onChange, onBlur: field.onBlur, name: field.name, ref: field.ref }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "imageUrl", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Project Image" }), _jsx("div", { className: "flex flex-col gap-4", children: imagePreview ? (_jsxs("div", { className: "relative", children: [_jsx("img", { src: imagePreview, alt: "Project preview", className: "w-full h-40 object-cover rounded-md" }), _jsx(Button, { type: "button", variant: "destructive", size: "icon", className: "absolute top-2 right-2 h-8 w-8 rounded-full", onClick: clearImage, children: _jsx(X, { className: "h-4 w-4" }) })] })) : (_jsxs("div", { className: "border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center gap-2 text-gray-500", children: [_jsx(Image, { className: "h-8 w-8" }), _jsx("p", { children: "Upload a project image" }), _jsx(Input, { type: "file", accept: "image/*", onChange: handleImageChange, className: "hidden", id: "projectImage" }), _jsx(Button, { type: "button", variant: "outline", onClick: () => document.getElementById('projectImage')?.click(), children: "Choose Image" })] })) }), _jsx(FormDescription, { children: "Add an image to showcase your project. This will be displayed on your project card." }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Describe the project, its goals, and your contributions...", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "projectType", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Project Type" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select project type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "personal", children: "Personal" }), _jsx(SelectItem, { value: "client", children: "Client" }), _jsx(SelectItem, { value: "academic", children: "Academic" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "submit", className: "w-full", children: initialData ? 'Update Project' : 'Create Project' })] }) }));
}
