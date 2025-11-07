/**
 * useFeatureFlag Hook
 *
 * Client-side hook for checking feature flags with caching
 * Uses Convex's built-in caching and reactivity
 */

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Check if a single feature flag is enabled
 *
 * @param flag - Feature flag key (e.g., "advisor.dashboard")
 * @returns boolean - true if enabled, false if disabled or loading
 *
 * @example
 * const isEnabled = useFeatureFlag("advisor.dashboard");
 * if (isEnabled) {
 *   // Show advisor dashboard
 * }
 */
export function useFeatureFlag(flag: string): boolean | undefined {
  const enabled = useQuery(api.feature_flags.getFeatureFlag, { flag });
  return enabled ?? undefined;
}

/**
 * Check multiple feature flags at once
 *
 * @param flags - Array of feature flag keys
 * @returns Object mapping flag keys to boolean values
 *
 * @example
 * const flags = useFeatureFlags(["advisor.dashboard", "advisor.students"]);
 * if (flags["advisor.dashboard"]) {
 *   // Show dashboard
 * }
 */
export function useFeatureFlags(flags: string[]): Record<string, boolean> {
  const result = useQuery(api.feature_flags.getFeatureFlags, { flags });
  return result || flags.reduce((acc, flag) => ({ ...acc, [flag]: false }), {});
}

/**
 * Advisor feature flags bundle
 * Optimized hook for all advisor-related flags
 *
 * @example
 * const advisorFlags = useAdvisorFeatureFlags();
 * if (advisorFlags.dashboard) {
 *   // Show advisor dashboard
 * }
 */
export function useAdvisorFeatureFlags() {
  const flags = useFeatureFlags([
    "advisor.dashboard",
    "advisor.students",
    "advisor.advising",
    "advisor.reviews",
    "advisor.applications",
    "advisor.analytics",
    "advisor.support",
  ]);

  return {
    dashboard: flags["advisor.dashboard"] ?? false,
    students: flags["advisor.students"] ?? false,
    advising: flags["advisor.advising"] ?? false,
    reviews: flags["advisor.reviews"] ?? false,
    applications: flags["advisor.applications"] ?? false,
    analytics: flags["advisor.analytics"] ?? false,
    support: flags["advisor.support"] ?? false,
  };
}
