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

export const getUserCareerPathsPaginated = query({
  args: { clerkId: v.string(), cursor: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const result = await ctx.db
      .query("career_paths")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .paginate({ numItems: args.limit ?? 10, cursor: (args.cursor as any) ?? null });

    return {
      items: result.page,
      nextCursor: result.isDone ? null : (result.continueCursor as any as string),
    };
  },
});

// Update a saved career path's display name (and keep steps.path.name in sync)
export const updateCareerPathName = mutation({
  args: { clerkId: v.string(), id: v.id("career_paths"), name: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) throw new Error("User not found");

    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Career path not found");
    if (doc.user_id !== user._id) throw new Error("Unauthorized");

    const steps = doc.steps || {};
    const path = steps.path || {};
    path.name = args.name;
    steps.path = path;

    await ctx.db.patch(args.id, {
      target_role: args.name,
      steps,
      updated_at: Date.now(),
    });

    return args.id;
  },
});

// Delete a saved career path
export const deleteCareerPath = mutation({
  args: { clerkId: v.string(), id: v.id("career_paths") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) throw new Error("User not found");

    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Career path not found");
    if (doc.user_id !== user._id) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
    return args.id;
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

    // TEMPORARILY DISABLED: Free plan limit check
    // NOTE: Clerk Billing (publicMetadata) is the source of truth for subscriptions.
    // The subscription_plan field in Convex is cached display data only (see CLAUDE.md).
    // Backend mutations should NOT use subscription_plan for feature gating.
    // Frontend enforces limits via useSubscription() hook + Clerk's has() method.
    // TODO: Re-enable this check by integrating Clerk SDK or passing verified subscription status from frontend.

    // if (user.subscription_plan === "free") {
    //   const existingPaths = await ctx.db
    //     .query("career_paths")
    //     .withIndex("by_user", (q) => q.eq("user_id", user._id))
    //     .collect();
    //
    //   if (existingPaths.length >= 1) {
    //     throw new Error("Free plan limit reached. Upgrade to Premium for unlimited career paths.");
    //   }
    // }

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
