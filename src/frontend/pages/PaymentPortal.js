import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
export default function PaymentPortal() {
    const [, navigate] = useLocation();
    const location = window.location.pathname;
    const planType = location.includes('premium') ? 'premium' : location.includes('university') ? 'university' : 'premium';
    const { user } = useUser();
    const { toast } = useToast();
    const [billingInterval, setBillingInterval] = useState('monthly');
    const [isProcessing, setIsProcessing] = useState(false);
    // Use the extracted plan type from the URL
    const currentPlanType = planType;
    // Plan details based on the selected plan type
    const planDetails = {
        premium: {
            name: 'Pro Plan',
            features: [
                'Unlimited resumes and cover letters',
                'Advanced interview preparation',
                'AI career coach (10 conversations/mo)',
                'Comprehensive goal tracking',
                'Achievement system with rewards',
                'Work history management',
                'Interview process tracking',
            ],
            priceDetails: {
                monthly: { price: '15.00', period: 'month', savings: '' },
                quarterly: { price: '30.00', period: '3 months', savings: 'Save $15' },
                annual: { price: '72.00', period: 'year', savings: 'Save $108' }
            }
        },
        university: {
            name: 'University Edition',
            features: [
                'All Pro features',
                'Study plan creator',
                'Course tracking and management',
                'Learning modules',
                'Assignment tracking',
                'Academic goal integration',
                'University-specific career resources',
            ],
            priceDetails: {
                monthly: { price: '7.99', period: 'month', savings: '47% off Pro' },
                quarterly: { price: '21.99', period: '3 months', savings: '27% off Pro' },
                annual: { price: '59.99', period: 'year', savings: '17% off Pro' }
            }
        }
    };
    // Get the current plan's details
    const currentPlan = planDetails[currentPlanType];
    // Get pricing for the selected billing interval
    const currentPricing = currentPlan.priceDetails[billingInterval];
    // Create subscription mutation
    const subscriptionMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest('POST', '/api/payments/create-subscription', {
                plan: currentPlanType,
                interval: billingInterval,
                email: user?.email,
                userId: user?.id,
                userName: user?.name
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create subscription');
            }
            return await response.json();
        },
        onSuccess: (data) => {
            // For the Stripe checkout flow, redirect to the checkout page with the client secret
            if (data.clientSecret) {
                toast({
                    title: "Redirecting to Checkout",
                    description: "Please complete your payment to activate your subscription.",
                });
                // Navigate to the checkout page with the client secret, plan type, and billing interval
                navigate(`/checkout?client_secret=${data.clientSecret}&plan=${currentPlanType}&interval=${billingInterval}`);
            }
        },
        onError: (error) => {
            toast({
                title: "Subscription Failed",
                description: error.message,
                variant: "destructive",
            });
            setIsProcessing(false);
        }
    });
    const handleSubscribe = async () => {
        if (!user) {
            // Redirect to auth page if not logged in
            navigate('/auth');
            return;
        }
        setIsProcessing(true);
        subscriptionMutation.mutate();
    };
    return (_jsx("div", { className: "min-h-screen bg-muted/30 py-10", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs(Button, { variant: "ghost", className: "mb-6", onClick: () => navigate('/pricing'), children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), "Back to Plans"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-2xl", children: ["Complete Your ", currentPlan.name, " Subscription"] }), _jsx(CardDescription, { children: "Choose your preferred billing cycle to get started" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Billing Cycle" }), _jsxs(RadioGroup, { defaultValue: "monthly", value: billingInterval, onValueChange: (value) => setBillingInterval(value), className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:bg-muted/50", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RadioGroupItem, { value: "monthly", id: "monthly" }), _jsx(Label, { htmlFor: "monthly", className: "cursor-pointer", children: "Monthly" })] }), _jsx("div", { className: "text-right", children: _jsxs("p", { className: "font-medium", children: ["$", currentPlan.priceDetails.monthly.price, "/", currentPlan.priceDetails.monthly.period] }) })] }), _jsxs("div", { className: "flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:bg-muted/50", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RadioGroupItem, { value: "quarterly", id: "quarterly" }), _jsx(Label, { htmlFor: "quarterly", className: "cursor-pointer", children: "Quarterly" })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-medium", children: ["$", currentPlan.priceDetails.quarterly.price, "/", currentPlan.priceDetails.quarterly.period] }), currentPlan.priceDetails.quarterly.savings && (_jsx("p", { className: "text-xs text-green-600", children: currentPlan.priceDetails.quarterly.savings }))] })] }), _jsxs("div", { className: "flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:bg-muted/50", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RadioGroupItem, { value: "annual", id: "annual" }), _jsx(Label, { htmlFor: "annual", className: "cursor-pointer", children: "Annual" })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-medium", children: ["$", currentPlan.priceDetails.annual.price, "/", currentPlan.priceDetails.annual.period] }), currentPlan.priceDetails.annual.savings && (_jsx("p", { className: "text-xs text-green-600", children: currentPlan.priceDetails.annual.savings }))] })] })] })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Payment Summary" }), _jsxs("div", { className: "flex justify-between", children: [_jsxs("span", { children: [currentPlan.name, " (", billingInterval, ")"] }), _jsxs("span", { children: ["$", currentPricing.price] })] }), _jsxs("div", { className: "flex justify-between font-semibold", children: [_jsxs("span", { children: ["Total billed ", billingInterval === 'monthly' ? 'monthly' : billingInterval === 'quarterly' ? 'every 3 months' : 'annually'] }), _jsxs("span", { children: ["$", currentPricing.price] })] })] })] }) }), _jsx(CardFooter, { children: _jsx(Button, { className: "w-full", size: "lg", onClick: handleSubscribe, disabled: isProcessing, children: isProcessing ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Processing..."] })) : (_jsxs(_Fragment, { children: ["Subscribe Now - $", currentPricing.price, "/", currentPricing.period] })) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-xl", children: [currentPlan.name, " Includes:"] }) }), _jsxs(CardContent, { children: [_jsx("ul", { className: "space-y-3", children: currentPlan.features.map((feature, index) => (_jsxs("li", { className: "flex items-start", children: [_jsx(CheckCircle, { className: "h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" }), _jsx("span", { children: feature })] }, index))) }), _jsxs("div", { className: "mt-8 border rounded-lg p-4 bg-muted/50", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx(Lock, { className: "h-4 w-4 mr-2 text-muted-foreground" }), _jsx("span", { className: "text-sm font-medium", children: "Secure Payment" })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Your payment information is securely processed by Stripe. We never store your full credit card details." })] }), _jsxs("div", { className: "mt-4 text-sm text-muted-foreground", children: [_jsxs("p", { children: ["By subscribing, you agree to our ", _jsx(Link, { href: "/terms", className: "text-primary underline", children: "Terms of Service" }), " and ", _jsx(Link, { href: "/privacy", className: "text-primary underline", children: "Privacy Policy" }), "."] }), _jsx("p", { className: "mt-2", children: "You can cancel your subscription at any time from your account settings." })] })] })] })] })] }) }));
}
