import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new resume for the authenticated user.
 * @returns { id: Id<"builder_resumes">, title: string, templateSlug: string, themeId?: Id<"builder_resume_themes"> }
 */
export const createResume = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    templateSlug: v.string(),
    themeId: v.optional(v.id("builder_resume_themes")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const id = await ctx.db.insert("builder_resumes" as any, {
      userId: user._id,
      title: args.title,
      templateSlug: args.templateSlug,
      themeId: args.themeId,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id,
      title: args.title,
      templateSlug: args.templateSlug,
      themeId: args.themeId,
    };
  },
});

/**
 * List all resumes for the authenticated user.
 * @returns Array of resume objects
 */
export const listUserResumes = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return [];

    const resumes = await ctx.db
      .query("builder_resumes" as any)
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return resumes;
  },
});

/**
 * Get a resume and its blocks for the authenticated user.
 * @returns { resume: object, blocks: Array }
 */
export const getResume = query({
  args: {
    id: v.id("builder_resumes"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const resume = await ctx.db.get(args.id) as any;
    if (!resume) {
      throw new Error("Not found");
    }
    if (resume.userId !== user._id) {
      throw new Error("Forbidden");
    }

    const blocks = await ctx.db
      .query("resume_blocks")
      .withIndex("by_resume", (q: any) => q.eq("resumeId", resume._id))
      .collect();

    // Sort blocks by order ascending
    blocks.sort((a: any, b: any) => a.order - b.order);

    return {
      resume,
      blocks,
    };
  },
});

/**
 * Update resume metadata with optimistic concurrency control.
 * @returns { id: Id<"builder_resumes">, updatedAt: number }
 */
export const updateResumeMeta = mutation({
  args: {
    id: v.id("builder_resumes"),
    title: v.optional(v.string()),
    templateSlug: v.optional(v.string()),
    themeId: v.optional(v.id("builder_resume_themes")),
    expectedUpdatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Unauthorized");
    }
    const userId = user.tokenIdentifier;

    const resume = await ctx.db.get(args.id) as any;
    if (!resume) {
      throw new Error("Not found");
    }
    if (resume.userId !== userId) {
      throw new Error("Forbidden");
    }

    // Optimistic concurrency check
    if (resume.updatedAt !== args.expectedUpdatedAt) {
      throw new Error("Conflict: resume was updated by another process");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updates.title = args.title;
    if (args.templateSlug !== undefined) updates.templateSlug = args.templateSlug;
    if (args.themeId !== undefined) updates.themeId = args.themeId;

    await ctx.db.patch(args.id as any, updates);

    return {
      id: args.id,
      updatedAt: updates.updatedAt,
    };
  },
});

/**
 * Delete a resume and all its blocks.
 * @returns { id: Id<"builder_resumes"> }
 */
export const deleteResume = mutation({
  args: {
    id: v.id("builder_resumes"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Unauthorized");
    }
    const userId = user.tokenIdentifier;

    const resume = await ctx.db.get(args.id) as any;
    if (!resume) {
      throw new Error("Not found");
    }
    if (resume.userId !== userId) {
      throw new Error("Forbidden");
    }

    // Delete all blocks for this resume
    const blocks = await ctx.db
      .query("resume_blocks")
      .withIndex("by_resume", (q: any) => q.eq("resumeId", args.id))
      .collect();

    for (const block of blocks) {
      await ctx.db.delete(block._id);
    }

    // Delete the resume
    await ctx.db.delete(args.id as any);

    return { id: args.id };
  },
});
