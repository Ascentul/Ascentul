import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Generate an upload URL for export files
 * Allows API routes to upload PDFs/DOCX to Convex storage
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Create an export record with storage ID
 * Called from API routes after uploading to Convex storage
 */
export const createWithStorage = mutation({
  args: {
    resumeId: v.id("builder_resumes"),
    format: v.string(), // "pdf" | "docx"
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate format
    const validFormats = ['pdf', 'docx'];
    if (!validFormats.includes(args.format)) {
      throw new Error(`Invalid export format: ${args.format}. Must be 'pdf' or 'docx'`);
    }

    // Verify resume exists
    const resume = await ctx.db.get(args.resumeId);
    if (!resume) {
      throw new Error("Resume not found");
    }

    // Get URL from storage
    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get file URL from storage");
    }

    // Create export record
    const now = Date.now();
    const exportId = await ctx.db.insert("builder_resume_exports" as any, {
      resumeId: args.resumeId,
      format: args.format,
      url: url,
      createdAt: now,
    });

    return {
      id: exportId,
      resumeId: args.resumeId,
      format: args.format,
      url: url,
      storageId: args.storageId,
      createdAt: now,
    };
  },
});

/**
 * Create an export record
 * Called from API routes after generating PDF/DOCX
 */
export const create = mutation({
  args: {
    resumeId: v.id("builder_resumes"),
    format: v.string(), // "pdf" | "docx"
    url: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate format
    const validFormats = ['pdf', 'docx'];
    if (!validFormats.includes(args.format)) {
      throw new Error(`Invalid export format: ${args.format}. Must be 'pdf' or 'docx'`);
    }

    // Verify resume exists
    const resume = await ctx.db.get(args.resumeId);
    if (!resume) {
      throw new Error("Resume not found");
    }

    // Create export record
    const now = Date.now();
    const exportId = await ctx.db.insert("builder_resume_exports" as any, {
      resumeId: args.resumeId,
      format: args.format,
      url: args.url,
      createdAt: now,
    });

    return {
      id: exportId,
      resumeId: args.resumeId,
      format: args.format,
      url: args.url,
      createdAt: now,
    };
  },
});

/**
 * List exports for a specific resume
 */
export const list = query({
  args: {
    resumeId: v.id("builder_resumes"),
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

    // Verify resume ownership
    const resume = await ctx.db.get(args.resumeId);
    if (!resume) {
      throw new Error("Resume not found");
    }

    if (resume.userId !== user._id) {
      throw new Error("Unauthorized: You don't own this resume");
    }

    // Get all exports for this resume
    const exports = await ctx.db
      .query("builder_resume_exports")
      .withIndex("by_resume", (q: any) => q.eq("resumeId", args.resumeId))
      .collect();

    // Sort by most recent first
    return exports
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((exp) => ({
        _id: exp._id,
        resumeId: exp.resumeId,
        format: exp.format,
        url: exp.url,
        createdAt: exp.createdAt,
      }));
  },
});

/**
 * List all exports for a user (across all resumes)
 */
export const listForUser = query({
  args: {
    clerkId: v.string(),
    limit: v.optional(v.number()),
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

    // Get all resumes for this user
    const resumes = await ctx.db
      .query("builder_resumes")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const resumeIds = new Set(resumes.map((r) => r._id));

    // Create Map for O(1) resume lookups instead of O(n) find()
    const resumeMap = new Map(resumes.map((r) => [r._id, r]));

    // Get all exports for these resumes
    // Note: Using per-resume queries due to Convex index constraints
    // Performance consideration: If user resume counts typically exceed ~10-20,
    // consider implementing batched queries, pagination, or a composite index
    // on (userId, resumeId) to enable a single query. Monitor query durations
    // if this becomes a hot path in production.
    const allExports = [];
    for (const resumeId of resumeIds) {
      const exports = await ctx.db
        .query("builder_resume_exports")
        .withIndex("by_resume", (q: any) => q.eq("resumeId", resumeId))
        .collect();

      for (const exp of exports) {
        const resume = resumeMap.get(exp.resumeId);
        allExports.push({
          _id: exp._id,
          resumeId: exp.resumeId,
          resumeTitle: resume?.title || "Untitled",
          format: exp.format,
          url: exp.url,
          createdAt: exp.createdAt,
        });
      }
    }

    // Sort by most recent first
    allExports.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit if provided
    if (args.limit && args.limit > 0) {
      return allExports.slice(0, args.limit);
    }

    return allExports;
  },
});

/**
 * Get a specific export by ID
 */
export const get = query({
  args: {
    id: v.id("builder_resume_exports"),
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

    // Get export
    const exp = await ctx.db.get(args.id);
    if (!exp) {
      throw new Error("Export not found");
    }

    // Verify resume ownership
    const resume = await ctx.db.get(exp.resumeId);
    if (!resume) {
      throw new Error("Resume not found");
    }

    if (resume.userId !== user._id) {
      throw new Error("Unauthorized: You don't own this export");
    }

    return {
      _id: exp._id,
      resumeId: exp.resumeId,
      format: exp.format,
      url: exp.url,
      createdAt: exp.createdAt,
    };
  },
});

/**
 * Delete an export record
 */
export const remove = mutation({
  args: {
    id: v.id("builder_resume_exports"),
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

    // Get export
    const exp = await ctx.db.get(args.id);
    if (!exp) {
      throw new Error("Export not found");
    }

    // Verify resume ownership
    const resume = await ctx.db.get(exp.resumeId);
    if (!resume) {
      throw new Error("Resume not found");
    }

    if (resume.userId !== user._id) {
      throw new Error("Unauthorized: You don't own this export");
    }

    // Delete export
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Delete old exports (cleanup utility - can be called by cron or manually)
 * Deletes exports older than specified days
 */
export const deleteOld = mutation({
  args: {
    daysOld: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - (args.daysOld * 24 * 60 * 60 * 1000);

    // Get all exports
    const allExports = await ctx.db
      .query("builder_resume_exports")
      .collect();

    let deletedCount = 0;
    for (const exp of allExports) {
      if (exp.createdAt < cutoffTime) {
        await ctx.db.delete(exp._id);
        deletedCount++;
      }
    }

    return {
      success: true,
      deletedCount,
      cutoffDate: new Date(cutoffTime).toISOString(),
    };
  },
});
