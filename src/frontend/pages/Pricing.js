import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, } from "@/components/ui/tabs";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ContactDialog from '@/components/ContactDialog';
import LoginDialog from '@/components/LoginDialog';
import { useToast } from '@/hooks/use-toast';
import { useUser, useIsSubscriptionActive } from '@/lib/useUserData';
import { motion } from 'framer-motion';
export default function Pricing() {
    const { user, isLoading: userLoading } = useUser();
    const isSubscriptionActive = useIsSubscriptionActive();
    const { toast } = useToast();
    const [, navigate] = useLocation();
    const [billingInterval, setBillingInterval] = useState('annual');
    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [loginDialogOpen, setLoginDialogOpen] = useState(false);
    const [initialDialogTab, setInitialDialogTab] = useState('signup');
    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.6 } }
    };
    const fadeInUp = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };
    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };
    const staggerItem = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };
    // Add state to track which plan is being processed
    const [processingPlan, setProcessingPlan] = useState(null);
    // Create subscription mutation
    const subscriptionMutation = useMutation({
        mutationFn: async ({ plan, interval }) => {
            const response = await apiRequest('POST', '/api/payments/create-subscription', {
                plan: plan,
                interval: interval,
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
                // Navigate to the checkout page with the client secret
                navigate(`/checkout?client_secret=${data.clientSecret}`);
            }
        },
        onError: (error) => {
            toast({
                title: "Subscription Failed",
                description: error.message,
                variant: "destructive",
            });
            setProcessingPlan(null);
        },
        onSettled: () => {
            setProcessingPlan(null);
        }
    });
    // Cancel subscription mutation
    const cancelSubscriptionMutation = useMutation({
        mutationFn: async () => {
            const response = await apiRequest('POST', '/api/payments/cancel-subscription', {});
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to cancel subscription');
            }
            return await response.json();
        },
        onSuccess: () => {
            toast({
                title: "Subscription Cancelled",
                description: "Your subscription has been cancelled and will end at the end of your billing period.",
            });
            // Refresh the page to update UI
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        },
        onError: (error) => {
            toast({
                title: "Cancellation Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    });
    // Function that subscribes with the currently selected billing interval
    const handleSubscribeWithInterval = async (planType) => {
        if (!user) {
            // Redirect to auth page if not logged in
            navigate('/auth');
            return;
        }
        setProcessingPlan(planType);
        try {
            // Create the subscription with the selected billing interval
            const response = await subscriptionMutation.mutateAsync({
                plan: planType,
                interval: billingInterval
            });
            // If successful, redirect to checkout page with client_secret
            if (response?.clientSecret) {
                navigate(`/checkout?client_secret=${response.clientSecret}&plan=${planType}&interval=${billingInterval}`);
            }
        }
        catch (error) {
            // Error is handled by the mutation error handler
            setProcessingPlan(null);
        }
    };
    // Keep original function for detailed subscription flow
    const handleSubscribe = async (planType) => {
        if (!user) {
            // Redirect to auth page if not logged in
            navigate('/auth');
            return;
        }
        // Navigate to payment portal page for more detailed subscription options
        navigate(`/payment-portal/${planType}`);
    };
    const handleCancelSubscription = async () => {
        if (!user || !isSubscriptionActive) {
            return;
        }
        cancelSubscriptionMutation.mutate();
    };
    // Pro plan pricing based on billing interval
    const getPricing = (interval) => {
        switch (interval) {
            case 'monthly':
                return { price: '30.00', period: 'month', savings: '', displayPrice: '30.00', displayPeriod: 'month' }; // Updated price here
            case 'quarterly':
                return { price: '60.00', period: '3 months', savings: 'Save 27%', displayPrice: '22.00', displayPeriod: 'quarterly' }; // Updated price here
            case 'annual':
                return { price: '144.00', period: 'year', savings: 'Save 50%', displayPrice: '15.00', displayPeriod: 'month' }; // Updated price here
            default:
                return { price: '30.00', period: 'month', savings: '', displayPrice: '30.00', displayPeriod: 'month' }; // Updated price here
        }
    };
    // Calculate university pricing (hypothetically at 20% discount of Pro)
    const getUniversityPricing = (interval) => {
        switch (interval) {
            case 'monthly':
                return { price: '7.99', period: 'month', savings: '47% off Pro' };
            case 'quarterly':
                return { price: '21.99', period: '3 months', savings: '27% off Pro' };
            case 'annual':
                return { price: '59.99', period: 'year', savings: '17% off Pro' };
            default:
                return { price: '7.99', period: 'month', savings: '47% off Pro' };
        }
    };
    // Current plan pricing
    const proPricing = getPricing(billingInterval);
    const universityPricing = getUniversityPricing(billingInterval);
    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: '0',
            period: 'forever',
            description: 'Perfect for getting started with basic career planning.',
            features: [
                'Dashboard with career stats',
                'Resume builder (1 resume)',
                'Cover letter builder (1 letter)',
                'Basic interview preparation',
                'Limited goal tracking',
            ],
            buttonText: user ? 'Current Plan' : 'Create Account',
            buttonAction: () => {
                if (user) {
                    navigate('/');
                }
                else {
                    setInitialDialogTab('signup');
                    setLoginDialogOpen(true);
                }
            },
            buttonVariant: 'outline',
            highlighted: false
        },
        {
            id: 'premium',
            name: 'Pro',
            price: proPricing.price,
            period: proPricing.period,
            displayPrice: proPricing.displayPrice || proPricing.price,
            displayPeriod: proPricing.displayPeriod || proPricing.period,
            savings: proPricing.savings,
            description: 'Everything you need for professional career development.',
            features: [
                'All Free features',
                'Unlimited resumes and cover letters',
                'Advanced interview preparation',
                'AI career coach (10 conversations/mo)',
                'Comprehensive goal tracking',
                'Achievement system with rewards',
                'Work history management',
                'Interview process tracking',
            ],
            buttonText: isSubscriptionActive && user?.subscriptionPlan === 'premium'
                ? 'Current Plan'
                : (user ? 'Subscribe Now' : 'Sign Up'),
            buttonAction: () => {
                if (user) {
                    if (isSubscriptionActive && user.subscriptionPlan === 'premium') {
                        navigate('/');
                    }
                    else {
                        handleSubscribeWithInterval('premium');
                    }
                }
                else {
                    setInitialDialogTab('signup');
                    setLoginDialogOpen(true);
                }
            },
            buttonVariant: 'default',
            highlighted: true
        },
        {
            id: 'university',
            name: 'University Edition',
            price: null,
            period: null,
            savings: null,
            description: 'Special plan for university students with academic tools.',
            features: [
                'All Pro features',
                'Study plan creator',
                'Course tracking and management',
                'Learning modules',
                'Assignment tracking',
                'Academic goal integration',
                'University-specific career resources',
            ],
            buttonText: 'Sign Up',
            buttonAction: () => setContactDialogOpen(true),
            buttonVariant: 'outline',
            highlighted: false
        }
    ];
    return (_jsxs("div", { children: [_jsx("section", { className: "py-16 md:py-20", children: _jsx("div", { className: "container mx-auto px-4", children: _jsxs(motion.div, { initial: "hidden", animate: "visible", variants: fadeInUp, className: "max-w-3xl mx-auto text-center", children: [_jsx("h1", { className: "text-3xl md:text-4xl font-bold mb-4", children: "Simple, Transparent Pricing" }), _jsx("p", { className: "text-lg text-muted-foreground mb-8", children: "Choose the plan that's right for your career stage. All plans include core features to help you succeed." })] }) }) }), _jsx("section", { className: "pb-2", children: _jsx("div", { className: "container mx-auto px-4", children: _jsx(motion.div, { initial: "hidden", animate: "visible", variants: fadeIn, className: "max-w-md mx-auto text-center", children: _jsxs("p", { className: "text-lg font-medium", children: ["Save up to ", _jsx("span", { className: "text-primary font-bold", children: "50%" }), " with annual billing"] }) }) }) }), _jsx("section", { className: "pb-8 pt-2", children: _jsx("div", { className: "container mx-auto px-4", children: _jsx(motion.div, { initial: "hidden", animate: "visible", variants: fadeIn, className: "max-w-md mx-auto", children: _jsx(Tabs, { defaultValue: "annual", className: "w-full", onValueChange: (value) => setBillingInterval(value), children: _jsxs(TabsList, { className: "grid w-full grid-cols-3", children: [_jsx(TabsTrigger, { value: "monthly", children: "Monthly" }), _jsx(TabsTrigger, { value: "quarterly", children: "Quarterly" }), _jsx(TabsTrigger, { value: "annual", children: "Annual" })] }) }) }) }) }), _jsx("section", { className: "pb-20", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsx(motion.div, { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-50px" }, variants: staggerContainer, className: "grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto", children: plans.map((plan) => (_jsx(motion.div, { variants: staggerItem, children: _jsxs(Card, { className: `${plan.highlighted ? 'border-primary shadow-lg relative' : 'border-border'}`, children: [plan.savings && (_jsx("div", { className: "absolute -top-3 right-6 bg-primary text-white text-xs font-semibold py-1 px-3 rounded-full", children: plan.savings })), _jsxs(CardHeader, { children: [_jsx(CardTitle, { children: plan.name }), _jsx("div", { className: "mt-2", children: plan.id !== 'university' ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "text-3xl font-bold", children: ["$", plan.displayPrice || plan.price] }), _jsxs("span", { className: "text-muted-foreground ml-1", children: ["/", plan.displayPeriod || plan.period] })] })) : (_jsx("span", { className: "text-3xl font-bold", children: "Custom Pricing" })) }), _jsx(CardDescription, { className: "mt-3 min-h-[60px]", children: plan.description }), _jsx("div", { className: "mt-6 mb-6 h-[48px]", children: plan.id === 'university' ? (_jsx(Button, { variant: "outline", className: "w-full text-primary border-primary hover:bg-primary/10 py-6", onClick: () => setContactDialogOpen(true), children: "Contact Sales" })) : (_jsx(Button, { variant: plan.buttonVariant, className: `w-full py-6 ${plan.highlighted ? 'bg-primary hover:bg-primary/90' : ''}`, onClick: plan.buttonAction, disabled: processingPlan === plan.id ||
                                                            (plan.id === 'free' && user?.subscriptionPlan !== 'free') ||
                                                            (plan.id !== 'free' && isSubscriptionActive && user?.subscriptionPlan === plan.id), children: processingPlan === plan.id ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Processing..."] })) : (_jsxs(_Fragment, { children: [plan.buttonText, !(plan.id !== 'free' && isSubscriptionActive && user?.subscriptionPlan === plan.id) &&
                                                                    _jsx(ArrowRight, { className: "ml-2 h-4 w-4" })] })) })) })] }), _jsx(CardContent, { children: _jsx("ul", { className: "space-y-3", children: plan.features.map((feature) => (_jsxs("li", { className: "flex items-center", children: [_jsx(Check, { className: "h-4 w-4 text-primary mr-3 flex-shrink-0" }), _jsx("span", { className: "text-sm", children: feature })] }, feature))) }) })] }) }, plan.id))) }), _jsxs(motion.div, { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-100px" }, variants: fadeInUp, className: "max-w-3xl mx-auto mt-12 bg-muted/50 rounded-lg p-6 text-center", children: [_jsx("h3", { className: "text-xl font-semibold mb-3", children: "University Licensing Available" }), _jsx("p", { className: "text-muted-foreground mb-4", children: "We offer special licensing for universities to provide CareerTracker.io to their students. Contact us for custom pricing and integration options." }), _jsx(Button, { variant: "outline", onClick: () => setContactDialogOpen(true), children: "Contact Sales" })] })] }) }), _jsx("section", { className: "py-16 bg-muted/30", children: _jsx("div", { className: "container mx-auto px-4", children: _jsxs(motion.div, { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-100px" }, variants: fadeInUp, className: "max-w-3xl mx-auto", children: [_jsx("h2", { className: "text-2xl font-bold text-center mb-10", children: "Frequently Asked Questions" }), _jsxs(motion.div, { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-50px" }, variants: staggerContainer, className: "space-y-6", children: [_jsxs(motion.div, { variants: staggerItem, className: "bg-card rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Can I upgrade or downgrade my plan?" }), _jsx("p", { className: "text-muted-foreground", children: "Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated amount for the remainder of your billing cycle. When downgrading, your new plan will take effect at the end of your current billing cycle." })] }), _jsxs(motion.div, { variants: staggerItem, className: "bg-card rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "What happens when I reach conversation limits with the AI coach?" }), _jsx("p", { className: "text-muted-foreground", children: "Once you reach your monthly conversation limit with the AI coach, you'll need to wait until your plan resets at the beginning of your next billing cycle. You can also upgrade to a higher tier plan for more conversations." })] }), _jsxs(motion.div, { variants: staggerItem, className: "bg-card rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "How do I verify my student status for the University Edition?" }), _jsx("p", { className: "text-muted-foreground", children: "You can verify your student status by signing up with your university email address (.edu or equivalent) or by providing your student ID. Our team will verify your status within 24 hours." })] }), _jsxs(motion.div, { variants: staggerItem, className: "bg-card rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Is there a discount for annual subscriptions?" }), _jsx("p", { className: "text-muted-foreground", children: "Yes, we offer a significant discount when you subscribe annually. The discount will be applied automatically when you select the annual billing option during checkout." })] }), _jsxs(motion.div, { variants: staggerItem, className: "bg-card rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: "Can I cancel my subscription?" }), _jsx("p", { className: "text-muted-foreground", children: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period, after which it will revert to the Free plan." })] })] })] }) }) }), _jsx("section", { className: "py-16 bg-gradient-to-b from-primary/10 to-primary/5", children: _jsx("div", { className: "container mx-auto px-4", children: _jsxs(motion.div, { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-100px" }, variants: fadeInUp, className: "max-w-3xl mx-auto text-center", children: [_jsx("h2", { className: "text-3xl font-bold mb-4", children: "Ready to Transform Your Career?" }), _jsx("p", { className: "text-lg text-muted-foreground mb-8", children: "Join thousands of professionals who are taking control of their future with CareerTracker.io." }), _jsxs("div", { className: "flex flex-col sm:flex-row justify-center gap-4", children: [_jsxs(Button, { size: "lg", className: "w-full sm:w-auto", onClick: () => {
                                            setInitialDialogTab('signup');
                                            setLoginDialogOpen(true);
                                        }, children: ["Get Started ", _jsx(ArrowRight, { className: "ml-2 h-5 w-5" })] }), _jsxs(Button, { variant: "outline", size: "lg", className: "w-full sm:w-auto", onClick: (e) => {
                                            e.preventDefault();
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }, children: ["Compare Plans ", _jsx(ArrowRight, { className: "ml-2 h-5 w-5" })] })] })] }) }) }), _jsx(ContactDialog, { open: contactDialogOpen, onOpenChange: setContactDialogOpen, subject: "University Sales Inquiry", description: "Contact our sales team to learn more about our University Edition plan." }), _jsx(LoginDialog, { open: loginDialogOpen, onOpenChange: setLoginDialogOpen, initialTab: initialDialogTab })] }));
}
