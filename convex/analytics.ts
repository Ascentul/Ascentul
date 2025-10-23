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

    // Get all support tickets for detailed metrics
    const allSupportTickets = await ctx.db.query("support_tickets").take(10000);

    const openTickets = allSupportTickets.filter(t => t.status === "open" || t.status === "in_progress");
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    const resolvedToday = allSupportTickets.filter(t =>
      t.status === "resolved" &&
      t.resolved_at &&
      t.resolved_at >= todayTimestamp
    );

    // Calculate average response time for resolved tickets
    const resolvedTickets = allSupportTickets.filter(t => t.status === "resolved" && t.resolved_at);
    const avgResponseTimeMs = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => sum + (t.resolved_at! - t.created_at), 0) / resolvedTickets.length
      : 0;
    const avgResponseTimeHours = (avgResponseTimeMs / (1000 * 60 * 60)).toFixed(1);

    // Calculate system stats
    const systemStats = {
      totalUsers: users.length,
      totalUniversities: universities.length,
      activeUsers: users.filter(u => u.subscription_status === "active").length,
      systemHealth: 98.5, // Would be calculated from actual monitoring
      monthlyGrowth: userGrowth.length > 1 ?
        Math.floor((userGrowth[userGrowth.length - 1].users / userGrowth[userGrowth.length - 2].users - 1) * 100) : 0,
      supportTickets: openTickets.length,
      systemUptime: 99.9 // Would come from monitoring system
    };

    // Support metrics
    const supportMetrics = {
      openTickets: openTickets.length,
      resolvedToday: resolvedToday.length,
      avgResponseTime: avgResponseTimeHours,
      totalTickets: allSupportTickets.length,
      resolvedTickets: resolvedTickets.length,
      inProgressTickets: allSupportTickets.filter(t => t.status === "in_progress").length,
    };

    // Transform plan segmentation into subscription data format
    const subscriptionData = [
      { name: 'University', value: planSegmentation.university || 0, color: '#4F46E5' },
      { name: 'Premium', value: planSegmentation.premium || 0, color: '#10B981' },
      { name: 'Free', value: planSegmentation.free || 0, color: '#F59E0B' },
    ];

    // Create real university data from actual universities with detailed metrics
    const universityData = await Promise.all(
      universities.map(async (uni) => {
        const uniUsers = await ctx.db
          .query("users")
          .withIndex("by_university", (q) => q.eq("university_id", uni._id))
          .collect();

        // Calculate license utilization
        const licenseUtilization = uni.license_seats > 0
          ? Math.round((uniUsers.length / uni.license_seats) * 100)
          : 0;

        // Get students (non-admin users)
        const students = uniUsers.filter(u => u.role === 'user');
        const advisors = uniUsers.filter(u => u.role === 'university_admin');

        // Calculate MAU (users with activity in last 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        // Get recent activity from various features
        const userIds = uniUsers.map(u => u._id);
        const [recentApps, recentResumes, recentGoals, recentProjects] = await Promise.all([
          ctx.db.query("applications")
            .filter((q) => q.gte(q.field("created_at"), thirtyDaysAgo))
            .take(10000),
          ctx.db.query("resumes")
            .filter((q) => q.gte(q.field("created_at"), thirtyDaysAgo))
            .take(10000),
          ctx.db.query("goals")
            .filter((q) => q.gte(q.field("created_at"), thirtyDaysAgo))
            .take(10000),
          ctx.db.query("projects")
            .filter((q) => q.gte(q.field("created_at"), thirtyDaysAgo))
            .take(10000),
        ]);

        // Get unique users with activity
        const activeUserIds = new Set([
          ...recentApps.filter(a => userIds.includes(a.user_id)).map(a => a.user_id),
          ...recentResumes.filter(r => userIds.includes(r.user_id)).map(r => r.user_id),
          ...recentGoals.filter(g => userIds.includes(g.user_id)).map(g => g.user_id),
          ...recentProjects.filter(p => userIds.includes(p.user_id)).map(p => p.user_id),
        ]);

        const mau = activeUserIds.size;

        // Calculate feature usage for this university
        const [uniApps, uniResumes, uniGoals, uniProjects, uniCoverLetters] = await Promise.all([
          ctx.db.query("applications").take(10000),
          ctx.db.query("resumes").take(10000),
          ctx.db.query("goals").take(10000),
          ctx.db.query("projects").take(10000),
          ctx.db.query("cover_letters").take(10000),
        ]);

        const featureUsage = {
          applications: uniApps.filter(a => userIds.includes(a.user_id)).length,
          resumes: uniResumes.filter(r => userIds.includes(r.user_id)).length,
          goals: uniGoals.filter(g => userIds.includes(g.user_id)).length,
          projects: uniProjects.filter(p => userIds.includes(p.user_id)).length,
          coverLetters: uniCoverLetters.filter(c => userIds.includes(c.user_id)).length,
        };

        return {
          name: uni.name,
          users: uniUsers.length,
          students: students.length,
          advisors: advisors.length,
          licenseSeats: uni.license_seats,
          licenseUtilization,
          mau,
          mauPercentage: students.length > 0 ? Math.round((mau / students.length) * 100) : 0,
          status: uni.status === "active" ? "Active" : "Inactive",
          featureUsage,
        };
      })
    );

    // Calculate MAU trends for universities (last 6 months)
    const mauTrends: Array<{ month: string; [key: string]: string | number }> = [];
    const monthBoundariesForMAU: Array<{ start: number; end: number; label: string }> = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
      const label = date.toLocaleDateString('en-US', { month: 'short' });
      monthBoundariesForMAU.push({ start: monthStart, end: monthEnd, label });
    }

    // Get all activity for the last 6 months
    const sixMonthsAgo = monthBoundariesForMAU[0].start;
    const [allApps, allResumes, allGoals, allProjects] = await Promise.all([
      ctx.db.query("applications")
        .filter((q) => q.gte(q.field("created_at"), sixMonthsAgo))
        .take(10000),
      ctx.db.query("resumes")
        .filter((q) => q.gte(q.field("created_at"), sixMonthsAgo))
        .take(10000),
      ctx.db.query("goals")
        .filter((q) => q.gte(q.field("created_at"), sixMonthsAgo))
        .take(10000),
      ctx.db.query("projects")
        .filter((q) => q.gte(q.field("created_at"), sixMonthsAgo))
        .take(10000),
    ]);

    // Calculate MAU for each month for each university
    // Wrap in try-catch to prevent production crashes due to large dataset timeouts
    try {
      // Optional limit controlled by environment variable
      const uniLimit = Number(process.env.ANALYTICS_UNI_LIMIT ?? "0");
      const universitiesToProcess = uniLimit > 0 ? universities.slice(0, uniLimit) : universities;

      for (const boundary of monthBoundariesForMAU) {
        const monthData: { month: string; [key: string]: string | number } = { month: boundary.label };

        for (const uni of universitiesToProcess) {
          const uniUsers = await ctx.db
            .query("users")
            .withIndex("by_university", (q) => q.eq("university_id", uni._id))
            .collect();

          const userIds = uniUsers.map(u => u._id);

          // Get activity for this month
          const monthApps = allApps.filter(a =>
            userIds.includes(a.user_id) &&
            a.created_at >= boundary.start &&
            a.created_at <= boundary.end
          );
          const monthResumes = allResumes.filter(r =>
            userIds.includes(r.user_id) &&
            r.created_at >= boundary.start &&
            r.created_at <= boundary.end
          );
          const monthGoals = allGoals.filter(g =>
            userIds.includes(g.user_id) &&
            g.created_at >= boundary.start &&
            g.created_at <= boundary.end
          );
          const monthProjects = allProjects.filter(p =>
            userIds.includes(p.user_id) &&
            p.created_at >= boundary.start &&
            p.created_at <= boundary.end
          );

          const activeUsersThisMonth = new Set([
            ...monthApps.map(a => a.user_id),
            ...monthResumes.map(r => r.user_id),
            ...monthGoals.map(g => g.user_id),
            ...monthProjects.map(p => p.user_id),
          ]);

          monthData[uni.name] = activeUsersThisMonth.size;
        }

        mauTrends.push(monthData);
      }
    } catch (error) {
      // If MAU calculation fails, return empty trends instead of crashing
      console.error("MAU trends calculation failed:", error);
      // Return placeholder data
      for (const boundary of monthBoundariesForMAU) {
        mauTrends.push({ month: boundary.label });
      }
    }

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
      supportMetrics,
      userGrowth,
      roleSegmentation,
      planSegmentation,
      subscriptionData,
      featureUsage,
      universityGrowth,
      universityData,
      mauTrends,
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
    const [
      applications,
      goals,
      interviewStages,
      followupActions,
      resumes,
      coverLetters,
      projects,
      contacts,
    ] = await Promise.all([
      ctx.db.query("applications").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("goals").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("interview_stages").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("followup_actions").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("resumes").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("cover_letters").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
      ctx.db.query("networking_contacts").withIndex("by_user", (q) => q.eq("user_id", user._id)).collect(),
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

    // Count all incomplete follow-up actions (not just overdue ones)
    const pendingTasks = followupActions.filter(followup =>
      !followup.completed
    ).length;

    // Find next upcoming interview
    const upcomingInterviews = interviewStages
      .filter(stage => stage.scheduled_at && stage.scheduled_at > Date.now())
      .sort((a, b) => (a.scheduled_at || 0) - (b.scheduled_at || 0));

    const nextInterview = upcomingInterviews.length > 0
      ? formatNextInterview(upcomingInterviews[0].scheduled_at)
      : "No Interviews";

    // Recent activity (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    type ActivityItem = {
      id: string;
      type:
        | "application"
        | "application_update"
        | "interview"
        | "followup"
        | "followup_completed"
        | "goal"
        | "goal_completed"
        | "resume"
        | "cover_letter"
        | "project"
        | "contact";
      description: string;
      timestamp: number;
    };

    const activity: ActivityItem[] = [];
    const addActivity = (item: ActivityItem) => {
      if (!item.timestamp || item.timestamp < thirtyDaysAgo) return;
      activity.push(item);
    };

    for (const app of applications) {
      if (app.created_at) {
        addActivity({
          id: `application-created-${app._id}`,
          type: "application",
          description: `Started tracking ${app.job_title} at ${app.company}`,
          timestamp: app.created_at,
        });
      }

      if (
        app.status !== "saved" &&
        app.updated_at &&
        app.updated_at !== app.created_at
      ) {
        const statusText =
          app.status === "applied"
            ? "Applied to"
            : app.status === "interview"
              ? "Moved to interviews for"
              : app.status === "offer"
                ? "Received an offer from"
                : app.status === "rejected"
                  ? "Closed application for"
                  : "Updated application for";

        addActivity({
          id: `application-update-${app._id}`,
          type: "application_update",
          description: `${statusText} ${app.company}`,
          timestamp: app.updated_at,
        });
      }
    }

    for (const stage of interviewStages) {
      addActivity({
        id: `interview-${stage._id}`,
        type: "interview",
        description: `Interview scheduled: ${stage.title}`,
        timestamp: stage.created_at,
      });
    }

    for (const followup of followupActions) {
      const label = followup.description || followup.notes || "Follow-up action";
      addActivity({
        id: `followup-${followup._id}`,
        type: "followup",
        description: `Scheduled follow-up: ${label}`,
        timestamp: followup.created_at ?? followup.updated_at ?? 0,
      });

      if (followup.completed && followup.updated_at) {
        addActivity({
          id: `followup-completed-${followup._id}`,
          type: "followup_completed",
          description: `Completed follow-up: ${label}`,
          timestamp: followup.updated_at,
        });
      }
    }

    for (const goal of goals) {
      addActivity({
        id: `goal-${goal._id}`,
        type: "goal",
        description: `Created goal: ${goal.title}`,
        timestamp: goal.created_at,
      });

      if (goal.completed_at) {
        addActivity({
          id: `goal-completed-${goal._id}`,
          type: "goal_completed",
          description: `Completed goal: ${goal.title}`,
          timestamp: goal.completed_at,
        });
      }
    }

    for (const resume of resumes) {
      if (resume.created_at) {
        addActivity({
          id: `resume-created-${resume._id}`,
          type: "resume",
          description: `Created resume: ${resume.title ?? "Untitled resume"}`,
          timestamp: resume.created_at,
        });
      }

      if (
        resume.updated_at &&
        resume.updated_at !== resume.created_at
      ) {
        addActivity({
          id: `resume-updated-${resume._id}`,
          type: "resume",
          description: `Updated resume: ${resume.title ?? "Untitled resume"}`,
          timestamp: resume.updated_at,
        });
      }
    }

    for (const coverLetter of coverLetters) {
      const coverLetterLabel =
        coverLetter.job_title ??
        coverLetter.company_name ??
        coverLetter.name ??
        "Cover letter";

      if (coverLetter.created_at) {
        addActivity({
          id: `cover-letter-created-${coverLetter._id}`,
          type: "cover_letter",
          description: `Created cover letter for ${coverLetterLabel}`,
          timestamp: coverLetter.created_at,
        });
      }

      if (
        coverLetter.updated_at &&
        coverLetter.updated_at !== coverLetter.created_at
      ) {
        addActivity({
          id: `cover-letter-updated-${coverLetter._id}`,
          type: "cover_letter",
          description: `Updated cover letter for ${coverLetterLabel}`,
          timestamp: coverLetter.updated_at,
        });
      }
    }

    for (const project of projects) {
      if (project.created_at) {
        addActivity({
          id: `project-created-${project._id}`,
          type: "project",
          description: `Added project: ${project.title ?? "Untitled project"}`,
          timestamp: project.created_at,
        });
      }

      if (
        project.updated_at &&
        project.updated_at !== project.created_at
      ) {
        addActivity({
          id: `project-updated-${project._id}`,
          type: "project",
          description: `Updated project: ${project.title ?? "Untitled project"}`,
          timestamp: project.updated_at,
        });
      }
    }

    for (const contact of contacts) {
      const contactLabel = contact.name ?? contact.email ?? "Contact";

      if (contact.created_at) {
        addActivity({
          id: `contact-created-${contact._id}`,
          type: "contact",
          description: `Added contact: ${contactLabel}${contact.company ? ` (${contact.company})` : ""}`,
          timestamp: contact.created_at,
        });
      }

      if (
        contact.updated_at &&
        contact.updated_at !== contact.created_at
      ) {
        addActivity({
          id: `contact-updated-${contact._id}`,
          type: "contact",
          description: `Updated contact: ${contactLabel}`,
          timestamp: contact.updated_at,
        });
      }
    }

    const recentActivity = activity
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 12);

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

// Get revenue analytics from Stripe payments
export const getRevenueAnalytics = query({
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

    // Get all successful payments
    const payments = await ctx.db
      .query("stripe_payments")
      .withIndex("by_status", (q) => q.eq("status", "succeeded"))
      .take(10000);

    // Calculate total revenue
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0) / 100; // Convert cents to dollars

    // Calculate current month revenue
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const currentMonthPayments = payments.filter(p => p.payment_date >= currentMonthStart);
    const monthlyRevenue = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0) / 100;

    // Calculate last month revenue for comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const lastMonthEnd = currentMonthStart - 1;
    const lastMonthPayments = payments.filter(p => p.payment_date >= lastMonthStart && p.payment_date <= lastMonthEnd);
    const lastMonthRevenue = lastMonthPayments.reduce((sum, payment) => sum + payment.amount, 0) / 100;

    // Calculate month-over-month growth
    const monthlyGrowthPercent = lastMonthRevenue > 0
      ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    // Get active paying users
    const activeUsers = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("subscription_status"), "active"),
          q.or(
            q.eq(q.field("subscription_plan"), "premium"),
            q.eq(q.field("subscription_plan"), "university")
          )
        )
      )
      .take(10000);

    const payingUsersCount = activeUsers.length;

    // Calculate ARPU (Average Revenue Per User)
    const arpu = payingUsersCount > 0 ? monthlyRevenue / payingUsersCount : 0;

    // Calculate revenue growth over last 6 months
    const revenueGrowth: Array<{ month: string; revenue: number; users: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
      const label = date.toLocaleDateString('en-US', { month: 'short' });

      const monthPayments = payments.filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd);
      const monthRevenue = monthPayments.reduce((sum, payment) => sum + payment.amount, 0) / 100;

      // Get unique customers for this month
      const uniqueCustomers = new Set(monthPayments.map(p => p.stripe_customer_id)).size;

      revenueGrowth.push({
        month: label,
        revenue: Math.round(monthRevenue),
        users: uniqueCustomers,
      });
    }

    // Get subscription lifecycle data
    const subscriptionEvents = await ctx.db
      .query("stripe_subscription_events")
      .take(10000);

    // Calculate churn rate from last month
    const lastMonthCancellations = subscriptionEvents.filter(e =>
      e.event_type === 'cancelled' &&
      e.event_date >= lastMonthStart &&
      e.event_date <= lastMonthEnd
    ).length;

    const lastMonthActiveSubscriptions = subscriptionEvents.filter(e =>
      e.event_date <= lastMonthStart &&
      e.subscription_status === 'active'
    ).length;

    const churnRate = lastMonthActiveSubscriptions > 0
      ? ((lastMonthCancellations / lastMonthActiveSubscriptions) * 100).toFixed(1)
      : "0.0";

    // Calculate subscription lifecycle for last 6 months
    const subscriptionLifecycle: Array<{ month: string; new: number; renewals: number; cancellations: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
      const label = date.toLocaleDateString('en-US', { month: 'short' });

      const monthEvents = subscriptionEvents.filter(e => e.event_date >= monthStart && e.event_date <= monthEnd);

      subscriptionLifecycle.push({
        month: label,
        new: monthEvents.filter(e => e.event_type === 'created').length,
        renewals: monthEvents.filter(e => e.event_type === 'renewed' || e.event_type === 'updated').length,
        cancellations: monthEvents.filter(e => e.event_type === 'cancelled').length,
      });
    }

    // Estimate LTV (simplified calculation: ARPU * average subscription length)
    // For now, use a 12-month assumption for active subscriptions
    const estimatedLTV = Math.round(arpu * 12);

    return {
      totalRevenue: Math.round(totalRevenue),
      monthlyRevenue: Math.round(monthlyRevenue),
      monthlyGrowthPercent,
      lastMonthRevenue: Math.round(lastMonthRevenue),
      payingUsersCount,
      arpu: arpu.toFixed(2),
      churnRate,
      estimatedLTV,
      revenueGrowth,
      subscriptionLifecycle,
      totalPayments: payments.length,
      monthlyPayments: currentMonthPayments.length,
    };
  },
});
