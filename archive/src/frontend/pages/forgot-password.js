import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import supabaseClient from "@/lib/supabase-auth";
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const { toast } = useToast();
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) {
                throw new Error(error.message);
            }
            setEmailSent(true);
            toast({
                title: "Reset email sent!",
                description: "Check your inbox for a password reset link."
            });
        }
        catch (error) {
            toast({
                title: "Failed to send reset email",
                description: error instanceof Error
                    ? error.message
                    : "Please check your email address and try again.",
                variant: "destructive"
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    if (emailSent) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-8", children: _jsx("div", { className: "max-w-md mx-auto w-full", children: _jsxs(Card, { children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center", children: _jsx(CheckCircle, { className: "h-8 w-8 text-green-600" }) }), _jsx(CardTitle, { children: "Check Your Email" }), _jsxs(CardDescription, { children: ["We've sent a password reset link to ", _jsx("strong", { children: email })] })] }), _jsxs(CardContent, { className: "text-center space-y-4", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "Click the link in the email to reset your password. The link will expire in 24 hours." }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Don't see the email? Check your spam folder or try a different email address." })] }), _jsxs(CardFooter, { className: "flex flex-col space-y-3", children: [_jsx(Button, { variant: "outline", onClick: () => {
                                        setEmailSent(false);
                                        setEmail("");
                                    }, className: "w-full", children: "Try Different Email" }), _jsx(Link, { href: "/sign-in", className: "w-full", children: _jsxs(Button, { variant: "ghost", className: "w-full", children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Back to Sign In"] }) })] })] }) }) }));
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-8", children: _jsxs("div", { className: "max-w-md mx-auto w-full", children: [_jsx("h1", { className: "text-3xl font-bold mb-6 text-center", children: _jsx("span", { className: "text-primary text-4xl", children: "Ascentul" }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Forgot Password?" }), _jsx(CardDescription, { children: "Enter your email address and we'll send you a link to reset your password." })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleResetPassword, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "email", type: "email", placeholder: "Enter your email address", value: email, onChange: (e) => setEmail(e.target.value), className: "pl-10", required: true, autoComplete: "email" })] })] }), _jsxs(Button, { type: "submit", className: "w-full", disabled: isLoading, children: [isLoading ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : null, "Send Reset Link"] })] }) }), _jsx(CardFooter, { className: "flex justify-center", children: _jsxs(Link, { href: "/sign-in", className: "text-sm text-primary hover:underline", children: [_jsx(ArrowLeft, { className: "h-3 w-3 mr-1 inline" }), "Back to Sign In"] }) })] })] }) }));
}
