import { v } from "convex/values";
import { query } from "./_generated/server";

// Define free plan limits
export const FREE_PLAN_LIMITS = {
  applications: 1,
  goals: 1,
  contacts: 1,
  career_paths: 1,
  projects: 1,
  // Unlimited: resumes, cover_letters
};

// Get user's current usage counts for free plan features
export const getUserUsage = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return null;
    }

    // Count applications
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Count goals
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Count networking contacts
    const contacts = await ctx.db
      .query("networking_contacts")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Count career paths
    const careerPaths = await ctx.db
      .query("career_paths")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Count projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Count resumes
    const resumes = await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Count cover letters
    const coverLetters = await ctx.db
      .query("cover_letters")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Calculate usage for free plan features
    const usage = {
      applications: {
        count: applications.length,
        limit: FREE_PLAN_LIMITS.applications,
        used: applications.length >= FREE_PLAN_LIMITS.applications,
      },
      goals: {
        count: goals.length,
        limit: FREE_PLAN_LIMITS.goals,
        used: goals.length >= FREE_PLAN_LIMITS.goals,
      },
      contacts: {
        count: contacts.length,
        limit: FREE_PLAN_LIMITS.contacts,
        used: contacts.length >= FREE_PLAN_LIMITS.contacts,
      },
      career_paths: {
        count: careerPaths.length,
        limit: FREE_PLAN_LIMITS.career_paths,
        used: careerPaths.length >= FREE_PLAN_LIMITS.career_paths,
      },
      projects: {
        count: projects.length,
        limit: FREE_PLAN_LIMITS.projects,
        used: projects.length >= FREE_PLAN_LIMITS.projects,
      },
      resumes: {
        count: resumes.length,
        unlimited: true,
      },
      cover_letters: {
        count: coverLetters.length,
        unlimited: true,
      },
    };

    // Calculate steps completed (for free plan, count how many features have been used at least once)
    const stepsCompleted = [
      usage.applications.used,
      usage.goals.used,
      usage.contacts.used,
      usage.career_paths.used,
      usage.projects.used,
    ].filter(Boolean).length;

    const totalSteps = 5; // Total trackable features for free users

    return {
      usage,
      stepsCompleted,
      totalSteps,
      subscriptionPlan: user.subscription_plan,
    };
  },
});
