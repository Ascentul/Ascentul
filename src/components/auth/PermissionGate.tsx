'use client';

/**
 * PermissionGate Component
 *
 * Conditionally renders children based on user's permissions.
 * Use this for fine-grained, action-level access control.
 *
 * @example
 * ```tsx
 * // Simple permission check
 * <PermissionGate permission="university.students.manage">
 *   <StudentManagementPanel />
 * </PermissionGate>
 *
 * // With resource context (ownership check)
 * <PermissionGate
 *   permission="student.applications.manage"
 *   resourceOwnerId={application.user_id}
 * >
 *   <EditApplicationButton />
 * </PermissionGate>
 *
 * // With university scope
 * <PermissionGate
 *   permission="university.settings.manage"
 *   resourceUniversityId={university._id}
 * >
 *   <UniversitySettings />
 * </PermissionGate>
 * ```
 */

import { useUser } from '@clerk/nextjs';
import type { ReactNode } from 'react';

import type { UserRole } from '@/lib/constants/roles';

// Permission definitions (mirrored from backend for consistency)
// Keep in sync with convex/lib/permissions.ts
const PERMISSIONS = {
  // Platform-level
  'platform.settings.view': ['super_admin'],
  'platform.settings.manage': ['super_admin'],
  'platform.users.view': ['super_admin'],
  'platform.users.manage': ['super_admin'],
  'platform.universities.view': ['super_admin'],
  'platform.universities.manage': ['super_admin'],
  'platform.analytics.view': ['super_admin'],
  'platform.audit.view': ['super_admin'],

  // University-level
  'university.settings.view': ['super_admin', 'university_admin'],
  'university.settings.manage': ['super_admin', 'university_admin'],
  'university.students.view': ['super_admin', 'university_admin', 'advisor'],
  'university.students.manage': ['super_admin', 'university_admin'],
  'university.advisors.view': ['super_admin', 'university_admin'],
  'university.advisors.manage': ['super_admin', 'university_admin'],
  'university.analytics.view': ['super_admin', 'university_admin', 'advisor'],
  'university.data.export': ['super_admin', 'university_admin'],

  // Advisor-level
  'advisor.students.view': ['super_admin', 'university_admin', 'advisor'],
  'advisor.students.assign': ['super_admin', 'university_admin'],
  'advisor.notes.view': ['super_admin', 'university_admin', 'advisor'],
  'advisor.notes.create': ['super_admin', 'university_admin', 'advisor'],

  // Student-level (self-service)
  'student.profile.view': ['super_admin', 'university_admin', 'advisor', 'student', 'individual'],
  'student.profile.edit': ['student', 'individual'],
  'student.applications.view': [
    'super_admin',
    'university_admin',
    'advisor',
    'student',
    'individual',
  ],
  'student.applications.manage': ['student', 'individual'],
  'student.resumes.view': ['super_admin', 'university_admin', 'advisor', 'student', 'individual'],
  'student.resumes.manage': ['student', 'individual'],
  'student.goals.view': ['super_admin', 'university_admin', 'advisor', 'student', 'individual'],
  'student.goals.manage': ['student', 'individual'],

  // Career tools
  'tools.ai_coach.use': [
    'super_admin',
    'university_admin',
    'advisor',
    'student',
    'individual',
    'staff',
    'user',
  ],
  'tools.resume_builder.use': [
    'super_admin',
    'university_admin',
    'advisor',
    'student',
    'individual',
    'staff',
    'user',
  ],
} as const;

type Permission = keyof typeof PERMISSIONS;

interface PermissionGateProps {
  /** The permission to check */
  permission: Permission;
  /** Content to show if user has permission */
  children: ReactNode;
  /** Optional content to show if user doesn't have permission */
  fallback?: ReactNode;
  /** Resource owner ID for ownership checks (self-only permissions) */
  resourceOwnerId?: string;
  /** University ID for tenant-scoped permissions */
  resourceUniversityId?: string;
  /** If true, shows loading spinner while checking auth */
  showLoading?: boolean;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
  resourceOwnerId,
  resourceUniversityId,
  showLoading = false,
}: PermissionGateProps) {
  const { user, isLoaded } = useUser();

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

  if (!user) {
    return <>{fallback}</>;
  }

  const userRole = user.publicMetadata?.role as UserRole | undefined;
  const userId = user.id;
  const userUniversityId = user.publicMetadata?.university_id as string | undefined;

  if (!userRole) {
    return <>{fallback}</>;
  }

  // Check if user has the permission
  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  if (!allowedRoles || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  // Super admin bypasses all context checks
  if (userRole === 'super_admin') {
    return <>{children}</>;
  }

  // Check self-only permissions (user can only act on their own resources)
  const selfOnlyPermissions: Permission[] = [
    'student.profile.edit',
    'student.applications.manage',
    'student.resumes.manage',
    'student.goals.manage',
  ];

  if (selfOnlyPermissions.includes(permission) && resourceOwnerId) {
    // Compare Clerk ID or Convex ID
    if (resourceOwnerId !== userId) {
      return <>{fallback}</>;
    }
  }

  // Check university-scoped permissions
  const universityScopedPrefixes = ['university.', 'advisor.'];
  const isUniversityScoped = universityScopedPrefixes.some((prefix) =>
    permission.startsWith(prefix),
  );

  if (isUniversityScoped && resourceUniversityId) {
    if (!userUniversityId || userUniversityId !== resourceUniversityId) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

/**
 * Hook to check if current user has a specific permission
 */
export function useHasPermission(
  permission: Permission,
  context?: {
    resourceOwnerId?: string;
    resourceUniversityId?: string;
  },
): {
  hasPermission: boolean;
  isLoaded: boolean;
} {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return { hasPermission: false, isLoaded };
  }

  const userRole = user.publicMetadata?.role as UserRole | undefined;
  const userId = user.id;
  const userUniversityId = user.publicMetadata?.university_id as string | undefined;

  if (!userRole) {
    return { hasPermission: false, isLoaded };
  }

  // Check role-based permission
  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  if (!allowedRoles || !allowedRoles.includes(userRole)) {
    return { hasPermission: false, isLoaded };
  }

  // Super admin always has permission
  if (userRole === 'super_admin') {
    return { hasPermission: true, isLoaded };
  }

  // Check ownership for self-only permissions
  const selfOnlyPermissions: Permission[] = [
    'student.profile.edit',
    'student.applications.manage',
    'student.resumes.manage',
    'student.goals.manage',
  ];

  if (selfOnlyPermissions.includes(permission) && context?.resourceOwnerId) {
    if (context.resourceOwnerId !== userId) {
      return { hasPermission: false, isLoaded };
    }
  }

  // Check university scope
  const universityScopedPrefixes = ['university.', 'advisor.'];
  const isUniversityScoped = universityScopedPrefixes.some((prefix) =>
    permission.startsWith(prefix),
  );

  if (isUniversityScoped && context?.resourceUniversityId) {
    if (!userUniversityId || userUniversityId !== context.resourceUniversityId) {
      return { hasPermission: false, isLoaded };
    }
  }

  return { hasPermission: true, isLoaded };
}
