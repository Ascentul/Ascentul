import { v } from 'convex/values';

import { api } from './_generated/api';
import { mutation, query } from './_generated/server';
import { requireMembership } from './lib/roles';

// Get goals for a Clerk user
export const getUserGoals = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) throw new Error('User not found');

    // Note: We don't require membership for read queries - users can always view their own goals
    // Membership is only used for write operations and tenant isolation

    // OPTIMIZED: Add limit to prevent bandwidth issues for power users
    const goals = await ctx.db
      .query('goals')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .order('desc')
      .take(200); // Limit to 200 most recent goals

    return goals;
  },
});

const statusValidator = v.union(
  v.literal('not_started'),
  v.literal('in_progress'),
  v.literal('active'),
  v.literal('completed'),
  v.literal('paused'),
  v.literal('cancelled'),
);

const checklistItem = v.object({
  id: v.string(),
  text: v.string(),
  completed: v.boolean(),
});

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
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) throw new Error('User not found');

    // Only require membership for university-affiliated students
    // Individual users can create goals without a membership
    let membership = null;
    if (user.role === 'student' && user.university_id) {
      try {
        membership = (await requireMembership(ctx, { role: 'student' })).membership;
      } catch {
        // If membership check fails but user has university_id, continue without membership
        // This handles edge cases during onboarding or membership transitions
        membership = null;
      }
    }

    // ARCHITECTURE NOTE: Free plan limits are enforced at the FRONTEND layer
    // - Clerk Billing (publicMetadata) is the source of truth for subscriptions
    // - Frontend enforces via useSubscription() hook + Clerk's has() method
    // - Backend subscription_plan is cached display data only (see CLAUDE.md)
    // - Defense-in-depth: Consider adding hasPremium arg from frontend for backend validation

    // if (user.subscription_plan === "free") {
    //   const FREE_PLAN_LIMIT = 1;
    //   const existingGoals = await ctx.db
    //     .query("goals")
    //     .withIndex("by_user", (q) => q.eq("user_id", user._id))
    //     .take(FREE_PLAN_LIMIT + 1);
    //
    //   if (existingGoals.length >= FREE_PLAN_LIMIT) {
    //     throw new Error("Free plan limit reached. Upgrade to Premium for unlimited goals.");
    //   }
    // }

    const now = Date.now();
    const id = await ctx.db.insert('goals', {
      user_id: user._id,
      university_id: membership?.university_id ?? user.university_id,
      title: args.title,
      description: args.description,
      category: args.category,
      target_date: args.target_date,
      status: args.status ?? 'not_started',
      progress: args.progress ?? 0,
      checklist: args.checklist,
      created_at: now,
      updated_at: now,
    });

    // Track activity for streak (fire-and-forget)
    await ctx.scheduler.runAfter(0, api.activity.markActionForToday, {});

    return id;
  },
});

// Update goal
export const updateGoal = mutation({
  args: {
    clerkId: v.string(),
    goalId: v.id('goals'),
    updates: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
      target_date: v.optional(v.number()),
      status: v.optional(statusValidator),
      progress: v.optional(v.number()),
      checklist: v.optional(v.array(checklistItem)),
      completed: v.optional(v.boolean()), // accepted but not stored directly
      completed_at: v.optional(v.union(v.number(), v.null())),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    // Only require membership for university-affiliated students
    let membership = null;
    if (user.role === 'student' && user.university_id) {
      try {
        membership = (await requireMembership(ctx, { role: 'student' })).membership;
      } catch {
        membership = null;
      }
    }

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.user_id !== user._id) throw new Error('Goal not found or unauthorized');

    if (goal.university_id && membership && goal.university_id !== membership.university_id) {
      throw new Error('Unauthorized: Goal belongs to another university');
    }

    // Remove 'completed' field as it's not in the schema
    const { completed, ...restUpdates } = args.updates;
    const updates: any = { ...restUpdates, updated_at: Date.now() };

    // Set completed_at timestamp when status is changed to completed (if not already set)
    if (
      args.updates.status === 'completed' &&
      goal.status !== 'completed' &&
      !args.updates.completed_at
    ) {
      updates.completed_at = Date.now();
    }

    // Clear completed_at if status is changed from completed to something else (if not explicitly set)
    if (
      goal.status === 'completed' &&
      args.updates.status &&
      args.updates.status !== 'completed' &&
      args.updates.completed_at === undefined
    ) {
      updates.completed_at = undefined;
    }

    await ctx.db.patch(args.goalId, updates);
    return args.goalId;
  },
});

// Delete goal
export const deleteGoal = mutation({
  args: { clerkId: v.string(), goalId: v.id('goals') },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();
    if (!user) throw new Error('User not found');

    // Only require membership for university-affiliated students
    let membership = null;
    if (user.role === 'student' && user.university_id) {
      try {
        membership = (await requireMembership(ctx, { role: 'student' })).membership;
      } catch {
        membership = null;
      }
    }

    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.user_id !== user._id) throw new Error('Goal not found or unauthorized');

    if (goal.university_id && membership && goal.university_id !== membership.university_id) {
      throw new Error('Unauthorized: Goal belongs to another university');
    }

    await ctx.db.delete(args.goalId);
    return args.goalId;
  },
});
