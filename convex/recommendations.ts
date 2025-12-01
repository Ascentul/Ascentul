import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

// Get daily recommendations for a user
export const getDailyRecommendations = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique();

    if (!user) {
      return [];
    }

    const recommendations: Array<{
      id: string;
      text: string;
      type: string;
      completed: boolean;
      completedAt: string | null;
      relatedEntityId: string | null;
      relatedEntityType: string | null;
      createdAt: string;
    }> = [];

    // Get user's applications
    const applications = await ctx.db
      .query('applications')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .collect();

    // Get user's goals
    const goals = await ctx.db
      .query('goals')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .collect();

    // Get user's resumes
    const resumes = await ctx.db
      .query('resumes')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .collect();

    // Get user's contacts
    const contacts = await ctx.db
      .query('networking_contacts')
      .withIndex('by_user', (q) => q.eq('user_id', user._id))
      .collect();

    // Recommendation 1: Create a resume if none exists
    if (resumes.length === 0) {
      recommendations.push({
        id: 'rec-1',
        text: 'Create your first resume to showcase your skills and experience',
        type: 'resume',
        completed: false,
        completedAt: null,
        relatedEntityId: null,
        relatedEntityType: 'resume',
        createdAt: new Date().toISOString(),
      });
    }

    // Recommendation 2: Set a career goal if none exists
    const activeGoals = goals.filter((g) => g.status !== 'completed');
    if (activeGoals.length === 0) {
      recommendations.push({
        id: 'rec-2',
        text: 'Set a career goal to track your professional development',
        type: 'goal',
        completed: false,
        completedAt: null,
        relatedEntityId: null,
        relatedEntityType: 'goal',
        createdAt: new Date().toISOString(),
      });
    }

    // Recommendation 3: Track a job application if none exists
    if (applications.length === 0) {
      recommendations.push({
        id: 'rec-3',
        text: 'Track your first job application to stay organized',
        type: 'application',
        completed: false,
        completedAt: null,
        relatedEntityId: null,
        relatedEntityType: 'job_application',
        createdAt: new Date().toISOString(),
      });
    }

    // Recommendation 4: Check for applications without follow-ups
    // MIGRATION: Support both stage and status during transition
    const applicationsWithoutFollowup = applications.filter(
      (app) =>
        (app.stage === 'Applied' || (!app.stage && app.status === 'applied')) &&
        app.applied_at &&
        Date.now() - app.applied_at > 7 * 24 * 60 * 60 * 1000, // 7 days
    );

    if (applicationsWithoutFollowup.length > 0) {
      const app = applicationsWithoutFollowup[0];
      recommendations.push({
        id: `rec-followup-${app._id}`,
        text: `Follow up on your application to ${app.company} - it's been over a week`,
        type: 'application',
        completed: false,
        completedAt: null,
        relatedEntityId: app._id,
        relatedEntityType: 'job_application',
        createdAt: new Date().toISOString(),
      });
    }

    // Recommendation 5: Build your network if few contacts
    if (contacts.length < 5) {
      recommendations.push({
        id: 'rec-5',
        text: 'Add professional contacts to expand your network',
        type: 'networking',
        completed: false,
        completedAt: null,
        relatedEntityId: null,
        relatedEntityType: 'contact',
        createdAt: new Date().toISOString(),
      });
    }

    // Recommendation 6: Update resume if old
    if (resumes.length > 0) {
      const latestResume = resumes.sort((a, b) => b.updated_at - a.updated_at)[0];
      const daysSinceUpdate = (Date.now() - latestResume.updated_at) / (1000 * 60 * 60 * 24);

      if (daysSinceUpdate > 30) {
        recommendations.push({
          id: `rec-resume-${latestResume._id}`,
          text: "Update your resume - it hasn't been modified in over a month",
          type: 'resume',
          completed: false,
          completedAt: null,
          relatedEntityId: latestResume._id,
          relatedEntityType: 'resume',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Recommendation 7: Check on pending applications
    // MIGRATION: Support both stage and status during transition
    const pendingApplications = applications.filter(
      (app) => app.stage === 'Interview' || (!app.stage && app.status === 'interview'),
    );

    if (pendingApplications.length > 0) {
      const app = pendingApplications[0];
      recommendations.push({
        id: `rec-interview-${app._id}`,
        text: `Prepare for your interview with ${app.company}`,
        type: 'interview',
        completed: false,
        completedAt: null,
        relatedEntityId: app._id,
        relatedEntityType: 'job_application',
        createdAt: new Date().toISOString(),
      });
    }

    // Recommendation 8: Check goal progress
    const staleGoals = activeGoals.filter((goal) => {
      const daysSinceUpdate = (Date.now() - goal.updated_at) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 14; // Not updated in 2 weeks
    });

    if (staleGoals.length > 0) {
      const goal = staleGoals[0];
      recommendations.push({
        id: `rec-goal-${goal._id}`,
        text: `Update progress on your goal: ${goal.title}`,
        type: 'goal',
        completed: false,
        completedAt: null,
        relatedEntityId: goal._id,
        relatedEntityType: 'goal',
        createdAt: new Date().toISOString(),
      });
    }

    // Return top 5 recommendations
    return recommendations.slice(0, 5);
  },
});
