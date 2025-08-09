import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, School, Search, Users, UserPlus, X, MoreHorizontal, Pencil, Eye } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
// Add university form schema
const addUniversitySchema = z.object({
    name: z.string().min(3, "University name must be at least 3 characters"),
    licensePlan: z.enum(["Starter", "Basic", "Pro", "Enterprise"], {
        required_error: "Please select a plan tier"
    }),
    licenseSeats: z.number().min(1, "Seat limit must be at least 1").default(50),
    licenseStart: z
        .date()
        .or(z.string())
        .refine((val) => !isNaN(new Date(val).getTime()), {
        message: "Please enter a valid start date"
    }),
    licenseEnd: z
        .date()
        .or(z.string())
        .refine((val) => !isNaN(new Date(val).getTime()), {
        message: "Please enter a valid end date"
    }),
    adminEmail: z.string().email("Please enter a valid email address").optional()
});
// Invite admin form schema
const inviteAdminSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    universityId: z.number()
});
// Badge components for university status and plan
const PlanBadge = ({ plan }) => {
    const getColor = () => {
        switch (plan) {
            case "Starter":
                return "bg-blue-100 text-blue-800";
            case "Basic":
                return "bg-green-100 text-green-800";
            case "Pro":
                return "bg-purple-100 text-purple-800";
            case "Enterprise":
                return "bg-amber-100 text-amber-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor()}`, children: plan }));
};
const StatusBadge = ({ status }) => {
    const getColor = () => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800";
            case "expired":
                return "bg-red-100 text-red-800";
            case "trial":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    return (_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColor()}`, children: status }));
};
// Edit university plan form schema
const editPlanSchema = z.object({
    licensePlan: z.enum(["Starter", "Basic", "Pro", "Enterprise"], {
        required_error: "Please select a plan tier"
    }),
    licenseSeats: z.number().min(1, "Seat limit must be at least 1"),
    licenseStart: z
        .date()
        .or(z.string())
        .refine((val) => !isNaN(new Date(val).getTime()), {
        message: "Please enter a valid start date"
    }),
    licenseEnd: z
        .date()
        .or(z.string())
        .refine((val) => !isNaN(new Date(val).getTime()), {
        message: "Please enter a valid end date"
    })
});
export default function UniversitiesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddUniversityOpen, setIsAddUniversityOpen] = useState(false);
    const [manageAccessDrawer, setManageAccessDrawer] = useState({
        isOpen: false,
        universityId: null,
        universityName: ""
    });
    const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
    const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
    const [selectedUniversity, setSelectedUniversity] = useState(null);
    const [filters, setFilters] = useState({
        plan: "all",
        status: "all"
    });
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Add university form
    const addUniversityForm = useForm({
        resolver: zodResolver(addUniversitySchema),
        defaultValues: {
            name: "",
            licensePlan: "Starter",
            licenseSeats: 50,
            licenseStart: new Date().toISOString().split("T")[0], // Today's date
            licenseEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                .toISOString()
                .split("T")[0], // 1 year from now
            adminEmail: ""
        }
    });
    // Invite admin form
    const inviteAdminForm = useForm({
        resolver: zodResolver(inviteAdminSchema),
        defaultValues: {
            email: "",
            universityId: 0
        }
    });
    // Edit plan form
    const editPlanForm = useForm({
        resolver: zodResolver(editPlanSchema),
        defaultValues: {
            licensePlan: "Starter",
            licenseSeats: 50,
            licenseStart: "",
            licenseEnd: ""
        }
    });
    // Reset forms when dialogs close
    const onAddUniversityClose = () => {
        setIsAddUniversityOpen(false);
        addUniversityForm.reset();
    };
    const onManageAccessClose = () => {
        setManageAccessDrawer({
            isOpen: false,
            universityId: null,
            universityName: ""
        });
        inviteAdminForm.reset();
    };
    const onViewDetailsClose = () => {
        setIsViewDetailsOpen(false);
        setSelectedUniversity(null);
    };
    const onEditPlanClose = () => {
        setIsEditPlanOpen(false);
        setSelectedUniversity(null);
        editPlanForm.reset();
    };
    // Fetch universities data
    const { data: universities, isLoading, isError, error: queryError, refetch } = useQuery({
        queryKey: ["/api/universities"],
        queryFn: async () => {
            try {
                const response = await apiRequest("GET", "/api/universities");
                if (!response.ok) {
                    throw new Error("Failed to fetch universities");
                }
                const data = await response.json();
                return data;
            }
            catch (error) {
                // Check if it's an authentication error
                if (error.status === 401) {
                    throw new Error("Please log in as an admin to view universities");
                }
                // Re-throw the original error
                throw error;
            }
        }
    });
    // Fetch university admins
    const { data: universityAdmins, isLoading: isLoadingAdmins, isError: isErrorAdmins } = useQuery({
        queryKey: ["/api/universities", manageAccessDrawer.universityId, "admins"],
        queryFn: async () => {
            if (!manageAccessDrawer.universityId)
                return [];
            const response = await apiRequest("GET", `/api/universities/${manageAccessDrawer.universityId}/admins`);
            if (!response.ok) {
                throw new Error("Failed to fetch university admins");
            }
            const data = await response.json();
            return data;
        },
        enabled: !!manageAccessDrawer.universityId && manageAccessDrawer.isOpen
    });
    // Add university mutation
    const addUniversityMutation = useMutation({
        mutationFn: async (values) => {
            try {
                const response = await apiRequest("POST", "/api/universities", values);
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || "Failed to add university");
                }
                return await response.json();
            }
            catch (error) {
                // Check if it's an authentication error
                if (error.status === 401) {
                    throw new Error("Please log in as an admin to create universities");
                }
                // Check if it's a network error or API not found
                if (error.message?.includes("fetch")) {
                    throw new Error("Unable to connect to the server. Please try again.");
                }
                // Re-throw the original error
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/universities"] });
            toast({
                title: "University added",
                description: "The university has been added successfully"
            });
            onAddUniversityClose();
        },
        onError: (error) => {
            toast({
                title: "Failed to add university",
                description: error.message,
                variant: "destructive"
            });
        }
    });
    // Invite admin mutation
    const inviteAdminMutation = useMutation({
        mutationFn: async (values) => {
            const response = await apiRequest("POST", "/api/university-invites", values);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to send invitation");
            }
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [
                    "/api/universities",
                    manageAccessDrawer.universityId,
                    "admins"
                ]
            });
            toast({
                title: "Invitation sent",
                description: "The admin invitation has been sent successfully"
            });
            inviteAdminForm.reset({
                email: "",
                universityId: manageAccessDrawer.universityId || 0
            });
        },
        onError: (error) => {
            toast({
                title: "Failed to send invitation",
                description: error.message,
                variant: "destructive"
            });
        }
    });
    // Edit university plan mutation
    const editPlanMutation = useMutation({
        mutationFn: async (values) => {
            const { id, ...planData } = values;
            const response = await apiRequest("PUT", `/api/universities/${id}`, planData);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to update university plan");
            }
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/universities"] });
            toast({
                title: "Plan updated",
                description: "The university plan has been updated successfully"
            });
            onEditPlanClose();
        },
        onError: (error) => {
            toast({
                title: "Failed to update plan",
                description: error.message,
                variant: "destructive"
            });
        }
    });
    // Handle add university form submission
    const onAddUniversitySubmit = (values) => {
        addUniversityMutation.mutate(values);
    };
    // Handle invite admin form submission
    const onInviteAdminSubmit = (values) => {
        inviteAdminMutation.mutate(values);
    };
    // Handle edit plan form submission
    const onEditPlanSubmit = (values) => {
        if (!selectedUniversity)
            return;
        editPlanMutation.mutate({
            ...values,
            id: selectedUniversity.id
        });
    };
    // Open manage access drawer for a university
    const openManageAccess = (university) => {
        setManageAccessDrawer({
            isOpen: true,
            universityId: university.id,
            universityName: university.name
        });
        inviteAdminForm.setValue("universityId", university.id);
    };
    // Open view details modal for a university
    const openViewDetails = (university) => {
        setSelectedUniversity(university);
        setIsViewDetailsOpen(true);
    };
    // Open edit plan modal for a university
    const openEditPlan = (university) => {
        setSelectedUniversity(university);
        // Initialize form with current values
        editPlanForm.reset({
            licensePlan: university.licensePlan,
            licenseSeats: university.licenseSeats,
            licenseStart: university.licenseStart.split("T")[0],
            licenseEnd: university.licenseEnd
                ? university.licenseEnd.split("T")[0]
                : ""
        });
        setIsEditPlanOpen(true);
    };
    // Filter universities based on search query and filters
    const filteredUniversities = universities?.filter((university) => {
        const matchesSearch = university.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesPlan = filters.plan === "all" || university.licensePlan === filters.plan;
        const matchesStatus = filters.status === "all" ||
            university.status.toLowerCase() === filters.status.toLowerCase();
        return matchesSearch && matchesPlan && matchesStatus;
    });
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "p-4 md:p-6", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Universities" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Manage university accounts and access" })] }), _jsxs(Button, { className: "mt-3 md:mt-0", onClick: () => setIsAddUniversityOpen(true), children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add University"] })] }), _jsx(Card, { className: "mb-6", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" }), _jsx(Input, { placeholder: "Search universities...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Select, { value: filters.plan, onValueChange: (value) => setFilters({ ...filters, plan: value }), children: [_jsx(SelectTrigger, { className: "w-[130px]", children: _jsx(SelectValue, { placeholder: "Plan" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Plans" }), _jsx(SelectItem, { value: "Starter", children: "Starter" }), _jsx(SelectItem, { value: "Basic", children: "Basic" }), _jsx(SelectItem, { value: "Pro", children: "Pro" }), _jsx(SelectItem, { value: "Enterprise", children: "Enterprise" })] })] }), _jsxs(Select, { value: filters.status, onValueChange: (value) => setFilters({ ...filters, status: value }), children: [_jsx(SelectTrigger, { className: "w-[130px]", children: _jsx(SelectValue, { placeholder: "Status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "expired", children: "Expired" }), _jsx(SelectItem, { value: "trial", children: "Trial" })] })] })] })] }) }) }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-lg", children: "Universities" }), _jsxs("div", { className: "text-sm text-muted-foreground", children: [filteredUniversities?.length, " universities found"] })] }) }), _jsx(CardContent, { children: isLoading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx("div", { className: "animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" }) })) : isError ? (_jsxs("div", { className: "p-6 text-center", children: [_jsx("div", { className: "text-red-500 mb-2", children: "Error loading universities" }), _jsx("p", { className: "mb-2", children: queryError?.message ||
                                                "There was a problem fetching university data. Please try again later." }), queryError?.message?.includes("log in") && (_jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "You may need to refresh the page or log in again to access admin features." })), _jsx(Button, { variant: "outline", className: "mt-4", onClick: () => refetch(), children: "Retry" })] })) : filteredUniversities?.length === 0 ? (_jsxs("div", { className: "p-6 text-center", children: [_jsx(School, { className: "h-12 w-12 mx-auto text-gray-400 mb-3" }), _jsx("h3", { className: "text-lg font-medium", children: "No universities found" }), _jsx("p", { className: "text-gray-500 mt-1", children: searchQuery ||
                                                filters.plan !== "all" ||
                                                filters.status !== "all"
                                                ? "No universities match your search criteria"
                                                : "No universities have been added yet" }), (searchQuery ||
                                            filters.plan !== "all" ||
                                            filters.status !== "all") && (_jsx(Button, { variant: "outline", className: "mt-4", onClick: () => {
                                                setSearchQuery("");
                                                setFilters({ plan: "all", status: "all" });
                                            }, children: "Clear filters" }))] })) : (_jsx("div", { className: "rounded-md border overflow-x-auto", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "University" }), _jsx(TableHead, { children: "Plan" }), _jsx(TableHead, { children: "Usage" }), _jsx(TableHead, { className: "hidden md:table-cell", children: "Contract" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { className: "hidden lg:table-cell", children: "Admins" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: filteredUniversities?.map((university) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { children: [_jsx("div", { className: "font-medium", children: university.name }), _jsx("div", { className: "text-xs text-muted-foreground md:hidden", children: university.slug })] }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(PlanBadge, { plan: university.licensePlan }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [university.licenseSeats, " seats"] })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "font-medium", children: [university.licenseUsed, " /", " ", university.licenseSeats] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [Math.round((university.licenseUsed /
                                                                                university.licenseSeats) *
                                                                                100), "%"] })] }) }), _jsx(TableCell, { className: "hidden md:table-cell", children: _jsxs("div", { className: "text-sm", children: [new Date(university.licenseStart).toLocaleDateString(), " ", "\u2014", university.licenseEnd
                                                                        ? new Date(university.licenseEnd).toLocaleDateString()
                                                                        : "N/A"] }) }), _jsx(TableCell, { children: _jsx(StatusBadge, { status: university.status }) }), _jsx(TableCell, { className: "hidden lg:table-cell", children: _jsxs(Button, { variant: "ghost", size: "sm", className: "hover:bg-muted", onClick: () => openManageAccess(university), children: [_jsx(Users, { className: "h-4 w-4 mr-1" }), _jsx("span", { children: "0" })] }) }), _jsx(TableCell, { className: "text-right", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: [_jsx(MoreHorizontal, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Open menu" })] }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuLabel, { children: "Actions" }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => openViewDetails(university), children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), "View Details"] }), _jsxs(DropdownMenuItem, { onClick: () => openEditPlan(university), children: [_jsx(Pencil, { className: "h-4 w-4 mr-2" }), "Edit Plan"] }), _jsxs(DropdownMenuItem, { onClick: () => openManageAccess(university), children: [_jsx(Users, { className: "h-4 w-4 mr-2" }), "Manage Access"] })] })] }) })] }, university.id))) })] }) })) })] })] }), _jsx(Dialog, { open: isAddUniversityOpen, onOpenChange: setIsAddUniversityOpen, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add University" }), _jsx(DialogDescription, { children: "Create a new university record in the system." })] }), _jsx(Form, { ...addUniversityForm, children: _jsxs("form", { onSubmit: addUniversityForm.handleSubmit(onAddUniversitySubmit), className: "space-y-4", children: [_jsx(FormField, { control: addUniversityForm.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "University Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter university name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: addUniversityForm.control, name: "licensePlan", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "License Plan" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a plan tier" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Starter", children: "Starter" }), _jsx(SelectItem, { value: "Basic", children: "Basic" }), _jsx(SelectItem, { value: "Pro", children: "Pro" }), _jsx(SelectItem, { value: "Enterprise", children: "Enterprise" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: addUniversityForm.control, name: "licenseSeats", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "License Seats" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", placeholder: "Number of seats", min: 1, ...field, onChange: (e) => field.onChange(parseInt(e.target.value)) }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: addUniversityForm.control, name: "licenseStart", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "License Start Date" }), _jsx(FormControl, { children: _jsx(Input, { type: "date", onChange: field.onChange, onBlur: field.onBlur, value: String(field.value).split("T")[0], name: field.name, ref: field.ref }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: addUniversityForm.control, name: "licenseEnd", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "License End Date" }), _jsx(FormControl, { children: _jsx(Input, { type: "date", onChange: field.onChange, onBlur: field.onBlur, value: String(field.value).split("T")[0], name: field.name, ref: field.ref }) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: addUniversityForm.control, name: "adminEmail", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Admin Email (Optional)" }), _jsx(FormDescription, { children: "If provided, an invitation will be sent to the admin." }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "admin@university.edu", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", type: "button", onClick: onAddUniversityClose, children: "Cancel" }), _jsxs(Button, { type: "submit", disabled: addUniversityMutation.isPending, children: [addUniversityMutation.isPending && (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })), "Add University"] })] })] }) })] }) }), _jsx(Drawer, { open: manageAccessDrawer.isOpen, onOpenChange: (isOpen) => !isOpen && onManageAccessClose(), children: _jsxs(DrawerContent, { children: [_jsxs(DrawerHeader, { children: [_jsxs(DrawerTitle, { children: ["Manage Access for ", manageAccessDrawer.universityName] }), _jsx(DrawerDescription, { children: "Invite administrators to manage this university." })] }), _jsxs("div", { className: "px-4 py-2", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Current Administrators" }), isLoadingAdmins ? (_jsx("div", { className: "flex justify-center py-4", children: _jsx(Loader2, { className: "h-5 w-5 animate-spin text-muted-foreground" }) })) : isErrorAdmins ? (_jsx("div", { className: "text-sm text-red-500 py-2", children: "Error loading administrators" })) : universityAdmins?.length === 0 ? (_jsx("div", { className: "text-sm text-muted-foreground py-2", children: "No administrators yet" })) : (_jsx("div", { className: "space-y-2", children: universityAdmins?.map((admin) => (_jsxs("div", { className: "flex items-center justify-between bg-muted/50 p-2 rounded-md", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-sm", children: admin.name }), _jsx("div", { className: "text-xs text-muted-foreground", children: admin.email })] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: [_jsx(X, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Remove administrator" })] })] }, admin.id))) }))] }), _jsxs("div", { className: "border-t pt-4", children: [_jsx("h4", { className: "text-sm font-medium mb-2", children: "Invite New Administrator" }), _jsx(Form, { ...inviteAdminForm, children: _jsxs("form", { onSubmit: inviteAdminForm.handleSubmit(onInviteAdminSubmit), className: "space-y-4", children: [_jsx(FormField, { control: inviteAdminForm.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email Address" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "admin@university.edu", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "submit", className: "w-full", disabled: inviteAdminMutation.isPending, children: inviteAdminMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Sending Invitation..."] })) : (_jsxs(_Fragment, { children: [_jsx(UserPlus, { className: "mr-2 h-4 w-4" }), "Send Invitation"] })) })] }) })] })] }), _jsx(DrawerFooter, { children: _jsx(Button, { variant: "outline", onClick: onManageAccessClose, children: "Close" }) })] }) }), _jsx(Dialog, { open: isViewDetailsOpen, onOpenChange: setIsViewDetailsOpen, children: _jsx(DialogContent, { className: "max-w-md", children: selectedUniversity && (_jsxs(_Fragment, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: selectedUniversity.name }), _jsx(DialogDescription, { children: "University details and contract information" })] }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-muted-foreground", children: "Slug" }), _jsx("p", { className: "text-sm", children: selectedUniversity.slug })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-muted-foreground", children: "Status" }), _jsx("div", { className: "mt-1", children: _jsx(StatusBadge, { status: selectedUniversity.status }) })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-muted-foreground mb-1", children: "License" }), _jsxs("div", { className: "bg-muted p-3 rounded-md", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Plan:" }), _jsx(PlanBadge, { plan: selectedUniversity.licensePlan })] }), _jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsx("span", { className: "text-sm", children: "Seats:" }), _jsxs("span", { className: "text-sm font-medium", children: [selectedUniversity.licenseUsed, " /", " ", selectedUniversity.licenseSeats] })] }), _jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsx("span", { className: "text-sm", children: "Period:" }), _jsxs("span", { className: "text-sm", children: [new Date(selectedUniversity.licenseStart).toLocaleDateString(), " ", "\u2014", selectedUniversity.licenseEnd
                                                                        ? new Date(selectedUniversity.licenseEnd).toLocaleDateString()
                                                                        : "No end date"] })] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-muted-foreground mb-1", children: "Timeline" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Created:" }), _jsx("span", { className: "text-sm", children: new Date(selectedUniversity.createdAt).toLocaleDateString() })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm", children: "Last Updated:" }), _jsx("span", { className: "text-sm", children: new Date(selectedUniversity.updatedAt).toLocaleDateString() })] })] })] })] }), _jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [_jsx(Button, { variant: "outline", onClick: onViewDetailsClose, children: "Close" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: () => {
                                                    onViewDetailsClose();
                                                    openEditPlan(selectedUniversity);
                                                }, children: [_jsx(Pencil, { className: "h-4 w-4 mr-2" }), "Edit Plan"] }), _jsxs(Button, { onClick: () => {
                                                    onViewDetailsClose();
                                                    openManageAccess(selectedUniversity);
                                                }, children: [_jsx(Users, { className: "h-4 w-4 mr-2" }), "Manage Access"] })] })] })] })) }) }), _jsx(Dialog, { open: isEditPlanOpen, onOpenChange: setIsEditPlanOpen, children: _jsx(DialogContent, { children: selectedUniversity && (_jsxs(_Fragment, { children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: ["Edit Plan for ", selectedUniversity.name] }), _jsx(DialogDescription, { children: "Update the university's plan tier and license details" })] }), _jsx(Form, { ...editPlanForm, children: _jsxs("form", { onSubmit: editPlanForm.handleSubmit(onEditPlanSubmit), className: "space-y-4", children: [_jsx(FormField, { control: editPlanForm.control, name: "licensePlan", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "License Plan" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a plan tier" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Starter", children: "Starter" }), _jsx(SelectItem, { value: "Basic", children: "Basic" }), _jsx(SelectItem, { value: "Pro", children: "Pro" }), _jsx(SelectItem, { value: "Enterprise", children: "Enterprise" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: editPlanForm.control, name: "licenseSeats", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "License Seats" }), _jsx(FormControl, { children: _jsx(Input, { type: "number", placeholder: "Number of seats", min: 1, ...field, onChange: (e) => field.onChange(parseInt(e.target.value)) }) }), _jsxs(FormDescription, { children: ["Currently using: ", selectedUniversity.licenseUsed, " ", "seats"] }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(FormField, { control: editPlanForm.control, name: "licenseStart", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "License Start Date" }), _jsx(FormControl, { children: _jsx(Input, { type: "date", onChange: field.onChange, onBlur: field.onBlur, value: String(field.value).split("T")[0], name: field.name, ref: field.ref }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: editPlanForm.control, name: "licenseEnd", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "License End Date" }), _jsx(FormControl, { children: _jsx(Input, { type: "date", onChange: field.onChange, onBlur: field.onBlur, value: String(field.value).split("T")[0], name: field.name, ref: field.ref }) }), _jsx(FormDescription, { children: "Leave empty for no end date" }), _jsx(FormMessage, {})] })) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", type: "button", onClick: onEditPlanClose, children: "Cancel" }), _jsxs(Button, { type: "submit", disabled: editPlanMutation.isPending, children: [editPlanMutation.isPending && (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })), "Update Plan"] })] })] }) })] })) }) })] }));
}
