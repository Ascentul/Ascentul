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

    // Paginate user collection (limit to 10k users for performance)
    const users = await usersQuery.take(10000);

    // Calculate metrics
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.subscription_status === "active").length;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const newUsersThisMonth = users.filter(u => {
      const userDate = new Date(u.created_at);
      return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
    }).length;

    // User growth data (last 12 months) - optimized with single pass
    const userGrowth: Array<{ month: string; users: number; monthStart: number }> = [];
    const monthCounts: Record<string, number> = {};

    // Pre-calculate month boundaries
    const monthBoundaries: Array<{ start: number; end: number; label: string }> = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
      const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthBoundaries.push({ start: monthStart, end: monthEnd, label });
      monthCounts[label] = 0;
    }

    // Single pass through users for growth calculation
    for (const user of users) {
      for (const boundary of monthBoundaries) {
        if (user.created_at >= boundary.start && user.created_at <= boundary.end) {
          monthCounts[boundary.label]++;
          break;
        }
      }
    }

    // Build userGrowth array
    for (const boundary of monthBoundaries) {
      userGrowth.push({
        month: boundary.label,
        users: monthCounts[boundary.label],
        monthStart: boundary.start,
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

    // Get universities for university data
    const universities = await ctx.db.query("universities").collect();

    // Get support tickets for system health
    const supportTickets = await ctx.db.query("support_tickets")
      .filter((q) => q.eq(q.field("status"), "open"))
      .collect();

    // Calculate system stats
    const systemStats = {
      totalUsers: users.length,
      totalUniversities: universities.length,
      activeUsers: users.filter(u => u.subscription_status === "active").length,
      systemHealth: 98.5, // Would be calculated from actual monitoring
      monthlyGrowth: userGrowth.length > 1 ?
        ((userGrowth[userGrowth.length - 1].users / userGrowth[userGrowth.length - 2].users - 1) * 100) : 0,
      supportTickets: supportTickets.length,
      systemUptime: 99.9 // Would come from monitoring system
    };

    // Transform plan segmentation into subscription data format
    const subscriptionData = [
      { name: 'University', value: planSegmentation.university || 0, color: '#4F46E5' },
      { name: 'Premium', value: planSegmentation.premium || 0, color: '#10B981' },
      { name: 'Free', value: planSegmentation.free || 0, color: '#F59E0B' },
    ];

    // Create real university data from actual universities
    const universityData = await Promise.all(
      universities.slice(0, 5).map(async (uni) => {
        const uniUsers = await ctx.db
          .query("users")
          .withIndex("by_university", (q) => q.eq("university_id", uni._id))
          .collect();

        return {
          name: uni.name,
          users: uniUsers.length,
          status: uni.status === "active" ? "Active" : "Inactive",
        };
      })
    );

    // Calculate activity data (last 7 days) - optimized
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    // Fetch all applications from last 7 days in one query
    const recentApplications = await ctx.db
      .query("applications")
      .filter((q) => q.gte(q.field("created_at"), sevenDaysAgo))
      .take(1000);

    // Pre-calculate day boundaries
    const dayBoundaries: Array<{ start: number; end: number; label: string }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const dayEnd = dayStart + (24 * 60 * 60 * 1000) - 1;
      dayBoundaries.push({
        start: dayStart,
        end: dayEnd,
        label: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }

    // Single pass through users and applications to build activity data
    const activityData = dayBoundaries.map(day => {
      const dayRegistrations = users.filter(user =>
        user.created_at >= day.start && user.created_at <= day.end
      ).length;

      const dayApplicationsCount = recentApplications.filter(app =>
        app.created_at >= day.start && app.created_at <= day.end
      ).length;

      return {
        day: day.label,
        logins: Math.max(dayApplicationsCount * 3, dayRegistrations * 5),
        registrations: dayRegistrations,
      };
    });

    return {
      overview: {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
      },
      systemStats,
      userGrowth,
      roleSegmentation,
      planSegmentation,
      subscriptionData,
      featureUsage,
      universityGrowth,
      universityData,
      activityData,
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
  const userCount = users.length || 1; // Prevent division by zero

  // Parallelize all feature queries
  const [resumes, applications, coverLetters, goals, projects] = await Promise.all([
    ctx.db.query("resumes").take(10000),
    ctx.db.query("applications").take(10000),
    ctx.db.query("cover_letters").take(10000),
    ctx.db.query("goals").take(10000),
    ctx.db.query("projects").take(10000),
  ]);

  return [
    { feature: "Resume Builder", count: resumes.length, percentage: Math.round((resumes.length / userCount) * 100) },
    { feature: "Job Applications", count: applications.length, percentage: Math.round((applications.length / userCount) * 100) },
    { feature: "Cover Letters", count: coverLetters.length, percentage: Math.round((coverLetters.length / userCount) * 100) },
    { feature: "Career Goals", count: goals.length, percentage: Math.round((goals.length / userCount) * 100) },
    { feature: "Projects", count: projects.length, percentage: Math.round((projects.length / userCount) * 100) },
  ].sort((a, b) => b.count - a.count);
}

// Helper function to get university growth metrics
async function getUniversityGrowth(ctx: any) {
  const universities = await ctx.db.query("universities").take(1000);

  // Pre-calculate month boundaries
  const monthBoundaries: Array<{ start: number; end: number; label: string }> = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
    monthBoundaries.push({
      start: monthStart,
      end: monthEnd,
      label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    });
  }

  // Single pass to build all metrics
  let activeCount = 0;
  const monthCounts: Record<string, number> = {};
  const licenseDistribution: Record<string, number> = {};

  monthBoundaries.forEach(m => monthCounts[m.label] = 0);

  for (const uni of universities) {
    if (uni.status === "active") activeCount++;

    for (const boundary of monthBoundaries) {
      if (uni.created_at >= boundary.start && uni.created_at <= boundary.end) {
        monthCounts[boundary.label]++;
        break;
      }
    }

    licenseDistribution[uni.license_plan] = (licenseDistribution[uni.license_plan] || 0) + 1;
  }

  const universityGrowth = monthBoundaries.map(m => ({
    month: m.label,
    universities: monthCounts[m.label],
  }));

  return {
    totalUniversities: universities.length,
    activeUniversities: activeCount,
    universityGrowth,
    licenseDistribution,
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

    // Parallelize all user data queries
    const [applications, goals, interviewStages, followupActions] = await Promise.all([
      ctx.db.query("applications").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("goals").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("interview_stages").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("followup_actions").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
    ]);

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
      : "No Interviews";

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
  if (!timestamp) return "No Interviews";

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
