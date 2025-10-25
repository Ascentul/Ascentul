import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get applications for a user
export const getUserApplications = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // OPTIMIZED: Add limit to prevent bandwidth issues for power users
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
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
    status: v.union(v.literal("saved"), v.literal("applied"), v.literal("interview"), v.literal("offer"), v.literal("rejected")),
    source: v.optional(v.string()),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    applied_at: v.optional(v.number()),
    resume_id: v.optional(v.id("resumes")),
    cover_letter_id: v.optional(v.id("cover_letters")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check free plan limit - OPTIMIZED to avoid loading all applications
    if (user.subscription_plan === "free") {
      const FREE_PLAN_LIMIT = 1;
      const existingApplications = await ctx.db
        .query("applications")
        .withIndex("by_user", (q) => q.eq("user_id", user._id))
        .take(FREE_PLAN_LIMIT + 1); // Only load what we need to check

      if (existingApplications.length >= FREE_PLAN_LIMIT) {
        throw new Error("Free plan limit reached. Upgrade to Premium for unlimited applications.");
      }
    }

    const applicationId = await ctx.db.insert("applications", {
      user_id: user._id,
      company: args.company,
      job_title: args.job_title,
      status: args.status,
      source: args.source,
      url: args.url,
      notes: args.notes,
      applied_at: args.applied_at,
      resume_id: args.resume_id,
      cover_letter_id: args.cover_letter_id,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    return applicationId;
  },
});

// Update an application
export const updateApplication = mutation({
  args: {
    clerkId: v.string(),
    applicationId: v.id("applications"),
    updates: v.object({
      company: v.optional(v.string()),
      job_title: v.optional(v.string()),
      status: v.optional(v.union(v.literal("saved"), v.literal("applied"), v.literal("interview"), v.literal("offer"), v.literal("rejected"))),
      source: v.optional(v.string()),
      url: v.optional(v.string()),
      notes: v.optional(v.string()),
      applied_at: v.optional(v.number()),
      resume_id: v.optional(v.id("resumes")),
      cover_letter_id: v.optional(v.id("cover_letters")),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const application = await ctx.db.get(args.applicationId);
    if (!application || application.user_id !== user._id) {
      throw new Error("Application not found or unauthorized");
    }

    await ctx.db.patch(args.applicationId, {
      ...args.updates,
      updated_at: Date.now(),
    });

    return args.applicationId;
  },
});

// Delete an application
export const deleteApplication = mutation({
  args: {
    clerkId: v.string(),
    applicationId: v.id("applications"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const application = await ctx.db.get(args.applicationId);
    if (!application || application.user_id !== user._id) {
      throw new Error("Application not found or unauthorized");
    }

    await ctx.db.delete(args.applicationId);
    return args.applicationId;
  },
});

// Get applications by status
export const getApplicationsByStatus = query({
  args: { 
    clerkId: v.string(),
    status: v.union(v.literal("saved"), v.literal("applied"), v.literal("interview"), v.literal("offer"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // OPTIMIZED: Add limit to prevent bandwidth issues
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .filter((q) => q.eq(q.field("user_id"), user._id))
      .take(500); // Limit to 500 applications per status

    return applications;
  },
});
