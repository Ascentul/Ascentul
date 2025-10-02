import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get goals for a Clerk user
export const getUserGoals = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .collect();

    return goals;
  },
});

const statusValidator = v.union(
  v.literal("not_started"),
  v.literal("in_progress"),
  v.literal("active"),
  v.literal("completed"),
  v.literal("paused"),
  v.literal("cancelled")
);

const checklistItem = v.object({ id: v.string(), text: v.string(), completed: v.boolean() });

// Create goal
export const createGoal = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(statusValidator),
    target_date: v.optional(v.number()),
    progress: v.optional(v.number()),
    checklist: v.optional(v.array(checklistItem)),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const id = await ctx.db.insert("goals", {
      user_id: user._id,
      title: args.title,
      description: args.description,
      category: args.category,
      target_date: args.target_date,
      status: args.status ?? "not_started",
      progress: args.progress ?? 0,
      checklist: args.checklist,
      created_at: now,
      updated_at: now,
    });

    return id;
  },
});

// Update goal
export const updateGoal = mutation({
  args: {
    clerkId: v.string(),
    goalId: v.id("goals"),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
      target_date: v.optional(v.number()),
      status: v.optional(statusValidator),
      progress: v.optional(v.number()),
      checklist: v.optional(v.array(checklistItem)),
      completed: v.optional(v.boolean()), // accepted but not stored directly
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) throw new Error("User not found");

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.user_id !== user._id) throw new Error("Goal not found or unauthorized");

    const updates: any = { ...args.updates, updated_at: Date.now() };

    // Set completed_at timestamp when status is changed to completed
    if (args.updates.status === 'completed' && goal.status !== 'completed') {
      updates.completed_at = Date.now();
    }

    // Clear completed_at if status is changed from completed to something else
    if (goal.status === 'completed' && args.updates.status && args.updates.status !== 'completed') {
      updates.completed_at = undefined;
    }

    await ctx.db.patch(args.goalId, updates);
    return args.goalId;
  },
});

// Delete goal
export const deleteGoal = mutation({
  args: { clerkId: v.string(), goalId: v.id("goals") },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) throw new Error("User not found");

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.user_id !== user._id) throw new Error("Goal not found or unauthorized");

    await ctx.db.delete(args.goalId);
    return args.goalId;
  },
});
