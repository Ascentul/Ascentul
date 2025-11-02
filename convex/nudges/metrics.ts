/**
 * Nudge Metrics and Analytics
 *
 * Tracks and analyzes nudge performance:
 * - Acceptance rates by rule type
 * - Snooze patterns
 * - Rule effectiveness
 * - User engagement metrics
 */

import { query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Helper: Format date to YYYY-MM-DD string
 */
function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Get global nudge metrics (for admin dashboard)
 */
export const getGlobalMetrics = query({
  args: {
    timeRange: v.optional(v.union(v.literal('day'), v.literal('week'), v.literal('month'), v.literal('all'))),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const timeRange = args.timeRange || 'week'

    // Calculate time window
    let startTime = 0
    if (timeRange === 'day') {
      startTime = now - 24 * 60 * 60 * 1000
    } else if (timeRange === 'week') {
      startTime = now - 7 * 24 * 60 * 60 * 1000
    } else if (timeRange === 'month') {
      startTime = now - 30 * 24 * 60 * 60 * 1000
    }

    // Get all nudges in time range using index for performance
    const nudges = startTime > 0
      ? await ctx.db
          .query('agent_nudges')
          .withIndex('by_created', (q) => q.gte('created_at', startTime))
          .collect()
      : await ctx.db.query('agent_nudges').collect()

    // Calculate metrics
    const totalNudges = nudges.length
    const acceptedNudges = nudges.filter(n => n.status === 'accepted')
    const snoozedNudges = nudges.filter(n => n.status === 'snoozed')
    const dismissedNudges = nudges.filter(n => n.status === 'dismissed')
    const pendingNudges = nudges.filter(n => n.status === 'pending')

    const acceptanceRate = totalNudges > 0
      ? Math.round((acceptedNudges.length / totalNudges) * 100)
      : 0

    const snoozeRate = totalNudges > 0
      ? Math.round((snoozedNudges.length / totalNudges) * 100)
      : 0

    const dismissalRate = totalNudges > 0
      ? Math.round((dismissedNudges.length / totalNudges) * 100)
      : 0

    // Calculate average time to action (for accepted nudges)
    const avgTimeToAction = acceptedNudges.length > 0
      ? acceptedNudges.reduce((sum, n) => {
          const timeToAction = (n.accepted_at || 0) - n.created_at
          return sum + timeToAction
        }, 0) / acceptedNudges.length
      : 0

    // Format average time (in hours)
    const avgHoursToAction = Math.round(avgTimeToAction / (1000 * 60 * 60))

    return {
      timeRange,
      total: totalNudges,
      byStatus: {
        accepted: acceptedNudges.length,
        snoozed: snoozedNudges.length,
        dismissed: dismissedNudges.length,
        pending: pendingNudges.length,
      },
      rates: {
        acceptance: acceptanceRate,
        snooze: snoozeRate,
        dismissal: dismissalRate,
      },
      avgTimeToAction: {
        hours: avgHoursToAction,
        milliseconds: avgTimeToAction,
      },
    }
  },
})

/**
 * Get metrics by rule type (which rules are most effective?)
 */
export const getMetricsByRuleType = query({
  args: {
    timeRange: v.optional(v.union(v.literal('day'), v.literal('week'), v.literal('month'), v.literal('all'))),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const timeRange = args.timeRange || 'week'

    let startTime = 0
    if (timeRange === 'day') {
      startTime = now - 24 * 60 * 60 * 1000
    } else if (timeRange === 'week') {
      startTime = now - 7 * 24 * 60 * 60 * 1000
    } else if (timeRange === 'month') {
      startTime = now - 30 * 24 * 60 * 60 * 1000
    }

    // Get all nudges in time range using index for performance
    const nudges = startTime > 0
      ? await ctx.db
          .query('agent_nudges')
          .withIndex('by_created', (q) => q.gte('created_at', startTime))
          .collect()
      : await ctx.db.query('agent_nudges').collect()

    // Group by rule type
    const ruleTypeMap: Record<string, {
      total: number
      accepted: number
      snoozed: number
      dismissed: number
      pending: number
      acceptanceRate: number
    }> = {}

    for (const nudge of nudges) {
      const ruleType = nudge.rule_type
      if (!ruleTypeMap[ruleType]) {
        ruleTypeMap[ruleType] = {
          total: 0,
          accepted: 0,
          snoozed: 0,
          dismissed: 0,
          pending: 0,
          acceptanceRate: 0,
        }
      }

      ruleTypeMap[ruleType].total++
      if (nudge.status === 'accepted') ruleTypeMap[ruleType].accepted++
      if (nudge.status === 'snoozed') ruleTypeMap[ruleType].snoozed++
      if (nudge.status === 'dismissed') ruleTypeMap[ruleType].dismissed++
      if (nudge.status === 'pending') ruleTypeMap[ruleType].pending++
    }

    // Calculate acceptance rates
    for (const ruleType in ruleTypeMap) {
      const stats = ruleTypeMap[ruleType]
      stats.acceptanceRate = stats.total > 0
        ? Math.round((stats.accepted / stats.total) * 100)
        : 0
    }

    // Convert to array and sort by acceptance rate
    const ruleTypes = Object.entries(ruleTypeMap)
      .map(([ruleType, stats]) => ({
        ruleType,
        ...stats,
      }))
      .sort((a, b) => b.acceptanceRate - a.acceptanceRate)

    return {
      timeRange,
      ruleTypes,
    }
  },
})

/**
 * Get engagement metrics (how many users are interacting with nudges?)
 */
export const getEngagementMetrics = query({
  args: {
    timeRange: v.optional(v.union(v.literal('day'), v.literal('week'), v.literal('month'), v.literal('all'))),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const timeRange = args.timeRange || 'week'

    let startTime = 0
    if (timeRange === 'day') {
      startTime = now - 24 * 60 * 60 * 1000
    } else if (timeRange === 'week') {
      startTime = now - 7 * 24 * 60 * 60 * 1000
    } else if (timeRange === 'month') {
      startTime = now - 30 * 24 * 60 * 60 * 1000
    }

    // Get all nudges in time range using index for performance
    const nudges = startTime > 0
      ? await ctx.db
          .query('agent_nudges')
          .withIndex('by_created', (q) => q.gte('created_at', startTime))
          .collect()
      : await ctx.db.query('agent_nudges').collect()

    // Get unique users who received nudges
    const usersWithNudges = new Set(nudges.map(n => n.user_id))

    // Get unique users who interacted (accepted, snoozed, or dismissed)
    const usersWhoInteracted = new Set(
      nudges
        .filter(n => n.status !== 'pending')
        .map(n => n.user_id)
    )

    // Get total active users (have preferences or nudges)
    const allPrefs = await ctx.db.query('agent_preferences').collect()
    const activeUsers = new Set([
      ...usersWithNudges,
      ...allPrefs.filter(p => p.agent_enabled).map(p => p.user_id),
    ])

    const engagementRate = usersWithNudges.size > 0
      ? Math.round((usersWhoInteracted.size / usersWithNudges.size) * 100)
      : 0

    // Calculate average nudges per user
    const avgNudgesPerUser = usersWithNudges.size > 0
      ? Math.round(nudges.length / usersWithNudges.size)
      : 0

    return {
      timeRange,
      totalUsers: activeUsers.size,
      usersWithNudges: usersWithNudges.size,
      usersWhoInteracted: usersWhoInteracted.size,
      engagementRate,
      avgNudgesPerUser,
    }
  },
})

/**
 * Get recent nudge activity (for live dashboard)
 */
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10

    const recentNudges = await ctx.db
      .query('agent_nudges')
      .order('desc')
      .take(limit)

    // Get user info for each nudge
    const activity = []
    for (const nudge of recentNudges) {
      const user = await ctx.db.get(nudge.user_id)
      activity.push({
        nudgeId: nudge._id,
        ruleType: nudge.rule_type,
        status: nudge.status,
        createdAt: nudge.created_at,
        userName: user?.full_name || 'Unknown User',
        userEmail: user?.email || '',
      })
    }

    return activity
  },
})

/**
 * Get daily nudge volume trend (for charts)
 */
export const getDailyVolumeTrend = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days || 7
    const now = Date.now()
    const startTime = now - days * 24 * 60 * 60 * 1000

    // Get all nudges in time range using index for performance
    const nudges = await ctx.db
      .query('agent_nudges')
      .withIndex('by_created', (q) => q.gte('created_at', startTime))
      .collect()

    // Group by day
    const dailyMap: Record<string, {
      total: number
      accepted: number
      snoozed: number
      dismissed: number
    }> = {}

    for (const nudge of nudges) {
      const date = new Date(nudge.created_at)
      const dateKey = formatDateKey(date)

      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { total: 0, accepted: 0, snoozed: 0, dismissed: 0 }
      }

      dailyMap[dateKey].total++
      if (nudge.status === 'accepted') dailyMap[dateKey].accepted++
      if (nudge.status === 'snoozed') dailyMap[dateKey].snoozed++
      if (nudge.status === 'dismissed') dailyMap[dateKey].dismissed++
    }

    // Convert to array and fill missing days with zeros
    const trend = []
    for (let i = 0; i < days; i++) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000)
      const dateKey = formatDateKey(date)

      trend.unshift({
        date: dateKey,
        total: dailyMap[dateKey]?.total || 0,
        accepted: dailyMap[dateKey]?.accepted || 0,
        snoozed: dailyMap[dateKey]?.snoozed || 0,
        dismissed: dailyMap[dateKey]?.dismissed || 0,
      })
    }

    return trend
  },
})
