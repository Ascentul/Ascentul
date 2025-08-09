import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
export default function StaffSignupPage() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    // Form state
    const [registerName, setRegisterName] = useState('');
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    const [registrationCode, setRegistrationCode] = useState(''); // For additional security
    const [isRegisterLoading, setIsRegisterLoading] = useState(false);
    const handleRegister = async (e) => {
        e.preventDefault();
        // Basic validation
        if (registerPassword !== registerConfirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "Please make sure your passwords match.",
                variant: "destructive",
            });
            return;
        }
        // Additional validation for staff members
        // This would be a special code provided by an admin
        // In a real system, this could be an invite token
        if (registrationCode !== 'STAFF2025') { // Simple placeholder security code
            toast({
                title: "Invalid registration code",
                description: "The staff registration code you entered is not valid.",
                variant: "destructive",
            });
            return;
        }
        setIsRegisterLoading(true);
        try {
            // Create a staff user
            const response = await apiRequest('POST', '/api/staff/register', {
                name: registerName,
                username: registerUsername,
                email: registerEmail,
                password: registerPassword,
                registrationCode
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            toast({
                title: "Staff registration successful!",
                description: "Your staff account has been created. You can now log in.",
            });
            // Redirect to staff login page
            setLocation('/staff-login');
        }
        catch (error) {
            toast({
                title: "Registration failed",
                description: error instanceof Error ? error.message : "Please check your details and try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsRegisterLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsx("div", { className: "w-full lg:w-1/2 p-8 flex flex-col justify-center", children: _jsxs("div", { className: "max-w-md mx-auto w-full", children: [_jsx("h1", { className: "text-3xl font-bold mb-6 text-center", children: "Staff Portal Registration" }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Create Staff Account" }), _jsx(CardDescription, { children: "Register as a new staff member" })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleRegister, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-name", children: "Full Name" }), _jsx(Input, { id: "register-name", placeholder: "Enter your full name", value: registerName, onChange: (e) => setRegisterName(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-username", children: "Username" }), _jsx(Input, { id: "register-username", placeholder: "Choose a username", value: registerUsername, onChange: (e) => setRegisterUsername(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-email", children: "Email" }), _jsx(Input, { id: "register-email", type: "email", placeholder: "Enter your email", value: registerEmail, onChange: (e) => setRegisterEmail(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-password", children: "Password" }), _jsx(Input, { id: "register-password", type: "password", placeholder: "Create a password", value: registerPassword, onChange: (e) => setRegisterPassword(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-confirm-password", children: "Confirm Password" }), _jsx(Input, { id: "register-confirm-password", type: "password", placeholder: "Confirm your password", value: registerConfirmPassword, onChange: (e) => setRegisterConfirmPassword(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-code", children: "Staff Registration Code" }), _jsx(Input, { id: "register-code", placeholder: "Enter the staff registration code", value: registrationCode, onChange: (e) => setRegistrationCode(e.target.value), required: true }), _jsx("p", { className: "text-xs text-muted-foreground", children: "This code is provided by administrators to authorize staff registration." })] }), _jsx("div", { className: "pt-2", children: _jsxs(Button, { type: "submit", className: "w-full", disabled: isRegisterLoading, children: [isRegisterLoading ? _jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null, "Register as Staff"] }) })] }) }), _jsx(CardFooter, { className: "flex justify-center", children: _jsx(Button, { variant: "ghost", onClick: () => setLocation('/staff-login'), className: "text-sm text-muted-foreground", children: "Already have an account? Sign in" }) })] })] }) }), _jsx("div", { className: "hidden lg:w-1/2 lg:flex bg-primary p-8", children: _jsxs("div", { className: "m-auto max-w-lg text-primary-foreground", children: [_jsx("h1", { className: "text-5xl font-bold mb-6", children: "CareerTracker.io Staff Portal" }), _jsx("p", { className: "text-xl mb-8", children: "Create your staff account to access administrative tools and manage the platform. Help users succeed in their career journey." }), _jsxs("div", { className: "space-y-4", children: [_jsx(StaffFeature, { icon: "\u2713", text: "Help users achieve their career goals" }), _jsx(StaffFeature, { icon: "\u2713", text: "Manage platform content and resources" }), _jsx(StaffFeature, { icon: "\u2713", text: "Provide support to users when needed" }), _jsx(StaffFeature, { icon: "\u2713", text: "Monitor and improve platform performance" })] })] }) })] }));
}
function StaffFeature({ icon, text }) {
    return (_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "bg-primary-foreground text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center", children: icon }), _jsx("div", { className: "text-primary-foreground", children: text })] }));
}
