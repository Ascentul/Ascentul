import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import supabaseClient from "@/lib/supabase-auth";
const UserContext = createContext(undefined);
export function UserProvider({ children }) {
    const queryClient = useQueryClient();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // Check Supabase auth session on load
    useEffect(() => {
        const checkAuthSession = async () => {
            const { data } = await supabaseClient.auth.getSession();
            setIsAuthenticated(!!data.session);
        };
        checkAuthSession();
        // Set up auth state change listener
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });
        return () => {
            subscription.unsubscribe();
        };
    }, []);
    // Custom query function for fetching user data - tries both API and Supabase
    const fetchUserData = async () => {
        try {
            // First check if we have a Supabase session
            const { data: authSession } = await supabaseClient.auth.getSession();
            if (!authSession.session) {
                console.log("No Supabase session found");
                return null;
            }
            console.log("Found Supabase session for user:", authSession.session.user.email);
            // Try the API endpoint with the Supabase token
            const token = authSession.session.access_token;
            const apiResponse = await fetch("/api/users/me", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });
            if (apiResponse.ok) {
                const userData = await apiResponse.json();
                console.log("Successfully fetched user data from API:", userData.name);
                console.log("API userData userType:", userData.userType, "role:", userData.role);
                return userData;
            }
            // If API fails, try getting user directly from Supabase
            console.log("API request failed, trying Supabase directly");
            const { data: authUser } = await supabaseClient.auth.getUser(token);
            if (!authUser.user) {
                return null;
            }
            // Fetch user profile from users table
            const { data: userData, error } = await supabaseClient
                .from("users")
                .select("*")
                .eq("id", authUser.user.id)
                .single();
            if (error || !userData) {
                console.error("Error fetching user data from Supabase:", error);
                return null;
            }
            console.log("Successfully fetched user data from Supabase:", userData.name);
            console.log("Supabase userData user_type:", userData.user_type, "role:", userData.role);
            // Map Supabase user to our User interface
            return {
                id: userData.id,
                username: userData.username,
                name: userData.name,
                email: userData.email,
                userType: userData.user_type,
                role: userData.role,
                universityId: userData.university_id,
                universityName: userData.university_name,
                isUniversityStudent: userData.user_type === "university_student",
                needsUsername: userData.needs_username,
                onboardingCompleted: userData.onboarding_completed,
                xp: userData.xp || 0,
                level: userData.level || 1,
                rank: userData.rank || "Beginner",
                profileImage: userData.profile_image,
                subscriptionPlan: (userData.subscription_plan || "free"),
                subscriptionStatus: (userData.subscription_status || "inactive"),
                subscriptionCycle: userData.subscription_cycle,
                stripeCustomerId: userData.stripe_customer_id,
                stripeSubscriptionId: userData.stripe_subscription_id,
                emailVerified: userData.email_verified || false
            };
        }
        catch (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
    };
    const { data: user, error, isLoading, refetch } = useQuery({
        queryKey: ["/api/users/me"],
        queryFn: fetchUserData,
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });
    const loginMutation = useMutation({
        mutationFn: async ({ email, password, loginType }) => {
            // Use Supabase auth for login
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            if (error) {
                throw new Error(error.message || "Login failed");
            }
            // Fetch user profile from the database to determine redirect
            const { data: userData, error: userError } = await supabaseClient
                .from("users")
                .select("*")
                .eq("email", email)
                .single();
            if (userError) {
                console.error("Error fetching user data after login:", userError);
                throw new Error("Error loading user profile");
            }
            // Map the Supabase user data to our User interface
            const mappedUser = {
                id: userData.id,
                username: userData.username,
                name: userData.name,
                email: userData.email,
                userType: userData.user_type,
                role: userData.role,
                universityId: userData.university_id,
                universityName: userData.university_name,
                isUniversityStudent: userData.user_type === "university_student",
                needsUsername: userData.needs_username,
                onboardingCompleted: userData.onboarding_completed,
                xp: userData.xp || 0,
                level: userData.level || 1,
                rank: userData.rank || "Beginner",
                profileImage: userData.profile_image,
                subscriptionPlan: (userData.subscription_plan || "free"),
                subscriptionStatus: (userData.subscription_status || "inactive"),
                subscriptionCycle: userData.subscription_cycle,
                stripeCustomerId: userData.stripe_customer_id,
                stripeSubscriptionId: userData.stripe_subscription_id,
                emailVerified: userData.email_verified || false
            };
            // Determine redirect path based on user type
            const redirectPath = userData.user_type === "university_student" ||
                userData.user_type === "university_admin"
                ? "/university"
                : userData.onboarding_completed
                    ? "/dashboard"
                    : "/onboarding";
            return {
                user: mappedUser,
                redirectPath
            };
        },
        onSuccess: (data) => {
            if (!data)
                return;
            const { user, redirectPath } = data;
            // Save user data to state
            queryClient.setQueryData(["/api/users/me"], user);
            setIsAuthenticated(true);
            // Force redirect using server-sent redirectPath
            if (redirectPath) {
                console.log("Redirecting to", redirectPath);
                window.location.href = redirectPath;
            }
        }
    });
    const login = async (email, password, loginType) => {
        // Clear any logout flag that might be set
        localStorage.removeItem("auth-logout");
        const result = await loginMutation.mutateAsync({
            email,
            password,
            loginType
        });
        // Return the full result object including redirectPath
        return result;
    };
    // Function to clear all cached user data and force fresh fetch
    const clearUserCache = () => {
        console.log("Clearing user cache and forcing fresh fetch...");
        // Clear React Query cache for user data
        queryClient.removeQueries({ queryKey: ["/api/users/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        // Clear any localStorage items that might be caching user data
        localStorage.removeItem("auth-logout");
        // Force refetch
        refetch();
    };
    const logout = async () => {
        try {
            console.log("Starting logout process...");
            // Sign out from Supabase
            await supabaseClient.auth.signOut();
            // Try the API logout as well for compatibility
            try {
                await apiRequest("POST", "/api/auth/logout");
            }
            catch (error) {
                console.warn("API logout failed, but Supabase logout succeeded");
            }
            // Clear all localStorage items that might contain auth data
            localStorage.clear();
            // Set the auth-logout flag in localStorage for future requests
            localStorage.setItem("auth-logout", "true");
            // Clear all React Query cache
            queryClient.clear();
            queryClient.setQueryData(["/api/users/me"], null);
            queryClient.removeQueries({ queryKey: ["/api/users/me"] });
            setIsAuthenticated(false);
            console.log("Logout completed, redirecting to sign-in...");
            // Force a hard redirect to completely reset the app state
            window.location.href = "/sign-in";
        }
        catch (error) {
            console.error("Logout error:", error);
            // Still clear local data and redirect even if the API call fails
            localStorage.clear();
            localStorage.setItem("auth-logout", "true");
            queryClient.clear();
            queryClient.setQueryData(["/api/users/me"], null);
            queryClient.removeQueries({ queryKey: ["/api/users/me"] });
            setIsAuthenticated(false);
            window.location.href = "/sign-in";
        }
    };
    const refetchUser = async () => {
        if (!isAuthenticated)
            return null;
        const result = await refetch();
        return result.data || null;
    };
    // Debug function to force clear all auth state (useful for development)
    const forceLogout = async () => {
        console.log("Force clearing all authentication state...");
        // Sign out from Supabase without waiting
        try {
            await supabaseClient.auth.signOut();
        }
        catch (e) {
            console.warn("Supabase signOut failed:", e);
        }
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        // Clear all React Query cache
        queryClient.clear();
        setIsAuthenticated(false);
        // Hard reload to reset everything
        window.location.reload();
    };
    // Make debug functions available globally for development
    useEffect(() => {
        if (typeof window !== "undefined" &&
            process.env.NODE_ENV === "development") {
            ;
            window.debugAuth = {
                forceLogout,
                clearCache: clearUserCache,
                currentUser: user,
                isAuthenticated
            };
        }
    }, [user, isAuthenticated]);
    const updateProfileMutation = useMutation({
        mutationFn: async (data) => {
            // Try updating via Supabase first
            try {
                // Get current auth user
                const { data: authUser } = await supabaseClient.auth.getUser();
                if (!authUser.user) {
                    throw new Error("Not authenticated");
                }
                // Update auth metadata if name is provided
                if (data.name) {
                    await supabaseClient.auth.updateUser({
                        data: { name: data.name }
                    });
                }
                // Update email if provided
                if (data.email) {
                    await supabaseClient.auth.updateUser({
                        email: data.email
                    });
                }
                // Update user profile in database
                const { data: updatedData, error } = await supabaseClient
                    .from("users")
                    .update({
                    name: data.name,
                    username: data.username,
                    profile_image: data.profileImage
                })
                    .eq("id", authUser.user.id)
                    .select()
                    .single();
                if (error) {
                    throw error;
                }
                // Map to our User type
                const mappedUser = {
                    id: updatedData.id,
                    username: updatedData.username,
                    name: updatedData.name,
                    email: updatedData.email,
                    userType: updatedData.user_type,
                    role: updatedData.role,
                    universityId: updatedData.university_id,
                    universityName: updatedData.university_name,
                    isUniversityStudent: updatedData.user_type === "university_student",
                    needsUsername: updatedData.needs_username,
                    onboardingCompleted: updatedData.onboarding_completed,
                    xp: updatedData.xp || 0,
                    level: updatedData.level || 1,
                    rank: updatedData.rank || "Beginner",
                    profileImage: updatedData.profile_image,
                    subscriptionPlan: (updatedData.subscription_plan || "free"),
                    subscriptionStatus: (updatedData.subscription_status ||
                        "inactive"),
                    subscriptionCycle: updatedData.subscription_cycle,
                    stripeCustomerId: updatedData.stripe_customer_id,
                    stripeSubscriptionId: updatedData.stripe_subscription_id,
                    emailVerified: updatedData.email_verified || false
                };
                return mappedUser;
            }
            catch (supabaseError) {
                console.error("Supabase update failed, falling back to API:", supabaseError);
                // Fall back to API endpoint if Supabase update fails
                const res = await apiRequest("PUT", "/api/users/profile", data);
                const responseData = await res.json();
                // Response data is the user object directly
                return responseData;
            }
        },
        onSuccess: (updatedUser) => {
            // Update the cache with the new user data
            queryClient.setQueryData(["/api/users/me"], updatedUser);
            // Also invalidate the cache to ensure fresh data on next fetch
            queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        }
    });
    const updateProfile = async (data) => {
        // Add a timestamp to force cache refresh if this is a profile image update
        if (data.profileImage) {
            data.profileImage = `${data.profileImage}?t=${new Date().getTime()}`;
            console.log("Setting profile image with timestamp:", data.profileImage);
        }
        return updateProfileMutation.mutateAsync(data);
    };
    const updateUser = (data) => {
        if (!user)
            return;
        // Add timestamp to profile image if it's being updated
        const updatedData = { ...data };
        if (updatedData.profileImage) {
            // If the URL already has a timestamp parameter, replace it
            if (updatedData.profileImage.includes("?")) {
                updatedData.profileImage =
                    updatedData.profileImage.split("?")[0] + `?t=${new Date().getTime()}`;
            }
            else {
                updatedData.profileImage = `${updatedData.profileImage}?t=${new Date().getTime()}`;
            }
            console.log("updateUser setting image with timestamp:", updatedData.profileImage);
        }
        queryClient.setQueryData(["/api/users/me"], { ...user, ...updatedData });
    };
    // Function to update theme settings
    const updateTheme = async (themeSettings) => {
        if (!user || !themeSettings)
            return;
        try {
            // Update theme.json via the fetch API
            const response = await fetch("/api/theme", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(themeSettings)
            });
            if (!response.ok) {
                throw new Error("Failed to update theme");
            }
            // Also update the user in the cache with the new theme settings
            updateUser({ theme: themeSettings });
            // In a real implementation with a server, we'd also need to save
            // the theme preference to the user's record in the database
            // For now, we'll directly update the theme.json file by simulating it
            // and reload the theme
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
        catch (error) {
            console.error("Error updating theme:", error);
            throw error;
        }
    };
    // Function to upload profile image and update the user profile
    const uploadProfileImage = async (imageDataUrl) => {
        if (!user)
            throw new Error("User not authenticated");
        try {
            console.log("Starting profile image save process...");
            // Try uploading to Supabase storage first
            try {
                const { data: authUser } = await supabaseClient.auth.getUser();
                if (!authUser.user) {
                    throw new Error("Not authenticated");
                }
                // Convert dataURL to file
                const base64Data = imageDataUrl.split(",")[1];
                const byteCharacters = atob(base64Data);
                const byteArrays = [];
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteArrays.push(byteCharacters.charCodeAt(i));
                }
                const byteArray = new Uint8Array(byteArrays);
                const blob = new Blob([byteArray], { type: "image/png" });
                const fileName = `profile-${authUser.user.id}-${Date.now()}.png`;
                // Upload to Supabase storage
                const { data: storageData, error: storageError } = await supabaseClient.storage
                    .from("profile-images")
                    .upload(fileName, blob);
                if (storageError) {
                    throw storageError;
                }
                // Get public URL
                const { data: publicUrlData } = supabaseClient.storage
                    .from("profile-images")
                    .getPublicUrl(fileName);
                const profileImage = publicUrlData.publicUrl;
                // Update user profile
                const { data: updatedUserData, error: updateError } = await supabaseClient
                    .from("users")
                    .update({ profile_image: profileImage })
                    .eq("id", authUser.user.id)
                    .select()
                    .single();
                if (updateError) {
                    throw updateError;
                }
                // Map to User type and return
                const updatedUser = {
                    id: updatedUserData.id,
                    username: updatedUserData.username,
                    name: updatedUserData.name,
                    email: updatedUserData.email,
                    userType: updatedUserData.user_type,
                    role: updatedUserData.role,
                    universityId: updatedUserData.university_id,
                    universityName: updatedUserData.university_name,
                    isUniversityStudent: updatedUserData.user_type === "university_student",
                    needsUsername: updatedUserData.needs_username,
                    onboardingCompleted: updatedUserData.onboarding_completed,
                    xp: updatedUserData.xp || 0,
                    level: updatedUserData.level || 1,
                    rank: updatedUserData.rank || "Beginner",
                    profileImage: `${profileImage}?t=${Date.now()}`, // Add timestamp
                    subscriptionPlan: (updatedUserData.subscription_plan ||
                        "free"),
                    subscriptionStatus: (updatedUserData.subscription_status ||
                        "inactive"),
                    subscriptionCycle: updatedUserData.subscription_cycle,
                    stripeCustomerId: updatedUserData.stripe_customer_id,
                    stripeSubscriptionId: updatedUserData.stripe_subscription_id,
                    emailVerified: updatedUserData.email_verified || false
                };
                // Update query cache
                queryClient.setQueryData(["/api/users/me"], updatedUser);
                return updatedUser;
            }
            catch (supabaseError) {
                console.error("Supabase upload failed, falling back to API:", supabaseError);
                // Fall back to legacy API
            }
            // Step 1: Upload image to server
            const uploadResponse = await fetch("/api/users/profile-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageDataUrl })
            });
            if (!uploadResponse.ok) {
                throw new Error("Failed to upload profile image");
            }
            const uploadData = await uploadResponse.json();
            if (!uploadData.profileImage) {
                throw new Error("Profile image URL not returned from server");
            }
            // Step 2: Update user profile with the new image URL
            const profileUpdateResponse = await fetch("/api/users/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    profileImage: uploadData.profileImage // Send without timestamp
                })
            });
            if (!profileUpdateResponse.ok) {
                throw new Error("Failed to update profile with new image");
            }
            const updatedUserData = await profileUpdateResponse.json();
            // Step 3: Update the local user state with the image URL plus cache-busting timestamp
            const timestamp = Date.now();
            const profileImageWithTimestamp = `${uploadData.profileImage}?t=${timestamp}`;
            const updatedUser = {
                ...updatedUserData,
                profileImage: profileImageWithTimestamp // Add timestamp to prevent browser caching
            };
            // Update query cache with the timestamped URL
            queryClient.setQueryData(["/api/users/me"], updatedUser);
            // Step 4: Manually trigger refetch to ensure consistency
            queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
            // Log success
            console.log("Image uploaded and profile updated successfully:", updatedUser);
            return updatedUser;
        }
        catch (error) {
            console.error("Error in uploadProfileImage:", error);
            throw error;
        }
    };
    return (_jsx(UserContext.Provider, { value: {
            user,
            isLoading,
            error,
            login,
            logout,
            forceLogout,
            refetchUser,
            updateProfile: updateProfileMutation.mutate,
            uploadProfileImage,
            clearUserCache,
            isAuthenticated
        }, children: children }));
}
export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
// Utility functions for managing user progress
export function useAddUserXP() {
    const queryClient = useQueryClient();
    const addXPMutation = useMutation({
        mutationFn: async ({ amount, source, description }) => {
            const res = await apiRequest("POST", "/api/users/xp", {
                amount,
                source,
                description
            });
            const data = await res.json();
            return data;
        },
        onSuccess: () => {
            // Refetch user data to get updated XP
            queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        }
    });
    return addXPMutation;
}
export function useUserStatistics() {
    return useQuery({
        queryKey: ["/api/users/statistics"]
    });
}
export function useUserXPHistory() {
    return useQuery({
        queryKey: ["/api/users/xp-history"]
    });
}
// User type helper hooks
export function useIsRegularUser() {
    const { user } = useUser();
    return !!user && (user.role === "user" || user.userType === "regular");
}
export function useIsUniversityStudent() {
    const { user } = useUser();
    return (!!user &&
        (user.role === "university_user" || user.userType === "university_student"));
}
export function useIsUniversityAdmin() {
    const { user } = useUser();
    return (!!user &&
        (user.role === "university_admin" || user.userType === "university_admin"));
}
export function useIsUniversityUser() {
    const { user } = useUser();
    return (!!user &&
        (user.role === "university_user" ||
            user.role === "university_admin" ||
            user.userType === "university_student" ||
            user.userType === "university_admin"));
}
// Check for any admin-like capabilities (broader definition, includes university admins)
export function useIsAdminUser() {
    const { user } = useUser();
    return (!!user &&
        (user.role === "super_admin" ||
            user.role === "admin" ||
            user.userType === "admin" ||
            user.id === 1));
}
// Check specifically for Ascentul system administrators
export function useIsSystemAdmin() {
    const { user } = useUser();
    return (!!user &&
        (user.role === "super_admin" ||
            user.role === "admin" ||
            user.userType === "admin" ||
            user.id === 1));
}
export function useIsStaffUser() {
    const { user } = useUser();
    return (!!user &&
        (user.role === "staff" ||
            user.role === "admin" ||
            user.role === "super_admin" ||
            user.userType === "staff" ||
            user.userType === "admin"));
}
// Subscription helper hooks
export function useIsSubscriptionActive() {
    const { user } = useUser();
    return !!user && user.subscriptionStatus === "active";
}
export function useUserPlan() {
    const { user } = useUser();
    return user?.subscriptionPlan || "free";
}
export function useCanAccessPremiumFeature() {
    const { user } = useUser();
    return (!!user &&
        (user.subscriptionPlan === "premium" ||
            user.subscriptionPlan === "university") &&
        user.subscriptionStatus === "active");
}
export function useUpdateUserSubscription() {
    const queryClient = useQueryClient();
    const updateSubscriptionMutation = useMutation({
        mutationFn: async ({ subscriptionPlan, subscriptionStatus, subscriptionCycle, stripeCustomerId, stripeSubscriptionId, subscriptionExpiresAt }) => {
            const res = await apiRequest("PUT", "/api/users/subscription", {
                subscriptionPlan,
                subscriptionStatus,
                subscriptionCycle,
                stripeCustomerId,
                stripeSubscriptionId,
                subscriptionExpiresAt
            });
            const data = await res.json();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        }
    });
    return updateSubscriptionMutation;
}
export function useVerifyEmail() {
    const queryClient = useQueryClient();
    const verifyEmailMutation = useMutation({
        mutationFn: async (token) => {
            const res = await apiRequest("POST", "/api/auth/verify-email", { token });
            const data = await res.json();
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        }
    });
    return verifyEmailMutation;
}
export function useSendVerificationEmail() {
    const sendVerificationMutation = useMutation({
        mutationFn: async (email) => {
            const res = await apiRequest("POST", "/api/auth/send-verification-email", { email });
            const data = await res.json();
            return data;
        }
    });
    return sendVerificationMutation;
}
// Hook for changing email
export function useChangeEmail() {
    const queryClient = useQueryClient();
    const changeEmailMutation = useMutation({
        mutationFn: async ({ email, currentPassword }) => {
            const res = await apiRequest("POST", "/api/auth/send-email-change-verification", {
                email,
                currentPassword
            });
            const data = await res.json();
            return data;
        },
        onSuccess: () => {
            // Refetch user data to reflect pending email change
            queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        }
    });
    return changeEmailMutation;
}
// Hook for verifying email change
export function useVerifyEmailChange() {
    const queryClient = useQueryClient();
    const verifyEmailChangeMutation = useMutation({
        mutationFn: async (token) => {
            const res = await apiRequest("GET", `/api/auth/verify-email-change?token=${token}`);
            const data = await res.json();
            return data;
        },
        onSuccess: () => {
            // Refetch user data to reflect email change
            queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        }
    });
    return verifyEmailChangeMutation;
}
// Hook for changing password
export function useChangePassword() {
    const queryClient = useQueryClient();
    const changePasswordMutation = useMutation({
        mutationFn: async ({ currentPassword, newPassword }) => {
            const res = await apiRequest("POST", "/api/auth/change-password", {
                currentPassword,
                newPassword
            });
            const data = await res.json();
            return data;
        },
        onSuccess: () => {
            // Optionally refetch user data if needed
            queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
        }
    });
    return changePasswordMutation;
}
