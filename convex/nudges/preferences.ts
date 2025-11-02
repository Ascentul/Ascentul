/**
 * Agent Preferences Management
 *
 * CRUD operations for user agent preferences including:
 * - Proactive nudge toggles
 * - Quiet hours
 * - Notification channels
 * - Playbook-specific toggles
 */

import { mutation, query } from '../_generated/server'
import { v } from 'convex/values'

/**
 * Default agent preferences
 * Single source of truth for default values
 */
const DEFAULT_PREFERENCES = {
  agent_enabled: true,
  proactive_enabled: true,
  notification_frequency: 'realtime' as const,
  quiet_hours_start: 22, // 10 PM
  quiet_hours_end: 8, // 8 AM
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

/**
 * Get user agent preferences
 *
 * Returns default preferences if none exist
 */
export const getUserPreferences = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query('agent_preferences')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .unique()

    // Return defaults if no preferences exist
    if (!prefs) {
      return {
        user_id: args.userId,
        ...DEFAULT_PREFERENCES,
      }
    }

    return prefs
  },
})

/**
 * Create or update user agent preferences
 */
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

    // Check if preferences exist
    const existing = await ctx.db
      .query('agent_preferences')
      .withIndex('by_user', (q) => q.eq('user_id', userId))
      .unique()

    if (existing) {
      // Update existing preferences
      await ctx.db.patch(existing._id, {
        ...updates,
        updated_at: now,
      })

      return {
        success: true,
        preferencesId: existing._id,
        message: 'Preferences updated successfully',
      }
    } else {
      // Create new preferences with defaults
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
        message: 'Preferences created successfully',
      }
    }
  },
})

/**
 * Toggle agent on/off (quick action)
 */
export const toggleAgent = mutation({
  args: {
    userId: v.id('users'),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const existing = await ctx.db
      .query('agent_preferences')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        agent_enabled: args.enabled,
        updated_at: now,
      })
    } else {
      await ctx.db.insert('agent_preferences', {
        user_id: args.userId,
        agent_enabled: args.enabled,
        proactive_enabled: true,
        notification_frequency: 'realtime',
        quiet_hours_start: 22,
        quiet_hours_end: 8,
        timezone: 'America/Los_Angeles',
        channels: { inApp: true, email: false, push: false },
        playbook_toggles: {
          jobSearch: true,
          resumeHelp: true,
          interviewPrep: true,
          networking: true,
          careerPath: true,
          applicationTracking: true,
        },
        created_at: now,
        updated_at: now,
      })
    }

    return {
      success: true,
      enabled: args.enabled,
      message: args.enabled ? 'Agent enabled' : 'Agent disabled',
    }
  },
})

/**
 * Toggle proactive nudges on/off (quick action)
 */
export const toggleProactiveNudges = mutation({
  args: {
    userId: v.id('users'),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const existing = await ctx.db
      .query('agent_preferences')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        proactive_enabled: args.enabled,
        updated_at: now,
      })
    } else {
      await ctx.db.insert('agent_preferences', {
        user_id: args.userId,
        agent_enabled: true,
        proactive_enabled: args.enabled,
        notification_frequency: 'realtime',
        quiet_hours_start: 22,
        quiet_hours_end: 8,
        timezone: 'America/Los_Angeles',
        channels: { inApp: true, email: false, push: false },
        playbook_toggles: {
          jobSearch: true,
          resumeHelp: true,
          interviewPrep: true,
          networking: true,
          careerPath: true,
          applicationTracking: true,
        },
        created_at: now,
        updated_at: now,
      })
    }

    return {
      success: true,
      enabled: args.enabled,
      message: args.enabled ? 'Proactive nudges enabled' : 'Proactive nudges disabled',
    }
  },
})

/**
 * Update quiet hours
 */
export const updateQuietHours = mutation({
  args: {
    userId: v.id('users'),
    startHour: v.number(), // 0-23
    endHour: v.number(), // 0-23
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate hours
    if (args.startHour < 0 || args.startHour > 23) {
      throw new Error('Start hour must be between 0 and 23')
    }
    if (args.endHour < 0 || args.endHour > 23) {
      throw new Error('End hour must be between 0 and 23')
    }

    const now = Date.now()

    const existing = await ctx.db
      .query('agent_preferences')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .unique()

    const updates = {
      quiet_hours_start: args.startHour,
      quiet_hours_end: args.endHour,
      ...(args.timezone && { timezone: args.timezone }),
      updated_at: now,
    }

    if (existing) {
      await ctx.db.patch(existing._id, updates)
    } else {
      await ctx.db.insert('agent_preferences', {
        user_id: args.userId,
        agent_enabled: true,
        proactive_enabled: true,
        notification_frequency: 'realtime',
        quiet_hours_start: args.startHour,
        quiet_hours_end: args.endHour,
        timezone: args.timezone ?? 'America/Los_Angeles',
        channels: { inApp: true, email: false, push: false },
        playbook_toggles: {
          jobSearch: true,
          resumeHelp: true,
          interviewPrep: true,
          networking: true,
          careerPath: true,
          applicationTracking: true,
        },
        created_at: now,
        updated_at: now,
      })
    }

    return {
      success: true,
      message: `Quiet hours set: ${args.startHour}:00 - ${args.endHour}:00`,
    }
  },
})

/**
 * Update notification channels
 */
export const updateChannels = mutation({
  args: {
    userId: v.id('users'),
    inApp: v.boolean(),
    email: v.boolean(),
    push: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    const existing = await ctx.db
      .query('agent_preferences')
      .withIndex('by_user', (q) => q.eq('user_id', args.userId))
      .unique()

    const channels = {
      inApp: args.inApp,
      email: args.email,
      push: args.push,
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        channels,
        updated_at: now,
      })
    } else {
      await ctx.db.insert('agent_preferences', {
        user_id: args.userId,
        agent_enabled: true,
        proactive_enabled: true,
        notification_frequency: 'realtime',
        quiet_hours_start: 22,
        quiet_hours_end: 8,
        timezone: 'America/Los_Angeles',
        channels,
        playbook_toggles: {
          jobSearch: true,
          resumeHelp: true,
          interviewPrep: true,
          networking: true,
          careerPath: true,
          applicationTracking: true,
        },
        created_at: now,
        updated_at: now,
      })
    }

    return {
      success: true,
      message: 'Notification channels updated',
    }
  },
})

/**
 * Update playbook-specific toggles
 */
export const updatePlaybookToggles = mutation({
  args: {
    userId: v.id('users'),
    jobSearch: v.optional(v.boolean()),
    resumeHelp: v.optional(v.boolean()),
    interviewPrep: v.optional(v.boolean()),
    networking: v.optional(v.boolean()),
    careerPath: v.optional(v.boolean()),
    applicationTracking: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...toggles } = args
    const now = Date.now()

    const existing = await ctx.db
      .query('agent_preferences')
      .withIndex('by_user', (q) => q.eq('user_id', userId))
      .unique()

    if (existing) {
      // Merge with existing toggles
      const updatedToggles = {
        ...existing.playbook_toggles,
        ...toggles,
      }

      await ctx.db.patch(existing._id, {
        playbook_toggles: updatedToggles,
        updated_at: now,
      })
    } else {
      await ctx.db.insert('agent_preferences', {
        user_id: userId,
        agent_enabled: true,
        proactive_enabled: true,
        notification_frequency: 'realtime',
        quiet_hours_start: 22,
        quiet_hours_end: 8,
        timezone: 'America/Los_Angeles',
        channels: { inApp: true, email: false, push: false },
        playbook_toggles: {
          jobSearch: toggles.jobSearch ?? true,
          resumeHelp: toggles.resumeHelp ?? true,
          interviewPrep: toggles.interviewPrep ?? true,
          networking: toggles.networking ?? true,
          careerPath: toggles.careerPath ?? true,
          applicationTracking: toggles.applicationTracking ?? true,
        },
        created_at: now,
        updated_at: now,
      })
    }

    return {
      success: true,
      message: 'Playbook preferences updated',
    }
  },
})

/**
 * Reset preferences to defaults
 */
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

    const defaults = {
      agent_enabled: true,
      proactive_enabled: true,
      notification_frequency: 'realtime' as const,
      quiet_hours_start: 22,
      quiet_hours_end: 8,
      timezone: 'America/Los_Angeles',
      channels: { inApp: true, email: false, push: false },
      playbook_toggles: {
        jobSearch: true,
        resumeHelp: true,
        interviewPrep: true,
        networking: true,
        careerPath: true,
        applicationTracking: true,
      },
      updated_at: now,
    }

    if (existing) {
      await ctx.db.patch(existing._id, defaults)
    } else {
      await ctx.db.insert('agent_preferences', {
        user_id: args.userId,
        ...defaults,
        created_at: now,
      })
    }

    return {
      success: true,
      message: 'Preferences reset to defaults',
    }
  },
})
