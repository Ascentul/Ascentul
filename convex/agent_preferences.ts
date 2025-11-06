/**
 * Agent Preferences (Clean Implementation)
 * 
 * Standalone preferences management without dependencies on nudge system
 */

import { mutation, query, MutationCtx } from './_generated/server'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'

const DEFAULT_PREFERENCES = {
  agent_enabled: true,
  proactive_enabled: true,
  notification_frequency: 'realtime' as const,
  quiet_hours_start: 22,
  quiet_hours_end: 8,
  timezone: 'America/Los_Angeles',
  channels: {
    inApp: true,
    email: false,
    push: false,
  },
  playbook_toggles: {
    jobSearch: true,
    resumeHelp: true,
    interviewPrep: true,
    networking: true,
    careerPath: true,
    applicationTracking: true,
  },
}

export const getUserPreferences = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query('agent_preferences')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .unique()

    if (!prefs) {
      return {
        user_id: args.userId,
        ...DEFAULT_PREFERENCES,
      }
    }

    return prefs
  },
})

export const upsertPreferences = mutation({
  args: {
    userId: v.id('users'),
    agent_enabled: v.optional(v.boolean()),
    proactive_enabled: v.optional(v.boolean()),
    notification_frequency: v.optional(
      v.union(v.literal('realtime'), v.literal('daily'), v.literal('weekly'))
    ),
    quiet_hours_start: v.optional(v.number()),
    quiet_hours_end: v.optional(v.number()),
    timezone: v.optional(v.string()),
    channels: v.optional(
      v.object({
        inApp: v.boolean(),
        email: v.boolean(),
        push: v.boolean(),
      })
    ),
    playbook_toggles: v.optional(
      v.object({
        jobSearch: v.boolean(),
        resumeHelp: v.boolean(),
        interviewPrep: v.boolean(),
        networking: v.boolean(),
        careerPath: v.boolean(),
        applicationTracking: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args
    const now = Date.now()

    // Validate quiet hours type first, then range (0-23)
    if (updates.quiet_hours_start !== undefined && !Number.isInteger(updates.quiet_hours_start)) {
      throw new Error('quiet_hours_start must be an integer')
    }
    if (updates.quiet_hours_start !== undefined && (updates.quiet_hours_start < 0 || updates.quiet_hours_start > 23)) {
      throw new Error('quiet_hours_start must be between 0 and 23')
    }
    if (updates.quiet_hours_end !== undefined && !Number.isInteger(updates.quiet_hours_end)) {
      throw new Error('quiet_hours_end must be an integer')
    }
    if (updates.quiet_hours_end !== undefined && (updates.quiet_hours_end < 0 || updates.quiet_hours_end > 23)) {
      throw new Error('quiet_hours_end must be between 0 and 23')
    }

    const existing = await ctx.db
      .query('agent_preferences')
      .withIndex('by_user', (q) => q.eq('user_id', userId))
      .unique()

    // Validate quiet hours are different (check final state, not just updates)
    if (updates.quiet_hours_start !== undefined || updates.quiet_hours_end !== undefined) {
      const finalStart = updates.quiet_hours_start ?? (existing?.quiet_hours_start ?? DEFAULT_PREFERENCES.quiet_hours_start)
      const finalEnd = updates.quiet_hours_end ?? (existing?.quiet_hours_end ?? DEFAULT_PREFERENCES.quiet_hours_end)

      if (finalStart === finalEnd) {
        throw new Error('quiet_hours_start and quiet_hours_end must be different to define a valid quiet hours window')
      }
    }

    if (existing) {
      // Merge nested objects instead of replacing them
      const updatedChannels = updates.channels
        ? { ...existing.channels, ...updates.channels }
        : existing.channels

      const updatedPlaybookToggles = updates.playbook_toggles
        ? { ...existing.playbook_toggles, ...updates.playbook_toggles }
        : existing.playbook_toggles

      await ctx.db.patch(existing._id, {
        ...updates,
        channels: updatedChannels,
        playbook_toggles: updatedPlaybookToggles,
        updated_at: now,
      })

      return {
        success: true,
        preferencesId: existing._id,
      }
    } else {
      const preferencesId = await ctx.db.insert('agent_preferences', {
        user_id: userId,
        agent_enabled: updates.agent_enabled ?? DEFAULT_PREFERENCES.agent_enabled,
        proactive_enabled: updates.proactive_enabled ?? DEFAULT_PREFERENCES.proactive_enabled,
        notification_frequency: updates.notification_frequency ?? DEFAULT_PREFERENCES.notification_frequency,
        quiet_hours_start: updates.quiet_hours_start ?? DEFAULT_PREFERENCES.quiet_hours_start,
        quiet_hours_end: updates.quiet_hours_end ?? DEFAULT_PREFERENCES.quiet_hours_end,
        timezone: updates.timezone ?? DEFAULT_PREFERENCES.timezone,
        channels: updates.channels ?? DEFAULT_PREFERENCES.channels,
        playbook_toggles: updates.playbook_toggles ?? DEFAULT_PREFERENCES.playbook_toggles,
        created_at: now,
        updated_at: now,
      })

      return {
        success: true,
        preferencesId,
      }
    }
  },
})

/**
 * Helper function to toggle a boolean preference field
 * Reduces duplication across toggle mutations
 */
async function togglePreferenceField(
  ctx: MutationCtx,
  userId: Id<'users'>,
  field: 'agent_enabled' | 'proactive_enabled',
  enabled: boolean
) {
  const now = Date.now()

  const existing = await ctx.db
    .query('agent_preferences')
    .withIndex('by_user', (q) => q.eq('user_id', userId))
    .unique()

  if (existing) {
    await ctx.db.patch(existing._id, {
      [field]: enabled,
      updated_at: now,
    })
  } else {
    await ctx.db.insert('agent_preferences', {
      user_id: userId,
      ...DEFAULT_PREFERENCES,
      [field]: enabled,
      created_at: now,
      updated_at: now,
    })
  }

  return {
    success: true,
    enabled,
  }
}

export const toggleAgent = mutation({
  args: {
    userId: v.id('users'),
    enabled: v.boolean(),
  },
  handler: (ctx, args) => togglePreferenceField(ctx, args.userId, 'agent_enabled', args.enabled),
})

export const toggleProactiveNudges = mutation({
  args: {
    userId: v.id('users'),
    enabled: v.boolean(),
  },
  handler: (ctx, args) => togglePreferenceField(ctx, args.userId, 'proactive_enabled', args.enabled),
})

export const resetPreferences = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const existing = await ctx.db
      .query('agent_preferences')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...DEFAULT_PREFERENCES,
        updated_at: now,
      })
    } else {
      await ctx.db.insert('agent_preferences', {
        user_id: args.userId,
        ...DEFAULT_PREFERENCES,
        created_at: now,
        updated_at: now,
      })
    }

    return {
      success: true,
    }
  },
})
