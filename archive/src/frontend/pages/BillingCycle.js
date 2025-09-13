import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';
export default function BillingCycle() {
    const [location, setLocation] = useLocation();
    const [billingCycle, setBillingCycle] = useState('monthly');
    const { toast } = useToast();
    const { user, isLoading } = useUser();
    // Parse the URL parameters
    const params = new URLSearchParams(location.split('?')[1]);
    const plan = params.get('plan');
    // Check if user is authenticated
    useEffect(() => {
        if (!isLoading && !user) {
            // Redirect to sign in if not authenticated
            setLocation('/sign-in');
        }
    }, [user, isLoading, setLocation]);
    // Handle URL parameters and subscription status
    useEffect(() => {
        // If no plan specified, redirect back to plan selection
        if (!plan) {
            setLocation('/plan-selection');
        }
        // Skip other checks if still loading or no user
        if (isLoading || !user) {
            return;
        }
        // If already subscribed with active subscription, redirect to dashboard
        if (user.subscriptionPlan && user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active') {
            setLocation('/dashboard');
        }
    }, [plan, setLocation, user, isLoading]);
    const calculatePrice = (cycle) => {
        // Pro plan pricing
        if (cycle === 'monthly')
            return 15;
        if (cycle === 'quarterly')
            return 30; // $10/month, billed quarterly
        if (cycle === 'yearly')
            return 72; // $6/month, billed yearly
        return 15; // Default to monthly
    };
    const calculateSavings = (cycle) => {
        if (cycle === 'monthly')
            return 0;
        const monthlyPrice = 15; // Monthly price for pro plan
        if (cycle === 'quarterly') {
            const quarterlyTotal = monthlyPrice * 3; // 3 months
            return quarterlyTotal - 30; // Savings compared to 3 months paid monthly
        }
        if (cycle === 'yearly') {
            const yearlyTotal = monthlyPrice * 12; // 12 months
            return yearlyTotal - 72; // Savings compared to 12 months paid monthly
        }
        return 0;
    };
    const handleContinue = () => {
        // Redirect to checkout with plan and billing cycle
        setLocation(`/checkout?plan=${plan}&cycle=${billingCycle}`);
    };
    const handleBack = () => {
        // Go back to plan selection
        setLocation('/plan-selection');
    };
    if (!plan || isLoading) {
        return (_jsx("div", { className: "flex justify-center items-center min-h-screen", children: !plan ? "Redirecting..." : "Loading..." }));
    }
    // If no user after loading is complete, redirect to sign in (this is a fallback)
    if (!user) {
        return _jsx("div", { className: "flex justify-center items-center min-h-screen", children: "Redirecting to sign in..." });
    }
    return (_jsx("div", { className: "min-h-screen bg-muted/30 py-10", children: _jsxs("div", { className: "container max-w-3xl mx-auto px-6 md:px-8", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-3xl font-bold mb-2", children: "Choose Your Billing Cycle" }), _jsx("p", { className: "text-muted-foreground", children: "Select how you'd like to be billed for your Pro Plan" })] }), _jsxs(Card, { className: "mb-8", children: [_jsxs(CardHeader, { className: "text-center pb-2", children: [_jsx(CardTitle, { className: "text-2xl", children: "Select Billing Cycle" }), _jsx(CardDescription, { children: "Choose the option that works best for you" })] }), _jsxs(CardContent, { className: "pt-6", children: [_jsxs(RadioGroup, { className: "space-y-4", value: billingCycle, onValueChange: setBillingCycle, children: [_jsx("div", { className: "border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors", onClick: () => setBillingCycle('monthly'), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(RadioGroupItem, { value: "monthly", id: "monthly" }), _jsxs("div", { className: "ml-3", children: [_jsx(Label, { htmlFor: "monthly", className: "text-lg font-medium cursor-pointer", children: "Monthly" }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Pay month-to-month, cancel anytime" })] })] }), _jsx("div", { className: "font-semibold", children: "$15/month" })] }) }), _jsx("div", { className: "border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors", onClick: () => setBillingCycle('quarterly'), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(RadioGroupItem, { value: "quarterly", id: "quarterly" }), _jsxs("div", { className: "ml-3", children: [_jsxs(Label, { htmlFor: "quarterly", className: "text-lg font-medium cursor-pointer", children: ["Quarterly", _jsx("span", { className: "ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full", children: "Save $15" })] }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Pay every 3 months, save 17%" })] })] }), _jsx("div", { className: "font-semibold", children: "$30/quarter" })] }) }), _jsx("div", { className: "border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors", onClick: () => setBillingCycle('yearly'), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(RadioGroupItem, { value: "yearly", id: "yearly" }), _jsxs("div", { className: "ml-3", children: [_jsxs(Label, { htmlFor: "yearly", className: "text-lg font-medium cursor-pointer", children: ["Yearly", _jsx("span", { className: "ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full", children: "Save $108" })] }), _jsx("p", { className: "text-muted-foreground text-sm", children: "Pay once a year, save 60%" })] })] }), _jsx("div", { className: "font-semibold", children: "$72/year" })] }) })] }), _jsxs("div", { className: "mt-8 p-4 bg-primary/5 rounded-lg", children: [_jsxs("div", { className: "flex justify-between font-medium text-lg mb-2", children: [_jsx("span", { children: "Total:" }), _jsxs("span", { children: ["$", calculatePrice(billingCycle)] })] }), calculateSavings(billingCycle) > 0 && (_jsxs("div", { className: "flex justify-between text-green-600 text-sm", children: [_jsx("span", { children: "You save:" }), _jsxs("span", { children: ["$", calculateSavings(billingCycle)] })] }))] })] }), _jsxs(CardFooter, { className: "flex justify-between", children: [_jsxs(Button, { variant: "outline", onClick: handleBack, children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), "Back to Plans"] }), _jsxs(Button, { onClick: handleContinue, children: ["Continue to Checkout", _jsx(ArrowRight, { className: "ml-2 h-4 w-4" })] })] })] }), _jsx("div", { className: "text-center text-sm text-muted-foreground", children: _jsxs("p", { children: ["By proceeding with payment, you agree to our ", _jsx("a", { href: "/terms", className: "underline", children: "Terms of Service" }), " and ", _jsx("a", { href: "/privacy", className: "underline", children: "Privacy Policy" }), "."] }) })] }) }));
}
