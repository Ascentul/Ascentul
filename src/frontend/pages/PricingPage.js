import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem, } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
const ProPricingTiers = [
    {
        id: 'monthly',
        name: 'Monthly',
        price: 15,
        period: 'month',
        description: 'Billed monthly',
        totalPrice: '$15',
        saveText: '',
    },
    {
        id: 'quarterly',
        name: 'Quarterly',
        price: 30,
        period: '3 months',
        description: 'Billed every 3 months',
        totalPrice: '$30',
        saveText: 'Save $15',
    },
    {
        id: 'annually',
        name: 'Annually',
        price: 72,
        period: 'year',
        description: 'Billed yearly',
        totalPrice: '$72',
        saveText: 'Save $108',
    },
];
const features = [
    { name: 'Basic career goal tracking', included: true, pro: true },
    { name: 'Career profile builder', included: true, pro: true },
    { name: 'Resume builder (1 resume)', included: true, pro: true },
    { name: 'Basic AI career advice', included: true, pro: true },
    { name: 'Unlimited resumes & templates', included: false, pro: true },
    { name: 'Advanced AI mentor features', included: false, pro: true },
    { name: 'Unlimited cover letters', included: false, pro: true },
    { name: 'Interview process tracking', included: false, pro: true },
    { name: 'Priority support', included: false, pro: true },
];
export default function PricingPage() {
    const [selectedPlan, setSelectedPlan] = useState('monthly');
    const [showCycleDialog, setShowCycleDialog] = useState(false);
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const handleFreePlanClick = () => {
        navigate('/auth?plan=free');
    };
    const handleProPlanClick = () => {
        setShowCycleDialog(true);
    };
    const handleContinueToPro = () => {
        setShowCycleDialog(false);
        navigate(`/auth?plan=pro&cycle=${selectedPlan}`);
    };
    return (_jsxs("div", { className: "container px-4 py-12 mx-auto max-w-6xl", children: [_jsx("div", { className: "text-center mb-12", children: _jsxs(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, children: [_jsx("h1", { className: "text-4xl font-bold tracking-tight sm:text-5xl mb-4", children: "Simple, Transparent Pricing" }), _jsx("p", { className: "text-xl text-muted-foreground max-w-3xl mx-auto", children: "Choose the plan that's right for your career journey, with no hidden fees" })] }) }), _jsxs("div", { className: "grid gap-8 md:grid-cols-2 lg:gap-12", children: [_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.1 }, children: _jsxs(Card, { className: "h-full flex flex-col", children: [_jsxs(CardHeader, { className: "pb-6", children: [_jsx(CardTitle, { className: "text-2xl", children: "Free Plan" }), _jsx(CardDescription, { children: "Essential tools to start your career journey" }), _jsxs("div", { className: "mt-4", children: [_jsx("span", { className: "text-4xl font-bold", children: "$0" }), _jsx("span", { className: "text-muted-foreground ml-2", children: "/ forever" })] })] }), _jsx(CardContent, { className: "flex-grow", children: _jsx("ul", { className: "space-y-4", children: features.map((feature) => (_jsxs("li", { className: "flex items-start", children: [feature.included ? (_jsx(Check, { className: "h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" })) : (_jsx(X, { className: "h-5 w-5 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" })), _jsx("span", { className: cn(!feature.included && "text-muted-foreground"), children: feature.name })] }, feature.name))) }) }), _jsx(CardFooter, { children: _jsx(Button, { onClick: handleFreePlanClick, variant: "outline", className: "w-full text-lg font-medium p-6", children: "Create Account" }) })] }) }), _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.2 }, children: _jsxs(Card, { className: "h-full flex flex-col bg-primary/5 border-primary/30", children: [_jsxs(CardHeader, { className: "pb-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx(CardTitle, { className: "text-2xl", children: "Pro Plan" }), _jsx("div", { className: "bg-primary text-primary-foreground text-xs font-semibold py-1 px-3 rounded-full", children: "RECOMMENDED" })] }), _jsx(CardDescription, { children: "Full suite of advanced career tools" }), _jsxs("div", { className: "mt-4", children: [_jsx("span", { className: "text-4xl font-bold", children: "$15" }), _jsx("span", { className: "text-muted-foreground ml-2", children: "/ month" })] })] }), _jsx(CardContent, { className: "flex-grow", children: _jsx("ul", { className: "space-y-4", children: features.map((feature) => (_jsxs("li", { className: "flex items-start", children: [feature.pro ? (_jsx(Check, { className: "h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" })) : (_jsx(X, { className: "h-5 w-5 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" })), _jsx("span", { className: cn(!feature.pro && "text-muted-foreground"), children: feature.name })] }, feature.name))) }) }), _jsx(CardFooter, { children: _jsx(Button, { onClick: handleProPlanClick, className: "w-full text-lg font-medium p-6 bg-primary hover:bg-primary/90", children: "Get Pro" }) })] }) })] }), _jsx(Dialog, { open: showCycleDialog, onOpenChange: setShowCycleDialog, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Choose your billing cycle" }), _jsx(DialogDescription, { children: "Select a billing cycle that works best for you. Longer plans offer bigger savings." })] }), _jsx("div", { className: "py-6", children: _jsx(RadioGroup, { value: selectedPlan, onValueChange: setSelectedPlan, className: "space-y-4", children: ProPricingTiers.map((tier) => (_jsxs("div", { className: "border rounded-lg p-4 cursor-pointer hover:border-primary", children: [_jsx(RadioGroupItem, { value: tier.id, id: tier.id, className: "peer sr-only" }), _jsxs(Label, { htmlFor: tier.id, className: "flex items-center justify-between cursor-pointer", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: tier.name }), _jsx("div", { className: "text-muted-foreground text-sm", children: tier.description })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "font-bold text-lg", children: tier.totalPrice }), tier.saveText && (_jsx("div", { className: "text-green-600 text-xs font-medium", children: tier.saveText }))] })] })] }, tier.id))) }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowCycleDialog(false), children: "Cancel" }), _jsx(Button, { onClick: handleContinueToPro, children: "Continue" })] })] }) })] }));
}
