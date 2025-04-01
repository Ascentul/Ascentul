import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  userType: "regular" | "university_student" | "university_admin" | "admin" | "staff";
  universityId?: number;
  departmentId?: number;
  studentId?: string;
  graduationYear?: number;
  isUniversityStudent: boolean;
  needsUsername?: boolean;
  xp: number;
  level: number;
  rank: string;
  profileImage?: string;
  subscriptionPlan: "free" | "premium" | "university";
  subscriptionStatus: "active" | "inactive" | "cancelled" | "past_due";
  subscriptionCycle?: "monthly" | "quarterly" | "annual";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionExpiresAt?: Date;
  emailVerified: boolean;
  pendingEmail?: string; // Added for email change verification workflow
  passwordLastChanged?: Date; // Added for password change tracking
  passwordLength?: number; // Added for password display purposes
  redirectPath?: string; // Added for role-based redirection after login
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string, loginType?: 'regular' | 'university' | 'staff' | 'admin') => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  refetchUser: () => Promise<User | null>;
  updateProfile: (data: { name?: string; email?: string; username?: string; profileImage?: string }) => Promise<User>;
  updateUser: (data: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to true for demo

  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<User | null, Error>({
    queryKey: ['/api/users/me'],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async ({ 
      username, 
      password, 
      loginType 
    }: { 
      username: string; 
      password: string; 
      loginType?: 'regular' | 'university' | 'staff' | 'admin' 
    }) => {
      const res = await apiRequest('POST', '/api/auth/login', { username, password, loginType });
      const data = await res.json();
      // Return both user and redirectPath from the server response
      return {
        user: data.user as User,
        redirectPath: data.redirectPath
      };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/users/me'], data.user);
      setIsAuthenticated(true);
      
      // Use the redirect path provided by the server, or fall back to role-based redirect
      if (data.redirectPath) {
        window.location.href = data.redirectPath;
      } else {
        // Fall back to role-based redirection
        const user = data.user;
        if (user.userType === 'admin') {
          window.location.href = '/admin';
        } else if (user.userType === 'staff') {
          window.location.href = '/staff';
        } else if (user.userType === 'university_admin' || user.userType === 'university_student') {
          window.location.href = '/university';
        } else { // regular user
          window.location.href = '/dashboard';
        }
      }
    },
  });

  // Helper function to determine the redirect path based on user role
  const getRedirectPathByRole = (userType: string): string => {
    switch (userType) {
      case 'admin':
        return '/admin';
      case 'staff':
        return '/staff';
      case 'university_student':
      case 'university_admin':
        return '/university';
      case 'regular':
      default:
        return '/dashboard';
    }
  };

  const login = async (username: string, password: string, loginType?: 'regular' | 'university' | 'staff' | 'admin') => {
    // Clear any logout flag that might be set
    localStorage.removeItem('auth-logout');
    
    const result = await loginMutation.mutateAsync({ username, password, loginType });
    return result.user;
  };

  const logout = () => {
    // Make an API call to logout
    apiRequest('POST', '/api/auth/logout')
      .then((response) => {
        // Check for the special header we added for logout
        const logoutHeader = response.headers.get('X-Auth-Logout');
        
        // Set the auth-logout flag in localStorage for future requests
        localStorage.setItem('auth-logout', 'true');
        
        // Clear local data
        queryClient.setQueryData(['/api/users/me'], null);
        setIsAuthenticated(false);
        
        // Redirect to sign-in page
        window.location.href = '/sign-in';
      })
      .catch(error => {
        console.error('Logout error:', error);
        // Still clear local data and redirect even if the API call fails
        localStorage.setItem('auth-logout', 'true');
        queryClient.setQueryData(['/api/users/me'], null);
        setIsAuthenticated(false);
        window.location.href = '/sign-in';
      });
  };

  const refetchUser = async () => {
    if (!isAuthenticated) return null;
    const result = await refetch();
    return result.data || null;
  };
  
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; email?: string; username?: string; profileImage?: string }) => {
      const res = await apiRequest('PUT', '/api/users/profile', data);
      const responseData = await res.json();
      // Response data is the user object directly
      return responseData as User;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['/api/users/me'], updatedUser);
    },
  });
  
  const updateProfile = async (data: { name?: string; email?: string; username?: string; profileImage?: string }) => {
    return updateProfileMutation.mutateAsync(data);
  };
  
  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    queryClient.setQueryData(['/api/users/me'], { ...user, ...data });
  };

  return (
    <UserContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        login,
        logout,
        isAuthenticated,
        refetchUser,
        updateProfile,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Utility functions for managing user progress
export function useAddUserXP() {
  const queryClient = useQueryClient();
  
  const addXPMutation = useMutation({
    mutationFn: async ({ amount, source, description }: { amount: number; source: string; description?: string }) => {
      const res = await apiRequest('POST', '/api/users/xp', { amount, source, description });
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      // Refetch user data to get updated XP
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
  });
  
  return addXPMutation;
}

export function useUserStatistics() {
  return useQuery({
    queryKey: ['/api/users/statistics'],
  });
}

export function useUserXPHistory() {
  return useQuery({
    queryKey: ['/api/users/xp-history'],
  });
}

// User type helper hooks
export function useIsRegularUser() {
  const { user } = useUser();
  return !!user && user.userType === 'regular';
}

export function useIsUniversityStudent() {
  const { user } = useUser();
  return !!user && user.userType === 'university_student';
}

export function useIsUniversityAdmin() {
  const { user } = useUser();
  return !!user && user.userType === 'university_admin';
}

export function useIsUniversityUser() {
  const { user } = useUser();
  return !!user && (user.userType === 'university_student' || user.userType === 'university_admin');
}

export function useIsAdminUser() {
  const { user } = useUser();
  return !!user && (user.userType === 'admin' || user.userType === 'university_admin' || user.id === 1);
}

export function useIsStaffUser() {
  const { user } = useUser();
  return !!user && (user.userType === 'staff' || user.userType === 'admin');
}

// Subscription helper hooks
export function useIsSubscriptionActive() {
  const { user } = useUser();
  return !!user && user.subscriptionStatus === 'active';
}

export function useUserPlan() {
  const { user } = useUser();
  return user?.subscriptionPlan || 'free';
}

export function useCanAccessPremiumFeature() {
  const { user } = useUser();
  return !!user && (
    (user.subscriptionPlan === 'premium' || user.subscriptionPlan === 'university') && 
    user.subscriptionStatus === 'active'
  );
}

export function useUpdateUserSubscription() {
  const queryClient = useQueryClient();
  
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ 
      subscriptionPlan, 
      subscriptionStatus,
      subscriptionCycle,
      stripeCustomerId,
      stripeSubscriptionId,
      subscriptionExpiresAt
    }: { 
      subscriptionPlan?: 'free' | 'premium' | 'university';
      subscriptionStatus?: 'active' | 'inactive' | 'cancelled' | 'past_due';
      subscriptionCycle?: 'monthly' | 'quarterly' | 'annual';
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
      subscriptionExpiresAt?: Date;
    }) => {
      const res = await apiRequest('PUT', '/api/users/subscription', {
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
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
  });
  
  return updateSubscriptionMutation;
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();
  
  const verifyEmailMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest('POST', '/api/auth/verify-email', { token });
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
  });
  
  return verifyEmailMutation;
}

export function useSendVerificationEmail() {
  const sendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest('POST', '/api/auth/send-verification-email', { email });
      const data = await res.json();
      return data;
    },
  });
  
  return sendVerificationMutation;
}

// Hook for changing email
export function useChangeEmail() {
  const queryClient = useQueryClient();
  
  const changeEmailMutation = useMutation({
    mutationFn: async ({ email, currentPassword }: { email: string; currentPassword: string }) => {
      const res = await apiRequest('POST', '/api/auth/send-email-change-verification', { 
        email, 
        currentPassword 
      });
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      // Refetch user data to reflect pending email change
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
  });
  
  return changeEmailMutation;
}

// Hook for verifying email change
export function useVerifyEmailChange() {
  const queryClient = useQueryClient();
  
  const verifyEmailChangeMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest('GET', `/api/auth/verify-email-change?token=${token}`);
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      // Refetch user data to reflect email change
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
  });
  
  return verifyEmailChangeMutation;
}

// Hook for changing password
export function useChangePassword() {
  const queryClient = useQueryClient();
  
  const changePasswordMutation = useMutation({
    mutationFn: async ({ 
      currentPassword, 
      newPassword 
    }: { 
      currentPassword: string; 
      newPassword: string;
    }) => {
      const res = await apiRequest('POST', '/api/auth/change-password', { 
        currentPassword, 
        newPassword 
      });
      const data = await res.json();
      return data;
    },
    onSuccess: () => {
      // Optionally refetch user data if needed
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
  });
  
  return changePasswordMutation;
}
