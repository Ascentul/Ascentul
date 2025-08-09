import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ChevronLeft, Loader2, School, Users, Edit, Trash2, UserPlus, User, Mail } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/layouts/AdminLayout";
// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
// Edit university form schema
const editUniversitySchema = z.object({
    name: z.string().min(3, "University name must be at least 3 characters"),
});
// Invite user form schema
const inviteUserSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    role: z.enum(["student", "admin"], {
        required_error: "Please select a role",
    }),
});
export default function UniversityDetailsPage() {
    const [, params] = useRoute("/admin/universities/:id");
    const universityId = params?.id ? parseInt(params.id) : 0;
    const [activeTab, setActiveTab] = useState("overview");
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Edit university form
    const editUniversityForm = useForm({
        resolver: zodResolver(editUniversitySchema),
        defaultValues: {
            name: "",
        }
    });
    // Invite user form
    const inviteUserForm = useForm({
        resolver: zodResolver(inviteUserSchema),
        defaultValues: {
            email: "",
            role: "student",
        }
    });
    // Fetch university details
    const { data: university, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["/api/universities", universityId],
        queryFn: async () => {
            const response = await apiRequest("GET", `/api/universities/${universityId}`);
            if (!response.ok) {
                throw new Error("Failed to fetch university details");
            }
            const data = await response.json();
            // Set form default values
            editUniversityForm.setValue("name", data.name);
            return data;
        },
        enabled: !!universityId,
    });
    // Fetch university students
    const { data: students, isLoading: isLoadingStudents, isError: isErrorStudents, } = useQuery({
        queryKey: ["/api/universities", universityId, "students"],
        queryFn: async () => {
            const response = await apiRequest("GET", `/api/universities/${universityId}/students`);
            if (!response.ok) {
                throw new Error("Failed to fetch university students");
            }
            return await response.json();
        },
        enabled: !!universityId && activeTab === "students",
    });
    // Fetch university admins
    const { data: admins, isLoading: isLoadingAdmins, isError: isErrorAdmins, } = useQuery({
        queryKey: ["/api/universities", universityId, "admins"],
        queryFn: async () => {
            const response = await apiRequest("GET", `/api/universities/${universityId}/admins`);
            if (!response.ok) {
                throw new Error("Failed to fetch university admins");
            }
            return await response.json();
        },
        enabled: !!universityId && activeTab === "admins",
    });
    // Edit university mutation
    const editUniversityMutation = useMutation({
        mutationFn: async (values) => {
            const response = await apiRequest("PATCH", `/api/universities/${universityId}`, values);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to update university");
            }
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/universities", universityId] });
            queryClient.invalidateQueries({ queryKey: ["/api/universities"] });
            toast({
                title: "University updated",
                description: "The university has been updated successfully",
            });
            setIsEditDialogOpen(false);
        },
        onError: (error) => {
            toast({
                title: "Failed to update university",
                description: error.message,
                variant: "destructive",
            });
        }
    });
    // Delete university mutation
    const deleteUniversityMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("DELETE", `/api/universities/${universityId}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to delete university");
            }
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/universities"] });
            toast({
                title: "University deleted",
                description: "The university has been deleted successfully",
            });
            setIsDeleteDialogOpen(false);
            window.history.back();
        },
        onError: (error) => {
            toast({
                title: "Failed to delete university",
                description: error.message,
                variant: "destructive",
            });
        }
    });
    // Invite user mutation
    const inviteUserMutation = useMutation({
        mutationFn: async (values) => {
            const payload = {
                email: values.email,
                universityId,
                role: values.role,
            };
            const response = await apiRequest("POST", "/api/university-invites", payload);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to send invitation");
            }
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/universities", universityId] });
            toast({
                title: "Invitation sent",
                description: "The invitation has been sent successfully",
            });
            setIsInviteDialogOpen(false);
            inviteUserForm.reset();
        },
        onError: (error) => {
            toast({
                title: "Failed to send invitation",
                description: error.message,
                variant: "destructive",
            });
        }
    });
    // Handle form submissions
    const onEditSubmit = (values) => {
        editUniversityMutation.mutate(values);
    };
    const onInviteSubmit = (values) => {
        inviteUserMutation.mutate(values);
    };
    const onDeleteConfirm = () => {
        deleteUniversityMutation.mutate();
    };
    // Format date string
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    // Loading and error states
    if (isLoading) {
        return (_jsx(AdminLayout, { children: _jsx("div", { className: "flex justify-center items-center h-64", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }) }));
    }
    if (isError) {
        return (_jsx(AdminLayout, { children: _jsxs("div", { className: "p-4 md:p-6", children: [_jsx("div", { className: "mb-4", children: _jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsxs(Link, { href: "/admin/universities", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "Back to Universities"] }) }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-6 text-center", children: [_jsx("div", { className: "text-red-500 text-lg mb-2", children: "Error loading university" }), _jsx("p", { className: "text-gray-600 mb-4", children: error instanceof Error ? error.message : "Failed to fetch university details" }), _jsx(Button, { onClick: () => refetch(), children: "Retry" })] }) })] }) }));
    }
    if (!university) {
        return (_jsx(AdminLayout, { children: _jsxs("div", { className: "p-4 md:p-6", children: [_jsx("div", { className: "mb-4", children: _jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsxs(Link, { href: "/admin/universities", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "Back to Universities"] }) }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-6 text-center", children: [_jsx(School, { className: "h-12 w-12 mx-auto text-gray-400 mb-3" }), _jsx("h3", { className: "text-lg font-medium", children: "University not found" }), _jsx("p", { className: "text-gray-500 mt-1", children: "The requested university could not be found." }), _jsx(Button, { variant: "outline", className: "mt-4", asChild: true, children: _jsx(Link, { href: "/admin/universities", children: "Return to Universities" }) })] }) })] }) }));
    }
    return (_jsxs(AdminLayout, { children: [_jsxs("div", { className: "p-4 md:p-6", children: [_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, children: _jsxs(Link, { href: "/admin/universities", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), "Back to Universities"] }) }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setIsInviteDialogOpen(true), children: [_jsx(UserPlus, { className: "h-4 w-4 mr-1" }), "Invite User"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setIsEditDialogOpen(true), children: [_jsx(Edit, { className: "h-4 w-4 mr-1" }), "Edit"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "text-red-500 hover:text-red-700 hover:bg-red-50", onClick: () => setIsDeleteDialogOpen(true), children: [_jsx(Trash2, { className: "h-4 w-4 mr-1" }), "Delete"] })] })] }), _jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: university.name }), _jsxs("p", { className: "text-gray-600", children: ["University ID: ", university.id] })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { className: "mb-4", children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "students", children: "Students" }), _jsx(TabsTrigger, { value: "admins", children: "Administrators" })] }), _jsxs(TabsContent, { value: "overview", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-gray-500", children: "Students" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "h-5 w-5 mr-2 text-blue-500" }), _jsx("span", { className: "text-2xl font-bold", children: university.studentCount })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-gray-500", children: "Administrators" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "h-5 w-5 mr-2 text-indigo-500" }), _jsx("span", { className: "text-2xl font-bold", children: university.adminCount })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-gray-500", children: "Created" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center", children: [_jsx(School, { className: "h-5 w-5 mr-2 text-emerald-500" }), _jsx("span", { className: "text-lg font-medium", children: university.createdAt ? formatDate(university.createdAt) : 'N/A' })] }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "University Details" }) }), _jsx(CardContent, { children: _jsxs("dl", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Name" }), _jsx("dd", { className: "mt-1 text-lg", children: university.name })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "ID" }), _jsx("dd", { className: "mt-1 text-lg", children: university.id })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Created" }), _jsx("dd", { className: "mt-1 text-lg", children: university.createdAt ? formatDate(university.createdAt) : 'N/A' })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-sm font-medium text-gray-500", children: "Total Users" }), _jsx("dd", { className: "mt-1 text-lg", children: university.studentCount + university.adminCount })] })] }) })] })] }), _jsx(TabsContent, { value: "students", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "h-5 w-5 mr-2" }), "Students"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                            inviteUserForm.setValue("role", "student");
                                                            setIsInviteDialogOpen(true);
                                                        }, children: [_jsx(UserPlus, { className: "h-4 w-4 mr-1" }), "Invite Student"] })] }) }), _jsx(CardContent, { children: isLoadingStudents ? (_jsx("div", { className: "flex justify-center items-center h-40", children: _jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) })) : isErrorStudents ? (_jsxs("div", { className: "text-center py-4", children: [_jsx("p", { className: "text-red-500", children: "Failed to load students" }), _jsx(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => queryClient.invalidateQueries({ queryKey: ["/api/universities", universityId, "students"] }), children: "Retry" })] })) : students?.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(User, { className: "h-10 w-10 mx-auto text-gray-400 mb-2" }), _jsx("p", { className: "text-gray-500", children: "No students found" })] })) : (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Name" }), _jsx(TableHead, { children: "Email" }), _jsx(TableHead, { children: "Enrollment Date" })] }) }), _jsx(TableBody, { children: students?.map((student) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: student.name }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "h-4 w-4 mr-1 text-gray-400" }), student.email] }) }), _jsx(TableCell, { children: formatDate(student.enrollmentDate) })] }, student.id))) })] })) })] }) }), _jsx(TabsContent, { value: "admins", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "h-5 w-5 mr-2" }), "Administrators"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                            inviteUserForm.setValue("role", "admin");
                                                            setIsInviteDialogOpen(true);
                                                        }, children: [_jsx(UserPlus, { className: "h-4 w-4 mr-1" }), "Invite Admin"] })] }) }), _jsx(CardContent, { children: isLoadingAdmins ? (_jsx("div", { className: "flex justify-center items-center h-40", children: _jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) })) : isErrorAdmins ? (_jsxs("div", { className: "text-center py-4", children: [_jsx("p", { className: "text-red-500", children: "Failed to load administrators" }), _jsx(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => queryClient.invalidateQueries({ queryKey: ["/api/universities", universityId, "admins"] }), children: "Retry" })] })) : admins?.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(Users, { className: "h-10 w-10 mx-auto text-gray-400 mb-2" }), _jsx("p", { className: "text-gray-500", children: "No administrators found" })] })) : (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Name" }), _jsx(TableHead, { children: "Email" }), _jsx(TableHead, { children: "Added Date" })] }) }), _jsx(TableBody, { children: admins?.map((admin) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: admin.name }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center", children: [_jsx(Mail, { className: "h-4 w-4 mr-1 text-gray-400" }), admin.email] }) }), _jsx(TableCell, { children: formatDate(admin.addedDate) })] }, admin.id))) })] })) })] }) })] })] }), _jsx(Dialog, { open: isEditDialogOpen, onOpenChange: setIsEditDialogOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit University" }), _jsx(DialogDescription, { children: "Update university information." })] }), _jsx(Form, { ...editUniversityForm, children: _jsxs("form", { onSubmit: editUniversityForm.handleSubmit(onEditSubmit), className: "space-y-4", children: [_jsx(FormField, { control: editUniversityForm.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "University Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter university name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsEditDialogOpen(false), children: "Cancel" }), _jsxs(Button, { type: "submit", disabled: editUniversityMutation.isPending, children: [editUniversityMutation.isPending && (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })), "Save Changes"] })] })] }) })] }) }), _jsx(Dialog, { open: isInviteDialogOpen, onOpenChange: setIsInviteDialogOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Invite User" }), _jsx(DialogDescription, { children: "Send an invitation to join the university." })] }), _jsx(Form, { ...inviteUserForm, children: _jsxs("form", { onSubmit: inviteUserForm.handleSubmit(onInviteSubmit), className: "space-y-4", children: [_jsx(FormField, { control: inviteUserForm.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email Address" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "user@example.com", type: "email", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: inviteUserForm.control, name: "role", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Role" }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { type: "button", variant: field.value === "student" ? "default" : "outline", className: "flex-1", onClick: () => field.onChange("student"), children: [_jsx(User, { className: "h-4 w-4 mr-2" }), "Student"] }), _jsxs(Button, { type: "button", variant: field.value === "admin" ? "default" : "outline", className: "flex-1", onClick: () => field.onChange("admin"), children: [_jsx(Users, { className: "h-4 w-4 mr-2" }), "Administrator"] })] }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsInviteDialogOpen(false), children: "Cancel" }), _jsxs(Button, { type: "submit", disabled: inviteUserMutation.isPending, children: [inviteUserMutation.isPending && (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })), "Send Invitation"] })] })] }) })] }) }), _jsx(AlertDialog, { open: isDeleteDialogOpen, onOpenChange: setIsDeleteDialogOpen, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "Delete University" }), _jsxs(AlertDialogDescription, { children: ["Are you sure you want to delete ", university.name, "? This action cannot be undone. All associated users, data, and resources will be permanently removed."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "Cancel" }), _jsxs(AlertDialogAction, { className: "bg-red-500 hover:bg-red-600 text-white", onClick: onDeleteConfirm, disabled: deleteUniversityMutation.isPending, children: [deleteUniversityMutation.isPending && (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })), "Delete"] })] })] }) })] }));
}
