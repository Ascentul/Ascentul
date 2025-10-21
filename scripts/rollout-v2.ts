/**
 * Resume Builder V2 - Cohort-Based Rollout Utility
 *
 * Enables gradual rollout of V2 features using deterministic user hashing.
 * This ensures users get a consistent experience across sessions.
 *
 * Usage:
 * 1. Set NEXT_PUBLIC_V2_ROLLOUT_PERCENT environment variable (0-100)
 * 2. Call isV2Enabled(userId) to check if user should see V2 features
 *
 * Rollout schedule:
 * - Week 1: 5% (internal team + early adopters)
 * - Week 2: 25% (monitor error rates and metrics)
 * - Week 3: 50% (if metrics look good)
 * - Week 4: 100% (GA)
 */

/**
 * Simple hash function for deterministic user bucketing
 * Uses FNV-1a algorithm for consistent, well-distributed hashing
 *
 * @param input - User ID or email to hash
 * @returns Hash value between 0 and 2^32-1
 */
function simpleHash(input: string): number {
  let hash = 2166136261; // FNV offset basis

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }

  return Math.abs(hash);
}

/**
 * Check if V2 features should be enabled for a specific user
 *
 * @param userId - Unique user identifier (email, clerk ID, etc.)
 * @param rolloutPercent - Percentage of users to enable (0-100)
 * @returns true if user is in the rollout cohort
 *
 * @example
 * // Enable for 25% of users
 * const v2Enabled = isV2Enabled(user.email, 25);
 *
 * // Use with environment variable
 * const rolloutPercent = parseInt(process.env.NEXT_PUBLIC_V2_ROLLOUT_PERCENT || '0');
 * const v2Enabled = isV2Enabled(user.id, rolloutPercent);
 */
export function isV2Enabled(userId: string, rolloutPercent: number): boolean {
  // Validate inputs
  if (!userId || userId.trim() === '') {
    return false;
  }

  if (rolloutPercent <= 0) {
    return false;
  }

  if (rolloutPercent >= 100) {
    return true;
  }

  // Use deterministic hash to bucket user
  const hash = simpleHash(userId);
  const bucket = hash % 100; // Map to 0-99

  return bucket < rolloutPercent;
}

/**
 * Get current rollout percentage from environment
 * @returns Rollout percentage (0-100)
 */
export function getRolloutPercent(): number {
  if (typeof window === 'undefined') {
    // Server-side: Use process.env
    return parseInt(process.env.NEXT_PUBLIC_V2_ROLLOUT_PERCENT || '0', 10);
  } else {
    // Client-side: Parse from window
    const percent = (window as any).__NEXT_DATA__?.props?.pageProps?.rolloutPercent;
    return percent || 0;
  }
}

/**
 * Check if V2 features should be enabled for current user
 * Combines feature flag and rollout percentage
 *
 * @param userId - User identifier
 * @returns true if V2 should be enabled
 *
 * @example
 * // In a React component or middleware
 * const shouldShowV2 = shouldEnableV2(user.id);
 *
 * if (shouldShowV2) {
 *   return <ResumeBuilderV2 />;
 * } else {
 *   return <ResumeBuilderV1 />;
 * }
 */
export function shouldEnableV2(userId: string): boolean {
  // Check master feature flag first
  const featureFlagEnabled = process.env.NEXT_PUBLIC_RESUME_V2_STORE === 'true';

  if (!featureFlagEnabled) {
    return false;
  }

  // Then check rollout percentage
  const rolloutPercent = getRolloutPercent();
  return isV2Enabled(userId, rolloutPercent);
}

/**
 * Testing utilities
 */
export const __testing = {
  simpleHash,

  /**
   * Verify hash distribution is reasonably uniform
   * Useful for validating rollout fairness
   */
  testDistribution(sampleSize = 10000): { [bucket: string]: number } {
    const buckets: { [key: number]: number } = {};

    for (let i = 0; i < sampleSize; i++) {
      const userId = `user-${i}@example.com`;
      const hash = simpleHash(userId);
      const bucket = hash % 100;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    }

    return buckets;
  },

  /**
   * Calculate expected vs actual rollout
   */
  testRolloutAccuracy(targetPercent: number, sampleSize = 10000): {
    target: number;
    actual: number;
    error: number;
  } {
    let enabledCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      const userId = `user-${i}@example.com`;
      if (isV2Enabled(userId, targetPercent)) {
        enabledCount++;
      }
    }

    const actualPercent = (enabledCount / sampleSize) * 100;
    const error = Math.abs(actualPercent - targetPercent);

    return {
      target: targetPercent,
      actual: actualPercent,
      error,
    };
  },
};
