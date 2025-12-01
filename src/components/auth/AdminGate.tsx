'use client';

/**
 * AdminGate Component
 *
 * Shorthand component for super_admin-only content.
 * Wraps RoleGate with platform admin roles preset.
 *
 * @example
 * ```tsx
 * <AdminGate>
 *   <PlatformSettings />
 * </AdminGate>
 *
 * // With fallback
 * <AdminGate fallback={<p>Admin access required.</p>}>
 *   <SystemConfig />
 * </AdminGate>
 * ```
 */

import type { ReactNode } from 'react';

import { PLATFORM_ADMIN_ROLES } from '@/lib/constants/roles';

import { RoleGate } from './RoleGate';

interface AdminGateProps {
  /** Content to show if user is a platform admin */
  children: ReactNode;
  /** Optional content to show if user isn't a platform admin */
  fallback?: ReactNode;
  /** If true, shows loading spinner while checking auth */
  showLoading?: boolean;
}

/**
 * Gate for platform admin content (super_admin only)
 */
export function AdminGate({ children, fallback, showLoading }: AdminGateProps) {
  return (
    <RoleGate
      allowedRoles={[...PLATFORM_ADMIN_ROLES]}
      fallback={fallback}
      showLoading={showLoading}
    >
      {children}
    </RoleGate>
  );
}

/**
 * Gate for university admin content (university_admin + super_admin)
 */
export function UniversityAdminGate({ children, fallback, showLoading }: AdminGateProps) {
  return (
    <RoleGate
      allowedRoles={['university_admin', 'super_admin']}
      fallback={fallback}
      showLoading={showLoading}
    >
      {children}
    </RoleGate>
  );
}

/**
 * Gate for advisor content (advisor + university_admin + super_admin)
 */
export function AdvisorGate({ children, fallback, showLoading }: AdminGateProps) {
  return (
    <RoleGate
      allowedRoles={['advisor', 'university_admin', 'super_admin']}
      fallback={fallback}
      showLoading={showLoading}
    >
      {children}
    </RoleGate>
  );
}
