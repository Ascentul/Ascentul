/**
 * Advisor Review Mutations
 *
 * Create, update, and complete reviews
 * Features: claim review, submit feedback, version control
 */

import { mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import {
  getCurrentUser,
  requireAdvisorRole,
  requireTenant,
  createAuditLog,
} from "./advisor_auth";

/**
 * Claim a review (move from waiting to in_progress)
 */
export const claimReview = mutation({
  args: {
    clerkId: v.string(),
    review_id: v.id('advisor_reviews'),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // ATOMIC CLAIM: Optimistic concurrency control ensures serializable semantics
    // Convex uses optimistic concurrency: mutations may execute concurrently for
    // performance, but commits only succeed if the transaction is serializable.
    const review = await ctx.db.get(args.review_id);
    if (!review) {
      throw new Error('Review not found');
    }

    // Verify tenant isolation
    if (review.university_id !== universityId) {
      throw new Error('Unauthorized: Review not in your university');
    }

    // CRITICAL: Race condition prevention via optimistic concurrency control.
    // If two advisors claim simultaneously, both may read status='waiting', but
    // only one commit will succeed. The second will fail serialization check,
    // retry, see status='in_review', and fail this validation.
    if (review.status !== 'waiting') {
      throw new Error('Review is not available to claim');
    }

    // Safe to claim - optimistic concurrency control guarantees that if another
    // mutation modified this review concurrently, this transaction will abort and retry
      const currentVersion = review.version ?? 0;
      await ctx.db.patch(args.review_id, {
        status: 'in_review',
        reviewed_by: sessionCtx.userId,
        version: currentVersion + 1,
        updated_at: Date.now(),
      });

    return { success: true, version: currentVersion + 1 };
  },
});

/**
 * Update review feedback (autosave)
 */
export const updateReviewFeedback = mutation({
  args: {
    clerkId: v.string(),
    review_id: v.id('advisor_reviews'),
    feedback: v.optional(v.string()),
    suggestions: v.optional(v.array(v.string())),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const review = await ctx.db.get(args.review_id);
    if (!review) {
      throw new Error('Review not found');
    }

    // Verify tenant isolation
    if (review.university_id !== universityId) {
      throw new Error('Unauthorized: Review not in your university');
    }

    // Only reviewer can update
    if (review.reviewed_by !== sessionCtx.userId) {
      throw new Error('Unauthorized: Not your review');
    }

    const currentVersion = review.version ?? 0;

    // Validate version for optimistic concurrency control
    if (currentVersion !== args.version) {
      throw new Error(
        `Version mismatch: Review was updated by another user. Expected version ${currentVersion}, got ${args.version}. Please refresh and try again.`
      );
    }

    // Build updates object with explicit typing
    type UpdateFields = {
      updated_at: number;
      version: number;
      feedback?: string;
      suggestions?: string[];
    };

    const updates: UpdateFields = {
      updated_at: Date.now(),
      version: currentVersion + 1, // Increment version for optimistic locking
    };

    if (args.feedback !== undefined) {
      updates.feedback = args.feedback;
    }

    if (args.suggestions !== undefined) {
      updates.suggestions = args.suggestions;
    }

    await ctx.db.patch(args.review_id, updates);

    return { success: true, version: updates.version };
  },
});

/**
 * Complete review (mark as done and notify student)
 */
export const completeReview = action({
  args: {
    clerkId: v.string(),
    review_id: v.id('advisor_reviews'),
    feedback: v.string(),
    suggestions: v.optional(v.array(v.string())),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    // Call internal mutation to update the review
    const result = await ctx.runMutation(internal.advisor_reviews_mutations._completeReviewInternal, {
      clerkId: args.clerkId,
      review_id: args.review_id,
      feedback: args.feedback,
      suggestions: args.suggestions,
      version: args.version,
    });

    // Send email notification to student (non-blocking)
    try {
      await ctx.runAction(api.email.sendReviewCompletionEmail, {
        email: result.studentEmail,
        studentName: result.studentName,
        reviewType: result.reviewType,
        reviewUrl: result.reviewUrl,
      });
    } catch (error) {
      // Log but don't fail the review completion if email fails
      console.error('Failed to send review completion email:', error);
    }

    return { success: true };
  },
});

/**
 * Internal mutation to complete review
 * Called by completeReview action
 */
export const _completeReviewInternal = internalMutation({
  args: {
    clerkId: v.string(),
    review_id: v.id('advisor_reviews'),
    feedback: v.string(),
    suggestions: v.optional(v.array(v.string())),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const review = await ctx.db.get(args.review_id);
    if (!review) {
      throw new Error('Review not found');
    }

    // Verify tenant isolation
    if (review.university_id !== universityId) {
      throw new Error('Unauthorized: Review not in your university');
    }

    // Only reviewer can complete
    if (review.reviewed_by !== sessionCtx.userId) {
      throw new Error('Unauthorized: Not your review');
    }

    // Ensure review is in progress before completing
    if (review.status !== 'in_review') {
      throw new Error(`Cannot complete review with status: ${review.status}`);
    }

    const currentVersion = review.version ?? 0;

    // Validate version for optimistic concurrency control
    if (currentVersion !== args.version) {
      throw new Error(
        `Version mismatch: Review was updated by another user. Expected version ${currentVersion}, got ${args.version}. Please refresh and try again.`
      );
    }

    // Get student info for email notification BEFORE completing review
    const student = await ctx.db.get(review.student_id);
    if (!student) {
      throw new Error('Student record not found');
    }

    const now = Date.now();

    await ctx.db.patch(args.review_id, {
      status: 'approved',
      reviewed_at: now,
      updated_at: now,
      feedback: args.feedback,
      suggestions: args.suggestions,
      version: currentVersion + 1, // Increment version for optimistic locking
    });

    // Determine review type from asset_type
    const reviewType = review.asset_type === 'resume' ? 'Resume' : 'Cover Letter';

    // Build review URL
    // IMPORTANT: APP_URL must be configured in Convex Dashboard for each environment:
    // Settings → Deployment Settings → Environment Variables
    // - Development: http://localhost:3000
    // - Staging: https://staging.ascentful.io
    // - Production: https://app.ascentful.io
    // The fallback only works for production; other envs will get wrong URLs without config
    const appUrl = process.env.APP_URL || 'https://app.ascentful.io';
    let reviewUrl = `${appUrl}/dashboard`;

    if (review.asset_type === 'resume' && review.resume_id) {
      reviewUrl = `${appUrl}/resumes/${review.resume_id}`;
    } else if (review.asset_type === 'cover_letter' && review.cover_letter_id) {
      reviewUrl = `${appUrl}/cover-letters/${review.cover_letter_id}`;
    }

    return {
      success: true,
      studentEmail: student.email,
      studentName: student.name,
      reviewType,
      reviewUrl,
    };
  },
});

/**
 * Return review to queue (unclaim)
 */
export const returnReviewToQueue = mutation({
  args: {
    clerkId: v.string(),
    review_id: v.id('advisor_reviews'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const review = await ctx.db.get(args.review_id);
    if (!review) {
      throw new Error('Review not found');
    }

    // Verify tenant isolation
    if (review.university_id !== universityId) {
      throw new Error('Unauthorized: Review not in your university');
    }

    // Only reviewer or admin can return
    if (
      review.reviewed_by !== sessionCtx.userId &&
      sessionCtx.role !== 'super_admin' &&
      sessionCtx.role !== 'university_admin'
    ) {
      throw new Error('Unauthorized: Not your review');
    }

    // Only allow returning reviews that are in progress
    if (review.status !== 'in_review') {
      throw new Error(`Cannot return review with status: ${review.status}`);
    }

    await ctx.db.patch(args.review_id, {
      status: 'waiting',
      reviewed_by: undefined,
      updated_at: Date.now(),
      version: (review.version ?? 0) + 1,
    });

    // Audit log for returning to queue
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: review.university_id,
      action: "review.returned_to_queue",
      entityType: "advisor_review",
      entityId: args.review_id,
      studentId: review.student_id,
      previousValue: { status: "in_review", reviewed_by: review.reviewed_by },
      newValue: { status: "waiting", reason: args.reason },
      ipAddress: "server",
    });

    return { success: true };
  },
});
