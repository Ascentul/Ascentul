'use client';

/**
 * RequireRole Component
 *
 * Enforces role requirements at the layout level with redirect behavior.
 * Unlike RoleGate (which conditionally renders), RequireRole redirects
 * unauthorized users to an appropriate page.
 *
 * Use in layout.tsx files for route-level protection:
 *
 * @example
 * ```tsx
 * // src/app/(dashboard)/admin/layout.tsx
 * export default function AdminLayout({ children }) {
 *   return (
 *     <RequireRole
 *       allowedRoles={['super_admin']}
 *       redirectTo="/dashboard"
 *     >
 *       {children}
 *     </RequireRole>
 *   );
 * }
 * ```
 */

import { useUser } from '@clerk/nextjs';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type { UserRole } from '@/lib/constants/roles';

interface RequireRoleProps {
  /** Roles that are allowed to access this route */
  allowedRoles: UserRole[];
  /** Content to show if user has required role */
  children: ReactNode;
  /** Where to redirect unauthorized users (default: /dashboard) */
  redirectTo?: string;
  /** Custom message to show while checking auth (optional) */
  loadingMessage?: string;
}

export function RequireRole({
  allowedRoles,
  children,
  redirectTo = '/dashboard',
  loadingMessage = 'Verifying access...',
}: RequireRoleProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    // No user - redirect to sign in
    if (!user) {
      router.replace('/sign-in');
      return;
    }

    const userRole = user.publicMetadata?.role as UserRole | undefined;

    // Check if user has required role
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Not authorized - redirect
      setIsAuthorized(false);
      router.replace(redirectTo);
      return;
    }

    // User is authorized
    setIsAuthorized(true);
  }, [isLoaded, user, allowedRoles, redirectTo, router]);

  // Loading state while checking auth
  if (!isLoaded || isAuthorized === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <p className="text-sm text-neutral-600">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  // Redirecting (show brief message)
  if (isAuthorized === false) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="h-8 w-8 text-amber-500" />
          <p className="text-sm text-neutral-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}

/**
 * Shorthand for requiring super_admin role
 */
export function RequireSuperAdmin({
  children,
  redirectTo = '/dashboard',
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  return (
    <RequireRole allowedRoles={['super_admin']} redirectTo={redirectTo}>
      {children}
    </RequireRole>
  );
}

/**
 * Shorthand for requiring university_admin or super_admin role
 */
export function RequireUniversityAdmin({
  children,
  redirectTo = '/dashboard',
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  return (
    <RequireRole allowedRoles={['university_admin', 'super_admin']} redirectTo={redirectTo}>
      {children}
    </RequireRole>
  );
}

/**
 * Shorthand for requiring advisor, university_admin, or super_admin role
 */
export function RequireAdvisor({
  children,
  redirectTo = '/dashboard',
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  return (
    <RequireRole
      allowedRoles={['advisor', 'university_admin', 'super_admin']}
      redirectTo={redirectTo}
    >
      {children}
    </RequireRole>
  );
}
