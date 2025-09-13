import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, createContext, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Search, Filter, MoreHorizontal, RefreshCw, Download, UserPlus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser, useIsAdminUser } from "@/lib/useUserData";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
// Schema for staff user creation
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
// Schema for user editing
const editUserSchema = z.object({
    name: z.string().min(2, { message: "Name is required" }),
    email: z.string().email({ message: "Please enter a valid email" }),
    userType: z.enum([
        "regular",
        "university_student",
        "university_admin",
        "staff"
    ]),
    university: z.string().optional(),
    subscriptionPlan: z.enum(["free", "premium", "university"]),
    accountStatus: z.enum(["active", "inactive", "suspended"])
});
const UserManagementContext = createContext(null);
export default function UserManagement() {
    const { user } = useUser();
    const isAdmin = useIsAdminUser();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        userType: "all",
        subscriptionPlan: "all",
        university: "all",
        activityLevel: "all",
        signupPeriod: "all"
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const itemsPerPage = 10;
    // Redirect if not admin
    if (user && !isAdmin) {
        setLocation("/dashboard");
        return null;
    }
    if (!user) {
        return (_jsx("div", { className: "flex h-screen w-full items-center justify-center", children: _jsx("div", { className: "animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" }) }));
    }
    const queryClient = useQueryClient();
    // Fetch users with search and filters
    const { data: users, isLoading, error } = useQuery({
        queryKey: ["/api/admin/users", searchTerm, filters, currentPage],
        queryFn: async () => {

            try {
                const response = await apiRequest({ url: "/api/admin/users" });

                return response;
            }
            catch (error) {
                console.error("Error fetching users:", error);
                throw error;
            }
        }
    });
    // Debug logging

    // Mutation for updating user status
    const updateUserStatusMutation = useMutation({
        mutationFn: async ({ userId, status }) => {
            // This is where you'd call your API
            // await apiRequest('PUT', `/api/admin/users/${userId}/status`, { status });
            return { userId, status };
        },
        onSuccess: (data) => {
            // Update the cache
            queryClient.setQueryData(["/api/admin/users", searchTerm, filters, currentPage], (old) => old?.map((user) => user.id === data.userId
                ? { ...user, accountStatus: data.status }
                : user));
        }
    });
    // Mutation for upgrading subscription
    const upgradeSubscriptionMutation = useMutation({
        mutationFn: async ({ userId, plan }) => {
            const res = await apiRequest("PUT", `/api/admin/users/${userId}/subscription`, { plan });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to update subscription");
            }
            return await res.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Subscription updated",
                description: `User subscription updated to ${data.plan}`
            });
            // Update the cache
            queryClient.setQueryData(["/api/admin/users", searchTerm, filters, currentPage], (old) => old?.map((user) => user.id === data.userId
                ? {
                    ...user,
                    subscriptionPlan: data.plan,
                    subscriptionStatus: "active"
                }
                : user));
        },
        onError: (error) => {
            toast({
                title: "Error updating subscription",
                description: error.message,
                variant: "destructive"
            });
        }
    });
    // Mutation for updating user details
    const updateUserMutation = useMutation({
        mutationFn: async ({ userId, userData }) => {
            // This is where you'd call your API
            // const res = await apiRequest('PUT', `/api/admin/users/${userId}`, userData);
            // return await res.json();
            // For demo, we'll just return the updated user data
            return { userId, ...userData };
        },
        onSuccess: (data) => {
            const { userId, ...updatedData } = data;
            // Show success toast
            toast({
                title: "User updated",
                description: `${data.name}'s profile has been updated.`
            });
            // Close edit modal
            setIsEditUserOpen(false);
            // Update the cache
            queryClient.setQueryData(["/api/admin/users", searchTerm, filters, currentPage], (old) => old?.map((user) => user.id === userId ? { ...user, ...updatedData } : user));
        },
        onError: (error) => {
            toast({
                title: "Error updating user",
                description: error.message,
                variant: "destructive"
            });
        }
    });
    // Filter users based on search and filters
    const filteredUsers = users?.filter((user) => {
        const matchesSearch = searchTerm === "" ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUserType = filters.userType === "all" || user.userType === filters.userType;
        const matchesSubscription = filters.subscriptionPlan === "all" ||
            user.subscriptionPlan === filters.subscriptionPlan;
        const matchesUniversity = filters.university === "all" ||
            (filters.university === "none" && !user.university) ||
            user.university === filters.university;
        const matchesActivity = filters.activityLevel === "all" ||
            user.usageStats.activityLevel === filters.activityLevel;
        // Parse dates for signup period filter
        const signupDate = new Date(user.signupDate);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 60)); // already subtracted 30
        const matchesSignupPeriod = filters.signupPeriod === "all" ||
            (filters.signupPeriod === "last30" && signupDate >= thirtyDaysAgo) ||
            (filters.signupPeriod === "last90" && signupDate >= ninetyDaysAgo) ||
            (filters.signupPeriod === "older" && signupDate < ninetyDaysAgo);
        return (matchesSearch &&
            matchesUserType &&
            matchesSubscription &&
            matchesUniversity &&
            matchesActivity &&
            matchesSignupPeriod);
    });
    // Paginate users
    const paginatedUsers = filteredUsers?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil((filteredUsers?.length || 0) / itemsPerPage);
    // View a user's details
    const handleViewUser = (user) => {
        setSelectedUser(user);
        setIsUserDetailsOpen(true);
    };
    // Edit a user
    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsEditUserOpen(true);
    };
    // Update a user's status
    const handleUpdateStatus = (userId, status) => {
        updateUserStatusMutation.mutate({ userId, status });
    };
    // Upgrade a user's subscription
    const handleUpgradeSubscription = (userId, plan) => {
        upgradeSubscriptionMutation.mutate({ userId, plan });
    };
    // Export users list (would be implemented in a real app)
    const handleExportUsers = () => {
        alert("This would export the current filtered user list as CSV");
    };
    // Create context value for sharing with EditUserDialog
    const contextValue = {
        selectedUser,
        isEditUserOpen,
        setIsEditUserOpen,
        updateUserMutation: updateUserMutation,
        searchTerm,
        filters,
        currentPage
    };
    return (_jsx(UserManagementContext.Provider, { value: contextValue, children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "User Management" }), _jsx("p", { className: "text-muted-foreground", children: "Manage and monitor all users in the system" })] }), _jsxs("div", { className: "flex items-center gap-2 mt-4 sm:mt-0", children: [_jsx(AddStaffUserDialog, {}), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleExportUsers, children: [_jsx(Download, { className: "mr-2 h-4 w-4" }), "Export"] }), _jsxs(Button, { variant: "default", size: "sm", children: [_jsx(RefreshCw, { className: "mr-2 h-4 w-4" }), "Refresh"] })] })] }), _jsx(Card, { className: "mb-6", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }), _jsx(Input, { placeholder: "Search by name, email, or username...", className: "pl-8", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs(Select, { value: filters.userType, onValueChange: (value) => setFilters({ ...filters, userType: value }), children: [_jsx(SelectTrigger, { className: "w-[130px]", children: _jsx(SelectValue, { placeholder: "User Type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), _jsx(SelectItem, { value: "regular", children: "Regular" }), _jsx(SelectItem, { value: "university_student", children: "Student" }), _jsx(SelectItem, { value: "university_admin", children: "Admin" }), _jsx(SelectItem, { value: "staff", children: "Staff" })] })] }), _jsxs(Select, { value: filters.subscriptionPlan, onValueChange: (value) => setFilters({ ...filters, subscriptionPlan: value }), children: [_jsx(SelectTrigger, { className: "w-[130px]", children: _jsx(SelectValue, { placeholder: "Plan" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Plans" }), _jsx(SelectItem, { value: "free", children: "Free" }), _jsx(SelectItem, { value: "premium", children: "Premium" }), _jsx(SelectItem, { value: "university", children: "University" })] })] }), _jsx(Button, { variant: "outline", size: "icon", onClick: () => setIsFiltersOpen(true), children: _jsx(Filter, { className: "h-4 w-4" }) })] })] }) }) }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-lg", children: "Users" }), _jsxs("div", { className: "text-sm text-muted-foreground", children: [filteredUsers?.length, " users found"] })] }) }), _jsx(CardContent, { children: isLoading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx("div", { className: "animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" }) })) : error ? (_jsx("div", { className: "flex justify-center py-8", children: _jsxs("div", { className: "text-center", children: [_jsx("h3", { className: "text-lg font-medium text-red-600 mb-2", children: "Error Loading Users" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: error instanceof Error
                                                ? error.message
                                                : "Failed to load user data" }), _jsx("button", { onClick: () => window.location.reload(), className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", children: "Retry" })] }) })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "rounded-md border", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "User" }), _jsx(TableHead, { className: "hidden md:table-cell", children: "Email" }), _jsx(TableHead, { className: "hidden md:table-cell", children: "Access Type" }), _jsx(TableHead, { className: "hidden sm:table-cell", children: "Plan" }), _jsx(TableHead, { className: "hidden lg:table-cell", children: "University" }), _jsx(TableHead, { className: "hidden lg:table-cell", children: "Last Login" }), _jsx(TableHead, { className: "hidden xl:table-cell", children: "Activity" }), _jsx(TableHead, { className: "hidden lg:table-cell", children: "Status" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: paginatedUsers?.map((user) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { children: [_jsx("div", { className: "font-medium", children: user.name }), _jsx("div", { className: "text-xs text-muted-foreground md:hidden", children: user.email })] }), _jsx(TableCell, { className: "hidden md:table-cell", children: user.email }), _jsx(TableCell, { className: "hidden md:table-cell", children: _jsx(UserTypeBadge, { type: user.userType }) }), _jsx(TableCell, { className: "hidden sm:table-cell", children: _jsx(SubscriptionBadge, { plan: user.subscriptionPlan, status: user.subscriptionStatus }) }), _jsx(TableCell, { className: "hidden lg:table-cell", children: user.university ? (_jsx("span", { className: "text-sm", children: user.university })) : (_jsx("span", { className: "text-xs text-muted-foreground", children: "N/A" })) }), _jsx(TableCell, { className: "hidden lg:table-cell", children: new Date(user.lastLogin).toLocaleDateString() }), _jsx(TableCell, { className: "hidden xl:table-cell", children: _jsx(ActivityBadge, { level: user.usageStats.activityLevel }) }), _jsx(TableCell, { className: "hidden lg:table-cell", children: _jsx(StatusBadge, { status: user.accountStatus }) }), _jsx(TableCell, { className: "text-right", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "icon", children: [_jsx(MoreHorizontal, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Actions" })] }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuLabel, { children: "Actions" }), _jsx(DropdownMenuItem, { onClick: () => handleViewUser(user), children: "View Details" }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuItem, { onClick: () => handleEditUser(user), children: "Edit" }), _jsx(DropdownMenuItem, { onClick: () => handleUpdateStatus(user.id, user.accountStatus === "active"
                                                                                        ? "inactive"
                                                                                        : "active"), children: user.accountStatus === "active"
                                                                                        ? "Deactivate"
                                                                                        : "Activate" }), _jsx(DropdownMenuSeparator, {}), _jsx(DropdownMenuLabel, { children: "Subscription" }), _jsx(DropdownMenuItem, { onClick: () => {
                                                                                        if (user.subscriptionPlan !== "premium") {
                                                                                            handleUpgradeSubscription(user.id, "premium");
                                                                                        }
                                                                                    }, className: user.subscriptionPlan === "premium"
                                                                                        ? "opacity-50 cursor-not-allowed"
                                                                                        : "", children: "Upgrade to Premium" })] })] }) })] }, user.id))) })] }) }), _jsx(Pagination, { className: "mt-4", children: _jsxs(PaginationContent, { children: [_jsx(PaginationItem, { children: currentPage === 1 ? (_jsx("span", { className: "opacity-50 cursor-not-allowed", children: _jsx(PaginationPrevious, {}) })) : (_jsx(PaginationPrevious, { onClick: () => setCurrentPage((prev) => Math.max(prev - 1, 1)) })) }), Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                    const pageNum = i + 1;
                                                    // Handle pagination display for many pages
                                                    if (totalPages > 5) {
                                                        if (currentPage <= 3) {
                                                            // Show first 3 pages, ellipsis, and last page
                                                            if (i < 3) {
                                                                return (_jsx(PaginationItem, { children: _jsx(PaginationLink, { isActive: pageNum === currentPage, onClick: () => setCurrentPage(pageNum), children: pageNum }) }, pageNum));
                                                            }
                                                            else if (i === 3) {
                                                                return _jsx(PaginationEllipsis, {}, "ellipsis1");
                                                            }
                                                            else {
                                                                return (_jsx(PaginationItem, { children: _jsx(PaginationLink, { onClick: () => setCurrentPage(totalPages), children: totalPages }) }, totalPages));
                                                            }
                                                        }
                                                        else if (currentPage > totalPages - 3) {
                                                            // Show first page, ellipsis, and last 3 pages
                                                            if (i === 0) {
                                                                return (_jsx(PaginationItem, { children: _jsx(PaginationLink, { onClick: () => setCurrentPage(1), children: "1" }) }, 1));
                                                            }
                                                            else if (i === 1) {
                                                                return _jsx(PaginationEllipsis, {}, "ellipsis2");
                                                            }
                                                            else {
                                                                const page = totalPages - 4 + i;
                                                                return (_jsx(PaginationItem, { children: _jsx(PaginationLink, { isActive: page === currentPage, onClick: () => setCurrentPage(page), children: page }) }, page));
                                                            }
                                                        }
                                                        else {
                                                            // Show first page, ellipsis, current page and neighbors, ellipsis, last page
                                                            if (i === 0) {
                                                                return (_jsx(PaginationItem, { children: _jsx(PaginationLink, { onClick: () => setCurrentPage(1), children: "1" }) }, 1));
                                                            }
                                                            else if (i === 1) {
                                                                return _jsx(PaginationEllipsis, {}, "ellipsis3");
                                                            }
                                                            else if (i === 2) {
                                                                return (_jsx(PaginationItem, { children: _jsx(PaginationLink, { isActive: true, onClick: () => setCurrentPage(currentPage), children: currentPage }) }, currentPage));
                                                            }
                                                            else if (i === 3) {
                                                                return _jsx(PaginationEllipsis, {}, "ellipsis4");
                                                            }
                                                            else {
                                                                return (_jsx(PaginationItem, { children: _jsx(PaginationLink, { onClick: () => setCurrentPage(totalPages), children: totalPages }) }, totalPages));
                                                            }
                                                        }
                                                    }
                                                    else {
                                                        // Less than 5 pages, show all
                                                        return (_jsx(PaginationItem, { children: _jsx(PaginationLink, { isActive: pageNum === currentPage, onClick: () => setCurrentPage(pageNum), children: pageNum }) }, pageNum));
                                                    }
                                                }), _jsx(PaginationItem, { children: currentPage === totalPages ? (_jsx("span", { className: "opacity-50 cursor-not-allowed", children: _jsx(PaginationNext, {}) })) : (_jsx(PaginationNext, { onClick: () => setCurrentPage((prev) => Math.min(prev + 1, totalPages)) })) })] }) })] })) })] }), _jsx(Sheet, { open: isFiltersOpen, onOpenChange: setIsFiltersOpen, children: _jsxs(SheetContent, { className: "sm:max-w-lg", children: [_jsxs(SheetHeader, { children: [_jsx(SheetTitle, { children: "Advanced Filters" }), _jsx(SheetDescription, { children: "Filter users by multiple criteria." })] }), _jsxs("div", { className: "py-6 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-sm font-medium", children: "User Type" }), _jsxs(Select, { value: filters.userType, onValueChange: (value) => setFilters({ ...filters, userType: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select user type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), _jsx(SelectItem, { value: "regular", children: "Regular" }), _jsx(SelectItem, { value: "university_student", children: "University Student" }), _jsx(SelectItem, { value: "university_admin", children: "University Admin" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-sm font-medium", children: "Subscription Plan" }), _jsxs(Select, { value: filters.subscriptionPlan, onValueChange: (value) => setFilters({ ...filters, subscriptionPlan: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select plan" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Plans" }), _jsx(SelectItem, { value: "free", children: "Free" }), _jsx(SelectItem, { value: "premium", children: "Premium" }), _jsx(SelectItem, { value: "university", children: "University" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-sm font-medium", children: "University" }), _jsxs(Select, { value: filters.university, onValueChange: (value) => setFilters({ ...filters, university: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select university" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Universities" }), _jsx(SelectItem, { value: "none", children: "No University" }), _jsx(SelectItem, { value: "MIT", children: "MIT" }), _jsx(SelectItem, { value: "Stanford", children: "Stanford" }), _jsx(SelectItem, { value: "Harvard", children: "Harvard" }), _jsx(SelectItem, { value: "Berkeley", children: "UC Berkeley" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-sm font-medium", children: "Activity Level" }), _jsxs(Select, { value: filters.activityLevel, onValueChange: (value) => setFilters({ ...filters, activityLevel: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select activity level" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Levels" }), _jsx(SelectItem, { value: "high", children: "High" }), _jsx(SelectItem, { value: "medium", children: "Medium" }), _jsx(SelectItem, { value: "low", children: "Low" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-sm font-medium", children: "Signup Period" }), _jsxs(Select, { value: filters.signupPeriod, onValueChange: (value) => setFilters({ ...filters, signupPeriod: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select signup period" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Time" }), _jsx(SelectItem, { value: "last30", children: "Last 30 days" }), _jsx(SelectItem, { value: "last90", children: "Last 90 days" }), _jsx(SelectItem, { value: "older", children: "Older than 90 days" })] })] })] })] }), _jsxs(SheetFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => {
                                            setFilters({
                                                userType: "all",
                                                subscriptionPlan: "all",
                                                university: "all",
                                                activityLevel: "all",
                                                signupPeriod: "all"
                                            });
                                        }, children: "Reset" }), _jsx(Button, { onClick: () => setIsFiltersOpen(false), children: "Apply Filters" })] })] }) }), _jsx(Sheet, { open: isUserDetailsOpen, onOpenChange: setIsUserDetailsOpen, children: _jsx(SheetContent, { className: "sm:max-w-xl overflow-auto", children: selectedUser && (_jsxs(_Fragment, { children: [_jsxs(SheetHeader, { children: [_jsx(SheetTitle, { children: "User Details" }), _jsxs(SheetDescription, { children: ["Complete information about ", selectedUser.name] })] }), _jsxs("div", { className: "py-6", children: [_jsxs("div", { className: "flex items-center mb-6", children: [_jsx("div", { className: "h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold", children: selectedUser.name.charAt(0) }), _jsxs("div", { className: "ml-4", children: [_jsx("h2", { className: "text-lg font-semibold", children: selectedUser.name }), _jsx("p", { className: "text-muted-foreground", children: selectedUser.email }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx(StatusBadge, { status: selectedUser.accountStatus }), _jsx(UserTypeBadge, { type: selectedUser.userType })] })] })] }), _jsxs(Tabs, { defaultValue: "overview", children: [_jsxs(TabsList, { className: "w-full", children: [_jsx(TabsTrigger, { value: "overview", className: "flex-1", children: "Overview" }), _jsx(TabsTrigger, { value: "activity", className: "flex-1", children: "Activity" }), _jsx(TabsTrigger, { value: "subscription", className: "flex-1", children: "Subscription" })] }), _jsx(TabsContent, { value: "overview", className: "mt-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(InfoItem, { label: "Username", value: selectedUser.username }), _jsx(InfoItem, { label: "User ID", value: `#${selectedUser.id}` }), _jsx(InfoItem, { label: "Signup Date", value: format(new Date(selectedUser.signupDate), "PPP") }), _jsx(InfoItem, { label: "Last Login", value: format(new Date(selectedUser.lastLogin), "PPP") })] }), _jsx(Separator, {}), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2", children: "University Information" }), selectedUser.university ? (_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(InfoItem, { label: "University", value: selectedUser.university }), _jsx(InfoItem, { label: "University ID", value: `#${selectedUser.universityId}` })] })) : (_jsx("p", { className: "text-sm text-muted-foreground", children: "Not affiliated with a university" }))] })] }) }), _jsx(TabsContent, { value: "activity", className: "mt-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2", children: "Activity Level" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ActivityBadge, { level: selectedUser.usageStats.activityLevel }), _jsx("span", { className: "text-sm text-muted-foreground", children: selectedUser.usageStats.activityLevel === "high"
                                                                                    ? "Very engaged user"
                                                                                    : selectedUser.usageStats.activityLevel ===
                                                                                        "medium"
                                                                                        ? "Regular user"
                                                                                        : "Occasional user" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(InfoItem, { label: "Logins", value: selectedUser.usageStats.logins.toString() }), _jsx(InfoItem, { label: "Sessions (30d)", value: selectedUser.usageStats.sessionsLast30Days.toString() }), _jsx(InfoItem, { label: "Avg. Session Time", value: selectedUser.usageStats.avgSessionTime })] }), _jsx(Separator, {}), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium mb-2", children: "Features Used" }), _jsx("div", { className: "flex flex-wrap gap-2", children: selectedUser.usageStats.featuresUsed.map((feature) => (_jsx(Badge, { variant: "outline", children: feature }, feature))) })] })] }) }), _jsx(TabsContent, { value: "subscription", className: "mt-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: "Current Plan" }), _jsx("div", { className: "flex items-center mt-1", children: _jsx(SubscriptionBadge, { plan: selectedUser.subscriptionPlan, status: selectedUser.subscriptionStatus }) })] }), _jsx(Button, { size: "sm", variant: "outline", children: "Change Plan" })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-sm font-medium", children: "Upgrade Options" }), _jsxs("div", { className: "space-y-2", children: [selectedUser.subscriptionPlan !== "premium" && (_jsx("div", { className: "border rounded-md p-4", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: "Premium Plan" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Full access to all features" })] }), _jsx(Button, { size: "sm", onClick: () => handleUpgradeSubscription(selectedUser.id, "premium"), children: "Upgrade" })] }) })), selectedUser.subscriptionPlan !== "university" && (_jsx("div", { className: "border rounded-md p-4", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium", children: "University Plan" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "University-specific features and integrations" })] }), _jsx(Button, { size: "sm", onClick: () => handleUpgradeSubscription(selectedUser.id, "university"), children: "Upgrade" })] }) }))] })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-sm font-medium", children: "Billing Information" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "This is a demonstration. Billing information would be displayed here." })] })] }) })] })] }), _jsxs(SheetFooter, { children: [_jsxs(Button, { variant: "outline", onClick: () => handleUpdateStatus(selectedUser.id, selectedUser.accountStatus === "active"
                                                ? "inactive"
                                                : "active"), children: [selectedUser.accountStatus === "active"
                                                    ? "Deactivate"
                                                    : "Activate", " ", "Account"] }), _jsx(Button, { onClick: () => setIsUserDetailsOpen(false), children: "Close" })] })] })) }) }), _jsx(EditUserDialog, {})] }) }));
}
// Helper Components
function InfoItem({ label, value }) {
    return (_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: label }), _jsx("p", { className: "text-sm font-medium", children: value })] }));
}
function UserTypeBadge({ type }) {
    let className = "";
    let variant = "outline";
    switch (type) {
        case "regular":
            className = "text-blue-600 bg-blue-50 border-blue-200";
            break;
        case "university_student":
            className = "text-green-600 bg-green-50 border-green-200";
            break;
        case "university_admin":
            className = "text-purple-600 bg-purple-50 border-purple-200";
            break;
        case "staff":
            className = "text-amber-600 bg-amber-50 border-amber-200";
            break;
        case "admin":
            variant = "destructive";
            className = "font-medium";
            break;
        default:
            className = "text-gray-600 bg-gray-50 border-gray-200";
    }
    let displayName = "User";
    if (type === "regular")
        displayName = "Regular";
    else if (type === "university_student")
        displayName = "Student";
    else if (type === "university_admin")
        displayName = "Uni Admin";
    else if (type === "staff")
        displayName = "Staff";
    else if (type === "admin")
        displayName = "Admin";
    return (_jsx(Badge, { variant: variant, className: className, children: displayName }));
}
function SubscriptionBadge({ plan, status }) {
    let className = "";
    let variant = "outline";
    switch (plan) {
        case "free":
            className = "text-gray-600 bg-gray-50 border-gray-200";
            break;
        case "premium":
            className = "text-amber-600 bg-amber-50 border-amber-200";
            break;
        case "university":
            variant = "secondary";
            className = "bg-blue-100 text-blue-800 hover:bg-blue-100";
            break;
        default:
            className = "text-gray-600 bg-gray-50 border-gray-200";
    }
    // Replace emoji dots with colored indicators
    const StatusIndicator = () => {
        switch (status) {
            case "active":
                return (_jsx("span", { className: "w-2 h-2 rounded-full bg-green-500 mr-1.5 inline-block" }));
            case "inactive":
                return (_jsx("span", { className: "w-2 h-2 rounded-full bg-gray-400 mr-1.5 inline-block" }));
            case "cancelled":
                return (_jsx("span", { className: "w-2 h-2 rounded-full bg-red-500 mr-1.5 inline-block" }));
            case "past_due":
                return (_jsx("span", { className: "w-2 h-2 rounded-full bg-amber-500 mr-1.5 inline-block" }));
            default:
                return null;
        }
    };
    // Display name with better capitalization
    const displayName = plan === "free"
        ? "Free"
        : plan === "premium"
            ? "Premium"
            : plan === "university"
                ? "University"
                : plan.charAt(0).toUpperCase() + plan.slice(1);
    return (_jsxs(Badge, { variant: variant, className: className, children: [_jsx(StatusIndicator, {}), displayName] }));
}
function ActivityBadge({ level }) {
    let className = "";
    switch (level) {
        case "high":
            className = "text-green-600 bg-green-50 border-green-200";
            break;
        case "medium":
            className = "text-blue-600 bg-blue-50 border-blue-200";
            break;
        case "low":
            className = "text-orange-600 bg-orange-50 border-orange-200";
            break;
        default:
            className = "text-gray-600 bg-gray-50 border-gray-200";
    }
    return (_jsx(Badge, { variant: "outline", className: className, children: level.charAt(0).toUpperCase() + level.slice(1) }));
}
function StatusBadge({ status }) {
    let className = "";
    switch (status) {
        case "active":
            className = "text-green-600 bg-green-50 border-green-200";
            break;
        case "inactive":
            className = "text-gray-600 bg-gray-50 border-gray-200";
            break;
        case "suspended":
            className = "text-red-600 bg-red-50 border-red-200";
            break;
        default:
            className = "text-gray-600 bg-gray-50 border-gray-200";
    }
    return (_jsx(Badge, { variant: "outline", className: className, children: status.charAt(0).toUpperCase() + status.slice(1) }));
}
// Add Staff User Dialog Component
function AddStaffUserDialog() {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
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
            const res = await apiRequest("POST", "/api/admin/create-staff", values);
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
            // Refresh the users list
            queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
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
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(UserPlus, { className: "mr-2 h-4 w-4" }), "Add Staff User"] }) }), _jsxs(DialogContent, { className: "sm:max-w-[425px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add Staff User" }), _jsx(DialogDescription, { children: "Create a new staff user account. Staff users will have access to administrative features with limited permissions." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "username", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Username" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "staffuser", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Full Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Staff Member Name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { type: "email", placeholder: "staff@example.com", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "password", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", ...field }) }), _jsx(FormDescription, { children: "Set a strong temporary password for this staff user." }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "mt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), disabled: createStaffUserMutation.isPending, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: createStaffUserMutation.isPending, children: createStaffUserMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx("svg", { className: "mr-2 h-4 w-4 animate-spin", xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }) }), "Creating..."] })) : ("Create Staff User") })] })] }) })] })] }));
}
function EditUserDialog() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    // Component context variables from parent component
    const parentContext = useContext(UserManagementContext);
    if (!parentContext) {
        return null; // Don't render if context is not available
    }
    const { selectedUser, isEditUserOpen, setIsEditUserOpen, updateUserMutation } = parentContext;
    // Initialize form with empty defaults first - important for React hooks rules
    const form = useForm({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            name: "",
            email: "",
            userType: "regular",
            university: "",
            subscriptionPlan: "free",
            accountStatus: "active"
        }
    });
    // Update form when selectedUser changes
    useEffect(() => {
        if (selectedUser && isEditUserOpen) {
            form.reset({
                name: selectedUser.name,
                email: selectedUser.email,
                userType: selectedUser.userType,
                university: selectedUser.university || "",
                subscriptionPlan: selectedUser.subscriptionPlan,
                accountStatus: selectedUser.accountStatus
            });
        }
    }, [selectedUser, isEditUserOpen, form]);
    // Reset form when selected user changes or dialog opens (duplicate effect removed)
    // This effect is already handled above
    // Early return if no selected user - AFTER all hook calls
    if (!selectedUser) {
        return null;
    }
    // Duplicate useEffect removed - form reset is handled above
    function onSubmit(values) {
        if (!selectedUser)
            return;
        updateUserMutation.mutate({
            userId: selectedUser.id,
            userData: values
        });
    }
    return (_jsx(Dialog, { open: isEditUserOpen, onOpenChange: setIsEditUserOpen, children: _jsxs(DialogContent, { className: "sm:max-w-md overflow-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit User" }), _jsxs(DialogDescription, { children: ["Make changes to ", selectedUser.name, "'s profile"] })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4 py-2", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "User's full name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Email address", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "userType", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "User Type" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a user type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "regular", children: "Regular" }), _jsx(SelectItem, { value: "university_student", children: "University Student" }), _jsx(SelectItem, { value: "university_admin", children: "University Admin" }), _jsx(SelectItem, { value: "staff", children: "Staff" })] })] }), _jsx(FormMessage, {})] })) }), (form.watch("userType") === "university_student" ||
                                form.watch("userType") === "university_admin") && (_jsx(FormField, { control: form.control, name: "university", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "University" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "University name", ...field }) }), _jsx(FormMessage, {})] })) })), _jsx(FormField, { control: form.control, name: "subscriptionPlan", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Subscription Plan" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select a subscription plan" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "free", children: "Free" }), _jsx(SelectItem, { value: "premium", children: "Premium" }), _jsx(SelectItem, { value: "university", children: "University" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "accountStatus", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Account Status" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select account status" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "inactive", children: "Inactive" }), _jsx(SelectItem, { value: "suspended", children: "Suspended" })] })] }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsEditUserOpen(false), disabled: updateUserMutation.isPending, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: updateUserMutation.isPending, children: updateUserMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx("svg", { className: "mr-2 h-4 w-4 animate-spin", xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }) }), "Saving..."] })) : ("Save Changes") })] })] }) })] }) }));
}
