import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';
import { AlertCircle, Trash2, Upload, BellRing, Building, GraduationCap, BookOpen, Plus, PenLine, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
// Form schema for university profile
const universityProfileSchema = z.object({
    universityName: z.string().min(1, 'University name is required'),
    description: z.string().optional(),
    website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
    contactEmail: z.string().email('Please enter a valid email address'),
    logo: z.any().optional(),
    primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Please enter a valid hex color code'),
    secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Please enter a valid hex color code').optional(),
});
// Schema for notification settings
const notificationSettingsSchema = z.object({
    emailNotifications: z.boolean().default(true),
    studentActivityDigest: z.boolean().default(true),
    usageReports: z.boolean().default(true),
    sendCopyToAdmin: z.boolean().default(false),
    adminEmail: z.string().email('Please enter a valid email address').optional(),
});
// Schema for academic program
const academicProgramSchema = z.object({
    programName: z.string().min(1, 'Program name is required'),
    degreeType: z.enum(['Associate', 'Bachelor', 'Master', 'Doctorate', 'Certificate']),
    departmentName: z.string().min(1, 'Department name is required'),
    description: z.string().optional(),
    duration: z.number().min(1, 'Duration must be at least 1').max(10, 'Duration cannot exceed 10'),
    active: z.boolean().default(true),
});
export default function Settings() {
    const { toast } = useToast();
    const { user } = useUser();
    const queryClient = useQueryClient();
    const [logoPreview, setLogoPreview] = useState(null);
    const [isAddProgramDialogOpen, setIsAddProgramDialogOpen] = useState(false);
    const [isEditProgramDialogOpen, setIsEditProgramDialogOpen] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);
    // Query for fetching academic programs
    const { data: programs = [], isLoading: programsLoading, error: programsError } = useQuery({
        queryKey: ['/api/academic-programs'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/academic-programs');
            if (!response.ok) {
                throw new Error('Failed to fetch academic programs');
            }
            return response.json();
        }
    });
    // Mutation for adding a new program
    const addProgramMutation = useMutation({
        mutationFn: async (program) => {
            const response = await apiRequest('POST', '/api/academic-programs', program);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to add program: ${errorText}`);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/academic-programs'] });
            setIsAddProgramDialogOpen(false);
            toast({
                title: 'Program Added',
                description: 'The academic program has been added successfully.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Failed to Add Program',
                description: error.message,
                variant: 'destructive',
            });
        }
    });
    // Mutation for updating a program
    const updateProgramMutation = useMutation({
        mutationFn: async ({ id, program }) => {
            const response = await apiRequest('PUT', `/api/academic-programs/${id}`, program);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update program: ${errorText}`);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/academic-programs'] });
            setIsEditProgramDialogOpen(false);
            setSelectedProgram(null);
            toast({
                title: 'Program Updated',
                description: 'The academic program has been updated successfully.',
            });
        },
        onError: (error) => {
            toast({
                title: 'Failed to Update Program',
                description: error.message,
                variant: 'destructive',
            });
        }
    });
    // Mutation for deleting a program
    const deleteProgramMutation = useMutation({
        mutationFn: async (id) => {
            const response = await apiRequest('DELETE', `/api/academic-programs/${id}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete program: ${errorText}`);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/academic-programs'] });
            setIsEditProgramDialogOpen(false);
            setSelectedProgram(null);
            toast({
                title: 'Program Deleted',
                description: 'The academic program has been deleted successfully.',
                variant: 'destructive',
            });
        },
        onError: (error) => {
            toast({
                title: 'Failed to Delete Program',
                description: error.message,
                variant: 'destructive',
            });
        }
    });
    // University profile form
    const profileForm = useForm({
        resolver: zodResolver(universityProfileSchema),
        defaultValues: {
            universityName: user?.universityName || 'Stanford University',
            description: 'Stanford University is a leading research and teaching institution located in Stanford, California. Established in 1885, Stanford is dedicated to providing an innovative and transformational education that prepares students to be creative citizens and leaders.',
            website: 'https://www.stanford.edu',
            contactEmail: 'career-services@stanford.edu',
            primaryColor: '#8C1515',
            secondaryColor: '#2F2424',
        },
    });
    // Notification settings form
    const notificationForm = useForm({
        resolver: zodResolver(notificationSettingsSchema),
        defaultValues: {
            emailNotifications: true,
            studentActivityDigest: true,
            usageReports: true,
            sendCopyToAdmin: true,
            adminEmail: 'admin@stanford.edu',
        },
    });
    // Handle logo upload
    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setLogoPreview(event.target?.result);
            };
            reader.readAsDataURL(file);
        }
    };
    // Form submission handlers
    const onProfileSubmit = (data) => {

        toast({
            title: 'Profile updated',
            description: 'University profile settings have been saved.',
        });
    };
    const onNotificationSubmit = (data) => {

        toast({
            title: 'Notification settings updated',
            description: 'Notification preferences have been saved.',
        });
    };
    // Academic program form management
    const programForm = useForm({
        resolver: zodResolver(academicProgramSchema),
        defaultValues: {
            programName: '',
            degreeType: 'Bachelor',
            departmentName: '',
            description: '',
            duration: 4,
            active: true,
        }
    });
    const editProgramForm = useForm({
        resolver: zodResolver(academicProgramSchema),
        defaultValues: {
            programName: '',
            degreeType: 'Bachelor',
            departmentName: '',
            description: '',
            duration: 4,
            active: true,
        }
    });
    // Reset and initialize add program form
    const handleOpenAddProgramDialog = () => {
        programForm.reset({
            programName: '',
            degreeType: 'Bachelor',
            departmentName: '',
            description: '',
            duration: 4,
            active: true,
        });
        setIsAddProgramDialogOpen(true);
    };
    // Reset and initialize edit program form
    const handleOpenEditProgramDialog = (program) => {
        setSelectedProgram(program);
        editProgramForm.reset({
            programName: program.programName,
            degreeType: program.degreeType,
            departmentName: program.departmentName,
            description: program.description || '',
            duration: program.duration || 4,
            active: program.active,
        });
        setIsEditProgramDialogOpen(true);
    };
    // Add a new program
    const handleAddProgram = (data) => {
        addProgramMutation.mutate(data);
    };
    // Update an existing program
    const handleUpdateProgram = (data) => {
        if (!selectedProgram)
            return;
        updateProgramMutation.mutate({
            id: selectedProgram.id,
            program: data
        });
    };
    // Delete a program
    const handleDeleteProgram = (id) => {
        deleteProgramMutation.mutate(id);
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "University Settings" }), _jsx("p", { className: "text-muted-foreground", children: "Manage your university's profile, integrations, and notification preferences." })] }), _jsxs(Tabs, { defaultValue: "profile", className: "space-y-4", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "profile", className: "flex items-center", children: [_jsx(Building, { className: "mr-2 h-4 w-4" }), "University Profile"] }), _jsxs(TabsTrigger, { value: "notifications", className: "flex items-center", children: [_jsx(BellRing, { className: "mr-2 h-4 w-4" }), "Notifications"] }), _jsxs(TabsTrigger, { value: "programs", className: "flex items-center", children: [_jsx(BookOpen, { className: "mr-2 h-4 w-4" }), "Programs"] })] }), _jsx(TabsContent, { value: "profile", className: "space-y-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "University Profile" }), _jsx(CardDescription, { children: "Manage your university's profile information and branding." })] }), _jsx(CardContent, { children: _jsx(Form, { ...profileForm, children: _jsxs("form", { onSubmit: profileForm.handleSubmit(onProfileSubmit), className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx(FormField, { control: profileForm.control, name: "universityName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "University Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter university name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: profileForm.control, name: "contactEmail", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Contact Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter contact email", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: profileForm.control, name: "website", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Website" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "https://www.example.edu", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "space-y-2", children: [_jsx(FormLabel, { children: "University Logo" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden", children: logoPreview ? (_jsx("img", { src: logoPreview, alt: "University logo", className: "w-full h-full object-contain" })) : (_jsx(GraduationCap, { className: "h-8 w-8 text-muted-foreground" })) }), _jsxs("div", { children: [_jsx(Button, { type: "button", variant: "outline", size: "sm", asChild: true, children: _jsxs("label", { className: "cursor-pointer", children: [_jsx(Upload, { className: "mr-2 h-4 w-4" }), "Upload Logo", _jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: handleLogoUpload })] }) }), _jsx(FormDescription, { className: "text-xs mt-1", children: "PNG, JPG or SVG (max. 2MB)" })] })] })] })] }), _jsx(FormField, { control: profileForm.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Enter a brief description of your university", className: "min-h-32", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "space-y-2", children: [_jsx(FormLabel, { children: "Brand Colors" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: profileForm.control, name: "primaryColor", render: ({ field }) => (_jsxs(FormItem, { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-6 h-6 rounded border", style: { backgroundColor: field.value } }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "#000000", ...field }) })] }), _jsx(FormDescription, { children: "Primary Color" }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: profileForm.control, name: "secondaryColor", render: ({ field }) => (_jsxs(FormItem, { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-6 h-6 rounded border", style: { backgroundColor: field.value } }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "#000000", ...field }) })] }), _jsx(FormDescription, { children: "Secondary Color" }), _jsx(FormMessage, {})] })) })] })] }), _jsx(Button, { type: "submit", children: "Save University Profile" })] }) }) })] }) }), _jsx(TabsContent, { value: "notifications", className: "space-y-4", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Notification Preferences" }), _jsx(CardDescription, { children: "Manage email notifications and reports for your university" })] }), _jsx(CardContent, { children: _jsx(Form, { ...notificationForm, children: _jsxs("form", { onSubmit: notificationForm.handleSubmit(onNotificationSubmit), className: "space-y-6", children: [_jsx(FormField, { control: notificationForm.control, name: "emailNotifications", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-center justify-between rounded-lg border p-3", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(FormLabel, { className: "text-base", children: "Email Notifications" }), _jsx(FormDescription, { children: "Receive email notifications about important updates" })] }), _jsx(FormControl, { children: _jsx(Switch, { checked: field.value, onCheckedChange: field.onChange }) })] })) }), _jsx(FormField, { control: notificationForm.control, name: "studentActivityDigest", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-center justify-between rounded-lg border p-3", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(FormLabel, { className: "text-base", children: "Student Activity Digest" }), _jsx(FormDescription, { children: "Receive weekly summaries of student activity" })] }), _jsx(FormControl, { children: _jsx(Switch, { checked: field.value, onCheckedChange: field.onChange }) })] })) }), _jsx(FormField, { control: notificationForm.control, name: "usageReports", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-center justify-between rounded-lg border p-3", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(FormLabel, { className: "text-base", children: "Monthly Usage Reports" }), _jsx(FormDescription, { children: "Receive monthly reports on platform usage and student engagement" })] }), _jsx(FormControl, { children: _jsx(Switch, { checked: field.value, onCheckedChange: field.onChange }) })] })) }), _jsx(FormField, { control: notificationForm.control, name: "sendCopyToAdmin", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-center justify-between rounded-lg border p-3", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(FormLabel, { className: "text-base", children: "Send Copy to Administrator" }), _jsx(FormDescription, { children: "Send a copy of all notifications to the administrator email" })] }), _jsx(FormControl, { children: _jsx(Switch, { checked: field.value, onCheckedChange: field.onChange }) })] })) }), notificationForm.watch('sendCopyToAdmin') && (_jsx(FormField, { control: notificationForm.control, name: "adminEmail", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Administrator Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "admin@example.edu", ...field }) }), _jsx(FormMessage, {})] })) })), _jsx(Button, { type: "submit", children: "Save Notification Settings" })] }) }) })] }) }), _jsxs(TabsContent, { value: "programs", className: "space-y-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: "Academic Programs" }), _jsx(CardDescription, { children: "Manage your university's academic programs and departments." })] }), _jsxs(Button, { onClick: handleOpenAddProgramDialog, className: "ml-auto", size: "sm", disabled: programsLoading || addProgramMutation.isPending, children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Program"] })] }), _jsx(CardContent, { children: programsLoading ? (_jsxs("div", { className: "flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center", children: [_jsx(Loader2, { className: "h-10 w-10 text-muted-foreground mb-3 animate-spin" }), _jsx("h3", { className: "font-semibold mb-1", children: "Loading programs..." })] })) : programsError ? (_jsxs("div", { className: "flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center", children: [_jsx(AlertCircle, { className: "h-10 w-10 text-destructive mb-3" }), _jsx("h3", { className: "font-semibold mb-1", children: "Error loading programs" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: programsError.message || 'Failed to fetch academic programs' }), _jsx(Button, { variant: "outline", onClick: () => queryClient.invalidateQueries({ queryKey: ['/api/academic-programs'] }), children: "Try Again" })] })) : programs.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center", children: [_jsx(BookOpen, { className: "h-10 w-10 text-muted-foreground mb-3" }), _jsx("h3", { className: "font-semibold mb-1", children: "No programs added" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Add your first academic program to start managing course offerings." }), _jsxs(Button, { variant: "secondary", onClick: handleOpenAddProgramDialog, children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Program"] })] })) : (_jsx("div", { className: "overflow-hidden rounded-md border", children: _jsxs("table", { className: "w-full divide-y text-sm", children: [_jsx("thead", { className: "bg-muted", children: _jsxs("tr", { children: [_jsx("th", { scope: "col", className: "px-4 py-3 text-left font-medium", children: "Program" }), _jsx("th", { scope: "col", className: "px-4 py-3 text-left font-medium", children: "Degree Type" }), _jsx("th", { scope: "col", className: "px-4 py-3 text-left font-medium", children: "Department" }), _jsx("th", { scope: "col", className: "px-4 py-3 text-left font-medium", children: "Duration" }), _jsx("th", { scope: "col", className: "px-4 py-3 text-left font-medium", children: "Status" }), _jsx("th", { scope: "col", className: "px-4 py-3 text-right font-medium", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y", children: programs.map((program) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3 whitespace-nowrap", children: _jsx("div", { className: "font-medium", children: program.programName }) }), _jsx("td", { className: "px-4 py-3", children: program.degreeType }), _jsx("td", { className: "px-4 py-3", children: program.departmentName }), _jsxs("td", { className: "px-4 py-3", children: [program.duration, " ", program.duration === 1 ? 'year' : 'years'] }), _jsx("td", { className: "px-4 py-3", children: _jsx("span", { className: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${program.active
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-yellow-100 text-yellow-800'}`, children: program.active ? 'Active' : 'Inactive' }) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => handleOpenEditProgramDialog(program), disabled: updateProgramMutation.isPending || deleteProgramMutation.isPending, children: [_jsx(PenLine, { className: "h-4 w-4 mr-1" }), "Edit"] }) })] }, program.id))) })] }) })) })] }), _jsx(Dialog, { open: isAddProgramDialogOpen, onOpenChange: setIsAddProgramDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add Academic Program" }), _jsx(DialogDescription, { children: "Create a new academic program for your university." })] }), _jsx(Form, { ...programForm, children: _jsxs("form", { onSubmit: programForm.handleSubmit(handleAddProgram), className: "space-y-4", children: [_jsx(FormField, { control: programForm.control, name: "programName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Program Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Computer Science", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: programForm.control, name: "degreeType", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Degree Type" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select degree type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Associate", children: "Associate" }), _jsx(SelectItem, { value: "Bachelor", children: "Bachelor" }), _jsx(SelectItem, { value: "Master", children: "Master" }), _jsx(SelectItem, { value: "Doctorate", children: "Doctorate" }), _jsx(SelectItem, { value: "Certificate", children: "Certificate" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: programForm.control, name: "departmentName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Department Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., School of Engineering", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: programForm.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Provide a brief description of the program", className: "min-h-24", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: programForm.control, name: "active", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-center justify-between rounded-lg border p-4", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(FormLabel, { className: "text-base", children: "Active Program" }), _jsx(FormDescription, { children: "Inactive programs won't be displayed to students" })] }), _jsx(FormControl, { children: _jsx(Switch, { checked: field.value, onCheckedChange: field.onChange }) })] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", type: "button", onClick: () => setIsAddProgramDialogOpen(false), disabled: addProgramMutation.isPending, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: addProgramMutation.isPending, children: addProgramMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Adding..."] })) : ('Add Program') })] })] }) })] }) }), _jsx(Dialog, { open: isEditProgramDialogOpen, onOpenChange: setIsEditProgramDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit Academic Program" }), _jsx(DialogDescription, { children: "Update the details of an existing academic program." })] }), _jsx(Form, { ...editProgramForm, children: _jsxs("form", { onSubmit: editProgramForm.handleSubmit(handleUpdateProgram), className: "space-y-4", children: [_jsx(FormField, { control: editProgramForm.control, name: "programName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Program Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., Computer Science", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: editProgramForm.control, name: "degreeType", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Degree Type" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select degree type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Associate", children: "Associate" }), _jsx(SelectItem, { value: "Bachelor", children: "Bachelor" }), _jsx(SelectItem, { value: "Master", children: "Master" }), _jsx(SelectItem, { value: "Doctorate", children: "Doctorate" }), _jsx(SelectItem, { value: "Certificate", children: "Certificate" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: editProgramForm.control, name: "duration", render: ({ field }) => (_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: "Duration (years)" }), _jsx("div", { className: "mt-1", children: _jsx(Input, { type: "number", min: 1, max: 10, ...field, onChange: e => field.onChange(Number(e.target.value)) }) }), _jsx("div", { className: "mt-1 text-sm text-destructive", children: editProgramForm.formState.errors.duration?.message })] })) })] }), _jsx(FormField, { control: editProgramForm.control, name: "departmentName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Department Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "e.g., School of Engineering", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: editProgramForm.control, name: "description", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Description" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Provide a brief description of the program", className: "min-h-24", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: editProgramForm.control, name: "active", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-center justify-between rounded-lg border p-4", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(FormLabel, { className: "text-base", children: "Active Program" }), _jsx(FormDescription, { children: "Inactive programs won't be displayed to students" })] }), _jsx(FormControl, { children: _jsx(Switch, { checked: field.value, onCheckedChange: field.onChange }) })] })) }), _jsxs(DialogFooter, { className: "flex justify-between", children: [_jsx(Button, { variant: "destructive", type: "button", onClick: () => selectedProgram && handleDeleteProgram(selectedProgram.id), disabled: deleteProgramMutation.isPending || updateProgramMutation.isPending, children: deleteProgramMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Deleting..."] })) : (_jsxs(_Fragment, { children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), "Delete Program"] })) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", type: "button", onClick: () => setIsEditProgramDialogOpen(false), disabled: updateProgramMutation.isPending || deleteProgramMutation.isPending, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: updateProgramMutation.isPending, children: updateProgramMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Updating..."] })) : ('Update Program') })] })] })] }) })] }) })] })] })] }));
}
