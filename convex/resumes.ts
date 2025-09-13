import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    const resumes = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .collect();

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
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const resumeId = await ctx.db.insert("resumes", {
      user_id: user._id,
      title: args.title,
      content: args.content,
      visibility: args.visibility,
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

    // Verify ownership
    const resume = await ctx.db.get(resumeId);
    if (!resume || resume.user_id !== user._id) {
      throw new Error("Resume not found or access denied");
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

    const resume = await ctx.db.get(args.resumeId);
    if (!resume || resume.user_id !== user._id) {
      throw new Error("Resume not found or unauthorized");
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

    const resume = await ctx.db.get(args.resumeId);
    if (!resume || resume.user_id !== user._id) {
      // Return null instead of throwing to avoid client runtime errors during transitions
      return null;
    }

    return resume;
  },
});
