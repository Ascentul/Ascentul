import { v } from 'convex/values';

import { api } from './_generated/api';
import { mutation, query } from './_generated/server';
import { requireMembership } from './lib/roles';
import { mapStatusToStage } from './migrate_application_status_to_stage';

// Get applications for a user
export const getUserApplications = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    // Note: We don't require membership for read queries - users can always view their own applications
    // Membership is only used for write operations and tenant isolation

    // OPTIMIZED: Add limit to prevent bandwidth issues for power users
    const applications = await ctx.db
      .query('applications')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .order('desc')
      .take(500); // Limit to 500 most recent applications

    return applications;
  },
});

// Create a new application
export const createApplication = mutation({
  args: {
    clerkId: v.string(),
    company: v.string(),
    job_title: v.string(),
    status: v.union(
      v.literal('saved'),
      v.literal('applied'),
      v.literal('interview'),
      v.literal('offer'),
      v.literal('rejected'),
    ),
    source: v.optional(v.string()),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    applied_at: v.optional(v.number()),
    resume_id: v.optional(v.id('resumes')),
    cover_letter_id: v.optional(v.id('cover_letters')),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    const membership =
      user.role === 'student'
        ? (await requireMembership(ctx, { role: 'student' })).membership
        : null;

    // ARCHITECTURE NOTE: Free plan limits are enforced at the FRONTEND layer
    // - Clerk Billing (publicMetadata) is the source of truth for subscriptions
    // - Frontend enforces via useSubscription() hook + Clerk's has() method
    // - Backend subscription_plan is cached display data only (see CLAUDE.md)
    // - Defense-in-depth: Consider adding hasPremium arg from frontend for backend validation

    // if (user.subscription_plan === "free") {
    //   const FREE_PLAN_LIMIT = 1;
    //   const existingApplications = await ctx.db
    //     .query("applications")
    //     .withIndex("by_user", (q) => q.eq("user_id", user._id))
    //     .take(FREE_PLAN_LIMIT + 1);
    //
    //   if (existingApplications.length >= FREE_PLAN_LIMIT) {
    //     throw new Error("Free plan limit reached. Upgrade to Premium for unlimited applications.");
    //   }
    // }

    const now = Date.now();

    const applicationId = await ctx.db.insert('applications', {
      user_id: user._id,
      university_id: membership?.university_id ?? user.university_id,
      company: args.company,
      job_title: args.job_title,
      status: args.status,
      // MIGRATION: Sync stage field from status for data consistency
      // See docs/TECH_DEBT_APPLICATION_STATUS_STAGE.md
      stage: mapStatusToStage(args.status),
      stage_set_at: now,
      source: args.source,
      url: args.url,
      notes: args.notes,
      applied_at: args.applied_at,
      resume_id: args.resume_id,
      cover_letter_id: args.cover_letter_id,
      created_at: now,
      updated_at: now,
    });

    // Track activity for streak (fire-and-forget)
    await ctx.scheduler.runAfter(0, api.activity.markActionForToday, {});

    return applicationId;
  },
});

// Update an application
export const updateApplication = mutation({
  args: {
    clerkId: v.string(),
    applicationId: v.id('applications'),
    updates: v.object({
      company: v.optional(v.string()),
      job_title: v.optional(v.string()),
      status: v.optional(
        v.union(
          v.literal('saved'),
          v.literal('applied'),
          v.literal('interview'),
          v.literal('offer'),
          v.literal('rejected'),
        ),
      ),
      source: v.optional(v.union(v.string(), v.null())),
      url: v.optional(v.union(v.string(), v.null())),
      notes: v.optional(v.union(v.string(), v.null())),
      applied_at: v.optional(v.union(v.number(), v.null())),
      resume_id: v.optional(v.union(v.id('resumes'), v.null())),
      cover_letter_id: v.optional(v.union(v.id('cover_letters'), v.null())),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    const membership =
      user.role === 'student'
        ? (await requireMembership(ctx, { role: 'student' })).membership
        : null;

    const application = await ctx.db.get(args.applicationId);
    if (!application || application.user_id !== user._id) {
      throw new Error('Application not found or unauthorized');
    }

    // University isolation check
    if (
      application.university_id &&
      membership &&
      application.university_id !== membership.university_id
    ) {
      throw new Error('Unauthorized: Application belongs to another university');
    }

    const now = Date.now();

    // Convert null values to undefined for Convex patch
    const cleanedUpdates = Object.fromEntries(
      Object.entries(args.updates).map(([key, value]) => [key, value === null ? undefined : value]),
    );

    // MIGRATION: Sync stage field when status changes
    // See docs/TECH_DEBT_APPLICATION_STATUS_STAGE.md
    const patchData: any = {
      ...cleanedUpdates,
      updated_at: now,
    };

    if (args.updates.status) {
      patchData.stage = mapStatusToStage(args.updates.status);
      patchData.stage_set_at = now;
    }

    await ctx.db.patch(args.applicationId, patchData);

    return args.applicationId;
  },
});

// Delete an application
export const deleteApplication = mutation({
  args: {
    clerkId: v.string(),
    applicationId: v.id('applications'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    const membership =
      user.role === 'student'
        ? (await requireMembership(ctx, { role: 'student' })).membership
        : null;

    const application = await ctx.db.get(args.applicationId);
    if (!application || application.user_id !== user._id) {
      throw new Error('Application not found or unauthorized');
    }

    if (
      application.university_id &&
      membership &&
      application.university_id !== membership.university_id
    ) {
      throw new Error('Unauthorized: Application belongs to another university');
    }

    await ctx.db.delete(args.applicationId);
    return args.applicationId;
  },
});

// Get applications by status
export const getApplicationsByStatus = query({
  args: {
    clerkId: v.string(),
    status: v.union(
      v.literal('saved'),
      v.literal('applied'),
      v.literal('interview'),
      v.literal('offer'),
      v.literal('rejected'),
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) {
      throw new Error('User not found');
    }

    // OPTIMIZED: Add limit to prevent bandwidth issues
    const applications = await ctx.db
      .query('applications')
      .withIndex('by_status', (q) => q.eq('status', args.status))
      .filter((q) => q.eq(q.field('user_id'), user._id))
      .take(500); // Limit to 500 applications per status

    return applications;
  },
});
