import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useUser } from "@/lib/useUserData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, User, UserCircle, School } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import supabaseClient from "@/lib/supabase-auth";
export default function SignUpPage() {
    const [, setLocation] = useLocation();
    const { user, login, isLoading } = useUser();
    const { toast } = useToast();
    // Form state for registration
    const [registerPassword, setRegisterPassword] = useState("");
    const [registerName, setRegisterName] = useState("");
    const [registerEmail, setRegisterEmail] = useState("");
    const [isRegisterLoading, setIsRegisterLoading] = useState(false);
    const [accountType, setAccountType] = useState("regular");
    const [universityName, setUniversityName] = useState("");
    const [studentId, setStudentId] = useState("");
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
    const handleRegister = async (e) => {
        e.preventDefault();
        setIsRegisterLoading(true);
        try {
            // Step 1: Sign up with Supabase Auth
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: registerEmail,
                password: registerPassword,
                options: {
                    data: {
                        name: registerName,
                        userType: accountType === "university" ? "university_student" : "regular",
                        xp: 0,
                        level: 1,
                        rank: "Beginner",
                        onboardingCompleted: false,
                        universityName: accountType === "university" ? universityName : undefined,
                        studentId: accountType === "university" ? studentId : undefined
                    }
                }
            });
            // If there's an auth error, throw it
            if (authError) {
                throw new Error(authError.message || "Registration failed");
            }
            // Step 2: Create or update user record in the database
            // This will be synchronized with the auth user through Supabase's RLS policies
            const userData = {
                id: authData.user?.id,
                username: `user_${authData.user?.id?.slice(0, 8)}`, // Temporary username
                email: registerEmail,
                name: registerName,
                password: "supabase-auth", // Placeholder as we're using Supabase Auth
                user_type: accountType === "university" ? "university_student" : "regular",
                needs_username: true,
                onboarding_completed: false,
                xp: 0,
                level: 1,
                rank: "Beginner",
                subscription_status: "inactive",
                subscription_plan: accountType === "university" ? "university" : "free"
            };
            // Add university-specific fields if applicable
            if (accountType === "university") {
                userData.university_name = universityName;
                userData.student_id = studentId;
            }
            const { data: newUserData, error: userError } = await supabaseClient
                .from("users")
                .upsert(userData)
                .select()
                .single();
            if (userError) {
                // If user table insert fails, we should clean up the auth user
                console.error("Error creating user record:", userError);
                throw new Error(userError.message || "Error completing registration");
            }
            toast({
                title: "Registration successful!",
                description: `Your ${accountType === "university" ? "university" : "regular"} account has been created and you are now logged in.`
            });
            // University users should go to standard onboarding for now, then to university dashboard
            // TODO: Create dedicated university onboarding flow
            const redirectPath = "/onboarding";
            console.log(`Registration successful - redirecting to ${redirectPath}`);
            window.location.href = redirectPath;
        }
        catch (error) {
            toast({
                title: "Registration failed",
                description: error instanceof Error
                    ? error.message
                    : "Please check your information and try again.",
                variant: "destructive"
            });
        }
        finally {
            setIsRegisterLoading(false);
        }
    };
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
    }
    return (_jsxs("div", { className: "min-h-screen flex", children: [_jsx("div", { className: "w-full lg:w-1/2 p-8 flex flex-col justify-center", children: _jsxs("div", { className: "max-w-md mx-auto w-full", children: [_jsx("h1", { className: "text-3xl font-bold mb-6 text-center", children: _jsx("span", { className: "text-primary text-4xl", children: "Ascentul" }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Create an account" }), _jsx(CardDescription, { children: "Enter your information to create a new account" })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "mb-6", children: [_jsx(Label, { className: "mb-2 block", children: "Account Type" }), _jsxs(ToggleGroup, { type: "single", value: accountType, onValueChange: (value) => value && setAccountType(value), className: "bg-gray-100 rounded-md p-1 justify-stretch", children: [_jsxs(ToggleGroupItem, { value: "regular", className: `flex-1 data-[state=on]:bg-white data-[state=on]:shadow-sm rounded-sm ${accountType === "regular"
                                                                ? "text-foreground"
                                                                : "text-muted-foreground"}`, children: [_jsx(User, { className: "h-4 w-4 mr-2" }), _jsx("span", { children: "Regular Account" })] }), _jsxs(ToggleGroupItem, { value: "university", className: `flex-1 data-[state=on]:bg-white data-[state=on]:shadow-sm rounded-sm ${accountType === "university"
                                                                ? "text-foreground"
                                                                : "text-muted-foreground"}`, children: [_jsx(School, { className: "h-4 w-4 mr-2" }), _jsx("span", { children: "University Account" })] })] })] }), _jsxs("form", { onSubmit: handleRegister, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-name", children: "Full Name" }), _jsxs("div", { className: "relative", children: [_jsx(UserCircle, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "register-name", placeholder: "Enter your full name", value: registerName, onChange: (e) => setRegisterName(e.target.value), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-email", children: "Email" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "register-email", type: "email", placeholder: accountType === "university"
                                                                        ? "Enter your university email"
                                                                        : "Enter your email address", value: registerEmail, onChange: (e) => setRegisterEmail(e.target.value), className: "pl-10", required: true })] })] }), accountType === "university" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "university-name", children: "University Name" }), _jsxs("div", { className: "relative", children: [_jsx(School, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "university-name", placeholder: "Enter your university name", value: universityName, onChange: (e) => setUniversityName(e.target.value), className: "pl-10", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "student-id", children: "Student ID (Optional)" }), _jsxs("div", { className: "relative", children: [_jsx(UserCircle, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "student-id", placeholder: "Enter your student ID", value: studentId, onChange: (e) => setStudentId(e.target.value), className: "pl-10" })] })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "register-password", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-3 h-4 w-4 text-muted-foreground" }), _jsx(Input, { id: "register-password", type: "password", placeholder: "Choose a password", value: registerPassword, onChange: (e) => setRegisterPassword(e.target.value), className: "pl-10", required: true })] })] }), _jsx("div", { className: "pt-2", children: _jsxs(Button, { type: "submit", className: "w-full", disabled: isRegisterLoading, children: [isRegisterLoading ? (_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" })) : null, accountType === "university"
                                                                ? "Create University Account"
                                                                : "Create Account"] }) })] })] }), _jsx(CardFooter, { className: "flex justify-center", children: _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Already have an account?", " ", _jsx(Link, { href: "/sign-in", className: "text-primary hover:underline", children: "Sign in" })] }) })] })] }) }), _jsx("div", { className: "hidden lg:w-1/2 lg:flex bg-primary p-8", children: _jsxs("div", { className: "m-auto max-w-lg text-primary-foreground", children: [_jsx("h1", { className: "text-5xl font-bold mb-6", children: "Accelerate Your Career Journey" }), _jsx("p", { className: "text-xl mb-8", children: "Your all-in-one platform for career development, resume building, interview preparation, and professional growth." }), _jsxs("div", { className: "space-y-4", children: [_jsx(FeatureItem, { icon: "\u2713", text: "AI-powered career coaching and goal tracking" }), _jsx(FeatureItem, { icon: "\u2713", text: "Resume and cover letter builder with AI suggestions" }), _jsx(FeatureItem, { icon: "\u2713", text: "Interactive interview preparation tools" }), _jsx(FeatureItem, { icon: "\u2713", text: "Gamified learning with XP and achievements" }), accountType === "university" && (_jsx(FeatureItem, { icon: "\u2713", text: "University-specific career resources and tracking" }))] })] }) })] }));
}
function FeatureItem({ icon, text }) {
    return (_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "bg-primary-foreground text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center", children: icon }), _jsx("div", { className: "text-primary-foreground", children: text })] }));
}
