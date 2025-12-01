'use client';

/**
 * University Layout
 *
 * Provides layout-level protection for all /university/* routes.
 * Users with university_admin, advisor, or super_admin roles can access these pages.
 *
 * This is an additional layer of protection beyond middleware.
 * Individual pages may still have their own authorization checks
 * for more granular control (e.g., advisor vs university_admin).
 */

import type { ReactNode } from 'react';

import { RequireRole } from '@/components/auth';

export default function UniversityLayout({ children }: { children: ReactNode }) {
  return (
    <RequireRole
      allowedRoles={['university_admin', 'advisor', 'super_admin']}
      redirectTo="/dashboard"
    >
      {children}
    </RequireRole>
  );
}
