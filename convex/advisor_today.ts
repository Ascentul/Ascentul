/**
 * Advisor Today View Queries
 *
 * Provides data for the daily advisor dashboard:
 * - Today's sessions
 * - Follow-ups due today
 * - Quick stats for the day
 *
 * V2 adds:
 * - Grouped follow-ups (overdue/today/upcoming)
 * - Student context enrichment (session history, risk tags)
 * - Coming up preview (next 3 days)
 * - Documentation tracking (sessions missing notes)
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  getCurrentUser,
  requireAdvisorRole,
  requireTenant,
} from "./advisor_auth";

/**
 * Get today's schedule and tasks
 *
 * @param timezoneOffset - Client's timezone offset in minutes from UTC
 *                         (e.g., 480 for PST/PDT, 0 for UTC, -60 for CET)
 *                         Obtained via `new Date().getTimezoneOffset()` on client
 *                         Note: Positive values = behind UTC; negative values = ahead of UTC
 */
export const getTodayOverview = query({
  args: {
    clerkId: v.string(),
    timezoneOffset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const now = Date.now();

    // Calculate "today" in the user's timezone
    // timezoneOffset: positive = behind UTC (e.g., PST = +480), negative = ahead of UTC (e.g., CET = -60)
    const tzOffsetMs = (args.timezoneOffset ?? 0) * 60 * 1000;

    // Convert current UTC time to user's local time by subtracting offset
    // (subtract because getTimezoneOffset() returns minutes *behind* UTC as positive)
    const userNow = new Date(now - tzOffsetMs);

    // Find start/end of day in user's local time (using UTC methods to avoid double conversion)
    const startOfDay = new Date(userNow);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(userNow);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Convert local day boundaries back to UTC timestamps for database queries
    const startTimestamp = startOfDay.getTime() + tzOffsetMs;
    const endTimestamp = endOfDay.getTime() + tzOffsetMs;

    // Get today's sessions
    const sessions = await ctx.db
      .query("advisor_sessions")
      .withIndex("by_advisor", (q) =>
        q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId),
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("start_at"), startTimestamp),
          q.lte(q.field("start_at"), endTimestamp),
        ),
      )
      .collect();

    // Get follow-ups due today
    // Migrated to follow_ups table (unified table for all follow-up tasks)
    const followUps = await ctx.db
      .query("follow_ups")
      .withIndex("by_university", (q) => q.eq("university_id", universityId))
      .filter((q) =>
        q.and(
          q.eq(q.field("created_by_id"), sessionCtx.userId),
          q.eq(q.field("created_by_type"), "advisor"),
          q.lte(q.field("due_at"), endTimestamp),
          q.eq(q.field("status"), "open"),
        ),
      )
      .collect();

    // Filter ensures due_at exists (DB query already filtered by endTimestamp)
    // Type guard refines the type to guarantee due_at is number
    const todayFollowUps = followUps.filter(
      (f): f is typeof f & { due_at: number } => f.due_at !== undefined
    );

    // Batch fetch all unique students to avoid N+1 queries
    const studentIds = new Set([
      ...sessions.map((s) => s.student_id),
      ...todayFollowUps.map((f) => f.user_id),
    ]);

    const students = await Promise.all(
      Array.from(studentIds).map((id) => ctx.db.get(id))
    );

    const studentMap = new Map(
      students
        .filter((student): student is NonNullable<typeof student> => student !== null)
        .map((student) => [student._id, student])
    );

    // Enrich sessions with student data from map
    const enrichedSessions = sessions.map((session) => {
      const student = studentMap.get(session.student_id);
      return {
        _id: session._id,
        student_id: session.student_id,
        student_name: student?.name || "Unknown",
        student_email: student?.email || "",
        title: session.title,
        session_type: session.session_type,
        start_at: session.start_at,
        end_at: session.end_at,
        duration_minutes: session.duration_minutes,
        notes: session.notes,
        visibility: session.visibility,
        status: session.status,
      };
    });

    // Enrich follow-ups with student data from map
    const enrichedFollowUps = todayFollowUps.map((followUp) => {
      const student = studentMap.get(followUp.user_id);
      return {
        _id: followUp._id,
        student_id: followUp.user_id, // Return as student_id for backward compatibility
        student_name: student?.name || "Unknown",
        title: followUp.title,
        description: followUp.description,
        due_at: followUp.due_at,
        priority: followUp.priority,
        status: followUp.status,
        related_type: followUp.related_type,
      };
    });

    // Calculate stats
    const completedSessions = sessions.filter(
      (s) => s.status === "completed",
    ).length;
    const upcomingSessions = sessions.filter((s) => s.start_at > now).length;
    const overdueFollowUps = todayFollowUps.filter(
      (f) => f.due_at && f.due_at < now,
    ).length;

    return {
      sessions: enrichedSessions.sort((a, b) => a.start_at - b.start_at),
      // Sort by due_at (type guard ensures due_at is number)
      followUps: enrichedFollowUps.sort((a, b) => a.due_at - b.due_at),
      stats: {
        totalSessions: sessions.length,
        completedSessions,
        upcomingSessions,
        totalFollowUps: todayFollowUps.length,
        overdueFollowUps,
      },
    };
  },
});

// ============================================================================
// V2 Enhanced Today Overview
// ============================================================================

/**
 * Interface for student context enrichment
 */
interface StudentContext {
  isFirstSession: boolean;
  totalSessions: number;
  lastSessionDate?: number;
  resumeCount: number;
  applicationCount: number;
  riskTags: string[];
}

/**
 * Calculate risk tags for a student based on their activity
 */
function calculateRiskTags(
  lastLogin: number | undefined,
  applications: { stage?: string; updated_at?: number }[],
  now: number
): string[] {
  const tags: string[] = [];
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Low engagement: No login in 21+ days or never logged in
  if (!lastLogin || now - lastLogin > 21 * DAY_MS) {
    tags.push("low_engagement");
  }

  // Stalled search: Has applications but no stage change in 14+ days
  if (applications.length > 0) {
    const recentActivity = applications.some(
      (app) => app.updated_at && now - app.updated_at < 14 * DAY_MS
    );
    if (!recentActivity) {
      tags.push("stalled_search");
    }
  }

  // High volume, no offers: >5 applications, no offers
  if (applications.length > 5) {
    const hasOffer = applications.some(
      (app) => app.stage === "Offer" || app.stage === "Accepted"
    );
    if (!hasOffer) {
      tags.push("high_volume_no_offers");
    }
  }

  return tags;
}

/**
 * Get enhanced today overview with student context and grouped follow-ups
 *
 * This V2 query provides:
 * - Sessions with student context (history, risk tags, readiness)
 * - Follow-ups grouped by overdue/today/upcoming
 * - Coming up preview (next 3 days)
 * - Documentation tracking (sessions missing notes)
 */
export const getTodayOverviewV2 = query({
  args: {
    clerkId: v.string(),
    timezoneOffset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Calculate "today" in the user's timezone
    const tzOffsetMs = (args.timezoneOffset ?? 0) * 60 * 1000;
    const userNow = new Date(now - tzOffsetMs);

    // Find start/end of day in user's local time
    const startOfDay = new Date(userNow);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(userNow);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Convert local day boundaries back to UTC timestamps for database queries
    const startTimestamp = startOfDay.getTime() + tzOffsetMs;
    const endTimestamp = endOfDay.getTime() + tzOffsetMs;

    // Calculate coming up period (tomorrow + 2 more days = 3 days total after today)
    const tomorrowStart = endTimestamp + 1;
    const comingUpEnd = startTimestamp + 4 * DAY_MS - 1; // End of 3rd day after today

    // Calculate upcoming follow-ups end (7 days from now)
    const upcomingEnd = startTimestamp + 8 * DAY_MS - 1;

    // ========================================================================
    // Fetch all required data in parallel
    // ========================================================================

    // Get today's sessions
    const todaySessions = await ctx.db
      .query("advisor_sessions")
      .withIndex("by_advisor", (q) =>
        q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("start_at"), startTimestamp),
          q.lte(q.field("start_at"), endTimestamp)
        )
      )
      .collect();

    // Get coming up sessions (next 3 days)
    const comingUpSessions = await ctx.db
      .query("advisor_sessions")
      .withIndex("by_advisor", (q) =>
        q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("start_at"), tomorrowStart),
          q.lte(q.field("start_at"), comingUpEnd)
        )
      )
      .collect();

    // Get sessions from last 3 days that may need documentation
    const pastSessionsStart = startTimestamp - 3 * DAY_MS;
    const pastSessions = await ctx.db
      .query("advisor_sessions")
      .withIndex("by_advisor", (q) =>
        q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId)
      )
      .filter((q) =>
        q.and(
          q.gte(q.field("start_at"), pastSessionsStart),
          q.lt(q.field("start_at"), startTimestamp),
          q.eq(q.field("status"), "completed")
        )
      )
      .collect();

    // Sessions missing notes (completed but no notes)
    const undocumentedSessions = pastSessions.filter(
      (s) => !s.notes || s.notes.trim() === ""
    );

    // Get all follow-ups (overdue + today + upcoming 7 days)
    const allFollowUps = await ctx.db
      .query("follow_ups")
      .withIndex("by_university", (q) => q.eq("university_id", universityId))
      .filter((q) =>
        q.and(
          q.eq(q.field("created_by_id"), sessionCtx.userId),
          q.eq(q.field("created_by_type"), "advisor"),
          q.lte(q.field("due_at"), upcomingEnd),
          q.eq(q.field("status"), "open")
        )
      )
      .collect();

    // Group follow-ups
    const overdueFollowUps = allFollowUps.filter(
      (f) => f.due_at && f.due_at < startTimestamp
    );
    const todayFollowUps = allFollowUps.filter(
      (f) => f.due_at && f.due_at >= startTimestamp && f.due_at <= endTimestamp
    );
    const upcomingFollowUps = allFollowUps.filter(
      (f) => f.due_at && f.due_at > endTimestamp
    );

    // ========================================================================
    // Batch fetch student data to avoid N+1 queries
    // ========================================================================

    // Collect all unique student IDs for basic info (name, email)
    const allStudentIds = new Set<Id<"users">>([
      ...todaySessions.map((s) => s.student_id),
      ...comingUpSessions.map((s) => s.student_id),
      ...undocumentedSessions.map((s) => s.student_id),
      ...allFollowUps.map((f) => f.user_id),
    ]);

    // Only fetch expensive context (session history, resumes, applications) for students
    // who appear in sessions that will display context - today's and coming up sessions
    // This significantly reduces queries for advisors with many follow-ups
    const studentsNeedingContext = new Set<Id<"users">>([
      ...todaySessions.map((s) => s.student_id),
      ...comingUpSessions.map((s) => s.student_id),
    ]);

    // Batch fetch students (all need basic info)
    const students = await Promise.all(
      Array.from(allStudentIds).map((id) => ctx.db.get(id))
    );

    const studentMap = new Map(
      students
        .filter((student): student is NonNullable<typeof student> => student !== null)
        .map((student) => [student._id, student])
    );

    // Batch fetch session history ONLY for students with sessions (not all follow-up students)
    const sessionHistoryByStudent = new Map<Id<"users">, typeof todaySessions>();
    await Promise.all(
      Array.from(studentsNeedingContext).map(async (studentId) => {
        const history = await ctx.db
          .query("advisor_sessions")
          .withIndex("by_student", (q) =>
            q.eq("student_id", studentId).eq("university_id", universityId)
          )
          .filter((q) => q.eq(q.field("advisor_id"), sessionCtx.userId))
          .collect();
        sessionHistoryByStudent.set(studentId, history);
      })
    );

    // Batch fetch resume counts ONLY for students with sessions
    const resumeCountByStudent = new Map<Id<"users">, number>();
    await Promise.all(
      Array.from(studentsNeedingContext).map(async (studentId) => {
        const resumes = await ctx.db
          .query("resumes")
          .withIndex("by_user", (q) => q.eq("user_id", studentId))
          .collect();
        resumeCountByStudent.set(studentId, resumes.length);
      })
    );

    // Batch fetch applications ONLY for students with sessions
    const applicationsByStudent = new Map<Id<"users">, { stage?: string; updated_at?: number }[]>();
    await Promise.all(
      Array.from(studentsNeedingContext).map(async (studentId) => {
        const apps = await ctx.db
          .query("applications")
          .withIndex("by_user", (q) => q.eq("user_id", studentId))
          .collect();
        applicationsByStudent.set(
          studentId,
          apps.map((a) => ({ stage: a.stage, updated_at: a.updated_at }))
        );
      })
    );

    // ========================================================================
    // Build student context enrichment
    // ========================================================================

    function getStudentContext(studentId: Id<"users">): StudentContext {
      const student = studentMap.get(studentId);
      const sessionHistory = sessionHistoryByStudent.get(studentId) || [];
      const resumes = resumeCountByStudent.get(studentId) || 0;
      const applications = applicationsByStudent.get(studentId) || [];

      // Find most recent completed session before today
      const pastCompletedSessions = sessionHistory
        .filter((s) => s.status === "completed" && s.start_at < startTimestamp)
        .sort((a, b) => b.start_at - a.start_at);

      return {
        isFirstSession: sessionHistory.length <= 1, // Current session is first or only
        totalSessions: sessionHistory.length,
        lastSessionDate: pastCompletedSessions[0]?.start_at,
        resumeCount: resumes,
        applicationCount: applications.length,
        riskTags: calculateRiskTags(student?.last_login_at, applications, now),
      };
    }

    // ========================================================================
    // Enrich and format data
    // ========================================================================

    // Enrich today's sessions with student context
    const enrichedTodaySessions = todaySessions.map((session) => {
      const student = studentMap.get(session.student_id);
      const context = getStudentContext(session.student_id);
      return {
        _id: session._id,
        student_id: session.student_id,
        student_name: student?.name || "Unknown",
        student_email: student?.email || "",
        title: session.title,
        session_type: session.session_type,
        start_at: session.start_at,
        end_at: session.end_at,
        duration_minutes: session.duration_minutes,
        notes: session.notes,
        visibility: session.visibility,
        status: session.status,
        meeting_url: session.meeting_url,
        // Student context
        studentContext: context,
      };
    });

    // Enrich undocumented sessions
    const enrichedUndocumented = undocumentedSessions.map((session) => {
      const student = studentMap.get(session.student_id);
      return {
        _id: session._id,
        student_id: session.student_id,
        student_name: student?.name || "Unknown",
        title: session.title,
        session_type: session.session_type,
        start_at: session.start_at,
        status: session.status,
      };
    });

    // Helper to enrich follow-ups
    function enrichFollowUp(followUp: typeof allFollowUps[0]) {
      const student = studentMap.get(followUp.user_id);
      return {
        _id: followUp._id,
        student_id: followUp.user_id,
        student_name: student?.name || "Unknown",
        title: followUp.title,
        description: followUp.description,
        due_at: followUp.due_at,
        priority: followUp.priority,
        status: followUp.status,
        related_type: followUp.related_type,
      };
    }

    // Group coming up sessions by day
    const comingUpByDay: { date: number; dayLabel: string; sessions: typeof enrichedTodaySessions }[] = [];

    // Create day buckets
    for (let i = 1; i <= 3; i++) {
      const dayStart = startTimestamp + i * DAY_MS;
      const dayEnd = dayStart + DAY_MS - 1;
      const dayDate = new Date(dayStart - tzOffsetMs);
      const dayLabel = dayDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

      const daySessions = comingUpSessions
        .filter((s) => s.start_at >= dayStart && s.start_at <= dayEnd)
        .map((session) => {
          const student = studentMap.get(session.student_id);
          return {
            _id: session._id,
            student_id: session.student_id,
            student_name: student?.name || "Unknown",
            student_email: student?.email || "",
            title: session.title,
            session_type: session.session_type,
            start_at: session.start_at,
            end_at: session.end_at,
            duration_minutes: session.duration_minutes,
            notes: session.notes,
            visibility: session.visibility,
            status: session.status,
            meeting_url: session.meeting_url,
            studentContext: getStudentContext(session.student_id),
          };
        });

      comingUpByDay.push({
        date: dayStart,
        dayLabel,
        sessions: daySessions,
      });
    }

    // Calculate stats
    const completedSessions = todaySessions.filter((s) => s.status === "completed").length;
    const upcomingSessions = todaySessions.filter((s) => s.start_at > now).length;

    return {
      sessions: enrichedTodaySessions.sort((a, b) => a.start_at - b.start_at),
      followUps: {
        overdue: overdueFollowUps.map(enrichFollowUp).sort((a, b) => (a.due_at || 0) - (b.due_at || 0)),
        today: todayFollowUps.map(enrichFollowUp).sort((a, b) => (a.due_at || 0) - (b.due_at || 0)),
        upcoming: upcomingFollowUps.map(enrichFollowUp).sort((a, b) => (a.due_at || 0) - (b.due_at || 0)),
      },
      comingUp: comingUpByDay,
      documentation: enrichedUndocumented.sort((a, b) => b.start_at - a.start_at),
      stats: {
        totalSessions: todaySessions.length,
        completedSessions,
        upcomingSessions,
        overdueFollowUps: overdueFollowUps.length,
      },
    };
  },
});
