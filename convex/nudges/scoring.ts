/**
 * Nudge Scoring and Evaluation
 *
 * Evaluates all rules for a user, checks cooldowns, and returns prioritized nudges
 */

import { query } from '../_generated/server'
import { v } from 'convex/values'
import { Id } from '../_generated/dataModel'
import { NUDGE_RULES, getApplicableRules, RuleEvaluation, NudgeRuleType } from './ruleEngine'
import { MAX_NUDGES_PER_DAY } from '../config/agentConstants'

/**
 * Evaluate all rules for a user and return prioritized nudges
 *
 * This is the main entry point for the nudge system
 */
export const evaluateNudgesForUser = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Check feature flags
    const agentEnabled = await ctx.db
      .query('feature_flags')
      .withIndex('by_flag_key', (q) => q.eq('flag_key', 'agent'))
      .unique()

    if (!agentEnabled || !agentEnabled.enabled) {
      return {
        nudges: [],
        reason: 'Agent feature is disabled',
      }
    }

    // Check user preferences
    const prefs = await ctx.db
      .query('agent_preferences')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .unique()

    if (prefs && !prefs.proactive_enabled) {
      return {
        nudges: [],
        reason: 'Proactive nudges disabled by user',
      }
    }

    // Check quiet hours
    if (prefs && isInQuietHours(prefs)) {
      return {
        nudges: [],
        reason: 'Currently in quiet hours',
      }
    }

    // Check daily nudge limit
    const todayCount = await getTodayNudgeCount(ctx, args.userId)
    const userPlan = (user.subscription_plan || 'free') as 'free' | 'premium' | 'university'
    const maxNudges = MAX_NUDGES_PER_DAY[userPlan]

    if (todayCount >= maxNudges) {
      return {
        nudges: [],
        reason: `Daily nudge limit reached (${maxNudges})`,
      }
    }

    // Get applicable rules for user's plan
    const rules = getApplicableRules(userPlan)

    // Evaluate all rules
    const evaluations: RuleEvaluation[] = []
    for (const rule of rules) {
      try {
        // Check cooldown first
        const onCooldown = await isRuleOnCooldown(ctx, args.userId, rule.type)
        if (onCooldown) {
          continue
        }

        const evaluation = await rule.evaluate(ctx, args.userId)
        if (evaluation.shouldTrigger) {
          evaluations.push(evaluation)
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.type}:`, error)
        // Continue with other rules even if one fails
      }
    }

    // Sort by score (highest first)
    evaluations.sort((a, b) => b.score - a.score)

    // Return top nudges up to remaining daily limit
    const remainingNudges = maxNudges - todayCount
    const topNudges = evaluations.slice(0, remainingNudges)

    return {
      nudges: topNudges,
      totalEvaluated: rules.length,
      triggered: evaluations.length,
      returned: topNudges.length,
      dailyCount: todayCount,
      dailyLimit: maxNudges,
    }
  },
})

/**
 * Check if a rule is on cooldown for a user
 */
async function isRuleOnCooldown(
  ctx: any,
  userId: Id<'users'>,
  ruleType: NudgeRuleType
): Promise<boolean> {
  const now = Date.now()

  // Find most recent cooldown for this rule
  const cooldown = await ctx.db
    .query('agent_cooldowns')
    .withIndex('by_user_and_rule', (q) =>
      q.eq('user_id', userId).eq('rule_type', ruleType)
    )
    .order('desc')
    .first()

  if (!cooldown) {
    return false // No cooldown found
  }

  return cooldown.cooldown_until > now
}

/**
 * Get count of nudges created today for a user
 */
async function getTodayNudgeCount(ctx: any, userId: Id<'users'>): Promise<number> {
  const now = Date.now()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const startOfDayMs = startOfDay.getTime()

  const todayNudges = await ctx.db
    .query('agent_nudges')
    .withIndex('by_user', (q) => q.eq('user_id', userId))
    .filter((q) => q.gte(q.field('created_at'), startOfDayMs))
    .collect()

  return todayNudges.length
}

/**
 * Check if current time is within user's quiet hours
 */
function isInQuietHours(prefs: any): boolean {
  const now = new Date()
  const currentHour = now.getHours()

  const start = prefs.quiet_hours_start
  const end = prefs.quiet_hours_end

  // Handle overnight quiet hours (e.g., 22:00 to 8:00)
  if (start > end) {
    return currentHour >= start || currentHour < end
  }

  // Normal quiet hours (e.g., 22:00 to 23:00)
  return currentHour >= start && currentHour < end
}

/**
 * Get detailed evaluation for a specific rule (for testing/debugging)
 */
export const evaluateSingleRule = query({
  args: {
    userId: v.id('users'),
    ruleType: v.string(),
  },
  handler: async (ctx, args) => {
    const rule = NUDGE_RULES[args.ruleType as NudgeRuleType]
    if (!rule) {
      throw new Error(`Unknown rule type: ${args.ruleType}`)
    }

    const evaluation = await rule.evaluate(ctx, args.userId)

    const onCooldown = await isRuleOnCooldown(ctx, args.userId, rule.type)

    return {
      rule: {
        type: rule.type,
        name: rule.name,
        description: rule.description,
        category: rule.category,
        baseScore: rule.baseScore,
      },
      evaluation,
      onCooldown,
      cooldownUntil: onCooldown ? await getCooldownExpiry(ctx, args.userId, rule.type) : null,
    }
  },
})

/**
 * Get cooldown expiry time for a rule
 */
async function getCooldownExpiry(
  ctx: any,
  userId: Id<'users'>,
  ruleType: NudgeRuleType
): Promise<number | null> {
  const cooldown = await ctx.db
    .query('agent_cooldowns')
    .withIndex('by_user_and_rule', (q) =>
      q.eq('user_id', userId).eq('rule_type', ruleType)
    )
    .order('desc')
    .first()

  return cooldown ? cooldown.cooldown_until : null
}

/**
 * Get current nudge stats for a user (for dashboard display)
 */
export const getNudgeStats = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startOfDayMs = startOfDay.getTime()

    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfWeekMs = startOfWeek.getTime()

    // Get all nudges
    const allNudges = await ctx.db
      .query('agent_nudges')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .collect()

    // Today's nudges
    const todayNudges = allNudges.filter(n => n.created_at >= startOfDayMs)

    // This week's nudges
    const weekNudges = allNudges.filter(n => n.created_at >= startOfWeekMs)

    // Pending nudges
    const pendingNudges = allNudges.filter(n => n.status === 'pending')

    // Accepted nudges
    const acceptedNudges = allNudges.filter(n => n.status === 'accepted')

    // Snoozed nudges
    const snoozedNudges = allNudges.filter(n => n.status === 'snoozed')

    // Dismissed nudges
    const dismissedNudges = allNudges.filter(n => n.status === 'dismissed')

    // Get user plan for limits
    const user = await ctx.db.get(args.userId)
    const userPlan = (user?.subscription_plan || 'free') as 'free' | 'premium' | 'university'
    const maxNudges = MAX_NUDGES_PER_DAY[userPlan]

    return {
      today: {
        count: todayNudges.length,
        limit: maxNudges,
        remaining: Math.max(0, maxNudges - todayNudges.length),
      },
      week: {
        count: weekNudges.length,
        accepted: weekNudges.filter(n => n.status === 'accepted').length,
        dismissed: weekNudges.filter(n => n.status === 'dismissed').length,
      },
      all: {
        total: allNudges.length,
        pending: pendingNudges.length,
        accepted: acceptedNudges.length,
        snoozed: snoozedNudges.length,
        dismissed: dismissedNudges.length,
      },
      acceptanceRate: allNudges.length > 0
        ? Math.round((acceptedNudges.length / allNudges.length) * 100)
        : 0,
    }
  },
})
