/**
 * Authentication and Plan Enforcement Utility
 *
 * Shared utility for validating user authentication, plan access, and rate limits
 * Use this at the beginning of every agent tool to enforce security and subscription rules
 */

import { QueryCtx, MutationCtx } from '../_generated/server'
import { Id } from '../_generated/dataModel'
import { getRateLimitForPlan } from '../config/agentConstants'

/**
 * Assert user is authenticated and has required plan
 *
 * @throws Error if user not found or doesn't have required plan
 */
export async function assertAuthAndPlan(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  options: {
    requiredPlan?: 'free' | 'premium' | 'university'
    requireAgent?: boolean
    checkRateLimit?: boolean
  } = {}
): Promise<{
  user: any
  plan: string
  canProceed: boolean
}> {
  // 1. Validate user exists
  const user = await ctx.db.get(userId)
  if (!user) {
    throw new Error('User not found')
  }

  const userPlan = user.subscription_plan || 'free'

  // 2. Check if user's organization has disabled agent
  if (user.university_id) {
    const university = await ctx.db.get(user.university_id)
    if (university?.agent_disabled) {
      throw new Error(
        'AI Agent is disabled for your organization. Contact your administrator for access.'
      )
    }
  }

  // 3. Check if agent is enabled for user (if required)
  if (options.requireAgent !== false) {
    const prefs = await ctx.db
      .query('agent_preferences')
      .withIndex('by_user', (q) => q.eq('user_id', userId))
      .unique()

    if (prefs && !prefs.agent_enabled) {
      throw new Error('AI Agent is disabled. Enable it in your preferences to continue.')
    }
  }

  // 4. Check plan requirement
  if (options.requiredPlan) {
    const hasRequiredPlan = checkPlanAccess(userPlan, options.requiredPlan)
    if (!hasRequiredPlan) {
      throw new Error(
        `This feature requires a ${options.requiredPlan} plan. Please upgrade to continue.`
      )
    }
  }

  // 5. Check rate limit (if requested)
  if (options.checkRateLimit) {
    const rateLimits = getRateLimitForPlan(userPlan)
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000
    const oneDayAgo = now - 24 * 60 * 60 * 1000

    // Check hourly limit
    const hourlyRequests = await ctx.db
      .query('agent_request_logs')
      .withIndex('by_user_created', (q) => q.eq('user_id', userId).gte('created_at', oneHourAgo))
      .collect()

    if (hourlyRequests.length >= rateLimits.requestsPerHour) {
      throw new Error(
        `Rate limit exceeded: ${rateLimits.requestsPerHour} requests per hour. Please try again later.`
      )
    }

    // Check daily limit
    const dailyRequests = await ctx.db
      .query('agent_request_logs')
      .withIndex('by_user_created', (q) => q.eq('user_id', userId).gte('created_at', oneDayAgo))
      .collect()

    if (dailyRequests.length >= rateLimits.requestsPerDay) {
      throw new Error(
        `Daily limit exceeded: ${rateLimits.requestsPerDay} requests per day. Please try again later.`
      )
    }
  }

  return {
    user,
    plan: userPlan,
    canProceed: true,
  }
}

/**
 * Assert user owns the resource
 *
 * @throws Error if resource doesn't exist or doesn't belong to user
 */
export async function assertOwnership<T extends { user_id: Id<'users'> }>(
  ctx: QueryCtx | MutationCtx,
  resourceId: Id<any>,
  tableName: string,
  userId: Id<'users'>
): Promise<T> {
  const resource = await ctx.db.get(resourceId)

  if (!resource) {
    throw new Error(`${tableName} not found`)
  }

  if ((resource as T).user_id !== userId) {
    throw new Error(`You don't have permission to access this ${tableName}`)
  }

  return resource as T
}

/**
 * Check if user's plan has access to required plan tier
 */
function checkPlanAccess(userPlan: string, requiredPlan: string): boolean {
  const planHierarchy = {
    free: 0,
    premium: 1,
    university: 1,
  }

  const userPlanLevel = planHierarchy[userPlan.toLowerCase() as keyof typeof planHierarchy] ?? 0
  const requiredPlanLevel =
    planHierarchy[requiredPlan.toLowerCase() as keyof typeof planHierarchy] ?? 0

  return userPlanLevel >= requiredPlanLevel
}

/**
 * Assert field is in allowlist for object type
 *
 * Prevents arbitrary field updates
 */
export function assertFieldAllowed(
  field: string,
  allowedFields: string[],
  objectType: string
): void {
  if (!allowedFields.includes(field)) {
    throw new Error(`Field '${field}' is not allowed for ${objectType} updates`)
  }
}

/**
 * Rate limit helper - consume a rate limit slot
 */
export async function consumeRateLimitSlot(
  ctx: MutationCtx,
  userId: Id<'users'>,
  clerkUserId: string
): Promise<void> {
  await ctx.db.insert('agent_request_logs', {
    clerk_user_id: clerkUserId,
    user_id: userId,
    created_at: Date.now(),
  })
}
