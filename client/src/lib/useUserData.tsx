import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  userType: "regular" | "university_student" | "university_admin";
  universityId?: number;
  departmentId?: number;
  studentId?: string;
  graduationYear?: number;
  isUniversityStudent: boolean;
  xp: number;
  level: number;
  rank: string;
  profileImage?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string, loginType?: 'regular' | 'university') => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  refetchUser: () => Promise<User | null>;
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
      loginType?: 'regular' | 'university' 
    }) => {
      const res = await apiRequest('POST', '/api/auth/login', { username, password, loginType });
      const data = await res.json();
      return data.user as User;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/users/me'], data);
      setIsAuthenticated(true);
    },
  });

  const login = async (username: string, password: string, loginType?: 'regular' | 'university') => {
    return loginMutation.mutateAsync({ username, password, loginType });
  };

  const logout = () => {
    // In a real app, you would call an API to logout
    queryClient.setQueryData(['/api/users/me'], null);
    setIsAuthenticated(false);
  };

  const refetchUser = async () => {
    if (!isAuthenticated) return null;
    const result = await refetch();
    return result.data || null;
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
