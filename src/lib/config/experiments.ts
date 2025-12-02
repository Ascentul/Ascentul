/**
 * A/B Experiments Module
 *
 * Lightweight in-code experiment system with deterministic bucketing.
 * Experiments are defined in code for simplicity; the database table
 * (experiment_configs) is available for future DB-driven experiments.
 *
 * ## Usage
 *
 * ```typescript
 * import { getExperimentVariant, EXPERIMENTS } from '@/lib/config/experiments';
 *
 * // Get variant for current user
 * const result = getExperimentVariant('onboarding_v2', {
 *   userId: user._id,
 *   tenantId: user.university_id ?? 'b2c_default',
 * });
 *
 * if (result.variant === 'treatment') {
 *   // Show new onboarding flow
 * }
 * ```
 *
 * ## Deterministic Bucketing
 *
 * Users are assigned to variants using FNV-1a hash of "{experimentId}:{userId}".
 * This ensures:
 * - Same user always gets same variant
 * - Distribution matches configured weights
 * - No need to store assignments (can be computed on demand)
 */

import type { ConfigContext, ExperimentConfig, ExperimentResult } from './types';

// ============================================================================
// EXPERIMENT REGISTRY
// ============================================================================

/**
 * Code-defined experiments.
 * Add new experiments here as your product evolves.
 *
 * Guidelines:
 * - Use descriptive IDs with version suffix (e.g., "onboarding_v2")
 * - Weights must sum to 100
 * - Set status to 'draft' until ready to launch
 * - After conclusion, set status to 'concluded' and winning_variant
 */
export const EXPERIMENTS: Record<string, ExperimentConfig> = {
  // Example: Onboarding flow experiment
  onboarding_v2: {
    id: 'onboarding_v2',
    name: 'Onboarding Flow V2',
    description: 'Testing new guided onboarding experience',
    status: 'draft', // Change to 'running' when ready
    variants: [
      { id: 'control', name: 'Current Flow', weight: 50 },
      { id: 'treatment', name: 'New Guided Flow', weight: 50 },
    ],
    userPercentage: 100,
  },

  // Example: Advisor dashboard layout experiment
  advisor_dashboard_layout: {
    id: 'advisor_dashboard_layout',
    name: 'Advisor Dashboard Layout',
    description: 'Testing compact vs expanded dashboard layout',
    status: 'draft',
    variants: [
      { id: 'control', name: 'Current Layout', weight: 80 },
      { id: 'compact', name: 'Compact Layout', weight: 20 },
    ],
    userPercentage: 100,
  },

  // Example: AI Coach nudge timing
  ai_coach_nudge_timing: {
    id: 'ai_coach_nudge_timing',
    name: 'AI Coach Nudge Timing',
    description: 'Testing different timing for AI coach engagement nudges',
    status: 'draft',
    variants: [
      { id: 'control', name: '24h delay', weight: 33 },
      { id: 'immediate', name: 'Immediate', weight: 34 },
      { id: 'contextual', name: 'Context-based', weight: 33 },
    ],
    userPercentage: 50, // Only 50% of users see any variant
  },
};

// ============================================================================
// DETERMINISTIC HASHING
// ============================================================================

/**
 * FNV-1a hash implementation.
 * Fast, non-cryptographic hash suitable for bucketing.
 *
 * @see https://en.wikipedia.org/wiki/Fowler–Noll–Vo_hash_function
 */
function fnv1aHash(str: string): number {
  const FNV_OFFSET_BASIS = 2166136261;
  const FNV_PRIME = 16777619;

  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }

  // Ensure positive 32-bit integer
  return hash >>> 0;
}

/**
 * Get a deterministic bucket (1-100) for a given key.
 */
function getBucket(experimentId: string, identifier: string): number {
  const key = `${experimentId}:${identifier}`;
  const hash = fnv1aHash(key);
  return (hash % 100) + 1; // 1-100
}

/**
 * Determine variant based on bucket and weights.
 */
function bucketToVariant(bucket: number, variants: ExperimentConfig['variants']): string {
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket <= cumulative) {
      return variant.id;
    }
  }
  // Fallback (shouldn't happen if weights sum to 100)
  return variants[0]?.id ?? 'control';
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Get the experiment variant for a user.
 *
 * @param experimentId - ID of the experiment
 * @param context - User context for bucketing
 * @returns Variant assignment result
 *
 * @example
 * ```typescript
 * const result = getExperimentVariant('onboarding_v2', {
 *   userId: user._id,
 *   tenantId: 'b2c_default',
 * });
 *
 * if (result.enrolled && result.variant === 'treatment') {
 *   showNewOnboarding();
 * }
 * ```
 */
export function getExperimentVariant(
  experimentId: string,
  context: ConfigContext,
): ExperimentResult {
  const experiment = EXPERIMENTS[experimentId];

  // Experiment not found or not running
  if (!experiment || experiment.status !== 'running') {
    return { variant: 'control', enrolled: false };
  }

  // Check tenant targeting (if specified)
  if (experiment.tenantIds && experiment.tenantIds.length > 0) {
    if (!experiment.tenantIds.includes(context.tenantId)) {
      return { variant: 'control', enrolled: false };
    }
  }

  // Get stable identifier for bucketing
  // Prefer userId, fall back to tenantId, then anonymousId
  const identifier = context.userId?.toString() ?? context.tenantId ?? context.anonymousId ?? '';

  if (!identifier) {
    // No identifier available - cannot bucket
    return { variant: 'control', enrolled: false };
  }

  // Check user percentage (traffic allocation)
  if (experiment.userPercentage !== undefined && experiment.userPercentage < 100) {
    const trafficBucket = getBucket(`${experimentId}:traffic`, identifier);
    if (trafficBucket > experiment.userPercentage) {
      // User not in experiment traffic
      return { variant: 'control', enrolled: false };
    }
  }

  // Assign variant based on bucket
  const variantBucket = getBucket(experimentId, identifier);
  const variant = bucketToVariant(variantBucket, experiment.variants);

  return { variant, enrolled: true };
}

/**
 * Check if a user is in a specific variant.
 * Convenience function for conditional rendering.
 *
 * @example
 * ```typescript
 * if (isInVariant('onboarding_v2', 'treatment', context)) {
 *   return <NewOnboarding />;
 * }
 * return <CurrentOnboarding />;
 * ```
 */
export function isInVariant(
  experimentId: string,
  variantId: string,
  context: ConfigContext,
): boolean {
  const result = getExperimentVariant(experimentId, context);
  return result.enrolled && result.variant === variantId;
}

/**
 * Get all active experiments for a user.
 * Returns only experiments where the user is enrolled.
 *
 * @example
 * ```typescript
 * const activeExperiments = getActiveExperiments(context);
 * // { onboarding_v2: 'treatment', advisor_dashboard: 'control' }
 * ```
 */
export function getActiveExperiments(context: ConfigContext): Record<string, string> {
  const results: Record<string, string> = {};

  for (const [id, experiment] of Object.entries(EXPERIMENTS)) {
    if (experiment.status !== 'running') continue;

    const result = getExperimentVariant(id, context);
    if (result.enrolled) {
      results[id] = result.variant;
    }
  }

  return results;
}

/**
 * List all defined experiments (for admin/debugging).
 */
export function listExperiments(): ExperimentConfig[] {
  return Object.values(EXPERIMENTS);
}

/**
 * Get experiment by ID.
 */
export function getExperiment(experimentId: string): ExperimentConfig | undefined {
  return EXPERIMENTS[experimentId];
}

// ============================================================================
// EXPERIMENT IDS (for type safety)
// ============================================================================

/**
 * Known experiment IDs.
 * Use these constants instead of string literals.
 */
export const EXPERIMENT_IDS = {
  ONBOARDING_V2: 'onboarding_v2',
  ADVISOR_DASHBOARD_LAYOUT: 'advisor_dashboard_layout',
  AI_COACH_NUDGE_TIMING: 'ai_coach_nudge_timing',
} as const;

export type ExperimentId = (typeof EXPERIMENT_IDS)[keyof typeof EXPERIMENT_IDS];

// Re-export types from types.ts for convenience
export type { ExperimentConfig, ExperimentResult, ExperimentVariant } from './types';
