/**
 * Resume Create Tool
 *
 * Agent-facing wrapper for creating a new resume from scratch
 */

import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { assertAuthAndPlan } from '../utils/assertAuthAndPlan'

/**
 * Create a new resume from scratch
 *
 * This is a simple wrapper around the base resume creation
 * that the agent can call directly
 */
export const createFromScratch = mutation({
  args: {
    userId: v.id('users'),
    title: v.string(),
    blocks: v.optional(v.array(v.any())),
    theme: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate auth and plan
    await assertAuthAndPlan(ctx, args.userId, {
      requireAgent: true,
      checkRateLimit: false, // Rate limiting handled at agent level
    })

    const now = Date.now()

    // Create resume
    const resumeId = await ctx.db.insert('resumes', {
      user_id: args.userId,
      title: args.title,
      content: { blocks: args.blocks || [] },
      visibility: 'private',
      source: 'ai_generated',
      created_at: now,
      updated_at: now,
    })

    const resume = await ctx.db.get(resumeId)

    return {
      success: true,
      resumeId,
      resume,
      message: `Created resume "${args.title}" successfully`,
    }
  },
})
