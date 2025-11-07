/**
 * Advisor Review Mutations
 *
 * Create, update, and complete reviews
 * Features: claim review, submit feedback, version control
 */

import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import {
  getCurrentUser,
  requireAdvisorRole,
  requireTenant,
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

    const review = await ctx.db.get(args.review_id);
    if (!review) {
      throw new Error('Review not found');
    }

    // Verify tenant isolation
    if (review.university_id !== universityId) {
      throw new Error('Unauthorized: Review not in your university');
    }

    // Can only claim waiting reviews
    if (review.status !== 'waiting') {
      throw new Error('Review is not available to claim');
    }

    await ctx.db.patch(args.review_id, {
      status: 'in_review',
      reviewed_by: sessionCtx.userId,
      updated_at: Date.now(),
    });

    return { success: true };
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

    const updates: any = {
      updated_at: Date.now(),
    };

    await ctx.db.patch(args.review_id, updates);

    return { success: true };
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
export const _completeReviewInternal = mutation({
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

    const now = Date.now();

    await ctx.db.patch(args.review_id, {
      status: 'approved',
      reviewed_at: now,
      updated_at: now,
    });

    // Get student info for email notification
    const student = await ctx.db.get(review.student_id);
    if (!student) {
      throw new Error('Student record not found');
    }

    // Determine review type from asset_type
    const reviewType = review.asset_type === 'resume' ? 'Resume' : 'Cover Letter';

    // Build review URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.ascentful.io';
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

    await ctx.db.patch(args.review_id, {
      status: 'waiting',
      reviewed_by: undefined,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});
