import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserCareerPaths = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const items = await ctx.db
      .query("career_paths")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .collect();

    return items;
  },
});

export const createCareerPath = mutation({
  args: {
    clerkId: v.string(),
    target_role: v.string(),
    current_level: v.optional(v.string()),
    estimated_timeframe: v.optional(v.string()),
    steps: v.any(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const id = await ctx.db.insert("career_paths", {
      user_id: user._id,
      target_role: args.target_role,
      current_level: args.current_level,
      estimated_timeframe: args.estimated_timeframe,
      steps: args.steps,
      status: args.status ?? "active",
      created_at: now,
      updated_at: now,
    });

    const doc = await ctx.db.get(id);
    return doc;
  },
});
