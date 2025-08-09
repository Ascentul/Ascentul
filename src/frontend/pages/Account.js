import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useUser } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
// Import UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { User, CreditCard, ShieldCheck, Edit, Building, GraduationCap, Trophy, BookOpen, Award, Languages, MapPin, CheckCircle, Calendar, AlertCircle, X, Plus } from 'lucide-react';
// Subscription Management Component
function SubscriptionManagement({ user }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('premium');
    const [selectedInterval, setSelectedInterval] = useState('monthly');
    // Fetch payment methods
    const { data: paymentMethods, isLoading: paymentMethodsLoading } = useQuery({
        queryKey: ['/api/payment-methods'],
        queryFn: async () => {
            const response = await apiRequest({ url: '/api/payment-methods' });
            return response;
        },
    });
    // Upgrade subscription mutation
    const upgradeSubscriptionMutation = useMutation({
        mutationFn: async ({ plan, interval }) => {
            const res = await apiRequest('POST', '/api/subscription/upgrade', { plan, interval });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to upgrade subscription');
            }
            return await res.json();
        },
        onSuccess: (data) => {
            toast({
                title: 'Subscription upgraded!',
                description: `Your subscription has been upgraded to ${selectedPlan}.`,
            });
            setUpgradeDialogOpen(false);
            // Refresh user data
            queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
        },
        onError: (error) => {
            toast({
                title: 'Upgrade failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
    // Cancel subscription mutation
    const cancelSubscriptionMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest('POST', '/api/subscription/cancel');
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to cancel subscription');
            }
            return await res.json();
        },
        onSuccess: () => {
            toast({
                title: 'Subscription cancelled',
                description: 'Your subscription has been cancelled successfully.',
            });
            setCancelDialogOpen(false);
            // Refresh user data
            queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
        },
        onError: (error) => {
            toast({
                title: 'Cancellation failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
    const handleUpgrade = () => {
        upgradeSubscriptionMutation.mutate({ plan: selectedPlan, interval: selectedInterval });
    };
    const handleCancel = () => {
        cancelSubscriptionMutation.mutate();
    };
    // Plan pricing information
    const planPricing = {
        premium: {
            monthly: { price: 15, label: '$15/month' },
            quarterly: { price: 30, label: '$30/quarter ($10/month)' },
            annual: { price: 72, label: '$72/year ($6/month)' },
        },
        university: {
            monthly: { price: 25, label: '$25/month' },
            quarterly: { price: 60, label: '$60/quarter ($20/month)' },
            annual: { price: 200, label: '$200/year ($16.67/month)' },
        },
    };
    const getStatusBadge = (plan, status) => {
        if (plan === 'free') {
            return _jsx(Badge, { variant: "outline", children: "Free Plan" });
        }
        const variant = status === 'active' ? 'default' : status === 'past_due' ? 'destructive' : 'secondary';
        const label = plan === 'premium' ? 'Premium' : plan === 'university' ? 'University' : plan;
        return (_jsxs(Badge, { variant: variant, className: "capitalize", children: [label, " - ", status.replace('_', ' ')] }));
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(CreditCard, { className: "h-5 w-5" }), "Current Subscription"] }), _jsx(CardDescription, { children: "Manage your subscription plan and billing" })] }), getStatusBadge(user.subscriptionPlan, user.subscriptionStatus)] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Plan" }), _jsx("p", { className: "font-medium capitalize", children: user.subscriptionPlan || 'Free' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Status" }), _jsx("p", { className: "font-medium capitalize", children: user.subscriptionStatus?.replace('_', ' ') || 'Active' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Billing Cycle" }), _jsx("p", { className: "font-medium capitalize", children: user.subscriptionCycle || 'N/A' })] })] }), _jsx(Separator, {}), _jsx("div", { className: "flex gap-3", children: user.subscriptionPlan === 'free' ? (_jsxs(Dialog, { open: upgradeDialogOpen, onOpenChange: setUpgradeDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Upgrade Plan"] }) }), _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Upgrade Your Subscription" }), _jsx(DialogDescription, { children: "Choose a plan that fits your needs and unlock premium features." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Select Plan" }), _jsxs(Select, { value: selectedPlan, onValueChange: (value) => setSelectedPlan(value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "premium", children: "Premium Plan" }), _jsx(SelectItem, { value: "university", children: "University Plan" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Billing Interval" }), _jsxs(Select, { value: selectedInterval, onValueChange: (value) => setSelectedInterval(value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsxs(SelectItem, { value: "monthly", children: ["Monthly - ", planPricing[selectedPlan].monthly.label] }), _jsxs(SelectItem, { value: "quarterly", children: ["Quarterly - ", planPricing[selectedPlan].quarterly.label] }), _jsxs(SelectItem, { value: "annual", children: ["Annual - ", planPricing[selectedPlan].annual.label] })] })] })] }), _jsxs("div", { className: "bg-muted p-3 rounded-lg", children: [_jsx("p", { className: "text-sm font-medium", children: "Selected Plan" }), _jsx("p", { className: "text-lg font-bold", children: planPricing[selectedPlan][selectedInterval].label })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setUpgradeDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleUpgrade, disabled: upgradeSubscriptionMutation.isPending, children: upgradeSubscriptionMutation.isPending ? 'Processing...' : 'Upgrade Now' })] })] })] })) : (_jsxs(_Fragment, { children: [_jsxs(Dialog, { open: upgradeDialogOpen, onOpenChange: setUpgradeDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", children: [_jsx(Edit, { className: "h-4 w-4 mr-2" }), "Change Plan"] }) }), _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Change Your Subscription" }), _jsx(DialogDescription, { children: "Update your current subscription plan." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Select Plan" }), _jsxs(Select, { value: selectedPlan, onValueChange: (value) => setSelectedPlan(value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "premium", children: "Premium Plan" }), _jsx(SelectItem, { value: "university", children: "University Plan" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Billing Interval" }), _jsxs(Select, { value: selectedInterval, onValueChange: (value) => setSelectedInterval(value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsxs(SelectItem, { value: "monthly", children: ["Monthly - ", planPricing[selectedPlan].monthly.label] }), _jsxs(SelectItem, { value: "quarterly", children: ["Quarterly - ", planPricing[selectedPlan].quarterly.label] }), _jsxs(SelectItem, { value: "annual", children: ["Annual - ", planPricing[selectedPlan].annual.label] })] })] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setUpgradeDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleUpgrade, disabled: upgradeSubscriptionMutation.isPending, children: upgradeSubscriptionMutation.isPending ? 'Processing...' : 'Update Plan' })] })] })] }), _jsxs(Dialog, { open: cancelDialogOpen, onOpenChange: setCancelDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "destructive", children: [_jsx(X, { className: "h-4 w-4 mr-2" }), "Cancel Subscription"] }) }), _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Cancel Subscription" }), _jsx(DialogDescription, { children: "Are you sure you want to cancel your subscription? You'll lose access to premium features." })] }), _jsxs("div", { className: "bg-destructive/10 p-3 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(AlertCircle, { className: "h-4 w-4 text-destructive" }), _jsx("p", { className: "text-sm font-medium", children: "This action cannot be undone" })] }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Your subscription will be cancelled immediately and you'll be moved to the free plan." })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setCancelDialogOpen(false), children: "Keep Subscription" }), _jsx(Button, { variant: "destructive", onClick: handleCancel, disabled: cancelSubscriptionMutation.isPending, children: cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel Subscription' })] })] })] })] })) })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(CreditCard, { className: "h-5 w-5" }), "Payment Methods"] }), _jsx(CardDescription, { children: "Manage your payment methods and billing information" })] }), _jsx(CardContent, { children: paymentMethodsLoading ? (_jsx("div", { className: "text-center py-4", children: _jsx("p", { className: "text-muted-foreground", children: "Loading payment methods..." }) })) : paymentMethods?.payment_methods?.length > 0 ? (_jsx("div", { className: "space-y-3", children: paymentMethods.payment_methods.map((method) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(CreditCard, { className: "h-4 w-4" }), _jsxs("div", { children: [_jsxs("p", { className: "font-medium", children: ["\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ", method.card?.last4] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [method.card?.brand?.toUpperCase(), " \u2022 Expires ", method.card?.exp_month, "/", method.card?.exp_year] })] })] }), method.id === paymentMethods.default_payment_method && (_jsx(Badge, { variant: "secondary", children: "Default" }))] }, method.id))) })) : (_jsxs("div", { className: "text-center py-6", children: [_jsx(CreditCard, { className: "h-8 w-8 mx-auto text-muted-foreground mb-2" }), _jsx("p", { className: "text-muted-foreground", children: "No payment methods added" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Add a payment method to manage your subscription" }), _jsxs(Button, { variant: "outline", className: "mt-3", children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Add Payment Method"] })] })) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-5 w-5" }), "Billing History"] }), _jsx(CardDescription, { children: "View your past invoices and payments" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "text-center py-6", children: [_jsx(Calendar, { className: "h-8 w-8 mx-auto text-muted-foreground mb-2" }), _jsx("p", { className: "text-muted-foreground", children: "No billing history available" }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Your billing history will appear here after your first payment" })] }) })] })] }));
}
export default function Account() {
    const { user } = useUser();
    const { toast } = useToast();
    const [location] = useLocation();
    // Get the active tab from URL query parameter
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        return tabParam === 'career' || tabParam === 'subscription' || tabParam === 'security'
            ? tabParam
            : 'profile';
    });
    // Listen for URL changes and update active tab
    useEffect(() => {
        const handleUrlChange = () => {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam === 'career' || tabParam === 'subscription' || tabParam === 'security') {
                setActiveTab(tabParam);
            }
        };
        // Call immediately to handle current URL
        handleUrlChange();
        // Add event listener for URL changes not captured by useLocation
        window.addEventListener('popstate', handleUrlChange);
        return () => {
            window.removeEventListener('popstate', handleUrlChange);
        };
    }, [location]);
    // Handle section editing for career profile sections
    const handleEditSection = (sectionId) => {
        toast({
            title: "Edit Section",
            description: `Editing ${sectionId} section. This feature is coming soon.`,
            variant: "default",
        });
    };
    // Profile completion data
    const profileSections = [
        { id: 'basic-info', title: 'Basic Information', completed: true },
        { id: 'work-history', title: 'Work History', completed: false },
        { id: 'education', title: 'Education', completed: false },
        { id: 'skills', title: 'Skills', completed: false },
        { id: 'certifications', title: 'Certifications', completed: false },
        { id: 'languages', title: 'Languages', completed: false },
        { id: 'career-summary', title: 'Career Summary', completed: false },
        { id: 'location-preferences', title: 'Location Preferences', completed: false },
    ];
    const completionPercentage = (profileSections.filter(s => s.completed).length / profileSections.length) * 100;
    if (!user)
        return null;
    // Function to update URL when tab changes
    const handleTabChange = (value) => {
        setActiveTab(value);
        // Update URL with new tab parameter without page reload
        const url = new URL(window.location.href);
        if (value !== 'profile') {
            url.searchParams.set('tab', value);
        }
        else {
            url.searchParams.delete('tab');
        }
        window.history.pushState({}, '', url);
    };
    return (_jsxs("div", { className: "container max-w-5xl py-8", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Account Settings" }), _jsxs(Tabs, { defaultValue: activeTab, value: activeTab, onValueChange: handleTabChange, className: "w-full", children: [_jsxs(TabsList, { className: "mb-6", children: [_jsxs(TabsTrigger, { value: "profile", className: "flex items-center", children: [_jsx(User, { className: "mr-2 h-4 w-4" }), "Profile"] }), _jsxs(TabsTrigger, { value: "career", className: "flex items-center", children: [_jsx(Building, { className: "mr-2 h-4 w-4" }), "Career"] }), _jsxs(TabsTrigger, { value: "subscription", className: "flex items-center", children: [_jsx(CreditCard, { className: "mr-2 h-4 w-4" }), "Subscription"] }), _jsxs(TabsTrigger, { value: "security", className: "flex items-center", children: [_jsx(ShieldCheck, { className: "mr-2 h-4 w-4" }), "Security"] })] }), _jsxs(TabsContent, { value: "profile", className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx(CardTitle, { children: "Profile Information" }), _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Edit, { className: "mr-2 h-4 w-4" }), "Edit Profile"] })] }), _jsxs(CardContent, { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Name" }), _jsx("p", { children: user.name })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Email" }), _jsx("p", { children: user.email })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Username" }), _jsx("p", { children: user.username })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Account Created" }), _jsx("p", { children: "March 15, 2025" })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "User Type" }), _jsx("p", { className: "capitalize", children: user.userType ? user.userType.replace('_', ' ') : 'Standard' })] })] })] }), _jsxs(Card, { className: "mt-6", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsx(CardTitle, { children: "Profile Completion" }), _jsx(CardDescription, { children: "Complete your career profile to maximize your opportunities" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "mb-2 flex items-center justify-between", children: [_jsxs("span", { className: "text-sm font-medium", children: [Math.round(completionPercentage), "% Complete"] }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [profileSections.filter(section => section.completed).length, "/", profileSections.length, " Sections"] })] }), _jsx(Progress, { value: completionPercentage, className: "h-2 mb-4" })] })] }), _jsxs(Card, { className: "mt-6", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Building, { className: "h-5 w-5 mr-2 text-primary" }), _jsx(CardTitle, { children: "Work History" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleEditSection('work-history'), children: [_jsx(Edit, { className: "h-4 w-4 mr-1" }), " Edit"] })] }), _jsx(CardDescription, { children: "Your professional experience" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "text-center py-6 text-muted-foreground", children: [_jsx("p", { children: "No work history added yet" }), _jsx("p", { className: "text-sm mt-2", children: "Add your professional experience to showcase your career progression" })] }) })] }), _jsxs(Card, { className: "mt-6", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(GraduationCap, { className: "h-5 w-5 mr-2 text-primary" }), _jsx(CardTitle, { children: "Education" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleEditSection('education'), children: [_jsx(Edit, { className: "h-4 w-4 mr-1" }), " Edit"] })] }), _jsx(CardDescription, { children: "Your educational background" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "text-center py-6 text-muted-foreground", children: [_jsx("p", { children: "No education history added yet" }), _jsx("p", { className: "text-sm mt-2", children: "Add your degrees, certifications, and educational achievements" })] }) })] }), _jsxs(Card, { className: "mt-6", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Award, { className: "h-5 w-5 mr-2 text-primary" }), _jsx(CardTitle, { children: "Skills" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleEditSection('skills'), children: [_jsx(Edit, { className: "h-4 w-4 mr-1" }), " Edit"] })] }), _jsx(CardDescription, { children: "Your professional skills and expertise" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "text-center py-6 text-muted-foreground", children: [_jsx("p", { children: "No skills added yet" }), _jsx("p", { className: "text-sm mt-2", children: "Add your technical and soft skills to showcase your expertise" })] }) })] }), _jsxs(Card, { className: "mt-6", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Trophy, { className: "h-5 w-5 mr-2 text-primary" }), _jsx(CardTitle, { children: "Certifications" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleEditSection('certifications'), children: [_jsx(Edit, { className: "h-4 w-4 mr-1" }), " Edit"] })] }), _jsx(CardDescription, { children: "Your professional certifications and credentials" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "text-center py-6 text-muted-foreground", children: [_jsx("p", { children: "No certifications added yet" }), _jsx("p", { className: "text-sm mt-2", children: "Add your professional certifications and credentials" })] }) })] }), _jsxs(Card, { className: "mt-6", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Languages, { className: "h-5 w-5 mr-2 text-primary" }), _jsx(CardTitle, { children: "Languages" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleEditSection('languages'), children: [_jsx(Edit, { className: "h-4 w-4 mr-1" }), " Edit"] })] }), _jsx(CardDescription, { children: "Languages you speak" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "text-center py-6 text-muted-foreground", children: [_jsx("p", { children: "No languages added yet" }), _jsx("p", { className: "text-sm mt-2", children: "Add languages you speak and your proficiency level" })] }) })] }), _jsxs(Card, { className: "mt-6", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(BookOpen, { className: "h-5 w-5 mr-2 text-primary" }), _jsx(CardTitle, { children: "Career Summary" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleEditSection('career-summary'), children: [_jsx(Edit, { className: "h-4 w-4 mr-1" }), " Edit"] })] }), _jsx(CardDescription, { children: "A brief overview of your professional experience" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "text-center py-6 text-muted-foreground", children: [_jsx("p", { children: "No career summary added yet" }), _jsx("p", { className: "text-sm mt-2", children: "Add a brief overview of your career and professional aspirations" })] }) })] }), _jsxs(Card, { className: "mt-6", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(MapPin, { className: "h-5 w-5 mr-2 text-primary" }), _jsx(CardTitle, { children: "Location Preferences" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleEditSection('location-preferences'), children: [_jsx(Edit, { className: "h-4 w-4 mr-1" }), " Edit"] })] }), _jsx(CardDescription, { children: "Your geographical preferences for work" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "text-center py-6 text-muted-foreground", children: [_jsx("p", { children: "No location preferences added yet" }), _jsx("p", { className: "text-sm mt-2", children: "Add your preferred work locations and remote work preferences" })] }) })] })] }), _jsx(TabsContent, { value: "subscription", className: "space-y-6", children: _jsx(SubscriptionManagement, { user: user }) }), _jsx(TabsContent, { value: "career", className: "space-y-6", children: _jsxs(Card, { className: "mt-6", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsx(CardTitle, { children: "Career Profile" }), _jsx(CardDescription, { children: "Complete your career profile to maximize your opportunities" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "mb-2 flex items-center justify-between", children: [_jsxs("span", { className: "text-sm font-medium", children: [Math.round(completionPercentage), "% Complete"] }), _jsxs("span", { className: "text-sm text-muted-foreground", children: [profileSections.filter(section => section.completed).length, "/", profileSections.length, " Sections"] })] }), _jsx(Progress, { value: completionPercentage, className: "h-2 mb-4" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-6", children: profileSections.map((section) => (_jsx(Card, { className: `border ${section.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'}`, children: _jsx(CardHeader, { className: "p-4 pb-2", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx(CardTitle, { className: "text-base", children: section.title }), section.completed ? (_jsx(CheckCircle, { className: "h-5 w-5 text-green-600" })) : (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleEditSection(section.id), children: [_jsx(Edit, { className: "h-4 w-4 mr-1" }), " Add"] }))] }) }) }, section.id))) })] })] }) }), _jsx(TabsContent, { value: "security", className: "space-y-6", children: _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Security Settings" }), _jsx(CardDescription, { children: "Manage your security settings" })] }), _jsx(CardContent, { children: _jsx("p", { children: "This section is coming soon." }) })] }) })] })] }));
}
