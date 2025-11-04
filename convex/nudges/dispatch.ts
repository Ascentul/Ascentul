/**
 * Nudge Dispatch System
 *
 * Creates nudge records and routes them to appropriate channels
 * (in-app, email, push) based on user preferences
 */

import { mutation, query, action } from '../_generated/server'
import { v } from 'convex/values'
import { api } from '../_generated/api'
import { Id } from '../_generated/dataModel'
import { RuleEvaluation, NudgeRuleType } from './ruleEngine'
import { NUDGE_RULES } from './ruleEngine'

/**
 * Create a new nudge from a rule evaluation
 *
 * This is called by the sweep job after evaluating rules
 */
export const createNudge = mutation({
  args: {
    userId: v.id('users'),
    ruleType: v.string(),
    score: v.number(),
    reason: v.string(),
    metadata: v.any(),
    suggestedAction: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate rule type
    if (!(args.ruleType in NUDGE_RULES)) {
      throw new Error(`Invalid rule type: ${args.ruleType}`)
    }

    const now = Date.now()
    const rule = NUDGE_RULES[args.ruleType as NudgeRuleType]

    // Create nudge record
    const nudgeId = await ctx.db.insert('agent_nudges', {
      user_id: args.userId,
      rule_type: args.ruleType,
      score: args.score,
      reason: args.reason,
      metadata: args.metadata,
      suggested_action: args.suggestedAction,
      action_url: args.actionUrl,
      status: 'pending',
      channel: 'inApp', // Default to in-app, will be updated by routing
      created_at: now,
      updated_at: now,
    })

    // Set cooldown for this rule
    await ctx.db.insert('agent_cooldowns', {
      user_id: args.userId,
      rule_type: args.ruleType,
      cooldown_until: now + rule.cooldownMs,
      created_at: now,
    })

    return {
      nudgeId,
      success: true,
    }
  },
})

/**
 * Dispatch nudge to appropriate channels
 *
 * This is an action because it may call external services (email, push)
 */
export const dispatchNudge = action({
  args: {
    nudgeId: v.id('agent_nudges'),
  },
  handler: async (ctx, args) => {
    // Get nudge
    const nudge = await ctx.runQuery(api.nudges.getNudge, {
      nudgeId: args.nudgeId,
    })

    if (!nudge) {
      throw new Error('Nudge not found')
    }

    // Get user preferences
    const prefs = await ctx.runQuery(api.nudges.preferences.getUserPreferences, {
      userId: nudge.user_id,
    })

    // Determine channels to send to
    const channels: Array<'inApp' | 'email' | 'push'> = []

    if (!prefs) {
      // Default to in-app only if no preferences
      channels.push('inApp')
    } else {
      if (prefs.channels.inApp) channels.push('inApp')
      if (prefs.channels.email) channels.push('email')
      if (prefs.channels.push) channels.push('push')
    }

    // Send to each channel
    const results = {
      inApp: false,
      email: false,
      push: false,
    }

    for (const channel of channels) {
      try {
        if (channel === 'inApp') {
          // In-app nudges are already stored in DB, just mark as ready
          await ctx.runMutation(api.nudges.dispatch.updateNudgeChannel, {
            nudgeId: args.nudgeId,
            channel: 'inApp',
          })
          results.inApp = true
        } else if (channel === 'email') {
          // Send email notification
          await sendEmailNudge(ctx, nudge)
          results.email = true
        } else if (channel === 'push') {
          // Send push notification
          await sendPushNudge(ctx, nudge)
          results.push = true
        }
      } catch (error) {
        console.error(`Failed to send nudge to ${channel}:`, error)
      }
    }

    return {
      success: true,
      channels: results,
    }
  },
})

/**
 * Update nudge channel (internal mutation)
 */
export const updateNudgeChannel = mutation({
  args: {
    nudgeId: v.id('agent_nudges'),
    channel: v.union(
      v.literal('inApp'),
      v.literal('email'),
      v.literal('push')
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.nudgeId, {
      channel: args.channel,
      updated_at: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Get a single nudge by ID
 */
export const getNudge = query({
  args: {
    nudgeId: v.id('agent_nudges'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.nudgeId)
  },
})

/**
 * Send email nudge notification
 *
 * NOTE: Email sending happens via API route since Convex actions can't import Node modules
 */
async function sendEmailNudge(
  ctx: { runQuery: any },
  nudge: {
    user_id: Id<'users'>
    rule_type: string
    reason: string
    suggested_action?: string
    action_url?: string
  }
): Promise<void> {
  // Get user
  const user = await ctx.runQuery(api.users.getUser, {
    userId: nudge.user_id,
  })

  if (!user || !user.email || !user.full_name) {
    console.warn(`User ${nudge.user_id} has no email/name, skipping email nudge`)
    return
  }

  // Get rule details
  const rule = NUDGE_RULES[nudge.rule_type as NudgeRuleType]
  if (!rule) {
    console.warn(`Unknown rule type: ${nudge.rule_type}`)
    return
  }

  // Call API route to send email (Convex can't import Node modules directly)
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL environment variable is required')
    }

    const internalKey = process.env.CONVEX_INTERNAL_KEY
    if (!internalKey) {
      throw new Error('CONVEX_INTERNAL_KEY environment variable is required')
    }

    const response = await fetch(`${appUrl}/api/nudges/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Convex-Internal-Key': internalKey,
      },
      body: JSON.stringify({
        email: user.email,
        name: user.full_name,
        nudge: {
          ruleName: rule.name,
          reason: nudge.reason,
          suggestedAction: nudge.suggested_action,
          actionUrl: nudge.action_url,
          category: rule.category,
        },
      }),
    })

    if (!response.ok) {
      console.error(`Email send failed: ${response.status} ${response.statusText}`)
    } else {
      console.log(`[Email Nudge] Sent to ${user.email}: ${rule.name}`)
    }
  } catch (error) {
    console.error('[Email Nudge] Failed to send:', error)
  }
}

/**
 * Send push notification nudge
 */
async function sendPushNudge(ctx: any, nudge: any): Promise<void> {
  // Get rule details
  const rule = NUDGE_RULES[nudge.rule_type as NudgeRuleType]
  if (!rule) {
    console.warn(`Unknown rule type: ${nudge.rule_type}`)
    return
  }

  // TODO: Implement push notification sending
  // For now, just log
  console.log(`[Push Nudge] User: ${nudge.user_id}, Title: ${rule.name}`)
  console.log(`  Body: ${nudge.reason}`)

  // When push integration is ready:
  // await ctx.runMutation(api.notifications.sendPushNotification, {
  //   userId: nudge.user_id,
  //   title: rule.name,
  //   body: nudge.reason,
  //   data: {
  //     nudgeId: nudge._id,
  //     actionUrl: nudge.action_url,
  //   },
  // })
}

/**
 * Accept a nudge (user clicked on it)
 */
export const acceptNudge = mutation({
  args: {
    nudgeId: v.id('agent_nudges'),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Look up the user by Clerk ID
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    const nudge = await ctx.db.get(args.nudgeId)
    if (!nudge) {
      throw new Error('Nudge not found')
    }

    if (nudge.user_id !== user._id) {
      throw new Error('Unauthorized')
    }

    const now = Date.now()
    const startTime = now

    await ctx.db.patch(args.nudgeId, {
      status: 'accepted',
      accepted_at: now,
      updated_at: now,
    })

    // Log acceptance for metrics
    await ctx.db.insert('agent_audit_logs', {
      user_id: user._id,
      tool: 'nudge_accepted',
      input_json: { nudgeId: args.nudgeId, ruleType: nudge.rule_type },
      status: 'success',
      latency_ms: Date.now() - startTime,
      created_at: now,
    })

    return {
      success: true,
      actionUrl: nudge.action_url,
    }
  },
})

/**
 * Snooze a nudge (postpone for later)
 */
export const snoozeNudge = mutation({
  args: {
    nudgeId: v.id('agent_nudges'),
    clerkId: v.string(),
    snoozeUntil: v.number(),
  },
  handler: async (ctx, args) => {
    // Look up the user by Clerk ID
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    const nudge = await ctx.db.get(args.nudgeId)
    if (!nudge) {
      throw new Error('Nudge not found')
    }

    if (nudge.user_id !== user._id) {
      throw new Error('Unauthorized')
    }

    const now = Date.now()

    await ctx.db.patch(args.nudgeId, {
      status: 'snoozed',
      snoozed_until: args.snoozeUntil,
      updated_at: now,
    })

    // Log snooze for metrics
    await ctx.db.insert('agent_audit_logs', {
      user_id: user._id,
      tool: 'nudge_snoozed',
      input_json: { nudgeId: args.nudgeId, snoozeUntil: args.snoozeUntil },
      status: 'success',
      latency_ms: 0,
      created_at: now,
    })

    return { success: true }
  },
})

/**
 * Dismiss a nudge (user doesn't want to see it)
 */
export const dismissNudge = mutation({
  args: {
    nudgeId: v.id('agent_nudges'),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Look up the user by Clerk ID
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    const nudge = await ctx.db.get(args.nudgeId)
    if (!nudge) {
      throw new Error('Nudge not found')
    }

    if (nudge.user_id !== user._id) {
      throw new Error('Unauthorized')
    }

    const now = Date.now()

    await ctx.db.patch(args.nudgeId, {
      status: 'dismissed',
      dismissed_at: now,
      updated_at: now,
    })

    // Log dismissal for metrics
    await ctx.db.insert('agent_audit_logs', {
      user_id: user._id,
      tool: 'nudge_dismissed',
      input_json: { nudgeId: args.nudgeId, ruleType: nudge.rule_type },
      status: 'success',
      latency_ms: 0,
      created_at: now,
    })

    return { success: true }
  },
})

/**
 * Get pending nudges for a user (for in-app display)
 */
export const getPendingNudges = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // First, look up the Convex user by Clerk ID
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (!user) {
      return []
    }

    // Then query nudges for that user
    return await ctx.db
      .query('agent_nudges')
      .withIndex('by_user_status', (q) =>
        q.eq('user_id', user._id).eq('status', 'pending')
      )
      .collect()
  },
})
