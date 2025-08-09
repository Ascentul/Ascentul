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
export default function AdminLoginPage() {
    const [, setLocation] = useLocation();
    const { user, login, isLoading } = useUser();
    const { toast } = useToast();
    // Form state for login
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    // Redirect if user is already logged in as admin - check both role and userType fields
    if (user && (user.role === 'super_admin' || user.role === 'admin' || user.userType === 'admin')) {
        console.log("Admin already logged in, redirecting to /admin. Role:", user.role, "Type:", user.userType);
        setLocation('/admin');
        return null;
    }
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoginLoading(true);
        try {
            // First clear any logout flag from localStorage
            localStorage.removeItem('auth-logout');
            // Use the login function from useUser hook with a special 'admin' indicator
            const result = await login(loginUsername, loginPassword, 'admin');
            const { user, redirectPath } = result;
            // Check if the logged-in user is an admin - this is a fallback
            // in case the server doesn't handle the login type correctly
            // Check both role and userType fields
            if (user.role !== 'super_admin' && user.role !== 'admin' && user.userType !== 'admin') {
                console.log("Access denied: Not an admin. Role:", user.role, "Type:", user.userType);
                toast({
                    title: "Access denied",
                    description: "You do not have admin privileges.",
                    variant: "destructive",
                });
                // Logout and redirect to regular login
                localStorage.setItem('auth-logout', 'true');
                setLocation('/sign-in');
                return;
            }
            console.log("Admin login successful. Role:", user.role, "Type:", user.userType);
            toast({
                title: "Admin login successful!",
                description: "You have been logged in successfully.",
            });
            // ✅ Rely solely on the server-sent redirectPath for proper routing
            // The login function in useUserData.tsx handles redirection based on the server response
            console.log("Admin login successful - redirection will be handled by useUserData.tsx");
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
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsx("div", { className: "w-full lg:w-1/2 p-8 flex flex-col justify-center", children: _jsxs("div", { className: "max-w-md mx-auto w-full", children: [_jsx("h1", { className: "text-3xl font-bold mb-6 text-center", children: "Admin Portal" }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Admin Sign In" }), _jsx(CardDescription, { children: "Enter your admin credentials" })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "login-username", children: "Username" }), _jsx(Input, { id: "login-username", placeholder: "Enter admin username", value: loginUsername, onChange: (e) => setLoginUsername(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "login-password", children: "Password" }), _jsx(Input, { id: "login-password", type: "password", placeholder: "Enter admin password", value: loginPassword, onChange: (e) => setLoginPassword(e.target.value), required: true })] }), _jsx("div", { className: "pt-2", children: _jsxs(Button, { type: "submit", className: "w-full", disabled: isLoginLoading, children: [isLoginLoading ? _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null, "Sign In as Admin"] }) })] }) }), _jsx(CardFooter, { className: "flex justify-center", children: _jsx(Button, { variant: "ghost", onClick: () => setLocation('/sign-in'), className: "text-sm text-muted-foreground", children: "Return to regular login" }) })] })] }) }), _jsx("div", { className: "hidden lg:w-1/2 lg:flex bg-primary p-8", children: _jsxs("div", { className: "m-auto max-w-lg text-primary-foreground", children: [_jsx("h1", { className: "text-5xl font-bold mb-6", children: "CareerTracker.io Admin" }), _jsx("p", { className: "text-xl mb-8", children: "Manage your platform, users, and content from the admin dashboard. Monitor statistics and make critical business decisions." }), _jsxs("div", { className: "space-y-4", children: [_jsx(AdminFeature, { icon: "\u2713", text: "User account and subscription management" }), _jsx(AdminFeature, { icon: "\u2713", text: "Content and curriculum administration" }), _jsx(AdminFeature, { icon: "\u2713", text: "Analytics and performance metrics" }), _jsx(AdminFeature, { icon: "\u2713", text: "System configuration and maintenance" })] })] }) })] }));
}
function AdminFeature({ icon, text }) {
    return (_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "bg-primary-foreground text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center", children: icon }), _jsx("div", { className: "text-primary-foreground", children: text })] }));
}
