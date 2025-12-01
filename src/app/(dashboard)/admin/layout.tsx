'use client';

/**
 * Admin Layout
 *
 * Provides layout-level protection for all /admin/* routes.
 * Only users with super_admin role can access these pages.
 *
 * This is an additional layer of protection beyond middleware.
 * Individual pages may still have their own authorization checks.
 */

import type { ReactNode } from 'react';

import { RequireSuperAdmin } from '@/components/auth';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RequireSuperAdmin redirectTo="/dashboard">{children}</RequireSuperAdmin>;
}
