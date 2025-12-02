/**
 * useFeatureFlag Hook
 *
 * Client-side hook for checking feature flags with caching.
 * Uses Convex's built-in caching and reactivity.
 *
 * ## Platform vs Tenant Flags
 *
 * - `useFeatureFlag()` - Platform-wide flag (existing behavior)
 * - `useFeatureFlagWithTenant()` - Tenant-aware flag with override support
 *
 * @example
 * ```tsx
 * // Platform-wide flag (no tenant override)
 * const isEnabled = useFeatureFlag("advisor.dashboard");
 *
 * // Tenant-aware flag (with per-university overrides)
 * const isEnabled = useFeatureFlagWithTenant("advisor.dashboard");
 * ```
 */

import { useQuery } from 'convex/react';

import { useAuth } from '@/contexts/ClerkAuthProvider';
import { resolveTenantId } from '@/lib/config/types';

import { api } from '../../convex/_generated/api';

/**
 * Check if a single feature flag is enabled (platform-wide).
 *
 * @param flag - Feature flag key (e.g., "advisor.dashboard")
 * @returns boolean | undefined - true if enabled, false if disabled, undefined if loading
 *
 * @example
 * const isEnabled = useFeatureFlag("advisor.dashboard");
 * if (isEnabled) {
 *   // Show advisor dashboard
 * }
 */
export function useFeatureFlag(flag: string): boolean | undefined {
  const enabled = useQuery(api.feature_flags.getFeatureFlag, { flag });
  return enabled;
}

/**
 * Check if a single feature flag is enabled with tenant override support.
 *
 * Resolution order:
 * 1. Tenant override (if user's university has one)
 * 2. Platform-wide setting
 * 3. false (default)
 *
 * @param flag - Feature flag key (e.g., "advisor.dashboard")
 * @returns boolean | undefined - true if enabled, false if disabled, undefined if loading
 *
 * @example
 * const isEnabled = useFeatureFlagWithTenant("advisor.dashboard");
 * // Returns true if user's university has override=true,
 * // or platform flag is true, or false otherwise
 */
export function useFeatureFlagWithTenant(flag: string): boolean | undefined {
  // Auto-resolve tenant from user context
  const enabled = useQuery(api.tenant_feature_flags.getMyFeatureFlag, { flag });
  return enabled;
}

/**
 * Check multiple feature flags with tenant override support.
 *
 * @param flags - Array of feature flag keys
 * @returns Object mapping flag keys to boolean values, or undefined if loading
 *
 * @example
 * const flags = useFeatureFlagsWithTenant(["advisor.dashboard", "advisor.students"]);
 */
export function useFeatureFlagsWithTenant(flags: string[]): Record<string, boolean> | undefined {
  const { user } = useAuth();
  const tenantId = resolveTenantId(user?.university_id);

  const result = useQuery(api.tenant_feature_flags.getFeatureFlagsWithTenant, {
    flags,
    tenantId,
  });

  if (!result) return undefined;

  // Create defaults map to ensure all requested flags are present
  const defaults = Object.fromEntries(flags.map((flag) => [flag, false]));
  return { ...defaults, ...result };
}

/**
 * Check multiple feature flags at once
 *
 * @param flags - Array of feature flag keys
 * @returns Object mapping flag keys to boolean values, or undefined if loading
 *
 * @example
 * const flags = useFeatureFlags(["advisor.dashboard", "advisor.students"]);
 * if (flags?.["advisor.dashboard"]) {
 *   // Show dashboard
 * }
 */
export function useFeatureFlags(flags: string[]): Record<string, boolean> | undefined {
  const result = useQuery(api.feature_flags.getFeatureFlags, { flags });
  if (!result) return undefined;
  // Create defaults map to ensure all requested flags are present
  const defaults = Object.fromEntries(flags.map((flag) => [flag, false]));
  if (process.env.NODE_ENV === 'development') {
    const missingFlags = flags.filter((flag) => !(flag in result));
    if (missingFlags.length > 0) {
      console.warn('Feature flags not found in API response:', missingFlags);
    }
  }
  return { ...defaults, ...result };
}

/**
 * Advisor feature flags bundle
 * Optimized hook for all advisor-related flags
 *
 * @returns Object with advisor feature flags, or undefined if loading
 *
 * @example
 * const advisorFlags = useAdvisorFeatureFlags();
 * if (advisorFlags?.dashboard) {
 *   // Show advisor dashboard
 * }
 */
export function useAdvisorFeatureFlags():
  | {
      dashboard: boolean;
      students: boolean;
      advising: boolean;
      reviews: boolean;
      applications: boolean;
      analytics: boolean;
      support: boolean;
    }
  | undefined {
  const flags = useFeatureFlags([
    'advisor.dashboard',
    'advisor.students',
    'advisor.advising',
    'advisor.reviews',
    'advisor.applications',
    'advisor.analytics',
    'advisor.support',
  ]);

  if (!flags) return undefined;

  return {
    dashboard: flags['advisor.dashboard'],
    students: flags['advisor.students'],
    advising: flags['advisor.advising'],
    reviews: flags['advisor.reviews'],
    applications: flags['advisor.applications'],
    analytics: flags['advisor.analytics'],
    support: flags['advisor.support'],
  };
}
