import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a new resume
 */
export const create = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    templateSlug: v.string(),
    themeId: v.optional(v.id("builder_resume_themes")),
  },
  handler: async (ctx, args) => {
    // Validate input
    if (!args.title || args.title.trim().length === 0) {
      throw new Error("Title is required");
    }

    // Get user from Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Verify template exists
    const template = await ctx.db
      .query("builder_resume_templates")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.templateSlug))
      .unique();

    if (!template) {
      throw new Error(`Template not found: ${args.templateSlug}`);
    }

    // Auto-assign default theme if not provided
    let themeId = args.themeId;
    if (!themeId) {
      const firstTheme = await ctx.db
        .query("builder_resume_themes")
        .first();

      if (firstTheme) {
        themeId = firstTheme._id;
      } else {
        throw new Error("No themes available. Please create a theme first.");
      }
    } else {
      // Verify theme exists if provided
      const theme = await ctx.db.get(themeId);
      if (!theme) {
        throw new Error("Theme not found");
      }
    }

    const now = Date.now();
    const resumeId = await ctx.db.insert("builder_resumes", {
      userId: user._id,
      title: args.title.trim(),
      templateSlug: args.templateSlug,
      themeId: themeId,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Insert a starter header block so canvas is never blank
    await ctx.db.insert("resume_blocks", {
      resumeId,
      type: "header",
      order: 1,
      locked: false,
      data: {
        fullName: "Your Name",
        title: "Target Role",
        contact: {
          email: "",
          phone: "",
          location: "",
          links: []
        },
      },
    });

    return {
      id: resumeId,
      title: args.title.trim(),
      templateSlug: args.templateSlug,
      themeId: themeId,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
  },
});

/**
 * Get a single resume by ID with auth check
 */
export const get = query({
  args: {
    id: v.id("builder_resumes"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user from Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const resume = await ctx.db.get(args.id);

    if (!resume) {
      throw new Error("Resume not found");
    }

    // Check ownership
    if (resume.userId !== user._id) {
      throw new Error("Unauthorized: You don't own this resume");
    }

    // Get blocks for this resume
    const blocks = await ctx.db
      .query("resume_blocks")
      .withIndex("by_resume", (q: any) => q.eq("resumeId", args.id))
      .collect();

    // Sort blocks by order
    const sortedBlocks = blocks.sort((a, b) => a.order - b.order);

    return {
      resume: {
        id: resume._id,
        userId: resume.userId,
        title: resume.title,
        templateSlug: resume.templateSlug,
        themeId: resume.themeId,
        version: resume.version,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      },
      blocks: sortedBlocks.map((block) => ({
        _id: block._id,
        resumeId: block.resumeId,
        type: block.type,
        data: block.data,
        order: block.order,
        locked: block.locked,
      })),
    };
  },
});

/**
 * List all resumes for a user
 */
export const list = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user from Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const resumes = await ctx.db
      .query("builder_resumes")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    // Sort by most recently updated
    return resumes
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((resume) => ({
        _id: resume._id,
        title: resume.title,
        templateSlug: resume.templateSlug,
        themeId: resume.themeId,
        version: resume.version,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      }));
  },
});

/**
 * Update resume metadata with optimistic concurrency control
 */
export const update = mutation({
  args: {
    id: v.id("builder_resumes"),
    clerkId: v.string(),
    title: v.optional(v.string()),
    templateSlug: v.optional(v.string()),
    themeId: v.optional(v.id("builder_resume_themes")),
    expectedUpdatedAt: v.number(), // For optimistic concurrency
  },
  handler: async (ctx, args) => {
    // Get user from Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const resume = await ctx.db.get(args.id);

    if (!resume) {
      throw new Error("Resume not found");
    }

    // Check ownership
    if (resume.userId !== user._id) {
      throw new Error("Unauthorized: You don't own this resume");
    }

    // Optimistic concurrency check
    if (resume.updatedAt !== args.expectedUpdatedAt) {
      throw new Error(
        "Resume was modified by another process. Please refresh and try again."
      );
    }

    // Verify template if being updated
    if (args.templateSlug) {
      const template = await ctx.db
        .query("builder_resume_templates")
        .withIndex("by_slug", (q: any) => q.eq("slug", args.templateSlug))
        .unique();

      if (!template) {
        throw new Error("Template not found");
      }
    }

    // Verify theme if being updated
    if (args.themeId) {
      const theme = await ctx.db.get(args.themeId);
      if (!theme) {
        throw new Error("Theme not found");
      }
    }

    const now = Date.now();
    const updates: any = {
      updatedAt: now,
    };

    if (args.title !== undefined) {
      if (!args.title || args.title.trim().length === 0) {
        throw new Error("Title cannot be empty");
      }
      updates.title = args.title.trim();
    }
    if (args.templateSlug !== undefined) updates.templateSlug = args.templateSlug;
    if (args.themeId !== undefined) updates.themeId = args.themeId;

    await ctx.db.patch(args.id, updates);

    return {
      success: true,
      updatedAt: now,
    };
  },
});

/**
 * Delete a resume and all its blocks
 */
export const remove = mutation({
  args: {
    id: v.id("builder_resumes"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user from Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const resume = await ctx.db.get(args.id);

    if (!resume) {
      throw new Error("Resume not found");
    }

    // Check ownership
    if (resume.userId !== user._id) {
      throw new Error("Unauthorized: You don't own this resume");
    }

    // Delete all blocks for this resume
    const blocks = await ctx.db
      .query("resume_blocks")
      .withIndex("by_resume", (q: any) => q.eq("resumeId", args.id))
      .collect();

    for (const block of blocks) {
      await ctx.db.delete(block._id);
    }

    // Delete all exports for this resume
    const exports = await ctx.db
      .query("builder_resume_exports")
      .withIndex("by_resume", (q: any) => q.eq("resumeId", args.id))
      .collect();

    for (const exp of exports) {
      await ctx.db.delete(exp._id);
    }

    // Delete the resume
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Duplicate a resume with all its blocks
 */
export const duplicate = mutation({
  args: {
    id: v.id("builder_resumes"),
    clerkId: v.string(),
    newTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user from Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const resume = await ctx.db.get(args.id);

    if (!resume) {
      throw new Error("Resume not found");
    }

    // Check ownership
    if (resume.userId !== user._id) {
      throw new Error("Unauthorized: You don't own this resume");
    }

    // Create new resume
    const now = Date.now();
    const newTitle = args.newTitle || `${resume.title} (Copy)`;
    const newResumeId = await ctx.db.insert("builder_resumes" as any, {
      userId: resume.userId,
      title: newTitle,
      templateSlug: resume.templateSlug,
      themeId: resume.themeId,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Copy all blocks
    const blocks = await ctx.db
      .query("resume_blocks")
      .withIndex("by_resume", (q: any) => q.eq("resumeId", args.id))
      .collect();

    for (const block of blocks) {
      await ctx.db.insert("resume_blocks" as any, {
        resumeId: newResumeId,
        type: block.type,
        data: block.data,
        order: block.order,
        locked: block.locked,
      });
    }

    return {
      id: newResumeId,
      title: newTitle,
    };
  },
});
