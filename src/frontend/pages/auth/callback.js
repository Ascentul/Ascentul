import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import supabaseClient from "@/lib/supabase-auth";
import { useToast } from "@/hooks/use-toast";
export default function AuthCallback() {
    const [, setLocation] = useLocation();
    const [isProcessing, setIsProcessing] = useState(true);
    const { toast } = useToast();
    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the current URL and extract any auth tokens
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const searchParams = new URLSearchParams(window.location.search);
                // Check for token in both hash and search params
                const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
                const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");
                const tokenType = hashParams.get("token_type") || searchParams.get("token_type");
                const type = hashParams.get("type") || searchParams.get("type");
                if (accessToken && refreshToken) {
                    // Set the session using the tokens
                    const { data, error } = await supabaseClient.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });
                    if (error) {
                        throw new Error(error.message);
                    }
                    if (data.user) {
                        // Fetch user profile to determine redirect
                        const { data: userData, error: userError } = await supabaseClient
                            .from("users")
                            .select("*")
                            .eq("email", data.user.email)
                            .single();
                        if (userError) {
                            console.error("Error fetching user data after auth:", userError);
                        }
                        // Handle different auth types
                        if (type === "recovery") {
                            toast({
                                title: "Password reset ready",
                                description: "You can now set your new password."
                            });
                            setLocation("/reset-password");
                            return;
                        }
                        // Regular magic link sign-in
                        toast({
                            title: "Successfully signed in!",
                            description: "Welcome back to Ascentul."
                        });
                        // Determine redirect path based on user type
                        const redirectPath = userData?.user_type === "university_student" ||
                            userData?.user_type === "university_admin"
                            ? "/university"
                            : userData?.onboarding_completed
                                ? "/dashboard"
                                : "/onboarding";
                        setLocation(redirectPath);
                    }
                    else {
                        throw new Error("No user data received");
                    }
                }
                else {
                    // Try to get existing session
                    const { data: { session }, error } = await supabaseClient.auth.getSession();
                    if (error) {
                        throw new Error(error.message);
                    }
                    if (session?.user) {
                        // User is already authenticated, redirect to appropriate page
                        const { data: userData } = await supabaseClient
                            .from("users")
                            .select("*")
                            .eq("email", session.user.email)
                            .single();
                        const redirectPath = userData?.user_type === "university_student" ||
                            userData?.user_type === "university_admin"
                            ? "/university"
                            : userData?.onboarding_completed
                                ? "/dashboard"
                                : "/onboarding";
                        setLocation(redirectPath);
                    }
                    else {
                        // No valid auth state, redirect to sign-in
                        toast({
                            title: "Authentication required",
                            description: "Please sign in to continue.",
                            variant: "destructive"
                        });
                        setLocation("/sign-in");
                    }
                }
            }
            catch (error) {
                console.error("Auth callback error:", error);
                toast({
                    title: "Authentication failed",
                    description: error instanceof Error
                        ? error.message
                        : "There was an error processing your authentication.",
                    variant: "destructive"
                });
                setLocation("/sign-in");
            }
            finally {
                setIsProcessing(false);
            }
        };
        handleAuthCallback();
    }, [setLocation, toast]);
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin mx-auto mb-4" }), _jsx("h2", { className: "text-lg font-semibold mb-2", children: "Processing authentication..." }), _jsx("p", { className: "text-muted-foreground", children: isProcessing
                        ? "Please wait while we sign you in."
                        : "Redirecting..." })] }) }));
}
