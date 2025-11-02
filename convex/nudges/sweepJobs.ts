/**
 * Nudge Sweep Jobs
 *
 * Automated cron jobs that:
 * 1. Query eligible users for nudge evaluation
 * 2. Evaluate rules and create nudges
 * 3. Dispatch nudges to channels
 */

import { internalAction, internalMutation, internalQuery } from '../_generated/server'
import { api, internal } from '../_generated/api'
import { v } from 'convex/values'

/**
 * Hourly sweep - High-priority urgent nudges
 *
 * Evaluates time-sensitive rules like:
 * - interviewSoon (interview in next 24-48 hours)
 * - Daily engagement nudges
 */
export const hourlySweep = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log('[Nudge Sweep] Starting hourly sweep...')

    try {
      // Get all active users who haven't disabled agent
      const users = await ctx.runQuery(internal.nudges.sweepJobs.getEligibleUsers, {
        checkQuietHours: true,
      })

      console.log(`[Nudge Sweep] Found ${users.length} eligible users`)

      let nudgesCreated = 0
      let errors = 0

      // Evaluate rules for each user
      for (const user of users) {
        try {
          const result = await ctx.runQuery(api.nudges.scoring.evaluateNudgesForUser, {
            userId: user._id,
          })

          // Create nudges for top-priority rules
          if (result.nudges && result.nudges.length > 0) {
            for (const nudgeEval of result.nudges) {
              // Only create urgent nudges in hourly sweep
              const rule = await getRuleMetadata(nudgeEval.ruleType)
              if (rule.category === 'urgent' || rule.category === 'engagement') {
                await ctx.runMutation(api.nudges.dispatch.createNudge, {
                  userId: user._id,
                  ruleType: nudgeEval.ruleType,
                  score: nudgeEval.score,
                  reason: nudgeEval.reason,
                  metadata: nudgeEval.metadata,
                  suggestedAction: nudgeEval.suggestedAction,
                  actionUrl: nudgeEval.actionUrl,
                })

                nudgesCreated++
              }
            }
          }
        } catch (error) {
          console.error(`[Nudge Sweep] Error processing user ${user._id}:`, error)
          errors++
        }
      }

      console.log(`[Nudge Sweep] Hourly sweep complete: ${nudgesCreated} nudges created, ${errors} errors`)

      return {
        success: true,
        usersProcessed: users.length,
        nudgesCreated,
        errors,
      }
    } catch (error) {
      console.error('[Nudge Sweep] Hourly sweep failed:', error)
      throw error
    }
  },
})

/**
 * Daily sweep - All nudge rules
 *
 * Evaluates all rules including:
 * - All urgent, helpful, and maintenance nudges
 * - Weekly reviews
 * - Profile completeness
 */
export const dailySweep = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log('[Nudge Sweep] Starting daily sweep...')

    try {
      // Get all active users (no quiet hours check - we'll send via preferred channel)
      const users = await ctx.runQuery(internal.nudges.sweepJobs.getEligibleUsers, {
        checkQuietHours: false, // Daily sweep can queue nudges for later delivery
      })

      console.log(`[Nudge Sweep] Found ${users.length} eligible users for daily sweep`)

      let nudgesCreated = 0
      let nudgesDispatched = 0
      let errors = 0

      // Evaluate rules for each user
      for (const user of users) {
        try {
          const result = await ctx.runQuery(api.nudges.scoring.evaluateNudgesForUser, {
            userId: user._id,
          })

          // Create and dispatch all triggered nudges
          if (result.nudges && result.nudges.length > 0) {
            for (const nudgeEval of result.nudges) {
              // Create nudge
              const createResult = await ctx.runMutation(api.nudges.dispatch.createNudge, {
                userId: user._id,
                ruleType: nudgeEval.ruleType,
                score: nudgeEval.score,
                reason: nudgeEval.reason,
                metadata: nudgeEval.metadata,
                suggestedAction: nudgeEval.suggestedAction,
                actionUrl: nudgeEval.actionUrl,
              })

              nudgesCreated++

              // Dispatch to channels
              if (createResult.nudgeId) {
                await ctx.runAction(api.nudges.dispatch.dispatchNudge, {
                  nudgeId: createResult.nudgeId,
                })
                nudgesDispatched++
              }
            }
          }
        } catch (error) {
          console.error(`[Nudge Sweep] Error processing user ${user._id}:`, error)
          errors++
        }
      }

      console.log(
        `[Nudge Sweep] Daily sweep complete: ${nudgesCreated} nudges created, ${nudgesDispatched} dispatched, ${errors} errors`
      )

      return {
        success: true,
        usersProcessed: users.length,
        nudgesCreated,
        nudgesDispatched,
        errors,
      }
    } catch (error) {
      console.error('[Nudge Sweep] Daily sweep failed:', error)
      throw error
    }
  },
})

/**
 * Weekly sweep - Weekly review nudges
 *
 * Sends weekly progress summaries and goal check-ins
 */
export const weeklySweep = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log('[Nudge Sweep] Starting weekly sweep...')

    try {
      const users = await ctx.runQuery(internal.nudges.sweepJobs.getEligibleUsers, {
        checkQuietHours: false,
      })

      let nudgesCreated = 0
      let errors = 0

      for (const user of users) {
        try {
          // Only evaluate weekly review rule
          const evaluation = await ctx.runQuery(api.nudges.scoring.evaluateSingleRule, {
            userId: user._id,
            ruleType: 'weeklyReview',
          })

          if (evaluation.evaluation.shouldTrigger && !evaluation.onCooldown) {
            const result = await ctx.runMutation(api.nudges.dispatch.createNudge, {
              userId: user._id,
              ruleType: 'weeklyReview',
              score: evaluation.evaluation.score,
              reason: evaluation.evaluation.reason,
              metadata: evaluation.evaluation.metadata,
              suggestedAction: evaluation.evaluation.suggestedAction,
              actionUrl: evaluation.evaluation.actionUrl,
            })

            if (result.nudgeId) {
              await ctx.runAction(api.nudges.dispatch.dispatchNudge, {
                nudgeId: result.nudgeId,
              })
              nudgesCreated++
            }
          }
        } catch (error) {
          console.error(`[Nudge Sweep] Error processing user ${user._id}:`, error)
          errors++
        }
      }

      console.log(`[Nudge Sweep] Weekly sweep complete: ${nudgesCreated} nudges created`)

      return {
        success: true,
        usersProcessed: users.length,
        nudgesCreated,
        errors,
      }
    } catch (error) {
      console.error('[Nudge Sweep] Weekly sweep failed:', error)
      throw error
    }
  },
})

/**
 * Get eligible users for nudge evaluation
 *
 * Internal query - filters by:
 * - Agent enabled
 * - Proactive nudges enabled
 * - Not in quiet hours (optional)
 * - University kill switch not active
 */
export const getEligibleUsers = internalQuery({
  args: {
    checkQuietHours: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Get all users
    const allUsers = await ctx.db.query('users').collect()

    const eligibleUsers = []

    for (const user of allUsers) {
      // Check university kill switch
      if (user.university_id) {
        const university = await ctx.db.get(user.university_id)
        if (university?.agent_disabled) {
          continue // Skip users from universities that disabled agent
        }
      }

      // Check user preferences
      const prefs = await ctx.db
        .query('agent_preferences')
        .withIndex('by_user', (q) => q.eq('user_id', user._id))
        .unique()

      // Skip if agent disabled
      if (prefs && !prefs.agent_enabled) {
        continue
      }

      // Skip if proactive nudges disabled
      if (prefs && !prefs.proactive_enabled) {
        continue
      }

      // Check quiet hours if requested
      if (args.checkQuietHours && prefs) {
        const now = new Date()
        const currentHour = now.getHours()
        const start = prefs.quiet_hours_start
        const end = prefs.quiet_hours_end

        const inQuietHours =
          start > end
            ? currentHour >= start || currentHour < end // Overnight quiet hours
            : currentHour >= start && currentHour < end // Normal quiet hours

        if (inQuietHours) {
          continue
        }
      }

      eligibleUsers.push(user)
    }

    return eligibleUsers
  },
})

/**
 * Helper to get rule metadata
 */
function getRuleMetadata(ruleType: string): {
  category: 'urgent' | 'helpful' | 'maintenance' | 'engagement'
} {
  // This would normally import from ruleEngine, but for simplicity:
  const urgentRules = ['interviewSoon']
  const helpfulRules = ['appRescue', 'resumeWeak', 'skillGap']
  const maintenanceRules = ['profileIncomplete']
  const engagementRules = ['dailyCheck', 'weeklyReview', 'goalStalled', 'networkingIdle', 'jobSearchStale']

  if (urgentRules.includes(ruleType)) return { category: 'urgent' }
  if (helpfulRules.includes(ruleType)) return { category: 'helpful' }
  if (maintenanceRules.includes(ruleType)) return { category: 'maintenance' }
  return { category: 'engagement' }
}
