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
 * Check multiple feature flags at once
 *
 * @param flags - Array of feature flag keys
 * @returns Object mapping flag keys to boolean values (guaranteed to include all requested flags)
 *
 * @example
 * const flags = useFeatureFlags(["advisor.dashboard", "advisor.students"]);
 * if (flags["advisor.dashboard"]) {
 *   // Show dashboard
 * }
 */
export function useFeatureFlags(flags: string[]): Record<string, boolean> {
  const result = useQuery(api.feature_flags.getFeatureFlags, { flags });
  // Create defaults map with all flags set to false (optimized with Object.fromEntries)
  const defaults = Object.fromEntries(flags.map(flag => [flag, false]));
  // Merge result with defaults to ensure all flags are present
  return result ? { ...defaults, ...result } : defaults;
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

  // No need for ?? false since useFeatureFlags guarantees all flags are present
  return {
    dashboard: flags["advisor.dashboard"],
    students: flags["advisor.students"],
    advising: flags["advisor.advising"],
    reviews: flags["advisor.reviews"],
    applications: flags["advisor.applications"],
    analytics: flags["advisor.analytics"],
    support: flags["advisor.support"],
  };
}
