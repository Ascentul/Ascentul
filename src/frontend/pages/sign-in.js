import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useUser } from "@/lib/useUserData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, School, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import supabaseClient from "@/lib/supabase-auth";
export default function SignInPage() {
    const [, setLocation] = useLocation();
    const { user, login, isLoading } = useUser();
    const { toast } = useToast();
    // Form state for login
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [loginType, setLoginType] = useState("regular");
    // Redirect if user is already logged in
    if (user) {
        if (user.userType === "regular") {
            setLocation("/dashboard");
        }
        else if (user.userType === "university_student" ||
            user.userType === "university_admin") {
            setLocation("/university");
        }
        else if (user.userType === "admin" || user.userType === "staff") {
            setLocation("/admin");
        }
        else {
            setLocation("/dashboard");
        }
        return null;
    }
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoginLoading(true);
        try {
            // First clear any logout flag from localStorage
            localStorage.removeItem("auth-logout");
            // Use Supabase auth to sign in
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword
            });
            if (error) {
                throw new Error(error.message || "Login failed");
            }
            // Fetch user profile from the database to determine redirect
            const { data: userData, error: userError } = await supabaseClient
                .from("users")
                .select("*")
                .eq("email", loginEmail)
                .single();
            if (userError) {
                console.error("Error fetching user data after login:", userError);
                // Continue anyway as auth was successful
            }
            toast({
                title: "Login successful!",
                description: "You have been logged in successfully."
            });
            // Determine redirect path based on user type
            const redirectPath = userData?.user_type === "university_student" ||
                userData?.user_type === "university_admin"
                ? "/university"
                : userData?.onboarding_completed
                    ? "/dashboard"
                    : "/onboarding";
            // Redirect to the appropriate page
            console.log(`Login successful - redirecting to ${redirectPath}`);
            // Use setTimeout to avoid React state update warning
            setTimeout(() => {
                window.location.href = redirectPath;
            }, 0);
        }
        catch (error) {
            toast({
                title: "Login failed",
                description: error instanceof Error
                    ? error.message
                    : "Please check your credentials and try again.",
                variant: "destructive"
            });
        }
        finally {
            setIsLoginLoading(false);
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
    }
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsx("div", { className: "w-full lg:w-1/2 p-8 flex flex-col justify-center", children: _jsxs("div", { className: "max-w-md mx-auto w-full", children: [_jsx("h1", { className: "text-3xl font-bold mb-6 text-center", children: _jsx("span", { className: "text-primary text-4xl", children: "Ascentul" }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Sign In" }), _jsx(CardDescription, { children: "Enter your credentials to access your account" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "mb-6", children: [_jsx(Label, { className: "mb-2 block", children: "Login Type" }), _jsxs(ToggleGroup, { type: "single", value: loginType, onValueChange: (value) => value && setLoginType(value), className: "bg-gray-100 rounded-md p-1 justify-stretch", children: [_jsxs(ToggleGroupItem, { value: "regular", className: `flex-1 data-[state=on]:bg-white data-[state=on]:shadow-sm rounded-sm ${loginType === "regular"
                                                                ? "text-foreground"
                                                                : "text-muted-foreground"}`, children: [_jsx(User, { className: "h-4 w-4 mr-2" }), _jsx("span", { children: "Regular Login" })] }), _jsxs(ToggleGroupItem, { value: "university", className: `flex-1 data-[state=on]:bg-white data-[state=on]:shadow-sm rounded-sm ${loginType === "university"
                                                                ? "text-foreground"
                                                                : "text-muted-foreground"}`, children: [_jsx(School, { className: "h-4 w-4 mr-2" }), _jsx("span", { children: "University Login" })] })] })] }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "login-email", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "login-email", type: "email", placeholder: loginType === "university"
                                                                        ? "Enter your university email"
                                                                        : "Enter your email", value: loginEmail, onChange: (e) => setLoginEmail(e.target.value), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "login-password", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "login-password", type: "password", placeholder: "Enter your password", value: loginPassword, onChange: (e) => setLoginPassword(e.target.value), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "pt-2 space-y-3", children: [_jsxs(Button, { type: "submit", className: "w-full", disabled: isLoginLoading, children: [isLoginLoading ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : null, loginType === "university"
                                                                    ? "Sign In to University Portal"
                                                                    : "Sign In"] }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("span", { className: "w-full border-t" }) }), _jsx("div", { className: "relative flex justify-center text-xs uppercase", children: _jsx("span", { className: "bg-background px-2 text-muted-foreground", children: "Or" }) })] }), _jsxs(Button, { type: "button", variant: "outline", className: "w-full", disabled: isLoginLoading, onClick: async () => {
                                                                setIsLoginLoading(true);
                                                                try {
                                                                    const { error } = await supabaseClient.auth.signInWithOtp({
                                                                        email: loginEmail,
                                                                        options: {
                                                                            emailRedirectTo: `${window.location.origin}/auth/callback`
                                                                        }
                                                                    });
                                                                    if (error) {
                                                                        throw new Error(error.message);
                                                                    }
                                                                    toast({
                                                                        title: "Magic link sent!",
                                                                        description: "Check your inbox for a sign-in link."
                                                                    });
                                                                }
                                                                catch (error) {
                                                                    toast({
                                                                        title: "Failed to send magic link",
                                                                        description: error instanceof Error
                                                                            ? error.message
                                                                            : "Please check your email address and try again.",
                                                                        variant: "destructive"
                                                                    });
                                                                }
                                                                finally {
                                                                    setIsLoginLoading(false);
                                                                }
                                                            }, children: [_jsx(Mail, { className: "mr-2 h-4 w-4" }), "Send Magic Link"] })] })] })] }), _jsxs(CardFooter, { className: "flex flex-col space-y-3", children: [_jsx("div", { className: "text-center", children: _jsx(Link, { href: "/forgot-password", className: "text-sm text-primary hover:underline", children: "Forgot your password?" }) }), _jsxs("p", { className: "text-sm text-muted-foreground text-center", children: ["Don't have an account?", " ", _jsx(Link, { href: "/sign-up", className: "text-primary hover:underline", children: "Sign up" })] })] })] })] }) }), _jsx("div", { className: "hidden lg:w-1/2 lg:flex bg-primary p-8", children: _jsxs("div", { className: "m-auto max-w-lg text-primary-foreground", children: [_jsx("h1", { className: "text-5xl font-bold mb-6", children: "Elevate Your Career Journey" }), _jsx("p", { className: "text-xl mb-8", children: "Ascentul is your AI-powered career hub \u2014 built to help you stay organized, apply smarter, and grow with confidence." }), _jsxs("div", { className: "space-y-4", children: [_jsx(FeatureItem, { icon: "\u2713", text: "Job application tracking that keeps you on top of every opportunity" }), _jsx(FeatureItem, { icon: "\u2713", text: "Career goal setting and progress tracking to build long-term momentum" }), _jsx(FeatureItem, { icon: "\u2713", text: "Smart resume and cover letter builder with AI-powered suggestions" }), _jsx(FeatureItem, { icon: "\u2713", text: "Personalized career coaching to guide your next move" })] })] }) })] }));
}
function FeatureItem({ icon, text }) {
    return (_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "bg-primary-foreground text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center", children: icon }), _jsx("div", { className: "text-primary-foreground", children: text })] }));
}
