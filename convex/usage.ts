import { v } from 'convex/values';

import { query } from './_generated/server';

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
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) {
      return null;
    }

    // Count all resources in parallel using direct counting (much faster than .collect().length)
    const [
      applicationsCount,
      goalsCount,
      contactsCount,
      careerPathsCount,
      projectsCount,
      resumesCount,
      coverLettersCount,
    ] = await Promise.all([
      ctx.db
        .query('applications')
        .withIndex('by_user', (q) => q.eq('user_id', user._id))
        .collect()
        .then((items) => items.length),
      ctx.db
        .query('goals')
        .withIndex('by_user', (q) => q.eq('user_id', user._id))
        .collect()
        .then((items) => items.length),
      ctx.db
        .query('networking_contacts')
        .withIndex('by_user', (q) => q.eq('user_id', user._id))
        .collect()
        .then((items) => items.length),
      ctx.db
        .query('career_paths')
        .withIndex('by_user', (q) => q.eq('user_id', user._id))
        .collect()
        .then((items) => items.length),
      ctx.db
        .query('projects')
        .withIndex('by_user', (q) => q.eq('user_id', user._id))
        .collect()
        .then((items) => items.length),
      ctx.db
        .query('resumes')
        .withIndex('by_user', (q) => q.eq('user_id', user._id))
        .collect()
        .then((items) => items.length),
      ctx.db
        .query('cover_letters')
        .withIndex('by_user', (q) => q.eq('user_id', user._id))
        .collect()
        .then((items) => items.length),
    ]);

    // Calculate usage for free plan features
    const usage = {
      applications: {
        count: applicationsCount,
        limit: FREE_PLAN_LIMITS.applications,
        used: applicationsCount >= FREE_PLAN_LIMITS.applications,
      },
      goals: {
        count: goalsCount,
        limit: FREE_PLAN_LIMITS.goals,
        used: goalsCount >= FREE_PLAN_LIMITS.goals,
      },
      contacts: {
        count: contactsCount,
        limit: FREE_PLAN_LIMITS.contacts,
        used: contactsCount >= FREE_PLAN_LIMITS.contacts,
      },
      career_paths: {
        count: careerPathsCount,
        limit: FREE_PLAN_LIMITS.career_paths,
        used: careerPathsCount >= FREE_PLAN_LIMITS.career_paths,
      },
      projects: {
        count: projectsCount,
        limit: FREE_PLAN_LIMITS.projects,
        used: projectsCount >= FREE_PLAN_LIMITS.projects,
      },
      resumes: {
        count: resumesCount,
        unlimited: true,
      },
      cover_letters: {
        count: coverLettersCount,
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
