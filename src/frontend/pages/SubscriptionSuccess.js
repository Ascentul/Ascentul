import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useUser } from '@/lib/useUserData';
export default function SubscriptionSuccess() {
    const [, navigate] = useLocation();
    const { user, isLoading } = useUser();
    useEffect(() => {
        // Redirect to login if no user
        if (!isLoading && !user) {
            navigate('/auth');
        }
    }, [user, isLoading, navigate]);
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" }) }));
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4", children: _jsxs(Card, { className: "max-w-md w-full", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx("div", { className: "p-2 bg-green-100 rounded-full", children: _jsx(CheckCircle, { className: "h-10 w-10 text-green-600" }) }) }), _jsx(CardTitle, { className: "text-2xl mb-2", children: "Subscription Activated!" }), _jsx(CardDescription, { children: "Thank you for subscribing to CareerTracker.io" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "border p-4 rounded-lg bg-muted/50", children: [_jsxs("div", { className: "flex justify-between mb-2", children: [_jsx("span", { className: "text-muted-foreground", children: "Plan:" }), _jsx("span", { className: "font-medium", children: user?.subscriptionPlan === 'pro' ? 'Pro Plan' : 'University Edition' })] }), _jsxs("div", { className: "flex justify-between mb-2", children: [_jsx("span", { className: "text-muted-foreground", children: "Billing Cycle:" }), _jsx("span", { className: "font-medium", children: user?.subscriptionCycle || 'Monthly' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-muted-foreground", children: "Status:" }), _jsx("span", { className: "font-medium text-green-600", children: "Active" })] })] }), _jsx("p", { className: "text-center text-sm text-muted-foreground", children: "Your subscription is now active. You can manage your subscription at any time from your account settings." })] }), _jsxs(CardFooter, { className: "flex flex-col space-y-3", children: [_jsxs(Button, { className: "w-full", onClick: () => navigate('/dashboard'), children: ["Go to Dashboard", _jsx(ArrowRight, { className: "ml-2 h-4 w-4" })] }), _jsx(Button, { variant: "outline", className: "w-full", onClick: () => navigate('/account'), children: "Manage Subscription" })] })] }) }));
}
