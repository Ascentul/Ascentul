/**
 * Server-side Feature Flag Utilities
 *
 * Helpers for checking feature flags in Convex mutations and queries
 */

import { QueryCtx, MutationCtx } from '../_generated/server'
import { Id } from '../_generated/dataModel'

/**
 * Check if feature is enabled for a user
 *
 * This is a convenience wrapper around the feature_flags table query
 * Use this in mutations/queries to gate features
 */
export async function isFeatureEnabledForUser(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  flagKey: string
): Promise<boolean> {
  const flag = await ctx.db
    .query('feature_flags')
    .withIndex('by_flag_key', (q) => q.eq('flag_key', flagKey))
    .unique()

  // If flag doesn't exist or is globally disabled, return false
  if (!flag || !flag.enabled) {
    return false
  }

  // Check user whitelist
  if (flag.whitelisted_user_ids.includes(userId)) {
    return true
  }

  // Get user's plan
  const user = await ctx.db.get(userId)
  if (!user) {
    return false
  }

  const userPlan = user.subscription_plan || 'free'

  // Check plan allowlist
  if (flag.allowed_plans.length > 0 && !flag.allowed_plans.includes(userPlan)) {
    return false
  }

  // Check rollout percentage using deterministic hash
  if (flag.rollout_percentage < 100) {
    const hash = simpleHash(String(userId) + flag.flag_key)
    const bucket = hash % 100
    if (bucket >= flag.rollout_percentage) {
      return false
    }
  }

  return true
}

/**
 * Assert that feature is enabled for user, throw if not
 */
export async function assertFeatureEnabled(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  flagKey: string,
  errorMessage?: string
): Promise<void> {
  const enabled = await isFeatureEnabledForUser(ctx, userId, flagKey)
  if (!enabled) {
    throw new Error(errorMessage || `Feature '${flagKey}' is not enabled for this user`)
  }
}

/**
 * Check if agent is enabled for user (convenience method)
 */
export async function isAgentEnabled(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>
): Promise<boolean> {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_AGENT_ENABLED === 'false') {
    return false
  }

  // Check user's preferences (if they have a kill switch)
  const prefs = await ctx.db
    .query('agent_preferences')
    .withIndex('by_user', (q) => q.eq('user_id', userId))
    .unique()

  if (prefs && !prefs.agent_enabled) {
    return false
  }

  // Check feature flag
  return await isFeatureEnabledForUser(ctx, userId, 'agent.enabled')
}

/**
 * Check if proactive nudges are enabled for user
 */
export async function isProactiveEnabled(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>
): Promise<boolean> {
  // Check user's preferences first
  const prefs = await ctx.db
    .query('agent_preferences')
    .withIndex('by_user', (q) => q.eq('user_id', userId))
    .unique()

  if (!prefs || !prefs.proactive_enabled) {
    return false
  }

  // Check feature flag
  return await isFeatureEnabledForUser(ctx, userId, 'agent.proactive.enabled')
}

/**
 * Simple string hash function for deterministic rollout bucketing
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash | 0 // Convert to 32-bit integer
  }
  return Math.abs(hash)
}
