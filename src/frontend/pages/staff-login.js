import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function StaffLoginPage() {
    const [, setLocation] = useLocation();
    const { user, login, isLoading } = useUser();
    const { toast } = useToast();
    // Form state for login
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    // Redirect if user is already logged in as staff or admin
    // Check both role and userType fields for consistent authorization
    if (user && (user.role === 'staff' ||
        user.role === 'admin' ||
        user.role === 'super_admin' ||
        user.userType === 'staff' ||
        user.userType === 'admin')) {

        setLocation('/staff-dashboard');
        return null;
    }
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoginLoading(true);
        try {
            // First clear any logout flag from localStorage
            localStorage.removeItem('auth-logout');
            // Use the login function from useUser hook with a special 'staff' indicator
            const result = await login(loginUsername, loginPassword, 'staff');
            const { user, redirectPath } = result;
            // Check if the logged-in user is staff or admin - this is a fallback
            // in case the server doesn't handle the login type correctly
            // Check both role and userType fields for consistent authorization
            if (!(user.role === 'staff' ||
                user.role === 'admin' ||
                user.role === 'super_admin' ||
                user.userType === 'staff' ||
                user.userType === 'admin')) {

                toast({
                    title: "Access denied",
                    description: "You do not have staff portal access privileges.",
                    variant: "destructive",
                });
                // Logout and redirect to regular login
                localStorage.setItem('auth-logout', 'true');
                setLocation('/sign-in');
                return;
            }

            toast({
                title: "Staff login successful!",
                description: "You have been logged in successfully.",
            });
            // ✅ Rely solely on the server-sent redirectPath for proper routing
            // The login function in useUserData.tsx handles redirection based on the server response

        }
        catch (error) {
            toast({
                title: "Login failed",
                description: error instanceof Error ? error.message : "Please check your credentials and try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsLoginLoading(false);
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
    }
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsx("div", { className: "w-full lg:w-1/2 p-8 flex flex-col justify-center", children: _jsxs("div", { className: "max-w-md mx-auto w-full", children: [_jsx("h1", { className: "text-3xl font-bold mb-6 text-center", children: "Staff Portal" }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Staff Sign In" }), _jsx(CardDescription, { children: "Enter your staff credentials" })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "login-username", children: "Username" }), _jsx(Input, { id: "login-username", placeholder: "Enter staff username", value: loginUsername, onChange: (e) => setLoginUsername(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "login-password", children: "Password" }), _jsx(Input, { id: "login-password", type: "password", placeholder: "Enter staff password", value: loginPassword, onChange: (e) => setLoginPassword(e.target.value), required: true })] }), _jsx("div", { className: "pt-2", children: _jsxs(Button, { type: "submit", className: "w-full", disabled: isLoginLoading, children: [isLoginLoading ? _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null, "Sign In as Staff"] }) })] }) }), _jsxs(CardFooter, { className: "flex flex-col gap-2 items-center", children: [_jsx(Button, { variant: "outline", onClick: () => setLocation('/staff-signup'), className: "text-sm w-full", children: "Create a staff account" }), _jsx(Button, { variant: "ghost", onClick: () => setLocation('/sign-in'), className: "text-sm text-muted-foreground", children: "Return to regular login" })] })] })] }) }), _jsx("div", { className: "hidden lg:w-1/2 lg:flex bg-primary p-8", children: _jsxs("div", { className: "m-auto max-w-lg text-primary-foreground", children: [_jsx("h1", { className: "text-5xl font-bold mb-6", children: "CareerTracker.io Staff" }), _jsx("p", { className: "text-xl mb-8", children: "Access staff tools and resources to manage the platform and support users. Monitor system status and track key metrics." }), _jsxs("div", { className: "space-y-4", children: [_jsx(StaffFeature, { icon: "\u2713", text: "User account and subscription management" }), _jsx(StaffFeature, { icon: "\u2713", text: "Content and curriculum administration" }), _jsx(StaffFeature, { icon: "\u2713", text: "Support ticket management" }), _jsx(StaffFeature, { icon: "\u2713", text: "System configuration and maintenance" })] })] }) })] }));
}
function StaffFeature({ icon, text }) {
    return (_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "bg-primary-foreground text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center", children: icon }), _jsx("div", { className: "text-primary-foreground", children: text })] }));
}
