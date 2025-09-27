import { v } from "convex/values";
import { query } from "./_generated/server";

// Get comprehensive analytics data for admin dashboard
export const getAdminAnalytics = query({
  args: {
    clerkId: v.string(),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    userType: v.optional(v.union(v.literal("all"), v.literal("user"), v.literal("admin"), v.literal("super_admin"), v.literal("university_admin"))),
    subscriptionFilter: v.optional(v.union(v.literal("all"), v.literal("free"), v.literal("premium"), v.literal("university"))),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!currentUser || !["admin", "super_admin"].includes(currentUser.role)) {
      throw new Error("Unauthorized");
    }

    // Build query with filters
    let usersQuery = ctx.db.query("users");

    // Apply date filters
    if (args.dateFrom && args.dateTo) {
      usersQuery = usersQuery.filter((q) =>
        q.and(
          q.gte(q.field("created_at"), args.dateFrom!),
          q.lte(q.field("created_at"), args.dateTo!)
        )
      );
    }

    // Apply user type filter
    if (args.userType && args.userType !== "all") {
      usersQuery = usersQuery.filter((q) => q.eq(q.field("role"), args.userType));
    }

    // Apply subscription filter
    if (args.subscriptionFilter && args.subscriptionFilter !== "all") {
      usersQuery = usersQuery.filter((q) => q.eq(q.field("subscription_plan"), args.subscriptionFilter));
    }

    const users = await usersQuery.collect();

    // Calculate metrics
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.subscription_status === "active").length;
    const newUsersThisMonth = users.filter(u => {
      const userDate = new Date(u.created_at);
      const now = new Date();
      return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
    }).length;

    // User growth data (last 12 months)
    const userGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();

      const monthUsers = users.filter(u =>
        u.created_at >= monthStart && u.created_at <= monthEnd
      ).length;

      userGrowth.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        users: monthUsers,
        monthStart,
      });
    }

    // User segmentation by role
    const roleSegmentation = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // User segmentation by plan
    const planSegmentation = users.reduce((acc, user) => {
      acc[user.subscription_plan] = (acc[user.subscription_plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Feature usage (based on created content)
    const featureUsage = await getFeatureUsage(ctx, users);

    // University growth metrics
    const universityGrowth = await getUniversityGrowth(ctx);

    // Recent users (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentUsers = users
      .filter(u => u.created_at >= thirtyDaysAgo)
      .sort((a, b) => b.created_at - a.created_at)
      .slice(0, 20);

    return {
      overview: {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
      },
      userGrowth,
      roleSegmentation,
      planSegmentation,
      featureUsage,
      universityGrowth,
      recentUsers,
      filters: {
        dateFrom: args.dateFrom,
        dateTo: args.dateTo,
        userType: args.userType,
        subscriptionFilter: args.subscriptionFilter,
      }
    };
  },
});

// Helper function to calculate feature usage
async function getFeatureUsage(ctx: any, users: any[]) {
  // Count various features used by users
  const resumes = await ctx.db
    .query("resumes")
    .collect();

  const applications = await ctx.db
    .query("applications")
    .collect();

  const coverLetters = await ctx.db
    .query("cover_letters")
    .collect();

  const goals = await ctx.db
    .query("goals")
    .collect();

  const projects = await ctx.db
    .query("projects")
    .collect();

  return [
    { feature: "Resume Builder", count: resumes.length, percentage: Math.round((resumes.length / users.length) * 100) },
    { feature: "Job Applications", count: applications.length, percentage: Math.round((applications.length / users.length) * 100) },
    { feature: "Cover Letters", count: coverLetters.length, percentage: Math.round((coverLetters.length / users.length) * 100) },
    { feature: "Career Goals", count: goals.length, percentage: Math.round((goals.length / users.length) * 100) },
    { feature: "Projects", count: projects.length, percentage: Math.round((projects.length / users.length) * 100) },
  ].sort((a, b) => b.count - a.count);
}

// Helper function to get university growth metrics
async function getUniversityGrowth(ctx: any) {
  const universities = await ctx.db.query("universities").collect();

  const universityGrowth = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();

    const monthUniversities = universities.filter((u: any) =>
      u.created_at >= monthStart && u.created_at <= monthEnd
    ).length;

    universityGrowth.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      universities: monthUniversities,
    });
  }

  return {
    totalUniversities: universities.length,
    activeUniversities: universities.filter((u: any) => u.status === "active").length,
    universityGrowth,
    licenseDistribution: universities.reduce((acc: Record<string, number>, uni: any) => {
      acc[uni.license_plan] = (acc[uni.license_plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

// Get user dashboard analytics
export const getUserDashboardAnalytics = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Get user's applications
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Get user's goals
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Get user's interview stages
    const interviewStages = await ctx.db
      .query("interview_stages")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Get user's followup actions
    const followupActions = await ctx.db
      .query("followup_actions")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Calculate stats
    const applicationStats = {
      total: applications.length,
      applied: applications.filter(app => app.status === "applied").length,
      interview: applications.filter(app => app.status === "interview").length,
      offer: applications.filter(app => app.status === "offer").length,
      rejected: applications.filter(app => app.status === "rejected").length,
    };

    const activeGoals = goals.filter(goal =>
      goal.status === "active" || goal.status === "in_progress"
    ).length;

    const pendingTasks = followupActions.filter(followup =>
      !followup.completed && followup.due_date && followup.due_date <= Date.now()
    ).length;

    // Find next upcoming interview
    const upcomingInterviews = interviewStages
      .filter(stage => stage.scheduled_at && stage.scheduled_at > Date.now())
      .sort((a, b) => (a.scheduled_at || 0) - (b.scheduled_at || 0));

    const nextInterview = upcomingInterviews.length > 0
      ? formatNextInterview(upcomingInterviews[0].scheduled_at)
      : "No upcoming interviews";

    // Recent activity (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentActivity = [
      ...applications.filter(app => app.created_at >= thirtyDaysAgo).map(app => ({
        id: app._id,
        type: "application",
        description: `Applied to ${app.job_title} at ${app.company}`,
        timestamp: app.created_at,
      })),
      ...interviewStages.filter(stage => stage.created_at >= thirtyDaysAgo).map(stage => ({
        id: stage._id,
        type: "interview",
        description: `Interview scheduled: ${stage.title}`,
        timestamp: stage.created_at,
      }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    // Calculate interview rate
    const interviewRate = applicationStats.total > 0
      ? Math.round((applicationStats.interview / applicationStats.total) * 100)
      : 0;

    return {
      applicationStats,
      activeGoals,
      pendingTasks,
      nextInterview,
      upcomingInterviews: upcomingInterviews.length,
      interviewRate,
      recentActivity,
    };
  },
});

// Helper function to format next interview date
function formatNextInterview(timestamp: number | undefined): string {
  if (!timestamp) return "No upcoming interviews";

  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  } else if (diffDays === 0) {
    return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

// Get session analytics (placeholder - would need actual session tracking)
export const getSessionAnalytics = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    // Check if user is admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!currentUser || !["admin", "super_admin"].includes(currentUser.role)) {
      throw new Error("Unauthorized");
    }

    // This would need actual session tracking implementation
    // For now, return placeholder data
    return {
      averageSessionTime: "5m 49s", // Would calculate from actual session data
      totalSessions: 0, // Would count from session tracking
      sessionsToday: 0, // Would count sessions from today
    };
  },
});
