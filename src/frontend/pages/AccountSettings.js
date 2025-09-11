import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useUser, useIsSubscriptionActive, useUpdateUserSubscription } from "@/lib/useUserData";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCareerData } from "@/hooks/use-career-data";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
// Import the form modals
import { WorkHistoryFormModal } from "@/components/modals/WorkHistoryFormModal";
import { EducationFormModal } from "@/components/modals/EducationFormModal";
import { SkillFormModal } from "@/components/modals/SkillFormModal";
import { CertificationFormModal } from "@/components/modals/CertificationFormModal";
import { CareerSummaryFormModal } from "@/components/modals/CareerSummaryFormModal";
import { LinkedInProfileFormModal } from "@/components/modals/LinkedInProfileFormModal";
import { DeleteConfirmationDialog } from "@/components/modals/DeleteConfirmationDialog";
import { AddSectionButton } from "@/components/AddSectionButton";
import { Loader2, CreditCard, User, LogOut, CheckCircle, Circle, Briefcase, GraduationCap, Award, BookOpen, FileText, Pencil, Trash2, Calendar, MapPin, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
// Color pickers removed as per branding decision
// Schema for validating the profile form
const profileFormSchema = z.object({
    name: z.string().nonempty({ message: "Name is required." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    currentPassword: z.string().optional().or(z.literal("")), // Optional current password (required for email/password change)
    password: z
        .string()
        .min(8, { message: "Password must be at least 8 characters." })
        .optional()
        .or(z.literal("")) // Allow empty string for no password change
});
export default function AccountSettings() {
    const { user, isLoading: userLoading, logout, updateProfile } = useUser();
    const isSubscriptionActive = useIsSubscriptionActive();
    const { toast } = useToast();
    const [, navigate] = useLocation();
    const updateUserSubscription = useUpdateUserSubscription();
    // Theme color customization removed as per branding decision
    const careerQuery = useCareerData();
    const { careerData, isLoading: careerDataLoading, refetch: refetchCareerData } = careerQuery;
    // Debug logging for career data
    useEffect(() => {

    }, [careerData, careerDataLoading]);
    // Track the current active tab
    const [activeTab, setActiveTab] = useState("career");
    // Track overall page loading state - combines user and career data loading
    const isPageLoading = userLoading || (activeTab === "career" && careerDataLoading);
    // Create form first before using it in useEffect
    const form = useForm({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            currentPassword: "", // Current password field (required for email/password changes)
            password: "" // Empty password field by default (no password change)
        }
    });
    // No need to force refresh on component mount - rely on React Query's caching
    // This prevents the white flash by not removing cached data
    useEffect(() => {
        // Only refetch if the data is stale, which React Query handles automatically
        // We don't need to manually removeQueries
        if (!careerData) {

            refetchCareerData();
        }
        // Always update form values when user data changes
        if (user) {
            form.reset({
                name: user.name,
                email: user.email,
                currentPassword: "",
                password: ""
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);
    // Only refresh career data when user switches to the Career tab IF data is stale or missing
    useEffect(() => {
        if (activeTab === "career" &&
            (!careerData || Object.keys(careerData).length === 0)) {

            refetchCareerData().then(() => {

            });
        }
        // Update form with latest user data when switching to profile tab
        if (activeTab === "profile" && user) {
            form.reset({
                name: user.name,
                email: user.email,
                currentPassword: "", // Always reset password fields
                password: ""
            });
        }
    }, [activeTab, refetchCareerData, careerData, user, form]);
    // Modal state variables for career data forms
    const [workHistoryModal, setWorkHistoryModal] = useState({ open: false, mode: "add" });
    const [educationModal, setEducationModal] = useState({ open: false, mode: "add" });
    const [skillModal, setSkillModal] = useState({ open: false });
    const [certificationModal, setCertificationModal] = useState({ open: false, mode: "add" });
    const [careerSummaryModal, setCareerSummaryModal] = useState({ open: false, defaultValue: "" });
    const [linkedInProfileModal, setLinkedInProfileModal] = useState({ open: false, defaultValue: "" });
    const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, itemId: 0, itemType: "", endpoint: "" });
    // Cancel subscription mutation
    const cancelSubscriptionMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("POST", "/api/payments/cancel-subscription", {});
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to cancel subscription");
            }
            return await response.json();
        },
        onSuccess: () => {
            toast({
                title: "Subscription Cancelled",
                description: "Your subscription has been cancelled and will end at the end of your billing period."
            });
        },
        onError: (error) => {
            let errorMessage = error.message;
            // Handle specific error cases with more user-friendly messages
            if (error.message.includes("no active subscription")) {
                errorMessage = "You don't currently have an active subscription to cancel. If you believe this is an error, please contact support.";
            }
            else if (error.message.includes("already cancelled")) {
                errorMessage = "Your subscription has already been cancelled.";
            }
            else if (error.message.includes("not found")) {
                errorMessage = "Subscription not found. Please refresh the page and try again.";
            }
            toast({
                title: "Cancellation Failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
    });
    // Theme customization mutation removed as per branding decision
    // Send verification email mutation
    const sendVerificationEmailMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest("POST", "/api/auth/send-verification-email", {});
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to send verification email");
            }
            return await response.json();
        },
        onSuccess: (data) => {
            toast({
                title: "Verification Email Sent",
                description: "Please check your inbox for the verification link."
            });
            // For development only - directly show the verification URL
            if (data.verificationUrl) {
                toast({
                    title: "Development Mode",
                    description: "Verification link: " + data.verificationUrl
                });
            }
        },
        onError: (error) => {
            toast({
                title: "Email Send Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    });
    const handleCancelSubscription = async () => {
        if (!user) {
            toast({
                title: "Error",
                description: "User not found. Please refresh the page and try again.",
                variant: "destructive"
            });
            return;
        }
        if (!isSubscriptionActive) {
            toast({
                title: "No Active Subscription",
                description: "You don't have an active subscription to cancel.",
                variant: "destructive"
            });
            return;
        }
        if (user.subscriptionPlan === "free") {
            toast({
                title: "No Subscription to Cancel",
                description: "You're currently on the free plan and don't have a subscription to cancel.",
                variant: "destructive"
            });
            return;
        }
        cancelSubscriptionMutation.mutate();
    };
    const handleSendVerificationEmail = async () => {
        if (!user || user.emailVerified) {
            return;
        }
        sendVerificationEmailMutation.mutate();
    };
    const handleProfileSubmit = async (data) => {
        try {
            if (!user) {
                throw new Error("User not found");
            }
            // Validate password requirements for email or password changes
            const isEmailChanged = data.email !== user.email;
            const isPasswordChanged = data.password && data.password.trim() !== "";
            if ((isEmailChanged || isPasswordChanged) &&
                (!data.currentPassword || data.currentPassword.trim() === "")) {
                toast({
                    title: "Validation Error",
                    description: "Current password is required when changing email or password.",
                    variant: "destructive"
                });
                return;
            }
            // Prepare update data
            const updateData = {
                name: data.name
            };
            // Only include email and password changes if current password is provided
            if (data.currentPassword && data.currentPassword.trim() !== "") {
                // Add current password for verification
                updateData.currentPassword = data.currentPassword;
                // Add email update if changed
                if (isEmailChanged) {
                    updateData.email = data.email;
                }
                // Add password update if provided
                if (isPasswordChanged) {
                    updateData.password = data.password;
                }
            }
            else if (data.name !== user.name) {
                // If only updating name (no password required)
                updateData.name = data.name;
            }
            // Send the update to the server
            await updateProfile(updateData);
            // Reset password fields after successful update
            form.setValue("password", "");
            form.setValue("currentPassword", "");
            // Show success toast
            toast({
                title: "Profile Updated",
                description: "Your profile information has been updated."
            });
        }
        catch (error) {
            // Show error toast
            toast({
                title: "Update Failed",
                description: error.message || "Failed to update profile information.",
                variant: "destructive"
            });
        }
    };
    const handleLogout = () => {
        logout();
        navigate("/auth");
    };
    // Theme color customization handlers removed as per branding decision
    if (userLoading || !user) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
    }
    // Show skeleton loading state when page is loading
    if (isPageLoading) {
        return (_jsxs("div", { className: "container py-10", children: [_jsx("h1", { className: "text-3xl font-bold mb-8", children: "Account Settings" }), _jsxs("div", { className: "space-y-8", children: [_jsx("div", { className: "flex flex-wrap gap-2 border-b", children: ["Profile", "Career", "Subscription", "Security"].map((tab, index) => (_jsx("div", { className: "animate-pulse px-4 py-2 rounded-t-lg bg-gray-100 w-24 h-10" }, index))) }), _jsx("div", { className: "px-6 py-8", children: _jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "rounded-lg bg-white shadow-sm p-6 border border-gray-200", children: [_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "h-7 bg-gray-200 rounded w-1/3 animate-pulse mb-2" }), _jsx("div", { className: "h-4 bg-gray-100 rounded w-2/3 animate-pulse" })] }), _jsxs("div", { className: "space-y-6", children: [[1, 2].map((i) => (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-24 animate-pulse" }), _jsx("div", { className: "h-10 bg-gray-100 rounded w-full animate-pulse" })] }, i))), _jsx("div", { className: "flex justify-end", children: _jsx("div", { className: "h-10 bg-gray-200 rounded w-32 animate-pulse" }) })] })] }) }) })] })] }));
    }
    const formatDate = (date) => {
        if (!date)
            return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };
    const getPlanName = (plan) => {
        switch (plan) {
            case "premium":
                return "Premium";
            case "university":
                return "University Edition";
            default:
                return "Free";
        }
    };
    return (_jsxs("div", { className: "container py-10", children: [_jsx("h1", { className: "text-3xl font-bold mb-8", children: "Account Settings" }), _jsxs(Tabs, { defaultValue: "career", className: "space-y-8", onValueChange: (value) => {

                    setActiveTab(value);
                }, children: [_jsxs(TabsList, { className: "inline-flex flex-wrap w-auto", children: [_jsxs(TabsTrigger, { value: "career", className: "flex items-center", children: [_jsx(Briefcase, { className: "mr-2 h-4 w-4" }), "Career"] }), _jsxs(TabsTrigger, { value: "profile", className: "flex items-center", children: [_jsx(User, { className: "mr-2 h-4 w-4" }), "Profile"] }), _jsxs(TabsTrigger, { value: "subscription", className: "flex items-center", children: [_jsx(CreditCard, { className: "mr-2 h-4 w-4" }), "Subscription"] })] }), _jsx(TabsContent, { value: "profile", className: "px-6 py-8", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "rounded-lg bg-white shadow-sm p-6 border border-gray-200", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Profile Information" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Update your personal information and how we can contact you." })] }), _jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(handleProfileSubmit), className: "space-y-6", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { className: "text-sm text-gray-500", children: "Full Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Your name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { className: "text-sm text-gray-500", children: "Email Address" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "your.email@example.com", ...field }) }), _jsx(FormDescription, { children: user.emailVerified ? (_jsx("span", { className: "inline-flex items-center gap-1 text-green-700 bg-green-100 text-xs font-medium px-2 py-0.5 rounded-full", children: "\u2705 Verified" })) : (_jsx(Button, { variant: "link", className: "p-0 h-auto text-sm", onClick: handleSendVerificationEmail, disabled: sendVerificationEmailMutation.isPending, children: sendVerificationEmailMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-1 h-3 w-3 animate-spin" }), "Sending..."] })) : (_jsx(_Fragment, { children: "Not verified. Click to verify" })) })) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "currentPassword", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { className: "text-sm text-gray-500", children: "Current Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: "Required to change email or password", ...field }) }), _jsx(FormDescription, { children: "Required only when changing email or password." }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "password", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { className: "text-sm text-gray-500", children: "New Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: "Leave blank to keep current password", ...field }) }), _jsx(FormDescription, { children: "Must be at least 8 characters. Leave blank to keep your current password." }), _jsx(FormMessage, {})] })) }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { type: "submit", disabled: form.formState.isSubmitting, className: "w-full sm:w-auto", children: form.formState.isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : ("Save Changes") }) })] }) })] }), _jsxs("div", { className: "rounded-lg bg-white shadow-sm p-6 border border-gray-200", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Account Information" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "View your account details and session information." })] }), _jsxs("dl", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-xs text-gray-500 mb-1", children: "Username" }), _jsx("dd", { className: "font-medium", children: user.username })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs text-gray-500 mb-1", children: "Account Type" }), _jsx("dd", { className: "font-medium capitalize", children: user.userType || "Regular" })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs text-gray-500 mb-1", children: "Account Created" }), _jsx("dd", { className: "font-medium", children: user.createdAt
                                                                ? formatDate(new Date(user.createdAt))
                                                                : "N/A" })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-xs text-gray-500 mb-1", children: "Last Password Change" }), _jsx("dd", { className: "font-medium", children: user.passwordLastChanged
                                                                ? formatDate(new Date(user.passwordLastChanged))
                                                                : "N/A" })] })] }), _jsx("div", { className: "mt-6 flex flex-col sm:flex-row gap-3", children: _jsxs(Button, { variant: "outline", className: "flex items-center gap-2", onClick: handleLogout, children: [_jsx(LogOut, { className: "h-4 w-4" }), "Sign Out"] }) })] })] }) }), _jsxs(TabsContent, { value: "career", className: "px-6 py-8", children: [_jsxs("div", { className: "space-y-8", children: [(() => {
                                        // Calculate if profile is complete
                                        const totalSections = 5; // Career Summary, LinkedIn, Work History, Education, Skills
                                        let completedSections = 0;
                                        if (careerData?.careerSummary)
                                            completedSections++;
                                        if (careerData?.linkedInUrl)
                                            completedSections++;
                                        if (careerData?.workHistory && careerData.workHistory.length > 0)
                                            completedSections++;
                                        if (careerData?.educationHistory && careerData.educationHistory.length > 0)
                                            completedSections++;
                                        if (careerData?.skills && careerData.skills.length > 0)
                                            completedSections++;
                                        const isProfileComplete = completedSections === totalSections;
                                        // Only show checklist if profile is not complete
                                        if (isProfileComplete)
                                            return null;
                                        return (_jsxs("div", { className: "rounded-lg bg-white shadow-sm p-6 border border-gray-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(CheckCircle, { className: "h-5 w-5 mr-2 text-primary" }), "Profile Completion"] }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Complete your career profile to maximize opportunities." })] }), _jsxs("div", { className: "text-xl font-semibold text-primary", children: [Math.round((completedSections / totalSections) * 100), "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2.5", children: _jsx("div", { className: "bg-primary h-2.5 rounded-full", style: {
                                                            width: `${(completedSections / totalSections) * 100}%`
                                                        } }) }), _jsxs("div", { className: "mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3", children: [_jsx("div", { className: `p-3 rounded-md border ${careerData?.careerSummary
                                                                ? "bg-green-50 border-green-200"
                                                                : "bg-gray-50 border-gray-200"}`, children: _jsxs("div", { className: "flex items-center", children: [careerData?.careerSummary ? (_jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mr-2" })) : (_jsx(Circle, { className: "h-5 w-5 text-gray-300 mr-2" })), _jsx("span", { className: "text-sm font-medium", children: "Career Summary" })] }) }), _jsx("div", { className: `p-3 rounded-md border ${careerData?.linkedInUrl
                                                                ? "bg-green-50 border-green-200"
                                                                : "bg-gray-50 border-gray-200"}`, children: _jsxs("div", { className: "flex items-center", children: [careerData?.linkedInUrl ? (_jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mr-2" })) : (_jsx(Circle, { className: "h-5 w-5 text-gray-300 mr-2" })), _jsx("span", { className: "text-sm font-medium", children: "LinkedIn Profile" })] }) }), _jsx("div", { className: `p-3 rounded-md border ${careerData?.workHistory && careerData.workHistory.length > 0
                                                                ? "bg-green-50 border-green-200"
                                                                : "bg-gray-50 border-gray-200"}`, children: _jsxs("div", { className: "flex items-center", children: [careerData?.workHistory &&
                                                                        careerData.workHistory.length > 0 ? (_jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mr-2" })) : (_jsx(Circle, { className: "h-5 w-5 text-gray-300 mr-2" })), _jsx("span", { className: "text-sm font-medium", children: "Work History" })] }) }), _jsx("div", { className: `p-3 rounded-md border ${careerData?.educationHistory &&
                                                                careerData.educationHistory.length > 0
                                                                ? "bg-green-50 border-green-200"
                                                                : "bg-gray-50 border-gray-200"}`, children: _jsxs("div", { className: "flex items-center", children: [careerData?.educationHistory &&
                                                                        careerData.educationHistory.length > 0 ? (_jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mr-2" })) : (_jsx(Circle, { className: "h-5 w-5 text-gray-300 mr-2" })), _jsx("span", { className: "text-sm font-medium", children: "Education" })] }) }), _jsx("div", { className: `p-3 rounded-md border ${careerData?.skills && careerData.skills.length > 0
                                                                ? "bg-green-50 border-green-200"
                                                                : "bg-gray-50 border-gray-200"}`, children: _jsxs("div", { className: "flex items-center", children: [careerData?.skills && careerData.skills.length > 0 ? (_jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mr-2" })) : (_jsx(Circle, { className: "h-5 w-5 text-gray-300 mr-2" })), _jsx("span", { className: "text-sm font-medium", children: "Skills" })] }) })] })] }));
                                    })(), _jsxs("div", { className: "rounded-lg bg-white shadow-sm p-6 border border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2 text-primary" }), "Career Summary"] }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Your professional summary that appears on your profile." })] }), _jsx(Button, { variant: "outline", size: "sm", className: "flex items-center", onClick: () => setCareerSummaryModal({
                                                            open: true,
                                                            defaultValue: careerData?.careerSummary || ""
                                                        }), children: !careerData?.careerSummary ? (_jsxs(_Fragment, { children: [_jsx(Pencil, { className: "h-4 w-4 mr-1" }), " Add Summary"] })) : (_jsxs(_Fragment, { children: [_jsx(Pencil, { className: "h-4 w-4 mr-1" }), " Edit"] })) })] }), _jsx("div", { className: "bg-gray-50 p-4 rounded-md text-gray-700 min-h-20", children: careerData?.careerSummary ? (_jsx("div", { className: "whitespace-pre-wrap", children: careerData.careerSummary })) : (_jsx("div", { className: "text-gray-400 italic", children: "No career summary yet. Add a professional summary that highlights your career goals, expertise, and what sets you apart." })) })] }), _jsxs("div", { className: "rounded-lg bg-white shadow-sm p-6 border border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(Linkedin, { className: "h-5 w-5 mr-2 text-primary" }), "LinkedIn Profile"] }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Your LinkedIn profile URL for networking and professional opportunities." })] }), _jsx(Button, { variant: "outline", size: "sm", className: "flex items-center", onClick: () => setLinkedInProfileModal({
                                                            open: true,
                                                            defaultValue: careerData?.linkedInUrl || ""
                                                        }), children: !careerData?.linkedInUrl ? (_jsxs(_Fragment, { children: [_jsx(Pencil, { className: "h-4 w-4 mr-1" }), " Add LinkedIn"] })) : (_jsxs(_Fragment, { children: [_jsx(Pencil, { className: "h-4 w-4 mr-1" }), " Edit"] })) })] }), _jsx("div", { className: "bg-gray-50 p-4 rounded-md text-gray-700 min-h-12", children: careerData?.linkedInUrl ? (_jsxs("div", { className: "flex items-center", children: [_jsx(Linkedin, { className: "h-4 w-4 mr-2 text-[#0077b5]" }), _jsx("a", { href: careerData.linkedInUrl.startsWith("http")
                                                                ? careerData.linkedInUrl
                                                                : `https://${careerData.linkedInUrl}`, target: "_blank", rel: "noopener noreferrer", className: "text-blue-600 hover:underline", children: careerData.linkedInUrl })] })) : (_jsx("div", { className: "text-gray-400 italic", children: "No LinkedIn profile added yet. Add your LinkedIn profile URL to enhance your professional presence." })) })] }), _jsxs("div", { className: "rounded-lg bg-white shadow-sm p-6 border border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(Briefcase, { className: "h-5 w-5 mr-2 text-primary" }), "Work History"] }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Your professional experience, positions, and achievements." })] }), _jsx(AddSectionButton, { label: "Add Job", onClick: () => setWorkHistoryModal({
                                                            open: true,
                                                            mode: "add"
                                                        }) })] }), !careerData?.workHistory ||
                                                careerData.workHistory.length === 0 ? (_jsxs("div", { className: "text-center py-8 border border-dashed border-gray-300 rounded-md bg-gray-50", children: [_jsx(Briefcase, { className: "mx-auto h-10 w-10 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-semibold text-gray-900", children: "No work history" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Add your work experience to help build your professional profile." }), _jsx("div", { className: "mt-4", children: _jsxs(Button, { variant: "default", size: "sm", onClick: () => setWorkHistoryModal({
                                                                open: true,
                                                                mode: "add"
                                                            }), children: [_jsx(Briefcase, { className: "h-4 w-4 mr-2" }), "Add Work Experience"] }) })] })) : (_jsx("div", { className: "space-y-6", children: careerData.workHistory.map((work) => (_jsxs("div", { className: "border border-gray-200 rounded-md p-4 relative group", children: [_jsxs("div", { className: "opacity-0 group-hover:opacity-100 absolute top-3 right-3 flex gap-1 transition-opacity", children: [_jsxs(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setWorkHistoryModal({
                                                                        open: true,
                                                                        mode: "edit",
                                                                        data: work,
                                                                        id: work.id
                                                                    }), children: [_jsx(Pencil, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Edit" })] }), _jsxs(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 hover:text-red-500", onClick: () => setDeleteConfirmation({
                                                                        open: true,
                                                                        itemId: work.id,
                                                                        itemType: "work history",
                                                                        endpoint: "work-history"
                                                                    }), children: [_jsx(Trash2, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Delete" })] })] }), _jsx("div", { className: "flex items-start gap-3", children: _jsxs("div", { children: [_jsxs(Badge, { variant: "outline", className: "font-normal", children: [new Date(work.startDate).getFullYear(), " -", " ", work.endDate
                                                                                ? new Date(work.endDate).getFullYear()
                                                                                : "Present"] }), _jsx("h3", { className: "text-base font-semibold mt-2", children: work.jobTitle }), _jsx("p", { className: "text-sm text-gray-700", children: work.company }), _jsxs("div", { className: "text-xs text-gray-500 mt-1 flex items-center", children: [_jsx(MapPin, { className: "h-3 w-3 mr-1 inline" }), work.location || "Remote"] }), work.description && (_jsx("div", { className: "mt-2 text-sm text-gray-600 whitespace-pre-wrap", children: work.description })), work.highlights && work.highlights.length > 0 && (_jsxs("div", { className: "mt-2", children: [_jsx("span", { className: "text-xs font-medium text-gray-500", children: "Achievements:" }), _jsx("ul", { className: "mt-1 text-sm text-gray-600 list-disc pl-5 space-y-1", children: work.highlights.map((highlight, i) => (_jsx("li", { children: highlight }, i))) })] }))] }) })] }, work.id))) }))] }), _jsxs("div", { className: "rounded-lg bg-white shadow-sm p-6 border border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(GraduationCap, { className: "h-5 w-5 mr-2 text-primary" }), "Education"] }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Your academic background, degrees, and certifications." })] }), _jsx(AddSectionButton, { label: "Add Education", onClick: () => setEducationModal({
                                                            open: true,
                                                            mode: "add"
                                                        }) })] }), !careerData?.educationHistory ||
                                                careerData.educationHistory.length === 0 ? (_jsxs("div", { className: "text-center py-8 border border-dashed border-gray-300 rounded-md bg-gray-50", children: [_jsx(GraduationCap, { className: "mx-auto h-10 w-10 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-semibold text-gray-900", children: "No education history" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Add your degrees, courses, and educational background." }), _jsx("div", { className: "mt-4", children: _jsxs(Button, { variant: "default", size: "sm", onClick: () => setEducationModal({
                                                                open: true,
                                                                mode: "add"
                                                            }), children: [_jsx(GraduationCap, { className: "h-4 w-4 mr-2" }), "Add Education"] }) })] })) : (_jsx("div", { className: "space-y-6", children: careerData.educationHistory.map((edu) => (_jsxs("div", { className: "border border-gray-200 rounded-md p-4 relative group", children: [_jsxs("div", { className: "opacity-0 group-hover:opacity-100 absolute top-3 right-3 flex gap-1 transition-opacity", children: [_jsxs(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setEducationModal({
                                                                        open: true,
                                                                        mode: "edit",
                                                                        data: edu,
                                                                        id: edu.id
                                                                    }), children: [_jsx(Pencil, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Edit" })] }), _jsxs(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 hover:text-red-500", onClick: () => setDeleteConfirmation({
                                                                        open: true,
                                                                        itemId: edu.id,
                                                                        itemType: "education",
                                                                        endpoint: "education"
                                                                    }), children: [_jsx(Trash2, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Delete" })] })] }), _jsxs("div", { children: [_jsxs(Badge, { variant: "outline", className: "font-normal", children: [new Date(edu.startDate).getFullYear(), " -", " ", edu.endDate
                                                                            ? new Date(edu.endDate).getFullYear()
                                                                            : "Present"] }), _jsxs("h3", { className: "text-base font-semibold mt-2", children: [edu.degreeType, " ", edu.fieldOfStudy && `in ${edu.fieldOfStudy}`] }), _jsx("p", { className: "text-sm text-gray-700", children: edu.institution }), _jsxs("div", { className: "text-xs text-gray-500 mt-1 flex items-center", children: [_jsx(MapPin, { className: "h-3 w-3 mr-1 inline" }), edu.location || "Remote"] }), edu.description && (_jsx("div", { className: "mt-2 text-sm text-gray-600 whitespace-pre-wrap", children: edu.description })), edu.achievements && edu.achievements.length > 0 && (_jsxs("div", { className: "mt-2", children: [_jsx("span", { className: "text-xs font-medium text-gray-500", children: "Achievements:" }), _jsx("ul", { className: "mt-1 text-sm text-gray-600 list-disc pl-5 space-y-1", children: edu.achievements.map((achievement, i) => (_jsx("li", { children: achievement }, i))) })] }))] })] }, edu.id))) }))] }), _jsxs("div", { className: "rounded-lg bg-white shadow-sm p-6 border border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(Award, { className: "h-5 w-5 mr-2 text-primary" }), "Skills"] }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Technical and professional skills that define your expertise." })] }), _jsxs(Button, { variant: "outline", size: "sm", className: "flex items-center", onClick: () => setSkillModal({ open: true }), children: [_jsx(Pencil, { className: "h-4 w-4 mr-1" }), " Manage Skills"] })] }), !careerData?.skills || careerData.skills.length === 0 ? (_jsxs("div", { className: "text-center py-8 border border-dashed border-gray-300 rounded-md bg-gray-50", children: [_jsx(Award, { className: "mx-auto h-10 w-10 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-semibold text-gray-900", children: "No skills added" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Add your technical, soft, and industry-specific skills." }), _jsx("div", { className: "mt-4", children: _jsxs(Button, { variant: "default", size: "sm", onClick: () => setSkillModal({ open: true }), children: [_jsx(Award, { className: "h-4 w-4 mr-2" }), "Add Skills"] }) })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "hidden", children: [console.log("Skills data:", careerData.skills), careerData.skills.forEach((skill, i) => {

                                                            })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: careerData.skills.map((skill, index) => (_jsx(Badge, { variant: "secondary", className: "px-3 py-1", children: typeof skill === "object" && skill !== null
                                                                ? skill.name || "Unknown skill"
                                                                : typeof skill === "string"
                                                                    ? skill
                                                                    : "Invalid skill" }, index))) })] }))] }), _jsxs("div", { className: "rounded-lg bg-white shadow-sm p-6 border border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(BookOpen, { className: "h-5 w-5 mr-2 text-primary" }), "Certifications"] }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Professional certifications, licenses, and accreditations." })] }), _jsx(AddSectionButton, { label: "Add Certification", onClick: () => setCertificationModal({
                                                            open: true,
                                                            mode: "add"
                                                        }) })] }), !careerData?.certifications ||
                                                careerData.certifications.length === 0 ? (_jsxs("div", { className: "text-center py-8 border border-dashed border-gray-300 rounded-md bg-gray-50", children: [_jsx(BookOpen, { className: "mx-auto h-10 w-10 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-semibold text-gray-900", children: "No certifications added" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Add any professional certifications or credentials you've earned." }), _jsx("div", { className: "mt-4", children: _jsxs(Button, { variant: "default", size: "sm", onClick: () => setCertificationModal({
                                                                open: true,
                                                                mode: "add"
                                                            }), children: [_jsx(BookOpen, { className: "h-4 w-4 mr-2" }), "Add Certification"] }) })] })) : (_jsx("div", { className: "space-y-6", children: careerData.certifications.map((cert) => (_jsxs("div", { className: "border border-gray-200 rounded-md p-4 relative group", children: [_jsxs("div", { className: "opacity-0 group-hover:opacity-100 absolute top-3 right-3 flex gap-1 transition-opacity", children: [_jsxs(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setCertificationModal({
                                                                        open: true,
                                                                        mode: "edit",
                                                                        data: cert,
                                                                        id: cert.id
                                                                    }), children: [_jsx(Pencil, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Edit" })] }), _jsxs(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 hover:text-red-500", onClick: () => setDeleteConfirmation({
                                                                        open: true,
                                                                        itemId: cert.id,
                                                                        itemType: "certification",
                                                                        endpoint: "certifications"
                                                                    }), children: [_jsx(Trash2, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Delete" })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-base font-semibold", children: cert.name }), _jsx("p", { className: "text-sm text-gray-700", children: cert.issuingOrganization }), _jsxs("div", { className: "flex items-center gap-4 mt-2 text-xs text-gray-500", children: [cert.issueDate && (_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), "Issued: ", formatDate(new Date(cert.issueDate))] })), cert.expirationDate && (_jsxs("div", { className: "flex items-center", children: [_jsx(Calendar, { className: "h-3 w-3 mr-1" }), "Expires:", " ", formatDate(new Date(cert.expirationDate))] }))] }), cert.credentialId && (_jsxs("div", { className: "mt-2 text-xs text-gray-500", children: ["Credential ID: ", cert.credentialId] })), cert.credentialUrl && (_jsx("div", { className: "mt-2", children: _jsx("a", { href: cert.credentialUrl, target: "_blank", rel: "noopener noreferrer", className: "text-xs text-primary hover:underline", children: "View Credential" }) }))] })] }, cert.id))) }))] })] }), _jsx(WorkHistoryFormModal, { open: workHistoryModal.open, mode: workHistoryModal.mode, defaultValues: workHistoryModal.data, id: workHistoryModal.id, onClose: () => setWorkHistoryModal({ ...workHistoryModal, open: false }), onSuccess: () => {
                                    setWorkHistoryModal({ ...workHistoryModal, open: false });
                                    refetchCareerData();
                                } }), _jsx(EducationFormModal, { open: educationModal.open, mode: educationModal.mode, defaultValues: educationModal.data, educationId: educationModal.id, onOpenChange: (open) => setEducationModal({ ...educationModal, open }), onSuccess: () => {
                                    setEducationModal({ ...educationModal, open: false });
                                    refetchCareerData();
                                } }), _jsx(SkillFormModal, { open: skillModal.open, skills: careerData?.skills || [], onOpenChange: (open) => setSkillModal({ ...skillModal, open }), onSuccess: () => {
                                    setSkillModal({ ...skillModal, open: false });
                                    refetchCareerData();
                                } }), _jsx(CertificationFormModal, { open: certificationModal.open, mode: certificationModal.mode, defaultValues: certificationModal.data, certificationId: certificationModal.id, onOpenChange: (open) => setCertificationModal({ ...certificationModal, open }), onSuccess: () => {
                                    setCertificationModal({ ...certificationModal, open: false });
                                    refetchCareerData();
                                } }), _jsx(CareerSummaryFormModal, { open: careerSummaryModal.open, defaultValue: careerSummaryModal.defaultValue, onOpenChange: (open) => setCareerSummaryModal({ ...careerSummaryModal, open }), onSuccess: () => {
                                    setCareerSummaryModal({ ...careerSummaryModal, open: false });
                                    refetchCareerData();
                                } }), _jsx(DeleteConfirmationDialog, { open: deleteConfirmation.open, itemType: deleteConfirmation.itemType, onOpenChange: (open) => setDeleteConfirmation({ ...deleteConfirmation, open }), onConfirm: async () => {
                                    try {
                                        await apiRequest("DELETE", `/api/career-data/${deleteConfirmation.endpoint}/${deleteConfirmation.itemId}`, {});
                                        toast({
                                            title: "Deleted",
                                            description: `The ${deleteConfirmation.itemType} has been deleted.`
                                        });
                                        refetchCareerData();
                                    }
                                    catch (error) {
                                        toast({
                                            title: "Error",
                                            description: `Failed to delete the ${deleteConfirmation.itemType}.`,
                                            variant: "destructive"
                                        });
                                    }
                                    finally {
                                        setDeleteConfirmation({ ...deleteConfirmation, open: false });
                                    }
                                } })] }), _jsx(TabsContent, { value: "subscription", className: "px-6 py-8", children: _jsx("div", { className: "space-y-6", children: _jsxs("div", { className: "rounded-lg bg-white shadow-sm p-6 border border-gray-200", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: "Subscription Details" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Manage your current subscription and billing information." })] }), _jsxs("div", { className: "border border-gray-200 rounded-lg p-6 mb-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full", children: "Current Plan" }), _jsx("h3", { className: "text-xl font-semibold mt-1", children: getPlanName(user.subscriptionPlan) })] }), _jsx(Badge, { variant: user.subscriptionStatus === "active"
                                                            ? "default"
                                                            : "outline", className: user.subscriptionStatus === "active"
                                                            ? "bg-green-500 text-white"
                                                            : user.subscriptionStatus === "past_due"
                                                                ? "bg-amber-500 text-white"
                                                                : user.subscriptionStatus === "cancelled"
                                                                    ? "border-amber-500 text-amber-500"
                                                                    : "border-gray-500 text-gray-500", children: user.subscriptionStatus === "active"
                                                            ? "Active"
                                                            : user.subscriptionStatus === "past_due"
                                                                ? "Past Due"
                                                                : user.subscriptionStatus === "cancelled"
                                                                    ? "Cancelled"
                                                                    : "Inactive" })] }), _jsxs("div", { className: "space-y-4", children: [user.subscriptionPlan !== "free" && (_jsxs(_Fragment, { children: [_jsxs("dl", { className: "grid grid-cols-2 gap-4 mt-4 text-sm", children: [_jsxs("div", { children: [_jsx("dt", { className: "text-gray-500", children: "Billing Period" }), _jsx("dd", { className: "font-medium capitalize", children: user.subscriptionCycle || "Monthly" })] }), _jsxs("div", { children: [_jsx("dt", { className: "text-gray-500", children: "Next Billing Date" }), _jsx("dd", { className: "font-medium", children: user.subscriptionExpiresAt
                                                                                    ? formatDate(new Date(user.subscriptionExpiresAt))
                                                                                    : "N/A" })] })] }), isSubscriptionActive && (_jsxs("div", { className: "pt-4 border-t border-gray-100", children: [_jsx(Button, { variant: "outline", className: "text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200", onClick: handleCancelSubscription, disabled: cancelSubscriptionMutation.isPending, children: cancelSubscriptionMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Processing..."] })) : ("Cancel Subscription") }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Your subscription will remain active until the end of your current billing period." })] }))] })), user.subscriptionPlan === "free" && (_jsxs("div", { className: "py-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "You're currently on the free plan with limited features." }), _jsx(Button, { className: "mt-4", onClick: () => {
                                                                    navigate("/pricing");
                                                                }, children: "Upgrade Now" })] }))] })] })] }) }) })] }), _jsx(LinkedInProfileFormModal, { open: linkedInProfileModal.open, onOpenChange: (open) => setLinkedInProfileModal({ ...linkedInProfileModal, open }), defaultValue: linkedInProfileModal.defaultValue, onSuccess: () => refetchCareerData() })] }));
}
