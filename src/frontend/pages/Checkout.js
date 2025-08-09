import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';
import { apiRequest } from '@/lib/queryClient';
export default function Checkout() {
    const [, navigate] = useLocation();
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [billingInterval, setBillingInterval] = useState('monthly');
    // Get plan type and cycle from URL
    const searchParams = new URLSearchParams(window.location.search);
    const planType = searchParams.get('plan') || 'pro';
    const cycleParam = searchParams.get('cycle');
    // In a real implementation with Stripe, we would have a client_secret here
    const clientSecret = 'mock_client_secret_for_demo';
    // Initialize billing interval from URL parameter if available
    useEffect(() => {
        if (cycleParam && ['monthly', 'quarterly', 'yearly'].includes(cycleParam)) {
            setBillingInterval(cycleParam);
        }
    }, [cycleParam]);
    useEffect(() => {
        if (!clientSecret) {
            toast({
                title: "Payment Error",
                description: "Missing payment information. Please try again.",
                variant: "destructive"
            });
            navigate('/pricing');
            return;
        }
        // Simulate payment verification (mock for now)
        const verifyPayment = async () => {
            try {
                setIsLoading(true);
                // In a real implementation, we would use Stripe.js to handle this
                await new Promise(resolve => setTimeout(resolve, 1500)); // simulate network delay
                setIsLoading(false);
            }
            catch (error) {
                setIsLoading(false);
                toast({
                    title: "Payment Error",
                    description: "There was an error verifying your payment. Please try again.",
                    variant: "destructive"
                });
            }
        };
        verifyPayment();
    }, [clientSecret, navigate, toast]);
    // Function to get pricing details based on plan and interval
    const getPricing = (plan, interval) => {
        if (plan === 'pro') {
            switch (interval) {
                case 'monthly':
                    return { price: '15.00', period: 'month' };
                case 'quarterly':
                    return { price: '30.00', period: '3 months' };
                case 'yearly':
                    return { price: '72.00', period: 'year' };
                default:
                    return { price: '15.00', period: 'month' };
            }
        }
        else { // university plan
            switch (interval) {
                case 'monthly':
                    return { price: '7.99', period: 'month' };
                case 'quarterly':
                    return { price: '21.99', period: '3 months' };
                case 'yearly':
                    return { price: '59.99', period: 'year' };
                default:
                    return { price: '7.99', period: 'month' };
            }
        }
    };
    const handleCompletePayment = async () => {
        if (!user || !clientSecret)
            return;
        try {
            setIsProcessing(true);
            // In a real implementation, we would update the subscription with the selected billing interval
            // and then confirm the payment with Stripe
            // For demo, we simulate the API call to update the billing interval
            await apiRequest('PUT', '/api/payments/update-subscription', {
                interval: billingInterval
            });
            // Then simulate payment confirmation
            await new Promise(resolve => setTimeout(resolve, 1500)); // simulate network delay
            // Redirect directly to success page without showing temporary success state
            navigate('/subscription-success');
        }
        catch (error) {
            setIsProcessing(false);
            toast({
                title: "Payment Failed",
                description: "There was an error processing your payment. Please try again.",
                variant: "destructive"
            });
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { children: "Verifying Payment" }), _jsx(CardDescription, { children: "Please wait while we verify your payment information..." })] }), _jsx(CardContent, { className: "flex justify-center py-8", children: _jsx(Loader2, { className: "h-12 w-12 animate-spin text-primary" }) })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Complete Your Payment" }), _jsx(CardDescription, { children: "Your subscription is almost ready!" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium mb-3", children: "Billing Interval" }), _jsxs(RadioGroup, { defaultValue: billingInterval, value: billingInterval, onValueChange: (value) => setBillingInterval(value), className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-muted/50", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RadioGroupItem, { value: "monthly", id: "monthly" }), _jsx(Label, { htmlFor: "monthly", className: "cursor-pointer", children: "Monthly" })] }), _jsx("div", { className: "text-right", children: _jsxs("p", { className: "font-medium", children: ["$", planType === 'pro' ? '15.00' : '7.99', "/month"] }) })] }), _jsxs("div", { className: "flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-muted/50", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RadioGroupItem, { value: "quarterly", id: "quarterly" }), _jsx(Label, { htmlFor: "quarterly", className: "cursor-pointer", children: "Quarterly" })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-medium", children: ["$", planType === 'pro' ? '30.00' : '21.99', "/3 months"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: planType === 'pro' ? 'Save $15' : 'Save $2' })] })] }), _jsxs("div", { className: "flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-muted/50", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RadioGroupItem, { value: "yearly", id: "yearly" }), _jsx(Label, { htmlFor: "yearly", className: "cursor-pointer", children: "Yearly" })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "font-medium", children: ["$", planType === 'pro' ? '72.00' : '59.99', "/year"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: planType === 'pro' ? 'Save $108' : 'Save $35.89' })] })] })] })] }), _jsxs("div", { className: "border rounded-lg p-4 bg-muted/50", children: [_jsx("h3", { className: "font-medium mb-2", children: "Payment Summary" }), _jsxs("div", { className: "flex justify-between mb-1", children: [_jsx("span", { children: "Plan" }), _jsx("span", { children: planType === 'pro' ? 'Pro Plan' : 'University Edition' })] }), _jsxs("div", { className: "flex justify-between mb-1", children: [_jsx("span", { children: "Billing Period" }), _jsx("span", { className: "capitalize", children: billingInterval })] }), _jsxs("div", { className: "flex justify-between font-semibold mt-2 pt-2 border-t", children: [_jsx("span", { children: "Total" }), _jsxs("span", { children: ["$", getPricing(planType, billingInterval).price] })] })] }), _jsx("div", { className: "flex items-center justify-center", children: _jsx("div", { className: "border border-dashed rounded p-6 w-full", children: _jsx("p", { className: "text-center text-muted-foreground", children: "In a real implementation, the Stripe payment form would be displayed here." }) }) })] }), _jsxs(CardFooter, { className: "flex flex-col space-y-3", children: [_jsx(Button, { className: "w-full", size: "lg", onClick: handleCompletePayment, disabled: isProcessing, children: isProcessing ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Processing..."] })) : (_jsxs(_Fragment, { children: ["Complete Payment - $", getPricing(planType, billingInterval).price] })) }), _jsxs(Button, { variant: "ghost", className: "w-full", onClick: () => navigate('/pricing'), children: [_jsx(ArrowLeft, { className: "mr-2 h-4 w-4" }), "Back to Plans"] })] })] }) }));
}
