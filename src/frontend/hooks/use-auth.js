import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext } from "react";
import { useQuery, useMutation, } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const { toast } = useToast();
    const { data: user, error, isLoading, } = useQuery({
        queryKey: ['/api/users/me'],
        queryFn: getQueryFn({ on401: "returnNull" }),
    });
    const loginMutation = useMutation({
        mutationFn: async (credentials) => {
            const res = await apiRequest("POST", "/auth/login", credentials);
            return await res.json();
        },
        onSuccess: (user) => {
            queryClient.setQueryData(['/api/users/me'], user);
            toast({
                title: "Login successful",
                description: `Welcome back, ${user.name}!`,
            });
        },
        onError: (error) => {
            toast({
                title: "Login failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const registerMutation = useMutation({
        mutationFn: async (userData) => {
            const res = await apiRequest("POST", "/auth/register", userData);
            return await res.json();
        },
        onSuccess: (user) => {
            queryClient.setQueryData(['/api/users/me'], user);
            toast({
                title: "Registration successful",
                description: `Welcome, ${user.name}!`,
            });
        },
        onError: (error) => {
            toast({
                title: "Registration failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const logoutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/auth/logout");
        },
        onSuccess: () => {
            queryClient.setQueryData(['/api/users/me'], null);
            toast({
                title: "Logged out",
                description: "You have been successfully logged out",
            });
        },
        onError: (error) => {
            toast({
                title: "Logout failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    // Check if user is admin (including super_admin)
    const isAdmin = user?.userType === 'admin' || user?.role === 'super_admin' || user?.role === 'admin';
    return (_jsx(AuthContext.Provider, { value: {
            user: user || null,
            isLoading,
            error,
            loginMutation,
            logoutMutation,
            registerMutation,
            isAdmin,
        }, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
