import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import supabaseClient from "@/lib/supabase-auth";
export default function ResetPasswordPage() {
    const [, setLocation] = useLocation();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isValidatingToken, setIsValidatingToken] = useState(true);
    const [isValidToken, setIsValidToken] = useState(false);
    const { toast } = useToast();
    useEffect(() => {
        // Check if we have a valid session from the email link
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabaseClient.auth.getSession();
                if (error || !session) {
                    setIsValidToken(false);
                    toast({
                        title: "Invalid reset link",
                        description: "This password reset link is invalid or has expired.",
                        variant: "destructive"
                    });
                }
                else {
                    setIsValidToken(true);
                }
            }
            catch (error) {
                setIsValidToken(false);
                toast({
                    title: "Error",
                    description: "Unable to validate reset link.",
                    variant: "destructive"
                });
            }
            finally {
                setIsValidatingToken(false);
            }
        };
        checkSession();
    }, [toast]);
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "Please make sure both passwords are identical.",
                variant: "destructive"
            });
            return;
        }
        if (password.length < 6) {
            toast({
                title: "Password too short",
                description: "Password must be at least 6 characters long.",
                variant: "destructive"
            });
            return;
        }
        setIsLoading(true);
        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: password
            });
            if (error) {
                throw new Error(error.message);
            }
            toast({
                title: "Password updated successfully!",
                description: "You can now sign in with your new password."
            });
            // Redirect to sign-in page after successful reset
            setTimeout(() => {
                setLocation("/sign-in");
            }, 2000);
        }
        catch (error) {
            toast({
                title: "Failed to update password",
                description: error instanceof Error ? error.message : "Please try again later.",
                variant: "destructive"
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    if (isValidatingToken) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-8", children: _jsxs("div", { className: "max-w-md mx-auto w-full text-center", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-muted-foreground", children: "Validating reset link..." })] }) }));
    }
    if (!isValidToken) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-8", children: _jsx("div", { className: "max-w-md mx-auto w-full", children: _jsxs(Card, { children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center", children: _jsx(AlertCircle, { className: "h-8 w-8 text-red-600" }) }), _jsx(CardTitle, { children: "Invalid Reset Link" }), _jsx(CardDescription, { children: "This password reset link is invalid or has expired." })] }), _jsxs(CardContent, { className: "text-center space-y-4", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Please request a new password reset email." }), _jsx(Button, { onClick: () => setLocation("/forgot-password"), className: "w-full", children: "Request New Reset Link" })] })] }) }) }));
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-8", children: _jsxs("div", { className: "max-w-md mx-auto w-full", children: [_jsx("h1", { className: "text-3xl font-bold mb-6 text-center", children: _jsx("span", { className: "text-primary text-4xl", children: "Ascentul" }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Set New Password" }), _jsx(CardDescription, { children: "Enter your new password below. Make sure it's secure and easy for you to remember." })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleResetPassword, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "New Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "password", type: showPassword ? "text" : "password", placeholder: "Enter your new password", value: password, onChange: (e) => setPassword(e.target.value), className: "pl-10 pr-10", required: true, minLength: 6 }), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute right-3 top-3 text-muted-foreground hover:text-foreground", children: showPassword ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPassword", children: "Confirm New Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "confirmPassword", type: showConfirmPassword ? "text" : "password", placeholder: "Confirm your new password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: "pl-10 pr-10", required: true, minLength: 6 }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute right-3 top-3 text-muted-foreground hover:text-foreground", children: showConfirmPassword ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) })] }), password &&
                                                confirmPassword &&
                                                password !== confirmPassword && (_jsx("p", { className: "text-sm text-red-600", children: "Passwords don't match" }))] }), _jsx("div", { className: "text-xs text-muted-foreground", children: "Password must be at least 6 characters long." }), _jsxs(Button, { type: "submit", className: "w-full", disabled: isLoading ||
                                            password !== confirmPassword ||
                                            password.length < 6, children: [isLoading ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : null, "Update Password"] })] }) })] })] }) }));
}
