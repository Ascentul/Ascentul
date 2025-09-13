import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
export default function AuthTest() {
    const [username, setUsername] = useState("alex");
    const [password, setPassword] = useState("password");
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    // Function to fetch the current user
    const fetchCurrentUser = async () => {
        try {
            setIsLoading(true);
            const response = await apiRequest("GET", "/api/users/me");
            const userData = await response.json();
            setCurrentUser(userData);
            toast({
                title: "Success",
                description: "Current user fetched successfully",
            });
        }
        catch (error) {
            console.error("Error fetching current user:", error);
            toast({
                title: "Error",
                description: "Failed to fetch current user",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    // Function to log in
    const handleLogin = async () => {
        try {
            setIsLoading(true);
            const response = await apiRequest("POST", "/api/auth/login", {
                username,
                password,
            });
            const data = await response.json();
            setCurrentUser(data.user);
            toast({
                title: "Login successful",
                description: `Welcome back, ${data.user.name}!`,
            });
        }
        catch (error) {
            console.error("Login error:", error);
            toast({
                title: "Login failed",
                description: "Invalid username or password",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    // Function to log out
    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await apiRequest("POST", "/api/auth/logout");
            setCurrentUser(null);
            toast({
                title: "Logout successful",
                description: "You have been logged out",
            });
        }
        catch (error) {
            console.error("Logout error:", error);
            toast({
                title: "Logout failed",
                description: "Something went wrong",
                variant: "destructive",
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    // Check current user on component mount
    useEffect(() => {
        fetchCurrentUser();
    }, []);
    return (_jsxs("div", { className: "container mx-auto p-4 max-w-md", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Authentication Test" }), _jsxs(Card, { className: "mb-6", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Login" }), _jsx(CardDescription, { children: "Enter your credentials to log in" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "grid gap-4", children: [_jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "username", children: "Username" }), _jsx(Input, { id: "username", value: username, onChange: (e) => setUsername(e.target.value), disabled: isLoading })] }), _jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "password", children: "Password" }), _jsx(Input, { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), disabled: isLoading })] })] }) }), _jsx(CardFooter, { children: _jsx(Button, { onClick: handleLogin, disabled: isLoading, children: isLoading ? "Loading..." : "Login" }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Current User" }), _jsx(CardDescription, { children: "User data from the session" })] }), _jsx(CardContent, { children: currentUser ? (_jsx("pre", { className: "bg-slate-100 p-2 rounded overflow-auto max-h-60", children: JSON.stringify(currentUser, null, 2) })) : (_jsx("p", { children: "No user is currently logged in" })) }), _jsxs(CardFooter, { className: "flex justify-between", children: [_jsx(Button, { onClick: fetchCurrentUser, disabled: isLoading, variant: "outline", children: "Refresh" }), currentUser && (_jsx(Button, { onClick: handleLogout, disabled: isLoading, variant: "destructive", children: "Logout" }))] })] })] }));
}
