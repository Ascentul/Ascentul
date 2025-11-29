/**
 * Centralized advisor feature flags
 *
 * Used by:
 * - convex/enable_advisor_features.ts (enable/disable all flags)
 * - convex/feature_flags.ts (initialize default flags)
 */

export const ADVISOR_FLAGS = [
  'advisor.dashboard',
  'advisor.students',
  'advisor.advising',
  'advisor.reviews',
  'advisor.applications',
  'advisor.analytics',
  'advisor.support',
] as const;

export type AdvisorFlag = (typeof ADVISOR_FLAGS)[number];
