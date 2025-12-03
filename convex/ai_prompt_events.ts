/**
 * AI Prompt Events - Audit logging for prompt lifecycle
 *
 * Tracks all events related to prompt versions:
 * - Version creation, cloning, editing
 * - Activations, deactivations, rollbacks
 * - Approvals
 * - Experiments (start/stop)
 * - Hotfixes
 * - Git syncs
 */

import { v } from 'convex/values';

import { query } from './_generated/server';
import { requireSuperAdmin } from './lib/roles';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List events with filters
 */
export const listEvents = query({
  args: {
    toolId: v.optional(v.string()),
    versionId: v.optional(v.id('prompt_versions')),
    eventType: v.optional(v.string()),
    env: v.optional(v.union(v.literal('dev'), v.literal('prod'))),
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const limit = args.limit ?? 100;

    // Build query
    let events;
    if (args.toolId) {
      events = await ctx.db
        .query('ai_prompt_events')
        .withIndex('by_tool', (q) => q.eq('tool_id', args.toolId!))
        .order('desc')
        .take(limit * 2); // Take extra to account for filters
    } else if (args.versionId) {
      events = await ctx.db
        .query('ai_prompt_events')
        .withIndex('by_version', (q) => q.eq('version_id', args.versionId!))
        .order('desc')
        .take(limit * 2);
    } else {
      events = await ctx.db
        .query('ai_prompt_events')
        .order('desc')
        .take(limit * 2);
    }

    // Apply additional filters
    if (args.eventType) {
      events = events.filter((e) => e.event_type === args.eventType);
    }
    if (args.env) {
      events = events.filter((e) => e.env === args.env);
    }
    if (args.startDate) {
      events = events.filter((e) => e.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      events = events.filter((e) => e.timestamp <= args.endDate!);
    }

    // Limit final results
    events = events.slice(0, limit);

    // Enrich with user info
    const enrichedEvents = await Promise.all(
      events.map(async (event) => {
        const user = await ctx.db.get(event.user_id);
        const version = event.version_id ? await ctx.db.get(event.version_id) : null;
        const previousVersion = event.previous_version_id
          ? await ctx.db.get(event.previous_version_id)
          : null;

        return {
          ...event,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
              }
            : null,
          version: version
            ? {
                _id: version._id,
                version_string: version.version_string,
                kind: version.kind,
              }
            : null,
          previousVersion: previousVersion
            ? {
                _id: previousVersion._id,
                version_string: previousVersion.version_string,
              }
            : null,
        };
      }),
    );

    return enrichedEvents;
  },
});

/**
 * Get timeline of events for a specific tool
 */
export const getToolTimeline = query({
  args: {
    toolId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const limit = args.limit ?? 50;

    const events = await ctx.db
      .query('ai_prompt_events')
      .withIndex('by_tool', (q) => q.eq('tool_id', args.toolId))
      .order('desc')
      .take(limit);

    // Group by date for timeline display
    const grouped: Record<string, typeof events> = {};
    for (const event of events) {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    }

    return {
      events,
      byDate: grouped,
    };
  },
});

/**
 * Get recent activity across all tools
 */
export const getRecentActivity = query({
  args: {
    hours: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const hours = args.hours ?? 24;
    const limit = args.limit ?? 50;
    const since = Date.now() - hours * 60 * 60 * 1000;

    const events = await ctx.db
      .query('ai_prompt_events')
      .order('desc')
      .take(limit * 2);

    const recentEvents = events.filter((e) => e.timestamp >= since).slice(0, limit);

    // Enrich with user info
    const enrichedEvents = await Promise.all(
      recentEvents.map(async (event) => {
        const user = await ctx.db.get(event.user_id);
        return {
          ...event,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
              }
            : null,
        };
      }),
    );

    return enrichedEvents;
  },
});

/**
 * Get activation history for a tool (shows which versions were active when)
 */
export const getActivationHistory = query({
  args: {
    toolId: v.string(),
    env: v.union(v.literal('dev'), v.literal('prod')),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const limit = args.limit ?? 20;

    const events = await ctx.db
      .query('ai_prompt_events')
      .withIndex('by_tool', (q) => q.eq('tool_id', args.toolId))
      .order('desc')
      .collect();

    // Filter for activation/deactivation/rollback events in this env
    const activationEvents = events
      .filter(
        (e) =>
          ['activation', 'deactivation', 'rollback'].includes(e.event_type) && e.env === args.env,
      )
      .slice(0, limit);

    // Enrich with version info
    return Promise.all(
      activationEvents.map(async (event) => {
        const version = event.version_id ? await ctx.db.get(event.version_id) : null;
        const user = await ctx.db.get(event.user_id);

        return {
          ...event,
          version: version
            ? {
                _id: version._id,
                version_string: version.version_string,
                risk_level: version.risk_level,
              }
            : null,
          user: user
            ? {
                name: user.name,
                email: user.email,
              }
            : null,
        };
      }),
    );
  },
});

/**
 * Get event counts by type for dashboard stats
 */
export const getEventStats = query({
  args: {
    toolId: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const days = args.days ?? 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    let events;
    if (args.toolId) {
      events = await ctx.db
        .query('ai_prompt_events')
        .withIndex('by_tool', (q) => q.eq('tool_id', args.toolId!))
        .collect();
    } else {
      events = await ctx.db.query('ai_prompt_events').collect();
    }

    // Filter to time window
    events = events.filter((e) => e.timestamp >= since);

    // Count by type
    const byType: Record<string, number> = {};
    for (const event of events) {
      byType[event.event_type] = (byType[event.event_type] || 0) + 1;
    }

    // Count by env
    const byEnv: Record<string, number> = { dev: 0, prod: 0 };
    for (const event of events) {
      if (event.env) {
        byEnv[event.env] = (byEnv[event.env] || 0) + 1;
      }
    }

    // Count rollbacks (important metric)
    const rollbackCount = byType['rollback'] || 0;

    // Count hotfixes
    const hotfixCount = byType['hotfix'] || 0;

    return {
      totalEvents: events.length,
      byType,
      byEnv,
      rollbackCount,
      hotfixCount,
      period: `Last ${days} days`,
    };
  },
});
