import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useUpdateUserSubscription } from "@/lib/useUserData";
import { useToast } from "@/hooks/use-toast";
const planFeatures = {
    free: [
        "Resume Builder (1 resume)",
        "Cover Letter Generator (1 letter)",
        "Basic Goal Tracking",
        "Work History Management",
        "Limited Interview Practice Questions",
        "Community Access"
    ],
    pro: [
        "Unlimited Resumes & Templates",
        "Unlimited Cover Letters",
        "Advanced Interview Preparation",
        "AI Career Coach (100 messages/month)",
        "Advanced Goal Planning & Tracking",
        "Custom Dashboards",
        "Export in Multiple Formats",
        "Email & Priority Support"
    ]
};
export default function PlanSelection() {
    const [, setLocation] = useLocation();
    const [selectedPlan, setSelectedPlan] = useState("free");
    const [billingCycle, setBillingCycle] = useState("monthly");
    const { user, isLoading } = useUser();
    const updateSubscriptionMutation = useUpdateUserSubscription();
    const { toast } = useToast();
    // Check if user is authenticated
    useEffect(() => {
        if (!isLoading && !user) {
            // Redirect to sign in if not authenticated
            setLocation("/sign-in");
        }
    }, [user, isLoading, setLocation]);
    // Handle user loading and subscription status
    useEffect(() => {
        if (isLoading || !user) {
            return; // Wait for user data to load
        }
        // If already subscribed, redirect to appropriate page
        if (user.subscriptionPlan &&
            user.subscriptionPlan !== "free" &&
            user.subscriptionStatus === "active") {
            if (user.userType === "university_student" ||
                user.userType === "university_admin") {
                setLocation("/university");
            }
            else {
                setLocation("/dashboard");
            }
        }
    }, [user, isLoading, setLocation]);
    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        // Different actions based on selected plan
        if (plan === "free") {
            // For free plan, handle directly
            handleContinue();
        }
        else {
            // For pro plan, navigate to billing cycle selection
            setLocation("/billing-cycle?plan=pro");
        }
    };
    const calculatePrice = (plan, cycle) => {
        if (plan === "free")
            return 0;
        // Pro plan pricing
        if (cycle === "monthly")
            return 15;
        if (cycle === "quarterly")
            return 30; // $10/month, billed quarterly
        if (cycle === "yearly")
            return 72; // $6/month, billed yearly
        return 0;
    };
    const calculateSavings = (plan, cycle) => {
        if (plan === "free" || cycle === "monthly")
            return 0;
        const monthlyPrice = 15; // Monthly price for pro plan
        if (cycle === "quarterly") {
            const quarterlyTotal = monthlyPrice * 3; // 3 months
            return quarterlyTotal - 30; // Savings compared to 3 months paid monthly
        }
        if (cycle === "yearly") {
            const yearlyTotal = monthlyPrice * 12; // 12 months
            return yearlyTotal - 72; // Savings compared to 12 months paid monthly
        }
        return 0;
    };
    const handleContinue = async () => {
        if (selectedPlan === "free") {
            try {
                // Update user with free plan using the server-side API
                await updateSubscriptionMutation.mutateAsync({
                    subscriptionPlan: "free",
                    subscriptionStatus: "active",
                    subscriptionCycle: undefined
                });
                toast({
                    title: "Free plan activated",
                    description: "You now have access to all free features of CareerTracker.io"
                });
                // Redirect to appropriate page based on user type with a slight delay to ensure data is updated
                setTimeout(() => {
                    if (user.userType === "university_student" ||
                        user.userType === "university_admin") {
                        window.location.href = "/university";
                    }
                    else {
                        window.location.href = "/dashboard";
                    }
                }, 500);
            }
            catch (error) {
                console.error("Error activating free plan:", error);
                toast({
                    title: "Error activating plan",
                    description: "There was an error activating your plan. Please try again.",
                    variant: "destructive"
                });
            }
        }
        else {
            // For pro plan, redirect to checkout
            setLocation(`/checkout?plan=${selectedPlan}&cycle=${billingCycle}`);
        }
    };
    if (!user) {
        return (_jsx("div", { className: "flex justify-center items-center min-h-screen", children: "Loading..." }));
    }
    return (_jsx("div", { className: "min-h-screen bg-muted/30 py-10", children: _jsxs("div", { className: "container max-w-5xl mx-auto px-6 md:px-8", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h1", { className: "text-3xl font-bold mb-4", children: "Choose Your Plan" }), _jsx("p", { className: "text-muted-foreground text-lg", children: "Select the plan that best fits your career development needs" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-12 mb-10", children: [_jsx("div", { className: "relative", children: _jsx("div", { className: "relative", children: _jsx("div", { className: "pt-10", children: _jsxs(Card, { className: "relative overflow-hidden border rounded-lg", children: [_jsxs(CardHeader, { className: "pb-8 px-6 md:px-8", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "For individuals" }), _jsx(CardTitle, { className: "text-3xl font-bold mb-4", children: "Free Plan" }), _jsx(CardDescription, { className: "text-sm mb-8", children: "Get started with basic career management tools" }), _jsxs("div", { className: "mt-8 mb-14", children: [_jsx("span", { className: "text-4xl font-bold", children: "$0" }), _jsx("span", { className: "text-muted-foreground ml-1", children: "/month" })] })] }), _jsx("div", { className: "px-6 md:px-8 mb-16", children: _jsx(Button, { variant: "outline", className: "w-full h-11", onClick: () => handlePlanSelect("free"), children: "Create account" }) }), _jsx(CardContent, { className: "pb-8 px-6 md:px-8", children: _jsx("ul", { className: "space-y-6", children: planFeatures.free.map((feature, index) => (_jsxs("li", { className: "flex items-start", children: [_jsx(Check, { className: "h-5 w-5 text-primary mr-3 mt-0.5" }), _jsx("span", { className: "leading-relaxed", children: feature })] }, index))) }) })] }) }) }) }), _jsx("div", { className: "relative", children: _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "absolute top-0 left-0 right-0 z-10 bg-primary text-white py-2 text-center font-medium rounded-t-lg flex items-center justify-center", children: ["Most popular ", _jsx("span", { className: "ml-1", children: "\u2728" })] }), _jsx("div", { className: "pt-10", children: _jsxs(Card, { className: "relative overflow-hidden border rounded-lg", children: [_jsxs(CardHeader, { className: "pb-8 px-6 md:px-8", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "For individuals and teams" }), _jsx(CardTitle, { className: "text-3xl font-bold mb-4", children: "Pro Plan" }), _jsx(CardDescription, { className: "text-sm mb-8", children: "Advanced features for serious career development" }), _jsxs("div", { className: "mt-8 mb-14", children: [_jsx("span", { className: "text-4xl font-bold", children: "$15" }), _jsx("span", { className: "text-muted-foreground ml-1", children: "/month" })] })] }), _jsxs("div", { className: "px-6 md:px-8 mb-16", children: [_jsx(Button, { variant: "default", className: "w-full h-11 bg-primary", onClick: () => handlePlanSelect("pro"), children: "Get started" }), _jsx("p", { className: "text-xs text-muted-foreground text-center mt-4", children: "Choose your billing cycle on the next step" })] }), _jsxs(CardContent, { className: "pb-6 px-6 md:px-8", children: [_jsx("p", { className: "font-semibold mb-4", children: "Everything in Free, plus:" }), _jsx("ul", { className: "space-y-6", children: planFeatures.pro.map((feature, index) => (_jsxs("li", { className: "flex items-start", children: [_jsx(Check, { className: "h-5 w-5 text-primary mr-3 mt-0.5" }), _jsx("span", { className: "leading-relaxed", children: feature })] }, index))) })] })] }) })] }) })] }), _jsx("div", { className: "flex flex-col items-center", children: _jsxs("div", { className: "mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start max-w-2xl", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" }), _jsx("p", { className: "text-sm text-yellow-700", children: "You can change or cancel your plan at any time from your account settings. Pro plan features will be immediately available after payment processing." })] }) })] }) }));
}
