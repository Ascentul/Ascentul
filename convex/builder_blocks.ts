import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a new block in a resume
 */
export const create = mutation({
  args: {
    clerkId: v.string(),
  resumeId: v.id("builder_resumes"),
    type: v.string(),
    data: v.any(),
    order: v.optional(v.number()),
    locked: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Validate block type
    const validTypes = ['header', 'summary', 'experience', 'education', 'skills', 'projects', 'custom'];
    if (!validTypes.includes(args.type)) {
      throw new Error(`Invalid block type: ${args.type}`);
    }

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

    // Compute order if not provided
    let order = args.order;
    if (order === undefined) {
      const existingBlocks = await ctx.db
        .query("resume_blocks")
        .withIndex("by_resume", (q: any) => q.eq("resumeId", args.resumeId))
        .collect();

      const maxOrder = existingBlocks.reduce(
        (max, block) => Math.max(max, block.order),
        -1
      );
      order = maxOrder + 1;
    }

    // Create block
    const blockId = await ctx.db.insert("resume_blocks", {
      resumeId: args.resumeId,
      type: args.type,
      data: args.data,
      order,
      locked: args.locked || false,
    });

    // Update resume's updatedAt timestamp
    await ctx.db.patch(args.resumeId, {
      updatedAt: Date.now(),
    });

    return {
      id: blockId,
      type: args.type,
      order,
    };
  },
});

/**
 * Get blocks for a resume
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

    // Get all blocks for this resume
    const blocks = await ctx.db
      .query("resume_blocks")
      .withIndex("by_resume", (q: any) => q.eq("resumeId", args.resumeId))
      .collect();

    // Sort by order
    return blocks
      .sort((a, b) => a.order - b.order)
      .map((block) => ({
        _id: block._id,
        resumeId: block.resumeId,
        type: block.type,
        data: block.data,
        order: block.order,
        locked: block.locked,
      }));
  },
});

/**
 * Update a block with optimistic concurrency control
 */
export const update = mutation({
  args: {
  id: v.id("resume_blocks"),
    clerkId: v.string(),
    data: v.optional(v.any()),
    type: v.optional(v.string()),
    order: v.optional(v.number()),
    locked: v.optional(v.boolean()),
    expectedResumeUpdatedAt: v.number(), // For optimistic concurrency on parent resume
  },
  handler: async (ctx, args) => {
    // Validate block type if provided
    if (args.type) {
      const validTypes = ['header', 'summary', 'experience', 'education', 'skills', 'projects', 'custom'];
      if (!validTypes.includes(args.type)) {
        throw new Error(`Invalid block type: ${args.type}`);
      }
    }

    // Get user from Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get block
  const block = await ctx.db.get(args.id);
    if (!block) {
      throw new Error("Block not found");
    }

    // Verify resume ownership and optimistic concurrency
    const resume = await ctx.db.get(block.resumeId);
    if (!resume) {
      throw new Error("Resume not found");
    }
    if (resume.userId !== user._id) {
      throw new Error("Unauthorized: You don't own this resume");
    }

    // Optimistic concurrency check
    if (resume.updatedAt !== args.expectedResumeUpdatedAt) {
      throw new Error(
        "Resume was modified by another process. Please refresh and try again."
      );
    }

    // Update block
    const updates: any = {};
    if (args.data !== undefined) updates.data = args.data;
    if (args.type !== undefined) updates.type = args.type;
    if (args.order !== undefined) updates.order = args.order;
    if (args.locked !== undefined) updates.locked = args.locked;

  await ctx.db.patch(args.id, updates);

    // Update resume's updatedAt timestamp
    const now = Date.now();
    await ctx.db.patch(block.resumeId, {
      updatedAt: now,
    });

    return {
      success: true,
      resumeUpdatedAt: now,
    };
  },
});

/**
 * Reorder multiple blocks in a single transaction
 */
export const reorder = mutation({
  args: {
    resumeId: v.id("builder_resumes"),
    clerkId: v.string(),
    orders: v.array(
      v.object({
        id: v.id("resume_blocks"),
        order: v.number(),
      })
    ),
    expectedResumeUpdatedAt: v.number(),
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

    // Optimistic concurrency check
    if (resume.updatedAt !== args.expectedResumeUpdatedAt) {
      throw new Error(
        "Resume was modified by another process. Please refresh and try again."
      );
    }

    // Update each block's order
    let updatedCount = 0;
    for (const item of args.orders) {
      const block = await ctx.db.get(item.id);
      if (block && block.resumeId === args.resumeId) {
        await ctx.db.patch(item.id, { order: item.order });
        updatedCount++;
      }
    }

    // Update resume's updatedAt timestamp
    const now = Date.now();
    await ctx.db.patch(args.resumeId, {
      updatedAt: now,
    });

    return {
      updatedCount,
      resumeUpdatedAt: now,
    };
  },
});

/**
 * Delete a block
 */
export const remove = mutation({
  args: {
  id: v.id("resume_blocks"),
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

    // Get block
  const block = await ctx.db.get(args.id);
    if (!block) {
      throw new Error("Block not found");
    }

    // Verify resume ownership
    const resume = await ctx.db.get(block.resumeId);
    if (!resume) {
      throw new Error("Resume not found");
    }
    if (resume.userId !== user._id) {
      throw new Error("Unauthorized: You don't own this resume");
    }

    // Delete block
  await ctx.db.delete(args.id);

    // Update resume's updatedAt timestamp
    await ctx.db.patch(block.resumeId, {
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Bulk update blocks (for AI-generated content)
 */
export const bulkUpdate = mutation({
  args: {
  resumeId: v.id("builder_resumes"),
    clerkId: v.string(),
    blocks: v.array(
      v.object({
        type: v.string(),
        data: v.any(),
        order: v.number(),
        locked: v.optional(v.boolean()),
      })
    ),
    clearExisting: v.optional(v.boolean()),
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

    // Validate block types before any deletion
    const validTypes = ['header', 'summary', 'experience', 'education', 'skills', 'projects', 'custom'];
    for (const block of args.blocks) {
      if (!validTypes.includes(block.type)) {
        throw new Error(`Invalid block type: ${block.type}`);
      }
    }

    // NOTE: Convex does not support multi-operation transactions for user code as of now.
    // This is not truly atomic, but validation is done before any destructive action.
    if (args.clearExisting) {
      const existingBlocks = await ctx.db
        .query("resume_blocks")
        .withIndex("by_resume", (q: any) => q.eq("resumeId", args.resumeId))
        .collect();
      for (const block of existingBlocks) {
        await ctx.db.delete(block._id);
      }
    }
    const createdIds = [];
    for (const block of args.blocks) {
      const blockId = await ctx.db.insert("resume_blocks", {
        resumeId: args.resumeId,
        type: block.type,
        data: block.data,
        order: block.order,
        locked: block.locked || false,
      });
      createdIds.push(blockId);
    }
    await ctx.db.patch(args.resumeId, {
      updatedAt: Date.now(),
    });
    return {
      success: true,
      createdCount: createdIds.length,
      ids: createdIds,
    };
  },
});
