/**
 * Feature Flags System
 *
 * Provides database-driven feature flag management with:
 * - Per-plan feature gating
 * - User-level whitelisting
 * - Percentage-based rollouts
 * - Organization-level overrides
 */

import { v } from 'convex/values'
import { query, mutation, internalQuery, QueryCtx, MutationCtx } from '../_generated/server'
import { Id } from '../_generated/dataModel'

/**
 * Assert that the current user is an admin
 * @throws Error if user is not authenticated or not an admin
 */
async function assertAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity) {
    throw new Error('Unauthorized: Authentication required')
  }

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .unique()

  if (!user) {
    throw new Error('Unauthorized: User not found')
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    throw new Error('Unauthorized: Admin access required')
  }
}

/**
 * Get feature flag configuration
 */
export const getFeatureFlag = query({
  args: {
    flagKey: v.string(),
  },
  handler: async (ctx, args) => {
    const flag = await ctx.db
      .query('feature_flags')
      .withIndex('by_flag_key', (q) => q.eq('flag_key', args.flagKey))
      .unique()

    if (!flag) {
      return {
        enabled: false,
        rolloutPercentage: 0,
        allowedPlans: [],
        whitelistedUserIds: [],
      }
    }

    return flag
  },
})

/**
 * Check if feature is enabled for a specific user
 *
 * Priority order:
 * 1. User whitelist (if user ID in whitelist, return true)
 * 2. Plan check (if user's plan not in allowed plans, return false)
 * 3. Rollout percentage (hash user ID to determine if in rollout)
 */
export const isFeatureEnabled = query({
  args: {
    userId: v.id('users'),
    flagKey: v.string(),
  },
  handler: async (ctx, args) => {
    const flag = await ctx.db
      .query('feature_flags')
      .withIndex('by_flag_key', (q) => q.eq('flag_key', args.flagKey))
      .unique()

    // If flag doesn't exist or is globally disabled, return false
    if (!flag || !flag.enabled) {
      return false
    }

    // Check user whitelist
    if (flag.whitelisted_user_ids.includes(args.userId)) {
      return true
    }

    // Get user's plan
    const user = await ctx.db.get(args.userId)
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
      const hash = simpleHash(args.userId + flag.flag_key)
      const bucket = hash % 100
      if (bucket >= flag.rollout_percentage) {
        return false
      }
    }

    return true
  },
})

/**
 * Internal query for server-side feature checks
 */
export const checkFeature = internalQuery({
  args: {
    userId: v.id('users'),
    flagKey: v.string(),
  },
  handler: async (ctx, args) => {
    const flag = await ctx.db
      .query('feature_flags')
      .withIndex('by_flag_key', (q) => q.eq('flag_key', args.flagKey))
      .unique()

    if (!flag || !flag.enabled) {
      return false
    }

    if (flag.whitelisted_user_ids.includes(args.userId)) {
      return true
    }

    const user = await ctx.db.get(args.userId)
    if (!user) {
      return false
    }

    const userPlan = user.subscription_plan || 'free'

    if (flag.allowed_plans.length > 0 && !flag.allowed_plans.includes(userPlan)) {
      return false
    }

    if (flag.rollout_percentage < 100) {
      const hash = simpleHash(args.userId + flag.flag_key)
      const bucket = hash % 100
      if (bucket >= flag.rollout_percentage) {
        return false
      }
    }

    return true
  },
})

/**
 * Admin: Set or update feature flag
 *
 * NOTE: This should be protected with admin role check in production
 */
export const setFeatureFlag = mutation({
  args: {
    flagKey: v.string(),
    enabled: v.boolean(),
    allowedPlans: v.optional(v.array(v.string())),
    rolloutPercentage: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx)

    const existing = await ctx.db
      .query('feature_flags')
      .withIndex('by_flag_key', (q) => q.eq('flag_key', args.flagKey))
      .unique()

    const now = Date.now()

    const flagData = {
      flag_key: args.flagKey,
      enabled: args.enabled,
      allowed_plans: args.allowedPlans || [],
      rollout_percentage: args.rolloutPercentage ?? 100,
      whitelisted_user_ids: existing?.whitelisted_user_ids || [],
      description: args.description || '',
      updated_at: now,
    }

    if (existing) {
      await ctx.db.patch(existing._id, flagData)
      return { id: existing._id, action: 'updated' }
    } else {
      const id = await ctx.db.insert('feature_flags', {
        ...flagData,
        created_at: now,
      })
      return { id, action: 'created' }
    }
  },
})

/**
 * Admin: Update rollout percentage
 */
export const updateRolloutPercentage = mutation({
  args: {
    flagKey: v.string(),
    rolloutPercentage: v.number(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx)

    if (args.rolloutPercentage < 0 || args.rolloutPercentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100')
    }

    const flag = await ctx.db
      .query('feature_flags')
      .withIndex('by_flag_key', (q) => q.eq('flag_key', args.flagKey))
      .unique()

    if (!flag) {
      throw new Error(`Feature flag '${args.flagKey}' not found`)
    }

    await ctx.db.patch(flag._id, {
      rollout_percentage: args.rolloutPercentage,
      updated_at: Date.now(),
    })

    return { success: true, rolloutPercentage: args.rolloutPercentage }
  },
})

/**
 * Admin: Add user to whitelist
 */
export const addUserToWhitelist = mutation({
  args: {
    flagKey: v.string(),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx)

    const flag = await ctx.db
      .query('feature_flags')
      .withIndex('by_flag_key', (q) => q.eq('flag_key', args.flagKey))
      .unique()

    if (!flag) {
      throw new Error(`Feature flag '${args.flagKey}' not found`)
    }

    if (flag.whitelisted_user_ids.includes(args.userId)) {
      return { success: true, message: 'User already whitelisted' }
    }

    await ctx.db.patch(flag._id, {
      whitelisted_user_ids: [...flag.whitelisted_user_ids, args.userId],
      updated_at: Date.now(),
    })

    return { success: true, message: 'User added to whitelist' }
  },
})

/**
 * Admin: Remove user from whitelist
 */
export const removeUserFromWhitelist = mutation({
  args: {
    flagKey: v.string(),
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx)

    const flag = await ctx.db
      .query('feature_flags')
      .withIndex('by_flag_key', (q) => q.eq('flag_key', args.flagKey))
      .unique()

    if (!flag) {
      throw new Error(`Feature flag '${args.flagKey}' not found`)
    }

    await ctx.db.patch(flag._id, {
      whitelisted_user_ids: flag.whitelisted_user_ids.filter((id) => id !== args.userId),
      updated_at: Date.now(),
    })

    return { success: true, message: 'User removed from whitelist' }
  },
})

/**
 * Get all feature flags (admin only)
 */
export const getAllFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx)

    return await ctx.db.query('feature_flags').collect()
  },
})

/**
 * Simple string hash function for deterministic rollout bucketing
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}
