import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
import supabaseClient from "@/lib/supabase-auth";
const SupabaseAuthContext = createContext(undefined);
export function SupabaseAuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        // Get initial session
        const initializeAuth = async () => {
            setIsLoading(true);
            try {
                // Check active session
                const { data: { session: activeSession } } = await supabaseClient.auth.getSession();
                setSession(activeSession);
                setUser(activeSession?.user || null);
            }
            catch (error) {
                console.error("Error fetching session:", error);
            }
            finally {
                setIsLoading(false);
            }
        };
        initializeAuth();
        // Set up auth state change listener
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, currentSession) => {

            setSession(currentSession);
            setUser(currentSession?.user || null);
            setIsLoading(false);
        });
        // Cleanup listener on unmount
        return () => {
            subscription.unsubscribe();
        };
    }, []);
    // Sign in with email and password
    const signIn = async (email, password) => {
        return supabaseClient.auth.signInWithPassword({ email, password });
    };
    // Sign up with email and password
    const signUp = async (email, password, userData = {}) => {
        return supabaseClient.auth.signUp({
            email,
            password,
            options: { data: userData }
        });
    };
    // Sign out
    const signOut = async () => {
        await supabaseClient.auth.signOut();
    };
    const value = {
        session,
        user,
        isLoading,
        signIn,
        signUp,
        signOut
    };
    return (_jsx(SupabaseAuthContext.Provider, { value: value, children: children }));
}
// Custom hook to use the auth context
export function useSupabaseAuth() {
    const context = useContext(SupabaseAuthContext);
    if (context === undefined) {
        throw new Error("useSupabaseAuth must be used within a SupabaseAuthProvider");
    }
    return context;
}
