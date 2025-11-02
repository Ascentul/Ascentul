/**
 * Resume Upload Tool
 *
 * Handles PDF/DOCX resume uploads, stores in Convex storage,
 * and optionally extracts text for analysis
 */

import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { assertAuthAndPlan } from '../utils/assertAuthAndPlan'

/**
 * Upload resume file
 *
 * Stores file reference and creates resume record
 * Text extraction happens asynchronously
 */
export const upload = mutation({
  args: {
    userId: v.id('users'),
    storageId: v.string(), // Convex storage ID from client upload
    filename: v.string(),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate auth and plan
    await assertAuthAndPlan(ctx, args.userId, {
      requireAgent: true,
      checkRateLimit: false,
    })

    const now = Date.now()

    // Create resume record with storage reference
    const resumeId = await ctx.db.insert('resumes', {
      user_id: args.userId,
      title: args.filename.replace(/\.(pdf|docx?)$/i, ''),
      blocks: [], // Will be populated after text extraction
      theme: 'default',
      source: 'pdf_upload',
      file_storage_id: args.storageId,
      created_at: now,
      updated_at: now,
    })

    return {
      success: true,
      resumeId,
      message: `Uploaded resume "${args.filename}" successfully`,
      note: 'Text extraction will happen in the background',
    }
  },
})

/**
 * Extract text from uploaded resume
 *
 * This would typically be called by a background job
 * after the file is uploaded
 */
export const extractText = mutation({
  args: {
    resumeId: v.id('resumes'),
    extractedText: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Authentication required')
    }

    const resume = await ctx.db.get(args.resumeId)
    if (!resume) {
      throw new Error('Resume not found')
    }

    // Verify ownership
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user || resume.user_id !== user._id) {
      throw new Error('Unauthorized: You do not own this resume')
    }

    // Update resume with extracted text
    await ctx.db.patch(args.resumeId, {
      extracted_text: args.extractedText,
      updated_at: Date.now(),
    })

    // TODO: Optionally parse extracted text into structured blocks
    // This could use OpenAI to identify sections and structure the content

    return {
      success: true,
      message: 'Text extracted successfully',
    }
  },
})
