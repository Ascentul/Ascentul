import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getFollowupsForApplication = query({
  args: { clerkId: v.string(), applicationId: v.id("applications") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const items = await ctx.db
      .query("followup_actions")
      .withIndex("by_application", (q) => q.eq("application_id", args.applicationId))
      .order("desc")
      .collect();

    return items.filter((f) => f.user_id === user._id);
  },
});

export const createFollowup = mutation({
  args: {
    clerkId: v.string(),
    applicationId: v.id("applications"),
    description: v.string(),
    due_date: v.optional(v.number()),
    notes: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const id = await ctx.db.insert("followup_actions", {
      user_id: user._id,
      application_id: args.applicationId,
      description: args.description,
      due_date: args.due_date,
      notes: args.notes,
      type: args.type ?? "follow_up",
      completed: false,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    return id;
  },
});

export const updateFollowup = mutation({
  args: {
    clerkId: v.string(),
    followupId: v.id("followup_actions"),
    updates: v.object({
      description: v.optional(v.string()),
      due_date: v.optional(v.number()),
      notes: v.optional(v.string()),
      type: v.optional(v.string()),
      completed: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const item = await ctx.db.get(args.followupId);
    if (!item || item.user_id !== user._id) throw new Error("Followup not found or unauthorized");

    await ctx.db.patch(args.followupId, { ...args.updates, updated_at: Date.now() });
    return args.followupId;
  },
});

export const deleteFollowup = mutation({
  args: { clerkId: v.string(), followupId: v.id("followup_actions") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const item = await ctx.db.get(args.followupId);
    if (!item || item.user_id !== user._id) throw new Error("Followup not found or unauthorized");

    await ctx.db.delete(args.followupId);
    return args.followupId;
  },
});
