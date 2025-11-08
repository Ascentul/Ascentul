/**
 * Advisor Reviews Management
 *
 * Queries and mutations for resume/cover letter review workflow:
 * - Review queue management
 * - Rubric scoring
 * - Inline comments with visibility controls
 * - Status transitions (waiting → needs_edits → approved)
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  getCurrentUser,
  requireTenant,
  requireAdvisorRole,
  getOwnedStudentIds,
  assertCanAccessStudent,
  canViewPrivateContent,
  createAuditLog,
} from "./advisor_auth";

/**
 * Get review queue for advisor (all pending reviews for their students)
 */
export const getReviewQueue = query({
  args: {
    clerkId: v.string(),
    status: v.optional(
      v.union(
        v.literal("waiting"),
        v.literal("in_review"),
        v.literal("needs_edits"),
        v.literal("approved"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Get all owned student IDs
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);

    if (studentIds.length === 0) {
      return [];
    }

    // Fetch reviews using appropriate index
    let reviews;
    if (args.status) {
      // Use by_status index when status filter is provided
      const status = args.status;
      reviews = await ctx.db
        .query("advisor_reviews")
        .withIndex("by_status", (q) =>
          q.eq("status", status).eq("university_id", universityId)
        )
        .collect();
    } else {
      // Use by_university index when no status filter
      reviews = await ctx.db
        .query("advisor_reviews")
        .withIndex("by_university", (q) => q.eq("university_id", universityId))
        .collect();
    }

    // Filter to owned students only
    const ownedReviews = reviews.filter((r) => studentIds.includes(r.student_id));

    // Enrich with student info
    const uniqueStudentIds = [...new Set(ownedReviews.map(r => r.student_id))];
    const students = await Promise.all(
      uniqueStudentIds.map(id => ctx.db.get(id))
    );
    const studentMap = new Map(
      students
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .map(s => [s._id, s] as const)
    );

    const enriched = ownedReviews.map((review) => {
      const student = studentMap.get(review.student_id);
      return {
        ...review,
        student: student
          ? {
              id: student._id,
              name: student.name,
              email: student.email,
              major: student.major,
              graduation_year: student.graduation_year,
            }
          : null,
      };
    });

    // Sort by created_at (oldest first for waiting status, newest first otherwise)
    return enriched.sort((a, b) => {
      if (args.status === "waiting") {
        return a.created_at - b.created_at; // FIFO for waiting
      }
      return b.created_at - a.created_at; // Latest first
    });
  },
});

/**
 * Get review count badge (number of reviews waiting)
 */
export const getReviewQueueCount = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);

    if (studentIds.length === 0) {
      return 0;
    }

    const waitingReviews = await ctx.db
      .query("advisor_reviews")
      .withIndex("by_status", (q) =>
        q.eq("status", "waiting").eq("university_id", universityId),
      )
      .collect();

    // Filter to owned students
    const ownedWaiting = waitingReviews.filter((r) =>
      studentIds.includes(r.student_id),
    );

    return ownedWaiting.length;
  },
});

/**
 * Get specific review by ID
 */
export const getReview = query({
  args: {
    clerkId: v.string(),
    reviewId: v.id("advisor_reviews"),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // Verify access to student
    await assertCanAccessStudent(ctx, sessionCtx, review.student_id);

    // Get student info
    const student = await ctx.db.get(review.student_id);

    // Get asset (resume or cover letter) using typed IDs
    let asset = null;
    if (review.asset_type === "resume" && review.resume_id) {
      asset = await ctx.db.get(review.resume_id);
    } else if (review.asset_type === "cover_letter" && review.cover_letter_id) {
      asset = await ctx.db.get(review.cover_letter_id);
    }

    return {
      ...review,
      student,
      asset,
    };
  },
});

/**
 * Create new review request
 */
export const createReview = mutation({
  args: {
    clerkId: v.string(),
    studentId: v.id("users"),
    assetType: v.union(v.literal("resume"), v.literal("cover_letter")),
    resumeId: v.optional(v.id("resumes")),
    coverLetterId: v.optional(v.id("cover_letters")),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Verify access to student
    await assertCanAccessStudent(ctx, sessionCtx, args.studentId);

    // Validate that exactly one ID is provided based on asset type
    if (args.assetType === "resume" && !args.resumeId) {
      throw new Error("resumeId is required when assetType is resume");
    }
    if (args.assetType === "cover_letter" && !args.coverLetterId) {
      throw new Error("coverLetterId is required when assetType is cover_letter");
    }

    const now = Date.now();

    const reviewId = await ctx.db.insert("advisor_reviews", {
      student_id: args.studentId,
      university_id: universityId,
      asset_type: args.assetType,
      resume_id: args.resumeId,
      cover_letter_id: args.coverLetterId,
      status: "waiting",
      comments: [],
      created_at: now,
      updated_at: now,
    });

    // Audit log
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: "review.created",
      entityType: "advisor_review",
      entityId: reviewId,
      studentId: args.studentId,
      newValue: {
        asset_type: args.assetType,
        resume_id: args.resumeId,
        cover_letter_id: args.coverLetterId,
      },
    });

    return reviewId;
  },
});

/**
 * Update review status
 */
export const updateReviewStatus = mutation({
  args: {
    clerkId: v.string(),
    reviewId: v.id("advisor_reviews"),
    status: v.union(
      v.literal("waiting"),
      v.literal("in_review"),
      v.literal("needs_edits"),
      v.literal("approved"),
    ),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    // Verify access to student
    await assertCanAccessStudent(ctx, sessionCtx, review.student_id);

    const previousStatus = review.status;
    const now = Date.now();

    // Validate state transition to enforce workflow
    const validTransitions: Record<string, string[]> = {
      waiting: ["in_review"],
      in_review: ["needs_edits", "approved", "waiting"],
      needs_edits: ["in_review", "waiting"],
      approved: ["needs_edits"], // allow re-review if needed
    };

    if (
      previousStatus &&
      !validTransitions[previousStatus]?.includes(args.status)
    ) {
      throw new Error(
        `Invalid transition from ${previousStatus} to ${args.status}`
      );
    }

    await ctx.db.patch(args.reviewId, {
      status: args.status,
      reviewed_by:
        args.status !== "waiting" ? sessionCtx.userId : review.reviewed_by,
      reviewed_at: args.status !== "waiting" ? now : review.reviewed_at,
      updated_at: now,
    });

    // Audit log
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: review.university_id,
      action: "review.status_changed",
      entityType: "advisor_review",
      entityId: args.reviewId,
      studentId: review.student_id,
      previousValue: previousStatus,
      newValue: args.status,
    });

    return { success: true };
  },
});

/**
 * Update rubric scores
 */
export const updateRubric = mutation({
  args: {
    clerkId: v.string(),
    reviewId: v.id("advisor_reviews"),
    rubric: v.object({
      content_quality: v.optional(v.number()),
      formatting: v.optional(v.number()),
      relevance: v.optional(v.number()),
      grammar: v.optional(v.number()),
      overall: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    await assertCanAccessStudent(ctx, sessionCtx, review.student_id);

    // Validate rubric scores (must be numbers between 0-100 and finite)
    const scores = Object.values(args.rubric).filter(
      (s) => s !== undefined,
    ) as number[];
    if (
      scores.some(
        (s) => typeof s !== "number" || s < 0 || s > 100 || !isFinite(s),
      )
    ) {
      throw new Error("Rubric scores must be numbers between 0 and 100");
    }

    const previousRubric = review.rubric;

    await ctx.db.patch(args.reviewId, {
      rubric: args.rubric,
      updated_at: Date.now(),
    });

    // Audit log for rubric updates (affects student outcomes)
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: review.university_id,
      action: "review.rubric_updated",
      entityType: "advisor_review",
      entityId: args.reviewId,
      studentId: review.student_id,
      previousValue: previousRubric,
      newValue: args.rubric,
    });

    return { success: true };
  },
});

/**
 * Add comment to review
 */
export const addComment = mutation({
  args: {
    clerkId: v.string(),
    reviewId: v.id("advisor_reviews"),
    body: v.string(),
    visibility: v.union(v.literal("shared"), v.literal("advisor_only")),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    await assertCanAccessStudent(ctx, sessionCtx, review.student_id);

    // Server-side validation and sanitization
    if (!args.body || args.body.trim().length === 0) {
      throw new Error("Comment body cannot be empty");
    }
    if (args.body.length > 10000) {
      throw new Error("Comment body too long (max 10000 characters)");
    }

    // Sanitize: trim whitespace and remove any null bytes
    const sanitizedBody = args.body.trim().replace(/\0/g, "");

    const now = Date.now();
    const commentId = crypto.randomUUID();

    const newComment = {
      id: commentId,
      author_id: sessionCtx.userId,
      body: sanitizedBody,
      visibility: args.visibility,
      created_at: now,
      updated_at: now,
    };

    const currentComments = review.comments || [];
    const updatedComments = [...currentComments, newComment];

    await ctx.db.patch(args.reviewId, {
      comments: updatedComments,
      updated_at: now,
    });

    // Audit log for all comments (FERPA compliance)
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: review.university_id,
      action: "review.comment_added",
      entityType: "advisor_review",
      entityId: args.reviewId,
      studentId: review.student_id,
      newValue: { visibility: args.visibility, comment_id: commentId },
    });

    return commentId;
  },
});

/**
 * Update comment
 */
export const updateComment = mutation({
  args: {
    clerkId: v.string(),
    reviewId: v.id("advisor_reviews"),
    commentId: v.string(),
    body: v.string(),
    visibility: v.optional(
      v.union(v.literal("shared"), v.literal("advisor_only")),
    ),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    await assertCanAccessStudent(ctx, sessionCtx, review.student_id);

    // Server-side validation and sanitization
    if (!args.body || args.body.trim().length === 0) {
      throw new Error("Comment body cannot be empty");
    }
    if (args.body.length > 10000) {
      throw new Error("Comment body too long (max 10000 characters)");
    }

    // Sanitize: trim whitespace and remove any null bytes
    const sanitizedBody = args.body.trim().replace(/\0/g, "");

    const comments = review.comments || [];
    const commentIndex = comments.findIndex((c) => c.id === args.commentId);

    if (commentIndex === -1) {
      throw new Error("Comment not found");
    }

    const comment = comments[commentIndex];

    // Only comment author can edit
    if (comment.author_id !== sessionCtx.userId) {
      throw new Error("Unauthorized: Only the comment author can edit it");
    }

    const previousVisibility = comment.visibility;
    const previousBody = comment.body;
    const now = Date.now();

    comments[commentIndex] = {
      ...comment,
      body: sanitizedBody,
      visibility: args.visibility || comment.visibility,
      updated_at: now,
    };

    await ctx.db.patch(args.reviewId, {
      comments,
      updated_at: now,
    });

    // Audit log for body changes (FERPA compliance)
    if (sanitizedBody !== previousBody) {
      await createAuditLog(ctx, {
        actorId: sessionCtx.userId,
        universityId: review.university_id,
        action: "review.comment_edited",
        entityType: "advisor_review",
        entityId: args.reviewId,
        studentId: review.student_id,
        previousValue: { body: previousBody },
        newValue: { body: sanitizedBody },
      });
    }

    // Audit log for visibility changes
    if (args.visibility && args.visibility !== previousVisibility) {
      await createAuditLog(ctx, {
        actorId: sessionCtx.userId,
        universityId: review.university_id,
        action: "review.comment_visibility_changed",
        entityType: "advisor_review",
        entityId: args.reviewId,
        studentId: review.student_id,
        previousValue: previousVisibility,
        newValue: args.visibility,
      });
    }

    return { success: true };
  },
});

/**
 * Delete comment
 */
export const deleteComment = mutation({
  args: {
    clerkId: v.string(),
    reviewId: v.id("advisor_reviews"),
    commentId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    await assertCanAccessStudent(ctx, sessionCtx, review.student_id);

    const comments = review.comments || [];
    const comment = comments.find((c) => c.id === args.commentId);

    if (!comment) {
      throw new Error("Comment not found");
    }

    // Only comment author or admin can delete
    if (
      comment.author_id !== sessionCtx.userId &&
      sessionCtx.role !== "super_admin" &&
      sessionCtx.role !== "university_admin"
    ) {
      throw new Error(
        "Unauthorized: Only the comment author or admin can delete it",
      );
    }

    const updatedComments = comments.filter((c) => c.id !== args.commentId);

    await ctx.db.patch(args.reviewId, {
      comments: updatedComments,
      updated_at: Date.now(),
    });

    // Audit log for comment deletion
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: review.university_id,
      action: "review.comment_deleted",
      entityType: "advisor_review",
      entityId: args.reviewId,
      studentId: review.student_id,
      previousValue: {
        comment_id: args.commentId,
        body: comment.body,
        visibility: comment.visibility,
        author_id: comment.author_id,
      },
    });

    return { success: true };
  },
});

/**
 * Approve review (shortcut for status + comment)
 */
export const approveReview = mutation({
  args: {
    clerkId: v.string(),
    reviewId: v.id("advisor_reviews"),
    comment: v.optional(v.string()),
    commentVisibility: v.optional(
      v.union(v.literal("shared"), v.literal("advisor_only"))
    ),
    rubric: v.optional(
      v.object({
        content_quality: v.optional(v.number()),
        formatting: v.optional(v.number()),
        relevance: v.optional(v.number()),
        grammar: v.optional(v.number()),
        overall: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    const review = await ctx.db.get(args.reviewId);
    if (!review) {
      throw new Error("Review not found");
    }

    await assertCanAccessStudent(ctx, sessionCtx, review.student_id);

    // Validate and sanitize approval comment if provided
    let sanitizedComment: string | undefined;
    if (args.comment) {
      if (args.comment.trim().length === 0) {
        throw new Error("Comment body cannot be empty");
      }
      if (args.comment.length > 10000) {
        throw new Error("Comment body too long (max 10000 characters)");
      }
      // Sanitize: trim whitespace and remove any null bytes
      sanitizedComment = args.comment.trim().replace(/\0/g, "");
    }

    const now = Date.now();

    // Add approval comment if provided
    let updatedComments = review.comments || [];
    let approvalCommentId: string | undefined;
    if (sanitizedComment) {
      const commentId = crypto.randomUUID();
      approvalCommentId = commentId;
      updatedComments = [
        ...updatedComments,
        {
          id: commentId,
          author_id: sessionCtx.userId,
          body: sanitizedComment,
          visibility: args.commentVisibility || "shared",
          created_at: now,
          updated_at: now,
        },
      ];
    }

    // Update review
    await ctx.db.patch(args.reviewId, {
      status: "approved",
      rubric: args.rubric || review.rubric,
      comments: updatedComments,
      reviewed_by: sessionCtx.userId,
      reviewed_at: now,
      updated_at: now,
    });

    // Audit log for approval
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: review.university_id,
      action: "review.approved",
      entityType: "advisor_review",
      entityId: args.reviewId,
      studentId: review.student_id,
      newValue: { status: "approved", approved_at: now },
    });

    // Audit log for approval comment if provided (FERPA compliance)
    if (sanitizedComment && approvalCommentId) {
      await createAuditLog(ctx, {
        actorId: sessionCtx.userId,
        universityId: review.university_id,
        action: "review.comment_added",
        entityType: "advisor_review",
        entityId: args.reviewId,
        studentId: review.student_id,
        newValue: {
          visibility: args.commentVisibility || "shared",
          comment_id: approvalCommentId,
          context: "approval"
        },
      });
    }

    return { success: true };
  },
});
