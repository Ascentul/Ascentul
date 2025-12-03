/**
 * AI Eval Feedback - User feedback on AI outputs
 *
 * Manages feedback on AI-generated content:
 * - Thumbs up/down ratings
 * - Tags for categorization
 * - Notes for detailed feedback
 * - Links to eval runs for traceability
 */

import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireSuperAdmin } from './lib/roles';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List feedback with filters
 */
export const listFeedback = query({
  args: {
    evalRunId: v.optional(v.id('ai_eval_runs')),
    rating: v.optional(v.union(v.literal('good'), v.literal('bad'), v.literal('neutral'))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const limit = args.limit ?? 100;

    let feedback;
    if (args.evalRunId) {
      feedback = await ctx.db
        .query('ai_eval_feedback')
        .withIndex('by_eval_run', (q) => q.eq('eval_run_id', args.evalRunId!))
        .order('desc')
        .take(limit);
    } else if (args.rating) {
      feedback = await ctx.db
        .query('ai_eval_feedback')
        .withIndex('by_rating', (q) => q.eq('rating', args.rating!))
        .order('desc')
        .take(limit);
    } else {
      feedback = await ctx.db.query('ai_eval_feedback').order('desc').take(limit);
    }

    // Enrich with user info
    return Promise.all(
      feedback.map(async (f) => {
        const user = await ctx.db.get(f.created_by_user_id);
        return {
          ...f,
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
  },
});

/**
 * Get a single feedback entry
 */
export const getFeedback = query({
  args: {
    feedbackId: v.id('ai_eval_feedback'),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) return null;

    // Get related data
    const evalRun = await ctx.db.get(feedback.eval_run_id);
    const user = await ctx.db.get(feedback.created_by_user_id);

    return {
      ...feedback,
      evalRun,
      user,
    };
  },
});

/**
 * Get feedback stats
 */
export const getFeedbackStats = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const days = args.days ?? 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const feedback = await ctx.db.query('ai_eval_feedback').collect();

    const recentFeedback = feedback.filter((f) => f.created_at >= since);

    // Count by rating
    const byRating: Record<string, number> = {
      good: 0,
      bad: 0,
      neutral: 0,
    };
    for (const f of recentFeedback) {
      byRating[f.rating] = (byRating[f.rating] || 0) + 1;
    }

    // Count by tag
    const byTag: Record<string, number> = {};
    for (const f of recentFeedback) {
      if (f.tags) {
        for (const tag of f.tags) {
          byTag[tag] = (byTag[tag] || 0) + 1;
        }
      }
    }

    // Calculate satisfaction rate
    const total = recentFeedback.length;
    const good = byRating.good || 0;
    const bad = byRating.bad || 0;
    const satisfactionRate = total > 0 ? good / total : null;
    const dissatisfactionRate = total > 0 ? bad / total : null;

    return {
      totalFeedback: total,
      byRating,
      byTag,
      satisfactionRate,
      dissatisfactionRate,
      withNotes: recentFeedback.filter((f) => f.note && f.note.length > 0).length,
      period: `Last ${days} days`,
    };
  },
});

/**
 * Get recent negative feedback for attention
 */
export const getRecentNegativeFeedback = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const limit = args.limit ?? 20;

    const feedback = await ctx.db
      .query('ai_eval_feedback')
      .withIndex('by_rating', (q) => q.eq('rating', 'bad'))
      .order('desc')
      .take(limit);

    // Enrich with eval run info
    return Promise.all(
      feedback.map(async (f) => {
        const evalRun = await ctx.db.get(f.eval_run_id);
        const user = await ctx.db.get(f.created_by_user_id);
        return {
          ...f,
          evalRun: evalRun
            ? {
                tool_id: evalRun.tool_id,
                input_snapshot: evalRun.input_snapshot,
                output_snapshot: evalRun.output_snapshot,
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

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Submit feedback for an eval run
 */
export const submitFeedback = mutation({
  args: {
    evalRunId: v.id('ai_eval_runs'),
    rating: v.union(v.literal('good'), v.literal('bad'), v.literal('neutral')),
    tags: v.optional(v.array(v.string())),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const evalRun = await ctx.db.get(args.evalRunId);
    if (!evalRun) {
      throw new Error('Eval run not found');
    }

    // Check if feedback already exists from this user
    const existing = await ctx.db
      .query('ai_eval_feedback')
      .withIndex('by_eval_run', (q) => q.eq('eval_run_id', args.evalRunId))
      .filter((q) => q.eq(q.field('created_by_user_id'), user._id))
      .first();

    if (existing) {
      throw new Error('Feedback already submitted for this eval run');
    }

    const now = Date.now();

    const feedbackId = await ctx.db.insert('ai_eval_feedback', {
      eval_run_id: args.evalRunId,
      rating: args.rating,
      tags: args.tags,
      note: args.note,
      created_by_user_id: user._id,
      created_at: now,
    });

    return feedbackId;
  },
});

/**
 * Update existing feedback
 */
export const updateFeedback = mutation({
  args: {
    feedbackId: v.id('ai_eval_feedback'),
    rating: v.optional(v.union(v.literal('good'), v.literal('bad'), v.literal('neutral'))),
    tags: v.optional(v.array(v.string())),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    const updates: Record<string, unknown> = {};

    if (args.rating !== undefined) updates.rating = args.rating;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.note !== undefined) updates.note = args.note;

    await ctx.db.patch(args.feedbackId, updates);

    return { success: true };
  },
});

/**
 * Delete feedback
 */
export const deleteFeedback = mutation({
  args: {
    feedbackId: v.id('ai_eval_feedback'),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      throw new Error('Feedback not found');
    }

    await ctx.db.delete(args.feedbackId);

    return { success: true };
  },
});
