import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useUser } from '@/lib/useUserData';
// Form schemas
const loginSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});
const registerSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});
export default function AuthPage() {
    const [, navigate] = useLocation();
    const [location] = useLocation();
    const { user } = useUser();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('login');
    const [isLoading, setIsLoading] = useState(false);
    // Parse URL parameters
    const urlParams = new URLSearchParams(location.split('?')[1]);
    const planParam = urlParams.get('plan') || 'free'; // Default to free
    const cycleParam = urlParams.get('cycle') || 'monthly'; // Default to monthly
    // If user is already logged in, redirect to dashboard or appropriate location
    useEffect(() => {
        if (user) {
            if (planParam === 'free') {
                navigate('/dashboard');
            }
            else {
                // Navigate to payment portal with the selected plan and cycle
                navigate(`/payment-portal/${planParam}?cycle=${cycleParam}`);
            }
        }
    }, [user, navigate, planParam, cycleParam]);
    // Login form
    const loginForm = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: ''
        }
    });
    // Register form
    const registerForm = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: '',
            email: '',
            password: ''
        }
    });
    const onLoginSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await apiRequest('POST', '/api/auth/login', data);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Invalid credentials');
            }
            const userData = await response.json();
            toast({
                title: 'Login successful',
                description: `Welcome back, ${userData.name}!`,
            });
            // Redirect based on the plan
            if (planParam === 'free') {
                navigate('/dashboard');
            }
            else {
                navigate(`/payment-portal/${planParam}?cycle=${cycleParam}`);
            }
        }
        catch (error) {
            toast({
                title: 'Login failed',
                description: error instanceof Error ? error.message : 'An unexpected error occurred',
                variant: 'destructive',
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const onRegisterSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await apiRequest('POST', '/api/auth/register', data);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
            }
            const userData = await response.json();
            toast({
                title: 'Registration successful',
                description: `Welcome to CareerTracker, ${userData.name}!`,
            });
            // Redirect based on the plan
            if (planParam === 'free') {
                navigate('/onboarding');
            }
            else {
                navigate(`/payment-portal/${planParam}?cycle=${cycleParam}`);
            }
        }
        catch (error) {
            toast({
                title: 'Registration failed',
                description: error instanceof Error ? error.message : 'An unexpected error occurred',
                variant: 'destructive',
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex flex-col md:flex-row", children: [_jsx("div", { className: "w-full md:w-1/2 p-8 flex flex-col justify-center", children: _jsxs("div", { className: "max-w-md mx-auto w-full", children: [_jsxs("div", { className: "mb-8 text-center", children: [_jsx("h1", { className: "text-3xl font-bold", children: planParam === 'free' ? 'Get Started with CareerTracker' : 'Join CareerTracker Pro' }), _jsx("p", { className: "text-muted-foreground mt-2", children: planParam === 'free'
                                        ? 'Create an account to start your career journey'
                                        : `Subscribe to the ${planParam === 'pro' ? 'Pro' : 'University'} plan to unlock all features` })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: _jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsx(TabsTrigger, { value: "login", children: "Login" }), _jsx(TabsTrigger, { value: "register", children: "Register" })] }) }) }), _jsxs(CardContent, { children: [_jsx(TabsContent, { value: "login", className: "mt-0", children: _jsx(Form, { ...loginForm, children: _jsxs("form", { onSubmit: loginForm.handleSubmit(onLoginSubmit), className: "space-y-4", children: [_jsx(FormField, { control: loginForm.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter your email", ...field, disabled: isLoading }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: loginForm.control, name: "password", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: "Enter your password", ...field, disabled: isLoading }) }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Logging in..."] })) : (_jsxs(_Fragment, { children: ["Login", _jsx(ArrowRight, { className: "ml-2 h-4 w-4" })] })) })] }) }) }), _jsx(TabsContent, { value: "register", className: "mt-0", children: _jsx(Form, { ...registerForm, children: _jsxs("form", { onSubmit: registerForm.handleSubmit(onRegisterSubmit), className: "space-y-4", children: [_jsx(FormField, { control: registerForm.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Full Name" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter your full name", ...field, disabled: isLoading }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: registerForm.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Email" }), _jsx(FormControl, { children: _jsx(Input, { placeholder: "Enter your email", ...field, disabled: isLoading }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: registerForm.control, name: "password", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Password" }), _jsx(FormControl, { children: _jsx(Input, { type: "password", placeholder: "Create a password", ...field, disabled: isLoading }) }), _jsx(FormMessage, {})] })) }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Creating account..."] })) : (_jsxs(_Fragment, { children: ["Create Account", _jsx(ArrowRight, { className: "ml-2 h-4 w-4" })] })) })] }) }) })] })] })] }) }), _jsx("div", { className: "hidden md:block md:w-1/2 bg-primary p-12", children: _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, className: "h-full flex flex-col justify-center max-w-lg mx-auto text-primary-foreground", children: [_jsx("h1", { className: "text-4xl font-bold mb-4", children: "Accelerate Your Career Growth" }), _jsx("p", { className: "text-xl mb-8", children: planParam === 'free' ? ('Join thousands of professionals using CareerTracker to organize their career journey and achieve their goals.') : planParam === 'pro' ? ('Unlock premium features designed to give you an edge in today\'s competitive job market.') : ('Special tools tailored for university students to prepare for career success after graduation.') }), _jsx("div", { className: "space-y-4", children: planParam === 'free' ? (_jsxs(_Fragment, { children: [_jsx(FeatureItem, { text: "Organize your career journey in one central platform" }), _jsx(FeatureItem, { text: "Track your progress with intuitive dashboards" }), _jsx(FeatureItem, { text: "Create professional resumes and cover letters" }), _jsx(FeatureItem, { text: "Prepare for interviews with confidence" })] })) : planParam === 'pro' ? (_jsxs(_Fragment, { children: [_jsx(FeatureItem, { text: "Unlimited resumes and cover letters with premium templates" }), _jsx(FeatureItem, { text: "Advanced AI career coach with personalized advice" }), _jsx(FeatureItem, { text: "Comprehensive interview tracking system" }), _jsx(FeatureItem, { text: "Priority support and exclusive resources" })] })) : (_jsxs(_Fragment, { children: [_jsx(FeatureItem, { text: "All Pro features included" }), _jsx(FeatureItem, { text: "Study planning and course management tools" }), _jsx(FeatureItem, { text: "Learning modules tailored to your program" }), _jsx(FeatureItem, { text: "Academic achievement integration with career planning" })] })) })] }) })] }));
}
// Helper component for feature items
function FeatureItem({ text }) {
    return (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "mr-3 h-6 w-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center", children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polyline", { points: "20 6 9 17 4 12" }) }) }), _jsx("span", { children: text })] }));
}
