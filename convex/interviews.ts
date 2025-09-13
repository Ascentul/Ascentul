import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getStagesForApplication = query({
  args: { clerkId: v.string(), applicationId: v.id("applications") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const stages = await ctx.db
      .query("interview_stages")
      .withIndex("by_application", (q) => q.eq("application_id", args.applicationId))
      .order("desc")
      .collect();

    // Safety: ensure only stages for this user's application are returned
    return stages.filter((s) => s.user_id === user._id);
  },
});

export const createStage = mutation({
  args: {
    clerkId: v.string(),
    applicationId: v.id("applications"),
    title: v.string(),
    scheduled_at: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const id = await ctx.db.insert("interview_stages", {
      user_id: user._id,
      application_id: args.applicationId,
      title: args.title,
      scheduled_at: args.scheduled_at,
      location: args.location,
      notes: args.notes,
      outcome: "pending",
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Set application status to 'interview' when adding first stage
    const existing = await ctx.db
      .query("interview_stages")
      .withIndex("by_application", (q) => q.eq("application_id", args.applicationId))
      .collect();
    if (existing.length === 0) {
      await ctx.db.patch(args.applicationId, { status: "interview", updated_at: Date.now() });
    }

    return id;
  },
});

export const updateStage = mutation({
  args: {
    clerkId: v.string(),
    stageId: v.id("interview_stages"),
    updates: v.object({
      title: v.optional(v.string()),
      scheduled_at: v.optional(v.number()),
      location: v.optional(v.string()),
      notes: v.optional(v.string()),
      outcome: v.optional(v.union(v.literal("pending"), v.literal("scheduled"), v.literal("passed"), v.literal("failed"))),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const stage = await ctx.db.get(args.stageId);
    if (!stage || stage.user_id !== user._id) throw new Error("Stage not found or unauthorized");

    await ctx.db.patch(args.stageId, { ...args.updates, updated_at: Date.now() });
    return args.stageId;
  },
});

export const deleteStage = mutation({
  args: { clerkId: v.string(), stageId: v.id("interview_stages") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const stage = await ctx.db.get(args.stageId);
    if (!stage || stage.user_id !== user._id) throw new Error("Stage not found or unauthorized");

    await ctx.db.delete(args.stageId);
    return args.stageId;
  },
});
