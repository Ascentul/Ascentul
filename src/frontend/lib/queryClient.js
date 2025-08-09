import { QueryClient } from "@tanstack/react-query";
import supabaseClient from "./supabase-auth";
async function throwIfResNotOk(res) {
    if (!res.ok) {
        // Try to parse JSON response first
        let errorText = res.statusText;
        let errorMessage = "";
        try {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorJson = await res.clone().json();
                errorMessage = errorJson.error || errorJson.message || "";
            }
            if (!errorMessage) {
                errorText = await res.text();
            }
        }
        catch (e) {
            console.error("Error parsing error response:", e);
            errorText = (await res.text()) || res.statusText;
        }
        // Create a custom error with additional status information
        const error = new Error(errorMessage || `${res.status}: ${errorText}`);
        error.status = res.status;
        throw error;
    }
}
// Helper function to get the current Supabase session token
async function getSupabaseToken() {
    try {
        const { data } = await supabaseClient.auth.getSession();
        return data.session?.access_token || null;
    }
    catch (error) {
        console.error("Error getting Supabase token:", error);
        return null;
    }
}
// Implementation of apiRequest
export async function apiRequest(methodOrOptions, urlOrNothing, dataOrNothing) {
    let method;
    let url;
    let data;
    // Determine if we're using the object pattern or the separate arguments pattern
    if (typeof methodOrOptions === "object") {
        // Object pattern
        method = methodOrOptions.method || "GET";
        url = methodOrOptions.url;
        data = methodOrOptions.data;
    }
    else {
        // Separate arguments pattern
        method = methodOrOptions;
        url = urlOrNothing;
        data = dataOrNothing;
    }
    // Prepare headers
    const headers = {};
    // Add Content-Type for requests with body
    if (data) {
        headers["Content-Type"] = "application/json";
    }
    // Get Supabase token and add Authorization header
    const token = await getSupabaseToken();
    if (token) {
        console.log("Using Supabase JWT token for authentication");
        headers["Authorization"] = `Bearer ${token}`;
    }
    else {
        console.log("No Supabase token available, using dev fallback");
        // Fallback to dev token for development mode
        headers["Authorization"] = "Bearer dev_token";
    }
    // Check if user is logged out from localStorage
    const isLoggedOut = localStorage.getItem("auth-logout") === "true";
    if (isLoggedOut && url !== "/auth/login") {
        headers["X-Auth-Logout"] = "true";
    }
    // Clear the logout flag if this is a login request
    if (url === "/auth/login" && method === "POST") {
        localStorage.removeItem("auth-logout");
    }
    const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include" // This ensures cookies are sent with the request
    });
    // Debug authentication info
    console.log(`API Request to ${url}: Status ${res.status}, Auth: ${res.headers.get("x-auth-status") || "N/A"}`);
    await throwIfResNotOk(res);
    // If we're using the object pattern, assume they want JSON back
    if (typeof methodOrOptions === "object") {
        return (await res.json());
    }
    // Otherwise return the response object
    return res;
}
export const getQueryFn = (options) => {
    // Provide default empty object when no options are passed
    const { on401: unauthorizedBehavior = "throw" } = options || {};
    // Return the actual query function
    return async ({ queryKey }) => {
        // Create headers object
        const headers = {};
        // Get Supabase token and add Authorization header
        const token = await getSupabaseToken();
        if (token) {
            console.log("Using Supabase JWT token for query");
            headers["Authorization"] = `Bearer ${token}`;
        }
        else {
            console.log("No Supabase token available for query, using dev fallback");
            // Fallback to dev token for development mode
            headers["Authorization"] = "Bearer dev_token";
        }
        // Check if user is logged out from localStorage
        const isLoggedOut = localStorage.getItem("auth-logout") === "true";
        if (isLoggedOut) {
            headers["X-Auth-Logout"] = "true";
        }
        const res = await fetch(queryKey[0], {
            credentials: "include",
            headers
        });
        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
            return null;
        }
        await throwIfResNotOk(res);
        return await res.json();
    };
};
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: getQueryFn({ on401: "throw" }),
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: Infinity,
            retry: false
        },
        mutations: {
            retry: false
        }
    }
});
