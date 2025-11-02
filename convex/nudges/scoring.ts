/**
 * Nudge Scoring and Evaluation
 *
 * Evaluates all rules for a user, checks cooldowns, and returns prioritized nudges
 */

import { query, QueryCtx } from '../_generated/server'
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
    const maxNudges = MAX_NUDGES_PER_DAY[userPlan].total

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
  ctx: QueryCtx,
  userId: Id<'users'>,
  ruleType: NudgeRuleType
): Promise<boolean> {
  const now = Date.now()

  // Find most recent cooldown for this rule
  const cooldown = await ctx.db
    .query('agent_cooldowns')
    .withIndex('by_user_rule', (q) =>
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
 *
 * Uses user's timezone preference to calculate start of day,
 * ensuring daily limits reset at midnight in the user's local time
 */
async function getTodayNudgeCount(ctx: QueryCtx, userId: Id<'users'>): Promise<number> {
  // Get user timezone preference
  const prefs = await ctx.db
    .query('agent_preferences')
    .withIndex('by_user', (q) => q.eq('user_id', userId))
    .unique()

  const userTimezone = prefs?.timezone || 'UTC'

  // Calculate start of day (midnight) in user's timezone
  // Proper timezone conversion: find UTC timestamp for midnight in user's timezone
  const now = new Date()

  // Get current date/time components in user's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  const parts = formatter.formatToParts(now)
  const year = parseInt(parts.find(p => p.type === 'year')!.value)
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1 // JS months are 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')!.value)

  // Calculate UTC offset for the user's timezone
  // We compare the same moment in time formatted in both timezones
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

  // Parse formatted strings to get timestamps (in server's local timezone, but consistently)
  const parseFormattedDate = (formatted: Intl.DateTimeFormatPart[]) => {
    const y = parseInt(formatted.find(p => p.type === 'year')!.value)
    const m = parseInt(formatted.find(p => p.type === 'month')!.value) - 1
    const d = parseInt(formatted.find(p => p.type === 'day')!.value)
    const h = parseInt(formatted.find(p => p.type === 'hour')!.value)
    const min = parseInt(formatted.find(p => p.type === 'minute')!.value)
    const s = parseInt(formatted.find(p => p.type === 'second')!.value)
    return new Date(y, m, d, h, min, s).getTime()
  }

  const userParts = formatter.formatToParts(now)
  const utcParts = utcFormatter.formatToParts(now)
  const userParsed = parseFormattedDate(userParts)
  const utcParsed = parseFormattedDate(utcParts)
  const offset = utcParsed - userParsed

  // Create midnight in user's timezone (in local server time), then adjust to UTC
  const midnightLocal = new Date(year, month, day, 0, 0, 0, 0).getTime()
  const startOfDayMs = midnightLocal + offset

  const todayNudges = await ctx.db
    .query('agent_nudges')
    .withIndex('by_user_status', (q) => q.eq('user_id', userId))
    .filter((q) => q.gte(q.field('created_at'), startOfDayMs))
    .collect()

  return todayNudges.length
}

/**
 * Check if current time is within user's quiet hours
 */
function isInQuietHours(prefs: {
  quiet_hours_start: number
  quiet_hours_end: number
}): boolean {
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
  ctx: QueryCtx,
  userId: Id<'users'>,
  ruleType: NudgeRuleType
): Promise<number | null> {
  const cooldown = await ctx.db
    .query('agent_cooldowns')
    .withIndex('by_user_rule', (q) =>
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
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startOfDayMs = startOfDay.getTime()

    const startOfWeek = new Date()
    // Use Monday as week start (getDay() === 1) for international consistency
    const dayOfWeek = startOfWeek.getDay()
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract)
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfWeekMs = startOfWeek.getTime()

    // Get all nudges
    const allNudges = await ctx.db
      .query('agent_nudges')
      .withIndex('by_user_status', (q) => q.eq('user_id', args.userId))
      .collect()

    // Today's nudges
    const todayNudges = allNudges.filter(n => n.created_at >= startOfDayMs)

    // This week's nudges
    const weekNudges = allNudges.filter(n => n.created_at >= startOfWeekMs)

    // Queued nudges
    const queuedNudges = allNudges.filter(n => n.status === 'queued')

    // Accepted nudges
    const acceptedNudges = allNudges.filter(n => n.status === 'accepted')

    // Snoozed nudges
    const snoozedNudges = allNudges.filter(n => n.status === 'snoozed')

    // Ignored nudges
    const ignoredNudges = allNudges.filter(n => n.status === 'ignored')

    // Get user plan for limits
    const user = await ctx.db.get(args.userId)
    const userPlan = (user?.subscription_plan || 'free') as 'free' | 'premium' | 'university'
    const maxNudges = MAX_NUDGES_PER_DAY[userPlan].total

    return {
      today: {
        count: todayNudges.length,
        limit: maxNudges,
        remaining: Math.max(0, maxNudges - todayNudges.length),
      },
      week: {
        count: weekNudges.length,
        accepted: weekNudges.filter(n => n.status === 'accepted').length,
        ignored: weekNudges.filter(n => n.status === 'ignored').length,
      },
      all: {
        total: allNudges.length,
        queued: queuedNudges.length,
        accepted: acceptedNudges.length,
        snoozed: snoozedNudges.length,
        ignored: ignoredNudges.length,
      },
      acceptanceRate: allNudges.length > 0
        ? Math.round((acceptedNudges.length / allNudges.length) * 100)
        : 0,
    }
  },
})
