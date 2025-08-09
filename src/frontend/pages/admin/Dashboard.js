import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useUser, useIsAdminUser } from "@/lib/useUserData";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AdminOverview from "./AdminOverview";
import SupportPage from "./SupportPage";
import AdminModelsPage from "./ModelsPage";
import OpenAILogsPage from "./OpenAILogsPage";
import EmailAdmin from "./EmailAdmin";
import UserManagement from "./UserManagement";
import TestEmailPage from "./test-email";
import UniversitiesPage from "./universities";
import AnalyticsPage from "./AnalyticsPage";
import BillingPage from "./BillingPage";
import ReviewsTab from "./ReviewsTab";
import AdminSettingsTab from "./AdminSettingsTab";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Eye } from "lucide-react";
// Import the components directly
// This avoid the need for separate imports
// Staff user creation form component
const addStaffUserSchema = z.object({
    username: z
        .string()
        .min(3, { message: "Username must be at least 3 characters" }),
    name: z.string().min(2, { message: "Name is required" }),
    email: z.string().email({ message: "Please enter a valid email" }),
    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters" })
});
function AddStaffUserDialog() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const form = useForm({
        resolver: zodResolver(addStaffUserSchema),
        defaultValues: {
            username: "",
            name: "",
            email: "",
            password: ""
        }
    });
    const createStaffUserMutation = useMutation({
        mutationFn: async (values) => {
            const res = await apiRequest("POST", "/admin/create-staff", values);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to create staff user");
            }
            return await res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Staff user created",
                description: `${data.user.name} was added as a staff member.`
            });
            setOpen(false);
            form.reset();
        },
        onError: (error) => {
            toast({
                title: "Error creating staff user",
                description: error.message,
                variant: "destructive"
            });
        }
    });
    function onSubmit(values) {
        createStaffUserMutation.mutate(values);
    }
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add Staff User"] }) }), _jsxs(DialogContent, { className: "sm:max-w-[425px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add Staff User" }), _jsx(DialogDescription, { children: "Create a new staff user account. Staff users will have access to the staff dashboard." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "username", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Username" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "staffuser", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Full Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Staff Member Name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { type: "email", placeholder: "staff@example.com", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "password", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", ...field }) }), _jsx(FormDescription, { children: "Set a strong temporary password for this staff user." }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "mt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), disabled: createStaffUserMutation.isPending, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: createStaffUserMutation.isPending, children: createStaffUserMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx("svg", { className: "mr-2 h-4 w-4 animate-spin", xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }) }), "Creating..."] })) : ("Create Staff User") })] })] }) })] })] }));
}
// Placeholder for SupportAnalytics component
import { SupportAnalytics } from "@/components/admin/SupportAnalytics";
function SupportSection() {
    const [source, setSource] = useState("all");
    const [issueType, setIssueType] = useState("all");
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");
    const { data: tickets, isLoading, error } = useQuery({
        queryKey: ["supportTickets", source, issueType, status, search],
        queryFn: async () => {
            // Direct testing of the API with credentials
            console.log("DEBUG: Direct test of API with credentials included");
            try {
                const directTestResponse = await fetch("/api/admin/support-tickets", {
                    credentials: "include", // Important: include credentials (cookies)
                    headers: {
                        Accept: "application/json"
                    }
                });
                console.log("DEBUG: Direct test response status:", directTestResponse.status);
                if (directTestResponse.ok) {
                    const directTestData = await directTestResponse.json();
                    console.log("DEBUG: Direct test returned tickets count:", directTestData.length);
                    console.log("DEBUG: Direct test university admin tickets:", directTestData.filter((t) => t.source === "university-admin").length);
                    // Log the first ticket details if any exist
                    if (directTestData.length > 0) {
                        console.log("DEBUG: First ticket details:", JSON.stringify(directTestData[0]));
                    }
                }
                else {
                    const errorText = await directTestResponse.text();
                    console.error("DEBUG: Direct test error:", errorText);
                }
            }
            catch (e) {
                console.error("DEBUG: Direct test exception:", e);
            }
            // First, try to get all tickets to see if they exist
            console.log("DEBUG: Fetching ALL support tickets first to check existence");
            const allTicketsResponse = await fetch(`/api/admin/support-tickets`, {
                credentials: "include" // Ensure we send auth cookies
            });
            console.log("DEBUG: All tickets response status:", allTicketsResponse.status);
            if (allTicketsResponse.ok) {
                const allTicketsData = await allTicketsResponse.json();
                console.log("DEBUG: All tickets count:", allTicketsData.length);
                console.log("DEBUG: All tickets sources:", allTicketsData.map((t) => t.source));
                console.log("DEBUG: University admin tickets count:", allTicketsData.filter((t) => t.source === "university-admin").length);
            }
            else {
                console.error("DEBUG: Failed to fetch all tickets:", await allTicketsResponse.text());
            }
            // Now fetch the filtered tickets
            const queryParams = new URLSearchParams({
                ...(source !== "all" && { source }),
                ...(issueType !== "all" && { issueType }),
                ...(status !== "all" && { status }),
                ...(search && { search })
            });
            console.log("Fetching support tickets with params:", Object.fromEntries(queryParams.entries()));
            const response = await fetch(`/api/admin/support-tickets?${queryParams}`, {
                credentials: "include" // Ensure we send auth cookies
            });
            console.log("Support tickets API response status:", response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Error fetching support tickets:", errorText);
                throw new Error(`Failed to fetch tickets: ${errorText}`);
            }
            const data = await response.json();
            console.log("Support tickets data received:", data);
            if (source === "university-admin" || source === "all") {
                console.log("DEBUG: University admin tickets in response:", data.filter((t) => t.source === "university-admin").length);
            }
            return data;
        }
    });
    return (_jsxs("div", { className: "space-y-8", children: [_jsx(SupportAnalytics, {}), _jsx("div", { className: "space-y-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Support Tickets" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [_jsxs(Select, { value: source, onValueChange: setSource, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by source" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Sources" }), _jsx(SelectItem, { value: "in-app", children: "In-App" }), _jsx(SelectItem, { value: "marketing-site", children: "Marketing Site" }), _jsx(SelectItem, { value: "university-admin", children: "University Admin" })] })] }), _jsxs(Select, { value: issueType, onValueChange: setIssueType, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by issue type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), [
                                                            "technical",
                                                            "account_access",
                                                            "bug",
                                                            "billing",
                                                            "feedback",
                                                            "feature_request",
                                                            "other"
                                                        ].map((type) => (_jsx(SelectItem, { value: type, children: type === "technical"
                                                                ? "Technical"
                                                                : type === "account_access"
                                                                    ? "Account Access"
                                                                    : type === "bug"
                                                                        ? "Bug"
                                                                        : type === "billing"
                                                                            ? "Billing"
                                                                            : type === "feedback"
                                                                                ? "Feedback"
                                                                                : type === "feature_request"
                                                                                    ? "Feature Request"
                                                                                    : "Other" }, type)))] })] }), _jsxs(Select, { value: status, onValueChange: setStatus, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), ["Open", "In Progress", "Resolved"].map((type) => (_jsx(SelectItem, { value: type, children: type }, type)))] })] }), _jsx(Input, { placeholder: "Search by email or keyword...", value: search, onChange: (e) => setSearch(e.target.value) })] }), _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Ticket ID" }), _jsx(TableHead, { children: "Submitted At" }), _jsx(TableHead, { children: "User Email" }), _jsx(TableHead, { children: "Source" }), _jsx(TableHead, { children: "Issue Type" }), _jsx(TableHead, { children: "Description" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { className: "text-right", children: "Action" })] }) }), _jsx(TableBody, { children: isLoading ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 8, className: "text-center", children: "Loading tickets..." }) })) : error ? (_jsx(TableRow, { children: _jsxs(TableCell, { colSpan: 8, className: "text-center text-red-500", children: ["Error loading tickets: ", error.toString()] }) })) : tickets?.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 8, className: "text-center", children: "No tickets found" }) })) : (tickets?.map((ticket) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { children: ["#", ticket.id] }), _jsx(TableCell, { children: new Date(ticket.createdAt).toLocaleString() }), _jsx(TableCell, { children: ticket.userEmail || "Guest Submission" }), _jsx(TableCell, { children: _jsx(Badge, { variant: "outline", children: ticket.source === "in-app"
                                                                ? "In-App"
                                                                : ticket.source === "marketing-site"
                                                                    ? "Marketing Site"
                                                                    : ticket.source === "university-admin"
                                                                        ? "University Admin"
                                                                        : ticket.source }) }), _jsx(TableCell, { children: ticket.issueType }), _jsxs(TableCell, { children: [ticket.description.slice(0, 100), "..."] }), _jsx(TableCell, { children: _jsx(Badge, { className: ticket.status === "Open"
                                                                ? "bg-red-100 text-red-800"
                                                                : ticket.status === "In Progress"
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : "bg-green-100 text-green-800", children: ticket.status }) }), _jsx(TableCell, { className: "text-right", children: _jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                                /* Handle view details */
                                                            }, children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), "View Details"] }) })] }, ticket.id)))) })] })] })] }) })] }));
}
export default function AdminDashboard() {
    const { user } = useUser();
    const isAdmin = useIsAdminUser();
    const [, setLocation] = useLocation();
    const [isUniversitiesRoute] = useRoute("/admin/universities");
    const [activeTab, setActiveTab] = useState("overview");
    const { toast } = useToast();
    // Check if user is super admin to conditionally hide certain nav sections
    const isSuperAdmin = user?.role === "super_admin";
    // Add support tab content
    const TabContent = () => {
        switch (activeTab) {
            case "overview":
                return _jsx(AdminOverview, {});
            case "users":
                return _jsx(UserManagement, {});
            case "universities":
                return _jsx(UniversitiesPage, {});
            case "reviews":
                return _jsx(ReviewsTab, {});
            case "analytics":
                return _jsx(AnalyticsPage, {});
            case "billing":
                return _jsx(BillingPage, {});
            case "support":
                return _jsx(SupportPage, {});
            case "ai-models":
                return _jsx(AdminModelsPage, {});
            case "openai-logs":
                return _jsx(OpenAILogsPage, {});
            case "email":
                return _jsx(EmailAdmin, {});
            case "test-email":
                return _jsx(TestEmailPage, {});
            case "settings":
                return _jsx(AdminSettingsTab, {});
            default:
                return _jsx(AdminOverview, {});
        }
    };
    const [proPricing, setProPricing] = useState({
        monthly: 15,
        quarterly: 30,
        annual: 72
    });
    const [universityPricing, setUniversityPricing] = useState({
        basePrice: 10,
        bulkThreshold: 100,
        bulkDiscount: 20
    });
    const [stats] = useState({
        proMonthlyUsers: 245,
        proMonthlyRevenue: 3675,
        proAnnualUsers: 876,
        proAnnualRevenue: 63072,
        universityUsers: 1250,
        universityRevenue: 12500
    });
    const updatePricing = (interval, value) => {
        setProPricing((prev) => ({
            ...prev,
            [interval]: parseFloat(value)
        }));
    };
    const updateUniversityPricing = (field, value) => {
        setUniversityPricing((prev) => ({
            ...prev,
            [field]: parseFloat(value)
        }));
    };
    const savePricingChanges = () => {
        // TODO: Implement API call to save pricing changes
        toast({
            title: "Pricing Updated",
            description: "The new pricing has been saved successfully."
        });
    };
    const saveUniversityPricing = () => {
        // TODO: Implement API call to save university pricing changes
        toast({
            title: "University Pricing Updated",
            description: "The new university pricing has been saved successfully."
        });
    };
    // Redirect if not admin
    if (user && !isAdmin) {
        setLocation("/dashboard");
        return null;
    }
    if (!user) {
        return (_jsx("div", { className: "flex h-screen w-full items-center justify-center", children: _jsx("div", { className: "animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-background", children: _jsxs("main", { className: "p-6", children: [_jsx("header", { className: "flex md:hidden items-center border-b p-4 mb-6", children: _jsx("h1", { className: "text-lg font-bold", children: "Admin Dashboard" }) }), _jsx("div", { className: "mx-auto max-w-7xl w-full", children: _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "md:hidden grid w-full grid-cols-2 mb-4", children: [_jsx(TabsTrigger, { value: "overview", children: "Overview" }), _jsx(TabsTrigger, { value: "users", children: "Users" })] }), _jsx(TabsContent, { value: activeTab, className: "mt-0", children: _jsx(TabContent, {}) })] }) })] }) }));
}
