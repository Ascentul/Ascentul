import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthenticatedUser } from "./lib/roles";

export const updateOnboardingProgress = mutation({
  args: {
    clerkId: v.string(),
    completed_tasks: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const actingUser = await getAuthenticatedUser(ctx);
    const isSelf = actingUser.clerkId === args.clerkId;
    if (!isSelf && actingUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const onboarding_completed = args.completed_tasks.length >= 5;

    await ctx.db.patch(user._id, {
      completed_tasks: args.completed_tasks,
      onboarding_completed,
      updated_at: Date.now(),
    });

    return user._id;
  },
});

export const toggleHideProgressCard = mutation({
  args: {
    clerkId: v.string(),
    hide: v.boolean(),
  },
  handler: async (ctx, args) => {
    const actingUser = await getAuthenticatedUser(ctx);
    const isSelf = actingUser.clerkId === args.clerkId;
    if (!isSelf && actingUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      hide_progress_card: args.hide,
      updated_at: Date.now(),
    });

    return user._id;
  },
});
