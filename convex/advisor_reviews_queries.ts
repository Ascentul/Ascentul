/**
 * Advisor Review Queue Queries
 *
 * Provides queries for managing resume/cover letter reviews:
 * - Get pending reviews
 * - Get review by ID
 * - Filter reviews by status/type
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  getCurrentUser,
  requireAdvisorRole,
  requireTenant,
} from "./advisor_auth";

/**
 * Get all reviews for advisor (with optional filters)
 */
export const getReviews = query({
  args: {
    clerkId: v.string(),
    status: v.optional(v.string()),
    asset_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Get all reviews for this university
    let reviews = await ctx.db
      .query("advisor_reviews")
      .withIndex("by_university", (q) => q.eq("university_id", universityId))
      .collect();

    // Filter by status if provided
    if (args.status) {
      reviews = reviews.filter((r) => r.status === args.status);
    }

    // Filter by asset type if provided
    if (args.asset_type) {
      reviews = reviews.filter((r) => r.asset_type === args.asset_type);
    }

    // Enrich with student data
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const student = await ctx.db.get(review.student_id);
        if (!student) {
          console.warn(`Student ${review.student_id} not found for review ${review._id}`);
        }

        // Get the asset (resume or cover letter)
        let assetName = 'Unknown';
        let assetId = null;
        if (review.asset_type === 'resume' && review.resume_id) {
          const resume = await ctx.db.get(review.resume_id);
          assetName = resume?.title || 'Untitled Resume';
          assetId = review.resume_id;
        } else if (review.asset_type === 'cover_letter' && review.cover_letter_id) {
          const coverLetter = await ctx.db.get(review.cover_letter_id);
          assetName = coverLetter?.company_name
            ? `Cover Letter for ${coverLetter.company_name}`
            : 'Untitled Cover Letter';
          assetId = review.cover_letter_id;
        }

        return {
          _id: review._id,
          student_id: review.student_id,
          student_name: student?.name || 'Unknown',
          student_email: student?.email || '',
          asset_id: assetId,
          asset_type: review.asset_type,
          asset_name: assetName,
          status: review.status,
          priority: review.priority || 'medium',
          requested_at: review.created_at,
          reviewer_id: review.reviewer_id,
          reviewed_at: review.reviewed_at,
          feedback: review.feedback,
          version: review.version,
        };
      }),
    );

    return enrichedReviews.sort((a, b) => {
      // Sort by priority (urgent first), then by requested date
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff =
        (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) -
        (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2);

      if (priorityDiff !== 0) return priorityDiff;

      return a.requested_at - b.requested_at;
    });
  },
});

/**
 * Get a single review by ID
 */
export const getReviewById = query({
  args: {
    clerkId: v.string(),
    review_id: v.id("advisor_reviews"),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const review = await ctx.db.get(args.review_id);
    if (!review) {
      throw new Error("Review not found");
    }

    // Verify tenant isolation
    if (review.university_id !== universityId) {
      throw new Error("Unauthorized: Review not in your university");
    }

    // Enrich with student data
    const student = await ctx.db.get(review.student_id);

    // Get the asset content
    let assetContent = null;
    let assetName = "Unknown";
    let assetId = null;

    if (review.asset_type === "resume" && review.resume_id) {
      const resume = await ctx.db.get(review.resume_id);
      if (resume) {
        assetName = resume.title || "Untitled Resume";
        assetId = review.resume_id;
        assetContent = {
          title: resume.title,
          file_url: resume.file_url,
          content: resume.content,
          created_at: resume.created_at,
          updated_at: resume.updated_at,
        };
      }
    } else if (review.asset_type === "cover_letter" && review.cover_letter_id) {
      const coverLetter = await ctx.db.get(review.cover_letter_id);
      if (coverLetter) {
        assetName = coverLetter.company_name
          ? `Cover Letter for ${coverLetter.company_name}`
          : "Untitled Cover Letter";
        assetId = review.cover_letter_id;
        assetContent = {
          company_name: coverLetter.company_name,
          position: coverLetter.position,
          content: coverLetter.content,
          file_url: coverLetter.file_url,
          created_at: coverLetter.created_at,
          updated_at: coverLetter.updated_at,
        };
      }
    }

    return {
      _id: review._id,
      student_id: review.student_id,
      student_name: student?.name || "Unknown",
      student_email: student?.email || "",
      asset_id: assetId,
      asset_type: review.asset_type,
      asset_name: assetName,
      asset_content: assetContent,
      status: review.status,
      priority: review.priority || "medium",
      requested_at: review.created_at,
      reviewer_id: review.reviewer_id,
      reviewed_at: review.reviewed_at,
      feedback: review.feedback,
      suggestions: review.suggestions,
      version: review.version,
    };
  },
});

/**
 * Get review queue stats
 */
export const getReviewQueueStats = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const allReviews = await ctx.db
      .query("advisor_reviews")
      .withIndex("by_university", (q) => q.eq("university_id", universityId))
      .collect();

    const waiting = allReviews.filter((r) => r.status === "waiting").length;
    const inProgress = allReviews.filter((r) => r.status === "in_progress").length;
    const completed = allReviews.filter((r) => r.status === "completed").length;

    const resumes = allReviews.filter((r) => r.asset_type === "resume").length;
    const coverLetters = allReviews.filter(
      (r) => r.asset_type === "cover_letter",
    ).length;

    const urgent = allReviews.filter(
      (r) => r.priority === "urgent" && r.status === "waiting",
    ).length;

    return {
      waiting,
      inProgress,
      completed,
      total: allReviews.length,
      resumes,
      coverLetters,
      urgent,
    };
  },
});
