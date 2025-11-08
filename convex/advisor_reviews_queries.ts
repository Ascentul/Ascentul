/**
 * Advisor Review Queue Queries
 *
 * Provides queries for managing resume/cover letter reviews:
 * - Get pending reviews
 * - Get review by ID
 * - Filter reviews by status/type
 */

import { query, QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import {
  getCurrentUser,
  requireAdvisorRole,
  requireTenant,
} from './advisor_auth';

/**
 * Type for resume content details
 */
type ResumeContent = {
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
};

/**
 * Type for cover letter content details
 */
type CoverLetterContent = {
  company_name: string | undefined;
  job_title: string | undefined;
  content: string;
  created_at: number;
  updated_at: number;
};

/**
 * Helper: Get asset name and optionally its content
 */
async function getAssetDetails(
  ctx: QueryCtx,
  assetType: "resume" | "cover_letter",
  resumeId: Id<"resumes"> | undefined,
  coverLetterId: Id<"cover_letters"> | undefined,
  includeContent: boolean = false
): Promise<{
  name: string;
  id: Id<"resumes"> | Id<"cover_letters"> | null;
  content: ResumeContent | CoverLetterContent | null;
}> {
  if (assetType === 'resume' && resumeId) {
    const resume = await ctx.db.get(resumeId);
    if (resume) {
      return {
        name: resume.title || 'Untitled Resume',
        id: resumeId,
        content: includeContent
          ? {
              title: resume.title,
              content: resume.content,
              created_at: resume.created_at,
              updated_at: resume.updated_at,
            }
          : null,
      };
    }
    console.warn(`Resume ${resumeId} not found for asset_type=${assetType}`);
  } else if (assetType === 'cover_letter' && coverLetterId) {
    const coverLetter = await ctx.db.get(coverLetterId);
    if (coverLetter) {
      return {
        name: coverLetter.company_name
          ? `Cover Letter for ${coverLetter.company_name}`
          : 'Untitled Cover Letter',
        id: coverLetterId,
        content: includeContent
          ? {
              company_name: coverLetter.company_name,
              job_title: coverLetter.job_title,
              content: coverLetter.content,
              created_at: coverLetter.created_at,
              updated_at: coverLetter.updated_at,
            }
          : null,
      };
    }
    console.warn(`Cover letter ${coverLetterId} not found for asset_type=${assetType}`);
  } else {
    console.warn(`Asset not found: type=${assetType}, resumeId=${resumeId}, coverLetterId=${coverLetterId}`);
  }

  return { name: 'Unknown', id: null, content: null };
}

/**
 * Get all reviews for advisor (with optional filters)
 */
export const getReviews = query({
  args: {
    clerkId: v.string(),
    status: v.optional(
      v.union(
        v.literal("waiting"),
        v.literal("in_review"),
        v.literal("needs_edits"),
        v.literal("approved")
      )
    ),
    asset_type: v.optional(
      v.union(v.literal("resume"), v.literal("cover_letter"))
    ),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Use database-level filtering for better performance
    let reviews;

    if (args.status && args.asset_type) {
      // Both filters: use status index, then filter asset_type in-memory
      // (no compound index for both fields)
      const statusFilter = args.status;
      reviews = await ctx.db
        .query("advisor_reviews")
        .withIndex("by_status", (q) =>
          q.eq("status", statusFilter).eq("university_id", universityId)
        )
        .collect();
      reviews = reviews.filter((r) => r.asset_type === args.asset_type);
    } else if (args.status) {
      // Status filter only: use by_status index
      const statusFilter = args.status;
      reviews = await ctx.db
        .query("advisor_reviews")
        .withIndex("by_status", (q) =>
          q.eq("status", statusFilter).eq("university_id", universityId)
        )
        .collect();
    } else if (args.asset_type) {
      // Asset type filter only: use by_asset_type index
      const assetTypeFilter = args.asset_type;
      reviews = await ctx.db
        .query("advisor_reviews")
        .withIndex("by_asset_type", (q) =>
          q.eq("asset_type", assetTypeFilter).eq("university_id", universityId)
        )
        .collect();
    } else {
      // No filters: use by_university index
      reviews = await ctx.db
        .query("advisor_reviews")
        .withIndex("by_university", (q) => q.eq("university_id", universityId))
        .collect();
    }

    // Enrich with student data
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const student = await ctx.db.get(review.student_id);
        if (!student) {
          console.warn(`Student ${review.student_id} not found for review ${review._id}`);
        }

        // Get the asset details using helper
        const assetDetails = await getAssetDetails(
          ctx,
          review.asset_type,
          review.resume_id,
          review.cover_letter_id,
          false // Don't include full content in list view
        );

        return {
          _id: review._id,
          student_id: review.student_id,
          student_name: student?.name || 'Unknown',
          student_email: student?.email || '',
          asset_id: assetDetails.id,
          asset_type: review.asset_type,
          asset_name: assetDetails.name,
          status: review.status,
          requested_at: review.created_at,
          reviewed_by: review.reviewed_by,
          reviewed_at: review.reviewed_at,
          rubric: review.rubric,
          comments: review.comments,
          version_id: review.version_id,
        };
      }),
    );

    return enrichedReviews.sort((a, b) => a.requested_at - b.requested_at);
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

    // Get the asset details with full content
    const assetDetails = await getAssetDetails(
      ctx,
      review.asset_type,
      review.resume_id,
      review.cover_letter_id,
      true // Include full content for detail view
    );

    // For detail views, asset must exist to provide complete review information
    if (assetDetails.id === null) {
      throw new Error(`Associated ${review.asset_type} not found for review`);
    }

    return {
      _id: review._id,
      student_id: review.student_id,
      student_name: student?.name || 'Unknown',
      student_email: student?.email || '',
      asset_id: assetDetails.id,
      asset_type: review.asset_type,
      asset_name: assetDetails.name,
   // For detail views, asset must exist to provide complete review information
   if (assetDetails.id === null) {
     throw new Error(`Associated ${review.asset_type} not found for review`);
   }
   if (assetDetails.content === null) {
     throw new Error(`Content not loaded for ${review.asset_type}`);
   }

   return {
     _id: review._id,
     student_id: review.student_id,
     student_name: student?.name || 'Unknown',
     student_email: student?.email || '',
     asset_id: assetDetails.id,
     asset_type: review.asset_type,
     asset_name: assetDetails.name,
     asset_content: assetDetails.content,
     status: review.status,
     requested_at: review.created_at,
      status: review.status,
      requested_at: review.created_at,
      reviewed_by: review.reviewed_by,
      reviewed_at: review.reviewed_at,
      rubric: review.rubric,
      comments: review.comments,
      version_id: review.version_id,
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

    // Single-pass statistics calculation for better performance
    const stats = allReviews.reduce(
      (acc, r) => {
        if (r.status === "waiting") acc.waiting++;
        if (r.status === "in_review") acc.inReview++;
        if (r.status === "needs_edits") acc.needsEdits++;
        if (r.status === "approved") acc.approved++;
        if (r.asset_type === "resume") acc.resumes++;
        if (r.asset_type === "cover_letter") acc.coverLetters++;
        return acc;
      },
      { waiting: 0, inReview: 0, needsEdits: 0, approved: 0, resumes: 0, coverLetters: 0 }
    );

    return {
      ...stats,
      total: allReviews.length,
    };
  },
});
