'use client';

/**
 * RoleGate Component
 *
 * Conditionally renders children based on user's role.
 * Use this for role-based UI visibility in components.
 *
 * @example
 * ```tsx
 * <RoleGate allowedRoles={['super_admin', 'university_admin']}>
 *   <AdminPanel />
 * </RoleGate>
 *
 * // With fallback
 * <RoleGate
 *   allowedRoles={['advisor']}
 *   fallback={<p>You need advisor access to view this.</p>}
 * >
 *   <AdvisorDashboard />
 * </RoleGate>
 * ```
 */

import { useUser } from '@clerk/nextjs';
import type { ReactNode } from 'react';

import type { UserRole } from '@/lib/constants/roles';

interface RoleGateProps {
  /** Roles that are allowed to see the children */
  allowedRoles: UserRole[];
  /** Content to show if user has required role */
  children: ReactNode;
  /** Optional content to show if user doesn't have required role */
  fallback?: ReactNode;
  /** If true, shows loading spinner while checking auth */
  showLoading?: boolean;
}

export function RoleGate({
  allowedRoles,
  children,
  fallback = null,
  showLoading = false,
}: RoleGateProps) {
  const { user, isLoaded } = useUser();

  // Show loading state if requested
  if (!isLoaded) {
    if (showLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      );
    }
    return null;
  }

  // No user or no role - show fallback
  if (!user) {
    return <>{fallback}</>;
  }

  const userRole = user.publicMetadata?.role as UserRole | undefined;

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check if current user has any of the specified roles
 */
export function useHasRole(allowedRoles: UserRole[]): {
  hasRole: boolean;
  isLoaded: boolean;
  role: UserRole | undefined;
} {
  const { user, isLoaded } = useUser();

  const role = user?.publicMetadata?.role as UserRole | undefined;
  const hasRole = !!role && allowedRoles.includes(role);

  return { hasRole, isLoaded, role };
}

/**
 * Hook to get the current user's role
 */
export function useUserRole(): {
  role: UserRole | undefined;
  isLoaded: boolean;
  isSuperAdmin: boolean;
  isUniversityAdmin: boolean;
  isAdvisor: boolean;
  isStudent: boolean;
} {
  const { user, isLoaded } = useUser();

  const role = user?.publicMetadata?.role as UserRole | undefined;

  return {
    role,
    isLoaded,
    isSuperAdmin: role === 'super_admin',
    isUniversityAdmin: role === 'university_admin',
    isAdvisor: role === 'advisor',
    isStudent: role === 'student',
  };
}
