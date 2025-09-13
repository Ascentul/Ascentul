import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useUser } from "@/lib/useUserData";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export default function LoginDialog({ open, onOpenChange, onSuccess, initialTab = "login" }) {
    const { login } = useUser();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState(initialTab);
    // Remove account type restriction (allow all user types to login)
    // Set active tab when initialTab prop changes
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);
    // Form state for login (using email instead of username)
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    // Form state for signup
    const [signupUsername, setSignupUsername] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [signupEmail, setSignupEmail] = useState("");
    const [signupName, setSignupName] = useState("");
    const [isSignupLoading, setIsSignupLoading] = useState(false);
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoginLoading(true);
        try {
            // First clear any logout flag from localStorage
            localStorage.removeItem("auth-logout");
            // Use the login function from useUser hook, passing email instead of username
            const result = await login(loginEmail, loginPassword);
            const user = result.user;
            toast({
                title: "Login successful!",
                description: "You have been logged in successfully."
            });
            // Check if user needs onboarding first
            if (user.needsUsername || !user.onboardingCompleted) {

                window.location.href = "/onboarding";
                return;
            }
            // Use redirect path from result if provided
            if (result.redirectPath) {

                window.location.href = result.redirectPath;
                return;
            }
            // Otherwise, redirect based on user role first, then fall back to userType
            if (user.role === "super_admin" ||
                user.role === "admin" ||
                user.userType === "admin") {

                window.location.href = "/admin";
            }
            else if (user.role === "staff" || user.userType === "staff") {

                window.location.href = "/staff-dashboard";
            }
            else if (user.role === "university_admin" ||
                user.userType === "university_admin") {

                window.location.href = "/university-admin/dashboard";
            }
            else if (user.role === "university_user" ||
                user.userType === "university_student") {

                window.location.href = "/university";
            }
            else {

                window.location.href = "/dashboard";
            }
            if (onSuccess) {
                onSuccess();
            }
            onOpenChange(false);
        }
        catch (error) {
            console.error("Login error:", error);
            // Ensure we have a valid error message
            let errorMessage = "Please check your credentials and try again.";
            if (error instanceof Error) {
                errorMessage = error.message || errorMessage;
            }
            toast({
                title: "Login failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
        finally {
            setIsLoginLoading(false);
        }
    };
    const handleSignup = async (e) => {
        e.preventDefault();
        setIsSignupLoading(true);
        try {
            // Generate a temporary username from the email
            // This will be updated during the onboarding flow
            const tempUsername = `user_${Date.now().toString().slice(-6)}`;
            // Make a direct API call for registration - ensure we're using the correct endpoint
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: signupUsername || tempUsername, // Use provided username or fallback to temporary
                    password: signupPassword,
                    email: signupEmail,
                    name: signupName,
                    userType: "regular", // Default to regular account type
                    needsUsername: !signupUsername // Only flag if we're using a temporary username
                })
            });
            // Handle the response carefully to avoid XML parsing errors
            let data;
            try {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    data = await response.json();
                }
                else {
                    // Handle non-JSON responses
                    const text = await response.text();
                    data = {
                        message: text || "Registration failed with a non-JSON response"
                    };
                }
            }
            catch (parseError) {
                console.error("Error parsing response:", parseError);
                // If JSON parsing fails, create a fallback data object
                data = { message: "Failed to parse server response" };
            }
            if (!response.ok) {
                throw new Error(data.message || "Registration failed");
            }
            toast({
                title: "Registration successful!",
                description: "Your account has been created successfully. You've been logged in."
            });
            // Redirect to onboarding flow for new users
            window.location.href = "/onboarding";
            if (onSuccess) {
                onSuccess();
            }
            onOpenChange(false);
        }
        catch (error) {
            console.error("Registration error:", error);
            // Ensure we have a valid error message
            let errorMessage = "Please check your information and try again.";
            if (error instanceof Error) {
                errorMessage = error.message || errorMessage;
            }
            toast({
                title: "Registration failed",
                description: errorMessage,
                variant: "destructive"
            });
        }
        finally {
            setIsSignupLoading(false);
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-center", children: "CareerTracker.io" }), _jsx(DialogDescription, { className: "text-center", children: "Access your personal career management platform" })] }), _jsxs(Tabs, { defaultValue: "login", value: activeTab, onValueChange: (value) => setActiveTab(value), className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsx(TabsTrigger, { value: "login", children: "Login" }), _jsx(TabsTrigger, { value: "signup", children: "Sign Up" })] }), _jsx(TabsContent, { value: "login", className: "mt-4", children: _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "login-email", children: "Email" }), _jsx(Input, { id: "login-email", type: "email", placeholder: "Enter your email", value: loginEmail, onChange: (e) => setLoginEmail(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "login-password", children: "Password" }), _jsx(Input, { id: "login-password", type: "password", placeholder: "Enter your password", value: loginPassword, onChange: (e) => setLoginPassword(e.target.value), required: true })] }), _jsx("div", { className: "pt-2", children: _jsxs(Button, { type: "submit", className: "w-full", disabled: isLoginLoading, children: [isLoginLoading ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : null, "Sign In"] }) })] }) }), _jsx(TabsContent, { value: "signup", className: "mt-4", children: _jsxs("form", { onSubmit: handleSignup, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "signup-name", children: "Full Name" }), _jsx(Input, { id: "signup-name", placeholder: "Enter your full name", value: signupName, onChange: (e) => setSignupName(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "signup-email", children: "Email" }), _jsx(Input, { id: "signup-email", type: "email", placeholder: "Enter your email", value: signupEmail, onChange: (e) => setSignupEmail(e.target.value), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "signup-password", children: "Password" }), _jsx(Input, { id: "signup-password", type: "password", placeholder: "Create a password", value: signupPassword, onChange: (e) => setSignupPassword(e.target.value), required: true })] }), _jsx("div", { className: "pt-2", children: _jsxs(Button, { type: "submit", className: "w-full", disabled: isSignupLoading, children: [isSignupLoading ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : null, "Create Account"] }) })] }) })] }), _jsx(DialogFooter, { className: "sm:justify-start", children: _jsx("div", { className: "text-xs text-muted-foreground mt-4", children: "By continuing, you agree to our Terms of Service and Privacy Policy." }) })] }) }));
}
