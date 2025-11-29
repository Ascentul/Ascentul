/**
 * Advisor Dashboard V2 Queries
 *
 * Action-oriented dashboard queries that answer three key questions:
 * 1. Who needs my attention right now?
 * 2. Who might quietly be slipping through the cracks?
 * 3. Are my students actually making progress toward real career paths?
 *
 * These queries power the redesigned advisor dashboard with:
 * - Needs Attention Today strip
 * - Risk Overview panel
 * - Caseload and Readiness Gaps
 * - Communication Load
 * - Capacity and Schedule
 * - Progress and Outcomes
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import {
  getCurrentUser,
  requireAdvisorRole,
  requireTenant,
  getOwnedStudentIds,
} from "./advisor_auth";
import { ACTIVE_STAGES } from './advisor_constants';
import { Id } from "./_generated/dataModel";

// Configuration constants (can be moved to a settings table later)
const CONFIG = {
  NO_CONTACT_DAYS: 14, // Days without any interaction before flagging
  LOW_ENGAGEMENT_DAYS: 21, // Days without activity for low engagement risk
  STALLED_SEARCH_DAYS: 14, // Days without application status change
  WEEKLY_SESSION_SLOTS: 10, // Default available session slots per week
  get SENIOR_GRADUATION_YEAR() {
    return new Date().getFullYear().toString();
  },
};

/**
 * Get "Needs Attention Today" metrics
 * Returns counts and student lists for urgent items requiring advisor action
 */
export const getNeedsAttentionToday = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);
    const studentIdSet = new Set(studentIds);
    const now = Date.now();

    // 1. Overdue follow-ups (due date in the past, still open)
    const allFollowUps = await ctx.db
      .query("follow_ups")
      .withIndex("by_university", (q) => q.eq("university_id", universityId))
      .filter((q) =>
        q.and(
          q.eq(q.field("created_by_id"), sessionCtx.userId),
          q.eq(q.field("created_by_type"), "advisor"),
          q.eq(q.field("status"), "open"),
          q.lt(q.field("due_at"), now)
        )
      )
      .collect();

    const overdueFollowUps = allFollowUps.filter((f) =>
      studentIdSet.has(f.user_id)
    );

    // Enrich with student names
    const overdueFollowUpsEnriched = await Promise.all(
      overdueFollowUps.slice(0, 10).map(async (f) => {
        const student = await ctx.db.get(f.user_id);
        return {
          _id: f._id,
          student_id: f.user_id,
          student_name: student?.name || "Unknown",
          title: f.title,
          due_at: f.due_at,
          priority: f.priority,
        };
      })
    );

    // 2. Past sessions without notes (completed sessions with no notes)
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const pastSessions = await ctx.db
      .query("advisor_sessions")
      .withIndex("by_advisor", (q) =>
        q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId)
      )
      .filter((q) =>
        q.and(
          q.lt(q.field("start_at"), now),
          q.gte(q.field("start_at"), oneWeekAgo),
          q.or(
            q.eq(q.field("status"), "completed"),
            q.eq(q.field("status"), undefined)
          )
        )
      )
      .collect();

    // Filter to sessions without notes
    const sessionsWithoutNotes = pastSessions.filter(
      (s) => !s.notes || s.notes.trim() === ""
    );

    const sessionsWithoutNotesEnriched = await Promise.all(
      sessionsWithoutNotes.slice(0, 10).map(async (s) => {
        const student = await ctx.db.get(s.student_id);
        return {
          _id: s._id,
          student_id: s.student_id,
          student_name: student?.name || "Unknown",
          title: s.title,
          start_at: s.start_at,
          session_type: s.session_type,
        };
      })
    );

    // 3. Students with no contact in N days
    // Check for students with no sessions, no follow-ups, and no recent login
    const noContactCutoff = now - CONFIG.NO_CONTACT_DAYS * 24 * 60 * 60 * 1000;

    // Get all students in caseload
    const students = await Promise.all(
      studentIds.map((id) => ctx.db.get(id))
    );
    const validStudents = students.filter((s): s is NonNullable<typeof s> => s !== null);

    // For each student, check recent activity
    const studentsNoContact: Array<{
      _id: Id<"users">;
      name: string;
      email: string;
      last_activity: number | null;
      days_inactive: number;
    }> = [];

    for (const student of validStudents) {
      // Check last session
      const lastSession = await ctx.db
        .query("advisor_sessions")
        .withIndex("by_advisor", (q) =>
          q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId)
        )
        .filter((q) => q.eq(q.field("student_id"), student._id))
        .order("desc")
        .first();

      // Check last follow-up activity
      const lastFollowUp = await ctx.db
        .query("follow_ups")
        .withIndex("by_user", (q) => q.eq("user_id", student._id))
        .order("desc")
        .first();

      const lastSessionTime = lastSession?.start_at || 0;
      const lastFollowUpTime = lastFollowUp?.updated_at || lastFollowUp?.created_at || 0;
      const lastLoginTime = student.last_login_at || 0;

      const lastActivity = Math.max(lastSessionTime, lastFollowUpTime, lastLoginTime);

      if (lastActivity < noContactCutoff || lastActivity === 0) {
        const daysInactive = lastActivity === 0
          ? CONFIG.NO_CONTACT_DAYS + 1
          : Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000));

        studentsNoContact.push({
          _id: student._id,
          name: student.name,
          email: student.email,
          last_activity: lastActivity || null,
          days_inactive: daysInactive,
        });
      }
    }

    // Sort by days inactive (most inactive first)
    studentsNoContact.sort((a, b) => b.days_inactive - a.days_inactive);

    // 4. Pending reviews that are urgent (waiting > 3 days)
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const allPendingReviews = await ctx.db
      .query("advisor_reviews")
      .withIndex("by_status", (q) =>
        q.eq("status", "waiting").eq("university_id", universityId)
      )
      .collect();

    const urgentReviews = allPendingReviews.filter(
      (r) => studentIdSet.has(r.student_id) && r.created_at < threeDaysAgo
    );

    const urgentReviewsEnriched = await Promise.all(
      urgentReviews.slice(0, 10).map(async (r) => {
        const student = await ctx.db.get(r.student_id);
        return {
          _id: r._id,
          student_id: r.student_id,
          student_name: student?.name || "Unknown",
          asset_type: r.asset_type,
          submitted_at: r.created_at,
          days_waiting: Math.floor((now - r.created_at) / (24 * 60 * 60 * 1000)),
        };
      })
    );

    return {
      overdueFollowUps: {
        count: overdueFollowUps.length,
        items: overdueFollowUpsEnriched,
      },
      sessionsWithoutNotes: {
        count: sessionsWithoutNotes.length,
        items: sessionsWithoutNotesEnriched,
      },
      studentsNoContact: {
        count: studentsNoContact.length,
        items: studentsNoContact.slice(0, 10),
        config: { days: CONFIG.NO_CONTACT_DAYS },
      },
      urgentReviews: {
        count: urgentReviews.length,
        items: urgentReviewsEnriched,
      },
    };
  },
});

/**
 * Get Risk Overview metrics
 * Returns counts for three risk categories:
 * 1. Low engagement - no activity for N days
 * 2. Stalled search - applications with no status change
 * 3. Priority population concerns - at-risk students in designated groups
 */
export const getRiskOverview = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);
    const studentIdSet = new Set(studentIds);
    const now = Date.now();

    // Get all students with their data
    const students = await Promise.all(
      studentIds.map((id) => ctx.db.get(id))
    );
    const validStudents = students.filter((s): s is NonNullable<typeof s> => s !== null);

    // Get all applications for caseload students
    const advisorApplications = await ctx.db
      .query("applications")
      .withIndex("by_advisor", (q) =>
        q.eq("assigned_advisor_id", sessionCtx.userId)
      )
      .collect();

    const caseloadApps = advisorApplications.filter((a) =>
      studentIdSet.has(a.user_id)
    );

    // Group applications by student
    const appsByStudent = new Map<string, typeof caseloadApps>();
    for (const app of caseloadApps) {
      const key = app.user_id;
      if (!appsByStudent.has(key)) {
        appsByStudent.set(key, []);
      }
      appsByStudent.get(key)!.push(app);
    }

    // 1. Low Engagement - no logins, sessions, or tracked activity for N days
    const lowEngagementCutoff = now - CONFIG.LOW_ENGAGEMENT_DAYS * 24 * 60 * 60 * 1000;
    const lowEngagementStudents: Array<{
      _id: Id<"users">;
      name: string;
      last_login_at: number | null;
      days_inactive: number;
    }> = [];

    for (const student of validStudents) {
      const lastLogin = student.last_login_at || 0;

      // Check for recent sessions
      const recentSession = await ctx.db
        .query("advisor_sessions")
        .withIndex("by_advisor", (q) =>
          q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId)
        )
        .filter((q) =>
          q.and(
            q.eq(q.field("student_id"), student._id),
            q.gte(q.field("start_at"), lowEngagementCutoff)
          )
        )
        .first();

      if (!recentSession && lastLogin < lowEngagementCutoff) {
        const daysInactive = lastLogin === 0
          ? CONFIG.LOW_ENGAGEMENT_DAYS + 1
          : Math.floor((now - lastLogin) / (24 * 60 * 60 * 1000));

        lowEngagementStudents.push({
          _id: student._id,
          name: student.name,
          last_login_at: lastLogin || null,
          days_inactive: daysInactive,
        });
      }
    }

    // 2. Stalled Search - at least one application but no status change for N days
    const stalledCutoff = now - CONFIG.STALLED_SEARCH_DAYS * 24 * 60 * 60 * 1000;
    const stalledSearchStudents: Array<{
      _id: Id<"users">;
      name: string;
      total_apps: number;
      has_interview: boolean;
      has_offer: boolean;
      days_since_update: number;
    }> = [];

    // Legacy at-risk: >5 apps, no offers (keeping for compatibility)
    const atRiskNoOfferStudents: Array<{
      _id: Id<"users">;
      name: string;
      total_apps: number;
    }> = [];

    for (const student of validStudents) {
      const studentApps = appsByStudent.get(student._id) || [];
      if (studentApps.length === 0) continue;

      // Check for offers/interviews
      const hasOffer = studentApps.some(
        (a) => a.stage === "Offer" || a.stage === "Accepted"
      );
      const hasInterview = studentApps.some((a) => a.stage === "Interview");

      // Check last status change (using stage_set_at or updated_at)
      const lastUpdate = Math.max(
        ...studentApps.map((a) => a.stage_set_at || a.updated_at || a._creationTime)
      );

      // Stalled: has apps but no movement
      if (!hasOffer && lastUpdate < stalledCutoff) {
        const daysSinceUpdate = Math.floor((now - lastUpdate) / (24 * 60 * 60 * 1000));
        stalledSearchStudents.push({
          _id: student._id,
          name: student.name,
          total_apps: studentApps.length,
          has_interview: hasInterview,
          has_offer: hasOffer,
          days_since_update: daysSinceUpdate,
        });
      }

      // Legacy at-risk: >5 apps, no offers
      if (studentApps.length > 5 && !hasOffer) {
        atRiskNoOfferStudents.push({
          _id: student._id,
          name: student.name,
          total_apps: studentApps.length,
        });
      }
    }

    // 3. Priority Population Concerns
    // Students who are both low-engagement/stalled AND in priority groups
    // Priority groups: first-gen (experience_level === 'entry'), seniors near graduation
    const lowEngagementIds = new Set(lowEngagementStudents.map((s) => s._id));
    const stalledIds = new Set(stalledSearchStudents.map((s) => s._id));
    const atRiskIds = new Set([...lowEngagementIds, ...stalledIds]);

    const priorityStudents: Array<{
      _id: Id<"users">;
      name: string;
      graduation_year: string | undefined;
      risk_type: "low_engagement" | "stalled_search" | "both";
    }> = [];

    for (const student of validStudents) {
      // Check if student is in a priority population (seniors or entry-level)
      const isSenior = student.graduation_year === CONFIG.SENIOR_GRADUATION_YEAR;
      const isEntryLevel = student.experience_level === "entry";

      if ((isSenior || isEntryLevel) && atRiskIds.has(student._id)) {
        const isLowEngagement = lowEngagementIds.has(student._id);
        const isStalled = stalledIds.has(student._id);

        priorityStudents.push({
          _id: student._id,
          name: student.name,
          graduation_year: student.graduation_year,
          risk_type: isLowEngagement && isStalled ? "both" : isLowEngagement ? "low_engagement" : "stalled_search",
        });
      }
    }

    return {
      lowEngagement: {
        count: lowEngagementStudents.length,
        items: lowEngagementStudents.slice(0, 10),
        config: { days: CONFIG.LOW_ENGAGEMENT_DAYS },
        subtitle: `No logins or sessions for ${CONFIG.LOW_ENGAGEMENT_DAYS}+ days`,
      },
      stalledSearch: {
        count: stalledSearchStudents.length,
        items: stalledSearchStudents.slice(0, 10),
        config: { days: CONFIG.STALLED_SEARCH_DAYS },
        subtitle: `No application progress for ${CONFIG.STALLED_SEARCH_DAYS}+ days`,
      },
      priorityPopulation: {
        count: priorityStudents.length,
        items: priorityStudents.slice(0, 10),
        subtitle: "Seniors or entry-level students with engagement/search concerns",
      },
      atRiskNoOffer: {
        count: atRiskNoOfferStudents.length,
        items: atRiskNoOfferStudents.slice(0, 10),
        subtitle: ">5 applications but no offers yet",
      },
    };
  },
});

/**
 * Get Caseload and Readiness Gaps
 * Returns counts for students missing basic career readiness steps
 */
export const getCaseloadGaps = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);
    const studentIdSet = new Set(studentIds);

    // Get all students
    const students = await Promise.all(
      studentIds.map((id) => ctx.db.get(id))
    );
    const validStudents = students.filter((s): s is NonNullable<typeof s> => s !== null);

    // 1. Students with no goal or career path defined
    const studentsNoGoal: Array<{
      _id: Id<"users">;
      name: string;
      email: string;
    }> = [];

    for (const student of validStudents) {
      // Check if student has career_goals field set or has goals in goals table
      if (!student.career_goals || student.career_goals.trim() === "") {
        const goals = await ctx.db
          .query("goals")
          .withIndex("by_user", (q) => q.eq("user_id", student._id))
          .first();

        if (!goals) {
          studentsNoGoal.push({
            _id: student._id,
            name: student.name,
            email: student.email,
          });
        }
      }
    }

    // 2. Seniors (or near graduation) with zero applications
    const seniorsNoApps: Array<{
      _id: Id<"users">;
      name: string;
      graduation_year: string | undefined;
    }> = [];

    // Get applications for caseload
    const advisorApplications = await ctx.db
      .query("applications")
      .withIndex("by_advisor", (q) =>
        q.eq("assigned_advisor_id", sessionCtx.userId)
      )
      .collect();

    const studentsWithApps = new Set(
      advisorApplications
        .filter((a) => studentIdSet.has(a.user_id))
        .map((a) => a.user_id)
    );

    for (const student of validStudents) {
      // Check if senior (current year or next year graduation)
      const currentYear = new Date().getFullYear();
      const gradYear = parseInt(student.graduation_year || "0", 10);

      if (gradYear >= currentYear && gradYear <= currentYear + 1) {
        if (!studentsWithApps.has(student._id)) {
          seniorsNoApps.push({
            _id: student._id,
            name: student.name,
            graduation_year: student.graduation_year,
          });
        }
      }
    }

    // 3. Students with no resume on file
    const studentsNoResume: Array<{
      _id: Id<"users">;
      name: string;
      email: string;
    }> = [];

    for (const student of validStudents) {
      const resume = await ctx.db
        .query("resumes")
        .withIndex("by_user", (q) => q.eq("user_id", student._id))
        .first();

      if (!resume) {
        studentsNoResume.push({
          _id: student._id,
          name: student.name,
          email: student.email,
        });
      }
    }

    return {
      totalStudents: validStudents.length,
      noGoal: {
        count: studentsNoGoal.length,
        items: studentsNoGoal.slice(0, 10),
        subtitle: "No career goal or path defined",
      },
      seniorsNoApps: {
        count: seniorsNoApps.length,
        items: seniorsNoApps.slice(0, 10),
        subtitle: "Near graduation with zero applications",
      },
      noResume: {
        count: studentsNoResume.length,
        items: studentsNoResume.slice(0, 10),
        subtitle: "No resume uploaded",
      },
    };
  },
});

/**
 * Get Capacity and Schedule metrics
 * Returns session capacity utilization and upcoming schedule
 */
export const getCapacityAndSchedule = query({
  args: {
    clerkId: v.string(),
    weeklySlots: v.optional(v.number()), // Allow override of default
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const now = Date.now();
    const weeklySlots = args.weeklySlots ?? CONFIG.WEEKLY_SESSION_SLOTS;
    if (weeklySlots <= 0) {
      throw new Error("weeklySlots must be greater than 0");
    }

    // Get current week boundaries (Monday to Sunday)
    const today = new Date(now);
    const dayOfWeek = today.getUTCDay();
    const daysToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now - daysToMonday * 24 * 60 * 60 * 1000);
    monday.setUTCHours(0, 0, 0, 0);
    const sunday = new Date(monday.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get sessions this week
    const sessionsThisWeek = await ctx.db
      .query("advisor_sessions")
      .withIndex("by_advisor", (q) =>
        q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("start_at"), monday.getTime()),
          q.lt(q.field("start_at"), sunday.getTime())
        )
      )
      .collect();

    // Filter to scheduled/completed sessions (exclude cancelled)
    const activeSessions = sessionsThisWeek.filter(
      (s) => s.status !== "cancelled" && s.status !== "no_show"
    );

    // Get upcoming sessions (next 7 days) with student info
    const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000;
    const upcomingSessions = await ctx.db
      .query("advisor_sessions")
      .withIndex("by_advisor", (q) =>
        q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("start_at"), now),
          q.lt(q.field("start_at"), oneWeekFromNow),
          q.neq(q.field("status"), "cancelled")
        )
      )
      .collect();

    // Sort by start time and enrich with student names
    const sortedUpcoming = upcomingSessions.sort((a, b) => a.start_at - b.start_at);
    const enrichedUpcoming = await Promise.all(
      sortedUpcoming.slice(0, 5).map(async (s) => {
        const student = await ctx.db.get(s.student_id);
        return {
          _id: s._id,
          student_id: s.student_id,
          student_name: student?.name || "Unknown",
          title: s.title,
          start_at: s.start_at,
          session_type: s.session_type,
          status: s.status,
        };
      })
    );

    return {
      capacity: {
        percentage: weeklySlots > 0 
          ? Math.round((activeSessions.length / weeklySlots) * 100) 
          : 0,
      },
      sessionsThisWeek: activeSessions.length,
      upcoming: {
        count: sortedUpcoming.length,
        items: enrichedUpcoming,
      },
    };
});

/**
 * Get Progress and Outcomes metrics
 * Returns summary metrics on student progress and career outcomes
 */
export const getProgressAndOutcomes = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);
    const studentIdSet = new Set(studentIds);

    // Get students
    const students = await Promise.all(
      studentIds.map((id) => ctx.db.get(id))
    );
    const validStudents = students.filter((s): s is NonNullable<typeof s> => s !== null);

    // Identify seniors (graduating this year)
    const currentYear = new Date().getFullYear().toString();
    const seniors = validStudents.filter(
      (s) => s.graduation_year === currentYear
    );
    const seniorIds = new Set(seniors.map((s) => s._id));

    // Get all applications for caseload
    const advisorApplications = await ctx.db
      .query("applications")
      .withIndex("by_advisor", (q) =>
        q.eq("assigned_advisor_id", sessionCtx.userId)
      )
      .collect();

    const caseloadApps = advisorApplications.filter((a) =>
      studentIdSet.has(a.user_id)
    );

    // Calculate metrics
    let seniorsWithInterview = 0;
    let studentsWithOffer = 0;
    let totalActiveApps = 0;
    const studentsWithActiveApps = new Set<string>();
    const activeStages = new Set(ACTIVE_STAGES);

    const studentAppStats = new Map<
      string,
      { hasInterview: boolean; hasOffer: boolean; activeApps: number }
    >();

    for (const app of caseloadApps) {
      const key = app.user_id;
      const stats = studentAppStats.get(key) || {
        hasInterview: false,
        hasOffer: false,
        activeApps: 0,
      };

      if (app.stage === "Interview") {
        stats.hasInterview = true;
      }
      if (app.stage === "Offer" || app.stage === "Accepted") {
        stats.hasOffer = true;
      }
      if (app.stage && activeStages.has(app.stage)) {
        stats.activeApps += 1;
        totalActiveApps += 1;
        studentsWithActiveApps.add(key);
      }

      studentAppStats.set(key, stats);
    }

    // Count seniors with interviews
    for (const seniorId of seniorIds) {
      const stats = studentAppStats.get(seniorId);
      if (stats?.hasInterview) {
        seniorsWithInterview += 1;
      }
    }

    // Count all students with offers
    for (const [, stats] of studentAppStats) {
      if (stats.hasOffer) {
        studentsWithOffer += 1;
      }
    }

    // Average apps per active job-seeking student
    const avgAppsPerStudent =
      studentsWithActiveApps.size > 0
        ? Math.round((totalActiveApps / studentsWithActiveApps.size) * 10) / 10
        : 0;

    return {
      seniorsWithInterview: {
        count: seniorsWithInterview,
        total: seniors.length,
        percentage: seniors.length > 0 ? Math.round((seniorsWithInterview / seniors.length) * 100) : 0,
        subtitle: "Seniors with at least one interview this term",
      },
      studentsWithOffer: {
        count: studentsWithOffer,
        total: validStudents.length,
        subtitle: "Students with offers this term",
      },
      avgAppsPerStudent: {
        value: avgAppsPerStudent,
        activeStudents: studentsWithActiveApps.size,
        subtitle: "Avg applications per active job seeker",
      },
      totalActiveApps: totalActiveApps,
    };
  },
});

/**
 * Get extended dashboard stats (combines original stats with new metrics)
 * This is a unified query that can replace getDashboardStats for efficiency
 */
export const getDashboardStatsExtended = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);
    const studentIdSet = new Set(studentIds);
    const now = Date.now();

    // Load all advisor-assigned applications once for aggregation
    const advisorApplications = await ctx.db
      .query("applications")
      .withIndex("by_advisor", (q) =>
        q.eq("assigned_advisor_id", sessionCtx.userId)
      )
      .collect();

    const activeStages = new Set(ACTIVE_STAGES);
    let activeApplicationsCount = 0;
    const perStudentAppStats = new Map<
      string,
      { total: number; hasOffer: boolean; hasInterview: boolean }
    >();

    for (const application of advisorApplications) {
      if (!studentIdSet.has(application.user_id)) continue;
      const key = application.user_id;
      const stats = perStudentAppStats.get(key) ?? {
        total: 0,
        hasOffer: false,
        hasInterview: false,
      };
      stats.total += 1;
      if (application.stage && activeStages.has(application.stage)) {
        activeApplicationsCount += 1;
      }
      if (application.stage === "Offer" || application.stage === "Accepted") {
        stats.hasOffer = true;
      }
      if (application.stage === "Interview") {
        stats.hasInterview = true;
      }
      perStudentAppStats.set(key, stats);
    }

    // Count sessions this week
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const sessionsThisWeek = await ctx.db
      .query("advisor_sessions")
      .withIndex("by_advisor", (q) =>
        q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId)
      )
      .filter((q) => q.gte(q.field("start_at"), oneWeekAgo))
      .collect();

    // Count pending reviews
    const allPendingReviews = await ctx.db
      .query("advisor_reviews")
      .withIndex("by_status", (q) =>
        q.eq("status", "waiting").eq("university_id", universityId)
      )
      .collect();

    const pendingReviews = allPendingReviews.filter((review) =>
      studentIdSet.has(review.student_id)
    );

    // At-risk students (>5 apps, no offers)
    const atRiskNoOfferCount = Array.from(perStudentAppStats.values()).reduce(
      (total, stats) =>
        stats.total > 5 && !stats.hasOffer ? total + 1 : total,
      0
    );

    // Calculate total applications
    const totalApplicationsCount = Array.from(perStudentAppStats.values()).reduce(
      (sum, stats) => sum + stats.total,
      0
    );

    return {
      totalStudents: studentIds.length,
      activeApplications: activeApplicationsCount,
      sessionsThisWeek: sessionsThisWeek.length,
      pendingReviews: pendingReviews.length,
      atRiskStudents: atRiskNoOfferCount,
      averageApplicationsPerStudent:
        studentIds.length > 0
          ? Math.round((totalApplicationsCount / studentIds.length) * 10) / 10
          : 0,
    };
  },
});
