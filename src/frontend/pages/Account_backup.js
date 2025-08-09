import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useUser, useChangeEmail, useChangePassword } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements, AddressElement } from '@stripe/react-stripe-js';
// Import UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { User, CreditCard, ShieldCheck, Edit, CheckCircle2, Loader2, Sparkles, CreditCardIcon, RotateCcw } from 'lucide-react';
import EmailChangeForm from '@/components/EmailChangeForm';
import { z } from 'zod';
// Load Stripe outside of component to avoid recreating on renders
// Make sure we're using the public key (starts with pk_)
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey || !stripePublicKey.startsWith('pk_')) {
    console.error('Missing or invalid Stripe public key. Make sure VITE_STRIPE_PUBLIC_KEY is set correctly.');
}
const stripePromise = loadStripe(stripePublicKey);
// Password Change Form schema and type
const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
// Password Change Form component
function PasswordChangeForm({ onSubmit, isPending }) {
    const form = useForm({
        resolver: zodResolver(passwordChangeSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });
    return (_jsx(Form, { ...form, children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4 py-2", children: [_jsx(FormField, { control: form.control, name: "currentPassword", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Current Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: "Enter your current password", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "newPassword", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "New Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: "Enter your new password", ...field }) }), _jsx(FormDescription, { children: "Password must be at least 8 characters and include uppercase, lowercase, and a number." }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "confirmPassword", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Confirm New Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: "Confirm your new password", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(DialogFooter, { className: "mt-6", children: _jsx(Button, { type: "submit", disabled: isPending, children: isPending ? _jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), " Changing Password..."] }) : "Change Password" }) })] }) }));
}
// Payment Method Form Component
function PaymentMethodForm({ onSuccess, onCancel }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) {
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            // Use the card Element to tokenize payment details
            const { error: submitError } = await elements.submit();
            if (submitError) {
                throw new Error(submitError.message);
            }
            // Confirm the SetupIntent
            const { error: confirmError } = await stripe.confirmSetup({
                elements,
                confirmParams: {
                    return_url: window.location.origin + '/account',
                },
                redirect: 'if_required',
            });
            if (confirmError) {
                throw new Error(confirmError.message);
            }
            // If we got here, then setup was successful
            onSuccess();
        }
        catch (err) {
            console.error('Error updating payment method:', err);
            setError(err.message || 'An error occurred while updating your payment method');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Card Details" }), _jsx(PaymentElement, {})] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Billing Address" }), _jsx(AddressElement, { options: { mode: 'billing' } })] }), error && (_jsx("div", { className: "rounded-md bg-destructive/10 p-3 text-sm text-destructive", children: error })), _jsxs("div", { className: "flex justify-end space-x-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: onCancel, disabled: isSubmitting, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: !stripe || !elements || isSubmitting, children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), " Processing..."] })) : ('Save Payment Method') })] })] }) }));
}
export default function Account() {
    const { user, logout, updateProfile } = useUser();
    const { toast } = useToast();
    // State for dialogs
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isManagingSubscription, setIsManagingSubscription] = useState(false);
    const [isManagingPaymentMethods, setIsManagingPaymentMethods] = useState(false);
    const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
    const [isUpgradingPlan, setIsUpgradingPlan] = useState(false);
    const [isChangingEmail, setIsChangingEmail] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly');
    // State for Career Profile sections completion tracking
    const [profileSections, setProfileSections] = useState([
        { id: 'work-history', title: 'Work History', icon: 'Building', completed: false },
        { id: 'education', title: 'Education', icon: 'GraduationCap', completed: false },
        { id: 'achievements', title: 'Achievements', icon: 'Trophy', completed: false },
        { id: 'skills', title: 'Skills', icon: 'BookOpen', completed: false },
        { id: 'certifications', title: 'Certifications', icon: 'Award', completed: false },
        { id: 'languages', title: 'Languages', icon: 'Languages', completed: false },
        { id: 'summary', title: 'Career Summary', icon: 'Users', completed: false },
        { id: 'location', title: 'Location Preferences', icon: 'MapPin', completed: false },
    ]);
    const [completionPercentage, setCompletionPercentage] = useState(0);
    // State for Stripe payment elements
    const [isLoading, setIsLoading] = useState(false);
    const [setupIntentClientSecret, setSetupIntentClientSecret] = useState(null);
    const [paymentMethodInfo, setPaymentMethodInfo] = useState(null);
    // Email and password change mutations using hooks from useUserData
    const changeEmailMutation = useChangeEmail();
    const changePasswordMutation = useChangePassword();
    // Fetch current payment method and calculate profile completion
    useEffect(() => {
        if (user && user.subscriptionPlan !== 'free') {
            fetchPaymentMethodInfo();
        }
        // Calculate profile completion percentage
        const completedSections = profileSections.filter(section => section.completed).length;
        const percentage = (completedSections / profileSections.length) * 100;
        setCompletionPercentage(percentage);
        // In a real implementation, fetch the profile sections data from the server
        // and update the completion status based on that
    }, [user, profileSections]);
    // Function to fetch the user's current payment method info
    const fetchPaymentMethodInfo = async () => {
        try {
            const response = await fetch('/api/payments/payment-methods', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch payment methods');
            }
            const data = await response.json();
            if (data?.default_payment_method) {
                setPaymentMethodInfo({
                    last4: data.default_payment_method.card.last4,
                    brand: data.default_payment_method.card.brand,
                    exp_month: data.default_payment_method.card.exp_month,
                    exp_year: data.default_payment_method.card.exp_year
                });
            }
        }
        catch (error) {
            console.error('Error fetching payment methods:', error);
        }
    };
    // Helper function to get pretty plan name
    const getPlanName = (plan) => {
        if (!plan)
            return 'Free Plan';
        switch (plan) {
            case 'free':
                return 'Free Plan';
            case 'premium':
                return 'Pro Plan';
            case 'pro_monthly':
                return 'Pro Plan (Monthly)';
            case 'pro_annual':
                return 'Pro Plan (Annual)';
            case 'university':
                return 'University License';
            default:
                return plan.replace('_', ' ');
        }
    };
    // Subscription management functions
    const upgradeSubscription = async (cycle) => {
        try {
            // Close dialog if open
            setIsManagingSubscription(false);
            setIsUpgradingPlan(false);
            // Use selected billing cycle or default to monthly
            const selectedCycle = cycle || billingCycle;
            // Create subscription with the selected interval
            const response = await fetch('/api/payments/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    plan: 'premium',
                    interval: selectedCycle,
                    email: user?.email
                })
            });
            if (!response.ok) {
                throw new Error('Failed to create subscription');
            }
            const { clientSecret } = await response.json();
            // Redirect to checkout page with client secret
            window.location.href = `/checkout?client_secret=${clientSecret}`;
        }
        catch (error) {
            console.error('Error upgrading subscription:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to upgrade subscription",
                variant: "destructive"
            });
        }
    };
    const cancelSubscription = async () => {
        try {
            const response = await fetch('/api/payments/cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id
                })
            });
            if (!response.ok) {
                throw new Error('Failed to cancel subscription');
            }
            setIsCancellingSubscription(false);
            toast({
                title: "Subscription Cancelled",
                description: "Your subscription has been cancelled successfully.",
                variant: "default"
            });
            // Reload the page to reflect changes
            window.location.reload();
        }
        catch (error) {
            console.error('Error cancelling subscription:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to cancel subscription",
                variant: "destructive"
            });
        }
    };
    // Function to initialize the Stripe setup intent for managing payment methods
    const initializePaymentMethodsUpdate = async () => {
        try {
            setIsLoading(true);
            // Get a setup intent from the server
            const response = await fetch('/api/payments/create-setup-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id
                })
            });
            if (!response.ok) {
                throw new Error('Failed to initialize payment method update');
            }
            const { clientSecret } = await response.json();
            setSetupIntentClientSecret(clientSecret);
        }
        catch (error) {
            console.error('Error initializing payment method update:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to initialize payment method management",
                variant: "destructive"
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const profileForm = useForm({
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            username: user?.username || '',
        },
    });
    const handleLogout = async () => {
        try {
            await fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            window.location.href = '/sign-in';
        }
        catch (error) {
            console.error("Logout failed:", error);
            toast({
                title: "Logout failed",
                description: "There was an error logging out. Please try again.",
                variant: "destructive",
            });
        }
    };
    const handleEditProfile = () => {
        // Reset form with current user values
        profileForm.reset({
            name: user?.name || '',
            email: user?.email || '',
            username: user?.username || '',
        });
        setIsEditingProfile(true);
    };
    const handleProfileSubmit = async (data) => {
        try {
            await updateProfile(data);
            setIsEditingProfile(false);
            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
                variant: "default",
            });
        }
        catch (error) {
            toast({
                title: "Failed to update profile",
                description: error.message || "An error occurred while updating your profile.",
                variant: "destructive",
            });
        }
    };
    // Format dates helper function
    const formatDate = (date) => {
        if (!date)
            return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    // Function to handle edit for a career profile section
    const handleEditSection = (sectionId) => {
        // You would implement section-specific edit logic here
        toast({
            title: "Edit Section",
            description: `Editing ${sectionId} section`,
        });
    };
    if (!user) {
        return _jsx("div", { className: "p-8 text-center", children: "Loading user information..." });
    }
    return (_jsxs("div", { className: "container max-w-5xl py-8", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "Account Settings" }), _jsxs(Tabs, { defaultValue: "profile", className: "w-full", children: [_jsxs(TabsList, { className: "mb-6", children: [_jsxs(TabsTrigger, { value: "profile", className: "flex items-center", children: [_jsx(User, { className: "mr-2 h-4 w-4" }), "Profile"] }), _jsxs(TabsTrigger, { value: "subscription", className: "flex items-center", children: [_jsx(CreditCard, { className: "mr-2 h-4 w-4" }), "Subscription"] }), _jsxs(TabsTrigger, { value: "security", className: "flex items-center", children: [_jsx(ShieldCheck, { className: "mr-2 h-4 w-4" }), "Security"] })] }), _jsxs(TabsContent, { value: "profile", className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between", children: [_jsx(CardTitle, { children: "Profile Information" }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleEditProfile, children: [_jsx(Edit, { className: "mr-2 h-4 w-4" }), "Edit Profile"] })] }), _jsxs(CardContent, { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Name" }), _jsx("p", { children: user.name })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Email" }), _jsx("p", { children: user.email })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Username" }), _jsx("p", { children: user.username })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Account Created" }), _jsx("p", { children: "March 15, 2025" })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "User Type" }), _jsx("p", { className: "capitalize", children: user.userType ? user.userType.replace('_', ' ') : 'Standard' })] })] })] }), _jsx(Dialog, { open: isEditingProfile, onOpenChange: setIsEditingProfile, children: _jsxs(DialogContent, { className: "sm:max-w-[425px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit Profile" }), _jsx(DialogDescription, { children: "Make changes to your profile information here." })] }), _jsx(Form, { ...profileForm, children: _jsxs("form", { onSubmit: profileForm.handleSubmit(handleProfileSubmit), className: "space-y-4 py-4", children: [_jsx(FormField, { control: profileForm.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Your name", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: profileForm.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { type: "email", placeholder: "Your email", ...field }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: profileForm.control, name: "username", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Username" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Your username", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs(DialogFooter, { className: "mt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setIsEditingProfile(false), children: "Cancel" }), _jsx(Button, { type: "submit", children: "Save Changes" })] })] }) })] }) }), _jsxs(Card, { className: "mt-6", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Theme Settings" }), _jsx(CardDescription, { children: "Customize the appearance of your application." })] }), _jsx(CardContent, { className: "space-y-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-2", children: "Color Mode" }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs(Button, { variant: "outline", className: `flex flex-col items-center justify-center h-24 ${user?.theme?.appearance === 'light' ? 'border-primary' : ''}`, onClick: () => updateTheme({ appearance: 'light' }), children: [_jsx("div", { className: "h-12 w-12 bg-background border rounded-full flex items-center justify-center mb-2", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-foreground", children: [_jsx("circle", { cx: "12", cy: "12", r: "4" }), _jsx("path", { d: "M12 8a2 2 0 1 0 4 0 4 4 0 0 0-8 0 6 6 0 0 0 12 0c0 8-12 8-12 0a8 8 0 0 0 16 0c0 12-16 12-16 0" })] }) }), _jsx("span", { children: "Light" })] }), _jsxs(Button, { variant: "outline", className: `flex flex-col items-center justify-center h-24 ${user?.theme?.appearance === 'dark' ? 'border-primary' : ''}`, onClick: () => updateTheme({ appearance: 'dark' }), children: [_jsx("div", { className: "h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-2", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" }) }) }), _jsx("span", { children: "Dark" })] }), _jsxs(Button, { variant: "outline", className: `flex flex-col items-center justify-center h-24 ${user?.theme?.appearance === 'system' ? 'border-primary' : ''}`, onClick: () => updateTheme({ appearance: 'system' }), children: [_jsx("div", { className: "h-12 w-12 bg-gradient-to-br from-background to-zinc-900 border rounded-full flex items-center justify-center mb-2", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { width: "18", height: "14", x: "3", y: "3", rx: "2" }), _jsx("path", { d: "M7 20h10" }), _jsx("path", { d: "M9 16v4" }), _jsx("path", { d: "M15 16v4" })] }) }), _jsx("span", { children: "System" })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-2", children: "Primary Color" }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#0C29AB] hover:ring-2 hover:ring-offset-2 hover:ring-[#0C29AB]/50", style: { backgroundColor: "#0C29AB" }, onClick: () => {
                                                                        setCustomColor("#0C29AB");
                                                                        updateTheme({ primary: "#0C29AB" });
                                                                        applyTheme();
                                                                    } }), _jsx("div", { className: "w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#7C3AED] hover:ring-2 hover:ring-offset-2 hover:ring-[#7C3AED]/50", style: { backgroundColor: "#7C3AED" }, onClick: () => {
                                                                        setCustomColor("#7C3AED");
                                                                        updateTheme({ primary: "#7C3AED" });
                                                                        applyTheme();
                                                                    } }), _jsx("div", { className: "w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#10B981] hover:ring-2 hover:ring-offset-2 hover:ring-[#10B981]/50", style: { backgroundColor: "#10B981" }, onClick: () => {
                                                                        setCustomColor("#10B981");
                                                                        updateTheme({ primary: "#10B981" });
                                                                        applyTheme();
                                                                    } }), _jsx("div", { className: "w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#F97316] hover:ring-2 hover:ring-offset-2 hover:ring-[#F97316]/50", style: { backgroundColor: "#F97316" }, onClick: () => {
                                                                        setCustomColor("#F97316");
                                                                        updateTheme({ primary: "#F97316" });
                                                                        applyTheme();
                                                                    } }), _jsx("div", { className: "w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#EF4444] hover:ring-2 hover:ring-offset-2 hover:ring-[#EF4444]/50", style: { backgroundColor: "#EF4444" }, onClick: () => {
                                                                        setCustomColor("#EF4444");
                                                                        updateTheme({ primary: "#EF4444" });
                                                                        applyTheme();
                                                                    } }), _jsx("div", { className: "w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#6366F1] hover:ring-2 hover:ring-offset-2 hover:ring-[#6366F1]/50", style: { backgroundColor: "#6366F1" }, onClick: () => {
                                                                        setCustomColor("#6366F1");
                                                                        updateTheme({ primary: "#6366F1" });
                                                                        applyTheme();
                                                                    } }), _jsx("div", { className: "w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#2563EB] hover:ring-2 hover:ring-offset-2 hover:ring-[#2563EB]/50", style: { backgroundColor: "#2563EB" }, onClick: () => {
                                                                        setCustomColor("#2563EB");
                                                                        updateTheme({ primary: "#2563EB" });
                                                                        applyTheme();
                                                                    } }), _jsx("div", { className: "w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#0891B2] hover:ring-2 hover:ring-offset-2 hover:ring-[#0891B2]/50", style: { backgroundColor: "#0891B2" }, onClick: () => {
                                                                        setCustomColor("#0891B2");
                                                                        updateTheme({ primary: "#0891B2" });
                                                                        applyTheme();
                                                                    } }), _jsxs("label", { htmlFor: "custom-color", className: "w-8 h-8 rounded-full border border-dashed border-input flex items-center justify-center cursor-pointer hover:bg-muted", children: [_jsx(Palette, { className: "h-4 w-4" }), _jsx("input", { type: "color", id: "custom-color", className: "sr-only", value: customColor, onChange: (e) => {
                                                                                const color = e.target.value;
                                                                                setCustomColor(color);
                                                                                updateTheme({ primary: color });
                                                                                applyTheme();
                                                                            } })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-2", children: "Variant" }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs(Button, { variant: "outline", className: `flex flex-col items-center justify-center h-24 ${user?.theme?.variant === 'professional' ? 'border-primary' : ''}`, onClick: () => {
                                                                        updateTheme({ variant: 'professional' });
                                                                        applyTheme();
                                                                    }, children: [_jsx("div", { className: "h-12 w-12 border rounded-md flex items-center justify-center mb-2 bg-gradient-to-r from-primary/20 to-primary/10", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M20 7h-3a2 2 0 0 1-2-2V2" }), _jsx("path", { d: "M7 2v4a2 2 0 0 1-2 2H2" }), _jsx("path", { d: "M20 17h-3a2 2 0 0 0-2 2v3" }), _jsx("path", { d: "M2 17h3a2 2 0 0 1 2 2v3" }), _jsx("rect", { width: "9", height: "9", x: "7.5", y: "7.5", rx: "1" })] }) }), _jsx("span", { children: "Professional" })] }), _jsxs(Button, { variant: "outline", className: `flex flex-col items-center justify-center h-24 ${user?.theme?.variant === 'tint' ? 'border-primary' : ''}`, onClick: () => {
                                                                        updateTheme({ variant: 'tint' });
                                                                        applyTheme();
                                                                    }, children: [_jsx("div", { className: "h-12 w-12 border rounded-md flex items-center justify-center mb-2 bg-gradient-to-br from-primary/30 to-primary/10", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" }), _jsx("path", { d: "m19 9-2 2-2-2" }), _jsx("path", { d: "m5 9 2 2 2-2" }), _jsx("path", { d: "m9 19 2-2 2 2" }), _jsx("path", { d: "m9 5 2 2 2-2" })] }) }), _jsx("span", { children: "Tint" })] }), _jsxs(Button, { variant: "outline", className: `flex flex-col items-center justify-center h-24 ${user?.theme?.variant === 'vibrant' ? 'border-primary' : ''}`, onClick: () => {
                                                                        updateTheme({ variant: 'vibrant' });
                                                                        applyTheme();
                                                                    }, children: [_jsx("div", { className: "h-12 w-12 border rounded-md flex items-center justify-center mb-2 bg-gradient-to-tr from-primary/90 to-primary/30", children: _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("circle", { cx: "13.5", cy: "6.5", r: "2.5" }), _jsx("circle", { cx: "19", cy: "17", r: "3" }), _jsx("circle", { cx: "6", cy: "12", r: "4" })] }) }), _jsx("span", { children: "Vibrant" })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-2", children: "Border Radius" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-3 gap-2 mb-4", children: [_jsxs(Button, { variant: "outline", className: `flex flex-col items-center justify-center h-24 ${user?.theme?.radius === 0 ? 'border-primary' : ''}`, onClick: () => {
                                                                                updateTheme({ radius: 0 });
                                                                                applyTheme();
                                                                            }, children: [_jsx("div", { className: "h-12 w-12 border rounded-none flex items-center justify-center mb-2", children: _jsx("span", { className: "text-xs", children: "0px" }) }), _jsx("span", { children: "None" })] }), _jsxs(Button, { variant: "outline", className: `flex flex-col items-center justify-center h-24 ${user?.theme?.radius === 0.5 ? 'border-primary' : ''}`, onClick: () => {
                                                                                updateTheme({ radius: 0.5 });
                                                                                applyTheme();
                                                                            }, children: [_jsx("div", { className: "h-12 w-12 border rounded-sm flex items-center justify-center mb-2", children: _jsx("span", { className: "text-xs", children: "0.5rem" }) }), _jsx("span", { children: "Small" })] }), _jsxs(Button, { variant: "outline", className: `flex flex-col items-center justify-center h-24 ${user?.theme?.radius === 1 ? 'border-primary' : ''}`, onClick: () => {
                                                                                updateTheme({ radius: 1 });
                                                                                applyTheme();
                                                                            }, children: [_jsx("div", { className: "h-12 w-12 border rounded-md flex items-center justify-center mb-2", children: _jsx("span", { className: "text-xs", children: "1rem" }) }), _jsx("span", { children: "Medium" })] })] }), _jsx(Slider, { defaultValue: [user?.theme?.radius || 0.5], min: 0, max: 1.5, step: 0.1, onValueChange: (value) => {
                                                                        updateTheme({ radius: value[0] });
                                                                        applyTheme();
                                                                    } })] })] })] }) }), _jsxs(CardFooter, { className: "border-t pt-6", children: [_jsxs(Button, { onClick: () => {
                                                    resetTheme();
                                                    applyTheme();
                                                }, variant: "outline", className: "mr-2", children: [_jsx(RotateCcw, { className: "h-4 w-4 mr-2" }), "Reset to Defaults"] }), _jsx(Button, { onClick: () => applyTheme(), disabled: isUpdatingTheme, children: isUpdatingTheme ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Updating..."] })) : ('Apply Changes') })] })] })] }), _jsxs(TabsContent, { value: "subscription", className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Subscription Details" }), user.subscriptionPlan === 'free' && (_jsx("div", { className: "flex justify-end", children: _jsxs(Button, { variant: "default", size: "sm", onClick: () => setIsUpgradingPlan(true), className: "mt-2", children: [_jsx(Sparkles, { className: "mr-2 h-4 w-4" }), "Upgrade Plan"] }) }))] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Current Plan" }), _jsx("p", { className: "font-medium", children: getPlanName(user.subscriptionPlan) })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Status" }), _jsx("p", { className: "capitalize", children: user.subscriptionStatus ?
                                                                    (user.subscriptionStatus === 'active' ?
                                                                        _jsxs("span", { className: "flex items-center text-green-600 font-medium", children: [_jsx(CheckCircle2, { className: "h-4 w-4 mr-1" }), " Active"] }) :
                                                                        user.subscriptionStatus.replace('_', ' ')) :
                                                                    _jsx("span", { className: "text-gray-500", children: "Free" }) })] }), user.subscriptionPlan !== 'free' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: "Billing Cycle" }), _jsx("p", { className: "capitalize", children: user.subscriptionCycle || 'Monthly' })] }), user.subscriptionExpiresAt && (_jsxs("div", { children: [_jsx("h3", { className: "font-medium text-sm text-muted-foreground", children: user.subscriptionStatus === 'active' ? 'Next Billing Date' : 'Expires On' }), _jsx("p", { children: formatDate(user.subscriptionExpiresAt) })] }))] }))] }), user.subscriptionPlan === 'free' && (_jsxs("div", { className: "mt-6 p-4 bg-muted/50 rounded-md", children: [_jsx("h3", { className: "font-medium mb-2", children: "Free Plan Features" }), _jsxs("ul", { className: "space-y-1 text-sm", children: [_jsxs("li", { className: "flex items-center", children: [_jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " Basic resume builder"] }), _jsxs("li", { className: "flex items-center", children: [_jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " Limited interview practice"] }), _jsxs("li", { className: "flex items-center", children: [_jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " Work history tracking"] })] }), _jsx(Button, { variant: "default", size: "sm", className: "mt-4", onClick: () => upgradeSubscription(), children: "Upgrade to Pro" })] })), user.subscriptionPlan === 'premium' && (_jsxs("div", { className: "mt-6 p-4 bg-muted/50 rounded-md", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h3", { className: "font-medium", children: "Your Pro Features" }), _jsx("div", { className: "flex space-x-2", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => setIsManagingSubscription(true), children: "Manage Subscription" }) })] }), _jsxs("ul", { className: "space-y-1 text-sm", children: [_jsxs("li", { className: "flex items-center", children: [_jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " Advanced resume builder"] }), _jsxs("li", { className: "flex items-center", children: [_jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " Unlimited interview practice"] }), _jsxs("li", { className: "flex items-center", children: [_jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " AI career coach"] }), _jsxs("li", { className: "flex items-center", children: [_jsx(CheckCircle2, { className: "h-4 w-4 mr-2 text-green-500" }), " Cover letter generator"] })] })] }))] }), user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active' && (_jsx(CardFooter, { className: "border-t pt-6 flex flex-col items-stretch", children: _jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: "Subscription Management" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Need to make changes to your billing?" })] }), _jsx(Button, { variant: "default", size: "sm", onClick: () => setIsManagingPaymentMethods(true), children: "Manage Payment Methods" })] }) }))] }), _jsx(Dialog, { open: isManagingSubscription, onOpenChange: setIsManagingSubscription, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Subscription Management" }), _jsx(DialogDescription, { children: "Manage your subscription settings and payment methods." })] }), _jsxs("div", { className: "py-4 space-y-6", children: [_jsxs("div", { className: "rounded-md border p-4", children: [_jsx("h3", { className: "font-medium mb-2 text-lg", children: "Current Subscription" }), _jsxs("div", { className: "grid grid-cols-2 gap-y-3 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Plan" }), _jsx("p", { className: "font-medium", children: getPlanName(user.subscriptionPlan) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Status" }), _jsxs("p", { className: "font-medium flex items-center", children: [user.subscriptionStatus === 'active' && (_jsx(CheckCircle2, { className: "h-4 w-4 mr-1 text-green-500" })), user.subscriptionStatus ? user.subscriptionStatus.replace('_', ' ') : 'Free'] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Billing Cycle" }), _jsxs("p", { className: "font-medium", children: [user.subscriptionCycle === 'monthly' && 'Monthly', user.subscriptionCycle === 'quarterly' && 'Quarterly', user.subscriptionCycle === 'annual' && 'Annual', !user.subscriptionCycle && 'N/A'] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: "Next Billing Date" }), _jsx("p", { className: "font-medium", children: formatDate(user.subscriptionExpiresAt) })] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "font-medium text-lg", children: "Plan Actions" }), _jsx("div", { className: "flex flex-col gap-3", children: user.subscriptionPlan === 'free' ? (_jsx(Button, { variant: "default", onClick: () => {
                                                                    setIsManagingSubscription(false);
                                                                    setIsUpgradingPlan(true);
                                                                }, children: "Upgrade to Pro" })) : (_jsx(Button, { variant: "destructive", onClick: () => {
                                                                    setIsManagingSubscription(false);
                                                                    setIsCancellingSubscription(true);
                                                                }, children: "Cancel Subscription" })) })] })] })] }) }), _jsx(Dialog, { open: isCancellingSubscription, onOpenChange: setIsCancellingSubscription, children: _jsxs(DialogContent, { className: "sm:max-w-[400px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Cancel Subscription" }), _jsx(DialogDescription, { children: "Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period." })] }), _jsxs("div", { className: "flex justify-end space-x-2 pt-4", children: [_jsx(Button, { variant: "outline", onClick: () => setIsCancellingSubscription(false), children: "Keep Subscription" }), _jsx(Button, { variant: "destructive", onClick: cancelSubscription, children: "Yes, Cancel" })] })] }) })] }), _jsxs(TabsContent, { value: "security", className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Email Verification" }), _jsx(CardDescription, { children: "Verify and manage your email address to secure your account." })] }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: "Current Email" }), _jsxs("div", { className: "flex items-center space-x-2 mt-1", children: [_jsx("p", { children: user.email }), user.emailVerified ? (_jsxs("span", { className: "inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700", children: [_jsx(CheckCircle2, { className: "mr-1 h-3 w-3" }), "Verified"] })) : (_jsx("span", { className: "inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700", children: "Not Verified" }))] }), user.pendingEmail && (_jsxs("div", { className: "mt-2", children: [_jsxs("p", { className: "text-sm text-muted-foreground", children: ["Verification email sent to ", _jsx("span", { className: "font-medium", children: user.pendingEmail }), ". Please check your inbox to complete the change."] }), _jsx("div", { className: "mt-3", children: _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setIsChangingEmail(true), children: [_jsx(RotateCcw, { className: "h-3.5 w-3.5 mr-1" }), "Try Again"] }) })] }))] }), _jsxs("div", { className: "flex flex-wrap space-x-2", children: [!user.pendingEmail && (_jsx(Button, { variant: "outline", onClick: () => setIsChangingEmail(true), children: "Change Email" })), !user.emailVerified && !user.pendingEmail && (_jsx(Button, { variant: "default", children: "Resend Verification" }))] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Password" }), _jsx(CardDescription, { children: "Update your password to keep your account secure." })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "Current Password" }), _jsxs("div", { className: "flex items-center", children: [_jsx("span", { className: "mr-3 tracking-widest text-muted-foreground", children: user.passwordLength ? '•'.repeat(user.passwordLength) : '••••••••' }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setIsChangingPassword(true), children: "Change Password" })] })] }), _jsx("div", { className: "text-xs text-muted-foreground", children: _jsxs("p", { children: ["Password last changed: ", user.passwordLastChanged ? new Date(user.passwordLastChanged).toLocaleDateString() : 'Not available'] }) })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Sign Out" }), _jsx(CardDescription, { children: "Sign out of your account on this device." })] }), _jsx(CardContent, { children: _jsx(Button, { variant: "outline", onClick: handleLogout, children: "Sign Out" }) })] })] })] }), _jsx(Dialog, { open: isChangingPassword, onOpenChange: setIsChangingPassword, children: _jsxs(DialogContent, { className: "sm:max-w-[450px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Change Password" }), _jsx(DialogDescription, { children: "Enter your current password and choose a new secure password." })] }), _jsx(PasswordChangeForm, { isPending: changePasswordMutation.isPending, onSubmit: (data) => {
                                changePasswordMutation.mutate({
                                    currentPassword: data.currentPassword,
                                    newPassword: data.newPassword
                                }, {
                                    onSuccess: () => {
                                        toast({
                                            title: "Password Changed",
                                            description: "Your password has been updated successfully.",
                                            variant: "default",
                                        });
                                        setIsChangingPassword(false);
                                    },
                                    onError: (error) => {
                                        toast({
                                            title: "Failed to change password",
                                            description: error.message || "An error occurred. Please check your current password and try again.",
                                            variant: "destructive",
                                        });
                                    }
                                });
                            } })] }) }), _jsx(Dialog, { open: isChangingEmail, onOpenChange: setIsChangingEmail, children: _jsxs(DialogContent, { className: "sm:max-w-[450px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Change Email Address" }), _jsx(DialogDescription, { children: "Enter your new email address and current password to verify your identity. You will need to verify your new email before the change takes effect." })] }), changeEmailMutation.isPending ? (_jsxs("div", { className: "py-8 flex items-center justify-center flex-col", children: [_jsx("div", { className: "h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" }), _jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: "Processing your request..." })] })) : (_jsx(EmailChangeForm, { currentEmail: user.email, onSubmit: (data) => {
                                changeEmailMutation.mutate(data, {
                                    onSuccess: () => {
                                        toast({
                                            title: "Verification email sent",
                                            description: "Please check your inbox to complete the email change.",
                                            variant: "default",
                                        });
                                        setIsChangingEmail(false);
                                    },
                                    onError: (error) => {
                                        toast({
                                            title: "Failed to send verification",
                                            description: error.message || "An error occurred while processing your request.",
                                            variant: "destructive",
                                        });
                                    }
                                });
                            } }))] }) }), _jsx(Dialog, { open: isUpgradingPlan, onOpenChange: setIsUpgradingPlan, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Upgrade to Pro" }), _jsx(DialogDescription, { children: "Unlock all premium features to accelerate your career growth." })] }), _jsxs("div", { className: "py-6", children: [_jsxs("div", { className: "rounded-xl bg-primary/5 p-5 border border-primary/20 mb-6", children: [_jsxs("h3", { className: "font-semibold text-lg mb-3 flex items-center", children: [_jsx(Sparkles, { className: "h-5 w-5 mr-2 text-primary" }), "Pro Plan Benefits"] }), _jsxs("ul", { className: "space-y-3", children: [_jsxs("li", { className: "flex items-start", children: [_jsx(CheckCircle2, { className: "h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Advanced Resume Builder" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Create unlimited professional resumes with AI enhancement" })] })] }), _jsxs("li", { className: "flex items-start", children: [_jsx(CheckCircle2, { className: "h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Unlimited Interview Practice" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Practice with unlimited AI-generated questions and feedback" })] })] }), _jsxs("li", { className: "flex items-start", children: [_jsx(CheckCircle2, { className: "h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "AI Career Coach" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Get personalized career advice whenever you need it" })] })] }), _jsxs("li", { className: "flex items-start", children: [_jsx(CheckCircle2, { className: "h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Cover Letter Generator" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Create tailored cover letters for every application" })] })] })] })] }), _jsx("div", { className: "mb-6", children: _jsxs(Tabs, { defaultValue: "monthly", className: "w-full", onValueChange: (value) => setBillingCycle(value), children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "monthly", children: "Monthly" }), _jsx(TabsTrigger, { value: "quarterly", children: "Quarterly" }), _jsx(TabsTrigger, { value: "annual", children: "Annual" })] }), _jsx(TabsContent, { value: "monthly", className: "pt-4", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsxs("p", { className: "text-lg font-semibold", children: ["$15.00 ", _jsx("span", { className: "text-sm font-normal text-muted-foreground", children: "/ month" })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Cancel anytime" })] }), _jsxs("div", { className: "space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => setIsUpgradingPlan(false), children: "Cancel" }), _jsx(Button, { onClick: () => upgradeSubscription('monthly'), children: "Upgrade Now" })] })] }) }), _jsx(TabsContent, { value: "quarterly", className: "pt-4", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center", children: [_jsxs("p", { className: "text-lg font-semibold", children: ["$30.00 ", _jsx("span", { className: "text-sm font-normal text-muted-foreground", children: "/ 3 months" })] }), _jsx("span", { className: "ml-2 text-xs font-medium text-green-600 bg-green-100 rounded-full px-2 py-0.5", children: "Save $15" })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "$10.00 per month, billed quarterly" })] }), _jsxs("div", { className: "space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => setIsUpgradingPlan(false), children: "Cancel" }), _jsx(Button, { onClick: () => upgradeSubscription('quarterly'), children: "Upgrade Now" })] })] }) }), _jsx(TabsContent, { value: "annual", className: "pt-4", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center", children: [_jsxs("p", { className: "text-lg font-semibold", children: ["$72.00 ", _jsx("span", { className: "text-sm font-normal text-muted-foreground", children: "/ year" })] }), _jsx("span", { className: "ml-2 text-xs font-medium text-green-600 bg-green-100 rounded-full px-2 py-0.5", children: "Save $108" })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "$6.00 per month, billed annually" })] }), _jsxs("div", { className: "space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => setIsUpgradingPlan(false), children: "Cancel" }), _jsx(Button, { onClick: () => upgradeSubscription('annual'), children: "Upgrade Now" })] })] }) })] }) })] })] }) }), _jsx(Dialog, { open: isManagingPaymentMethods, onOpenChange: setIsManagingPaymentMethods, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Payment Methods" }), _jsx(DialogDescription, { children: "Manage your payment methods for subscription billing." })] }), !setupIntentClientSecret ? (_jsxs("div", { className: "py-6 space-y-4", children: [paymentMethodInfo ? (_jsxs("div", { className: "rounded-md border p-4", children: [_jsx("h3", { className: "font-medium mb-3", children: "Current Payment Method" }), _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "p-3 bg-muted rounded-md mr-4", children: _jsx(CreditCardIcon, { className: "h-6 w-6" }) }), _jsxs("div", { children: [_jsxs("p", { className: "font-medium capitalize", children: [paymentMethodInfo.brand, " \u2022\u2022\u2022\u2022 ", paymentMethodInfo.last4] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Expires ", paymentMethodInfo.exp_month, "/", paymentMethodInfo.exp_year] })] })] })] })) : (_jsxs("div", { className: "rounded-md border p-4 text-center py-8", children: [_jsx("p", { className: "text-muted-foreground mb-2", children: "No payment methods found" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Add a payment method to manage your subscription" })] })), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { onClick: initializePaymentMethodsUpdate, disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), " Loading..."] })) : (_jsx(_Fragment, { children: paymentMethodInfo ? 'Update Payment Method' : 'Add Payment Method' })) }) })] })) : (_jsx("div", { className: "py-6", children: _jsx(Elements, { stripe: stripePromise, options: { clientSecret: setupIntentClientSecret }, children: _jsx(PaymentMethodForm, { onSuccess: () => {
                                        setIsManagingPaymentMethods(false);
                                        setSetupIntentClientSecret(null);
                                        fetchPaymentMethodInfo();
                                        toast({
                                            title: "Payment method updated",
                                            description: "Your payment method has been updated successfully.",
                                            variant: "default",
                                        });
                                    }, onCancel: () => {
                                        setSetupIntentClientSecret(null);
                                    } }) }) }))] }) })] }));
}
