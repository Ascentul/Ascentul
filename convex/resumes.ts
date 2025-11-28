import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMembership } from "./lib/roles";

// Get resumes for a user
export const getUserResumes = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Note: We don't require membership for read queries - users can always view their own resumes
    // Membership is only used for write operations and tenant isolation

    // OPTIMIZED: Add limit to prevent bandwidth issues
    const resumes = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .take(50); // Limit to 50 most recent resumes

    return resumes;
  },
});

// Create a new resume
export const createResume = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    content: v.any(),
    visibility: v.union(v.literal("private"), v.literal("public")),
    source: v.optional(v.union(
      v.literal("manual"),
      v.literal("ai_generated"),
      v.literal("ai_optimized"),
      v.literal("pdf_upload"),
    )),
    job_description: v.optional(v.string()),
    extracted_text: v.optional(v.string()),
    analysis_result: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const membership = user.role === "student"
      ? (await requireMembership(ctx, { role: "student" })).membership
      : null;

    const resumeId = await ctx.db.insert("resumes", {
      user_id: user._id,
      university_id: membership?.university_id ?? user.university_id,
      title: args.title,
      content: args.content,
      visibility: args.visibility,
      source: args.source,
      job_description: args.job_description,
      extracted_text: args.extracted_text,
      analysis_result: args.analysis_result,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    return resumeId;
  },
});

// Update a resume
export const updateResume = mutation({
  args: {
    clerkId: v.string(),
    resumeId: v.id("resumes"),
    updates: v.object({
      title: v.optional(v.string()),
      content: v.optional(v.any()),
      visibility: v.optional(v.union(v.literal("private"), v.literal("public"))),
      extracted_text: v.optional(v.string()),
      job_description: v.optional(v.string()),
      analysis_result: v.optional(v.any()),
      ai_suggestions: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { clerkId, resumeId, updates }) => {
    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const membership = user.role === "student"
      ? (await requireMembership(ctx, { role: "student" })).membership
      : null;

    // Verify ownership
    const resume = await ctx.db.get(resumeId);
    if (!resume || resume.user_id !== user._id) {
      throw new Error("Resume not found or access denied");
    }

    if (resume.university_id && user.university_id && resume.university_id !== user.university_id) {
      throw new Error("Unauthorized: Resume belongs to another university");
    }

    // Update the resume
    await ctx.db.patch(resumeId, {
      ...updates,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

// Delete a resume
export const deleteResume = mutation({
  args: {
    clerkId: v.string(),
    resumeId: v.id("resumes"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const membership = user.role === "student"
      ? (await requireMembership(ctx, { role: "student" })).membership
      : null;

    const resume = await ctx.db.get(args.resumeId);
    if (!resume || resume.user_id !== user._id) {
      throw new Error("Resume not found or unauthorized");
    }

    // University isolation check
    if (resume.university_id && user.university_id && resume.university_id !== user.university_id) {
      throw new Error("Unauthorized: Resume belongs to another university");
    }

    // Referential integrity: Check for active reviews before deletion
    // Uses by_resume index for O(1) lookup instead of scanning by_student
    // Active reviews are those awaiting action (waiting/in_review), not finalized ones (approved/needs_edits)
    const activeReview = await ctx.db
      .query("advisor_reviews")
      .withIndex("by_resume", (q) => q.eq("resume_id", args.resumeId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "waiting"),
          q.eq(q.field("status"), "in_review"),
        ),
      )
      .first();

    if (activeReview) {
      throw new Error(
        "Cannot delete resume: Active review in progress. Please wait for the review to complete or contact your advisor.",
      );
    }

    await ctx.db.delete(args.resumeId);
    return args.resumeId;
  },
});

// Get a single resume by id (ensures it belongs to the Clerk user)
export const getResumeById = query({
  args: {
    clerkId: v.string(),
    resumeId: v.id("resumes"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    // Note: We don't require membership for read queries - consistent with getUserResumes
    // Users can always view their own resumes regardless of membership status

    const resume = await ctx.db.get(args.resumeId);
    if (!resume || resume.user_id !== user._id) {
      // Return null instead of throwing to avoid client runtime errors during transitions
      return null;
    }

    // University isolation for reads - use user's university_id directly
    if (resume.university_id && user.university_id && resume.university_id !== user.university_id) {
      return null;
    }

    return resume;
  },
});
