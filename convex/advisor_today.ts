/**
 * Advisor Today View Queries
 *
 * Provides data for the daily advisor dashboard:
 * - Today's sessions
 * - Follow-ups due today
 * - Quick stats for the day
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
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
    // timezoneOffset is in minutes and is negative for timezones ahead of UTC
    const tzOffsetMs = (args.timezoneOffset ?? 0) * 60 * 1000;
    const userNow = new Date(now - tzOffsetMs);

    // Get start and end of day in user's timezone
    const startOfDay = new Date(userNow);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(userNow);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Convert back to UTC timestamps for database queries
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
    // TODO: Migrate to follow_ups table (see convex/migrate_follow_ups.ts)
    const followUps = await ctx.db
      .query("advisor_follow_ups") // DEPRECATED: Use follow_ups table instead
      .withIndex("by_advisor", (q) =>
        q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId),
      )
      .filter((q) =>
        q.and(
          q.lte(q.field("due_at"), endTimestamp),
          q.eq(q.field("status"), "open"),
        ),
      )
      .collect();

    // Filter follow-ups to only those due today or overdue
    const todayFollowUps = followUps.filter(
      (f) => f.due_at && f.due_at <= endTimestamp,
    );

    // Batch fetch all unique students to avoid N+1 queries
    const studentIds = new Set([
      ...sessions.map((s) => s.student_id),
      ...todayFollowUps.map((f) => f.student_id),
    ]);

    const students = await Promise.all(
      Array.from(studentIds).map((id) => ctx.db.get(id))
    );

    const studentMap = new Map(
      students.map((student) => [student?._id, student])
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
      };
    });

    // Enrich follow-ups with student data from map
    const enrichedFollowUps = todayFollowUps.map((followUp) => {
      const student = studentMap.get(followUp.student_id);
      return {
        _id: followUp._id,
        student_id: followUp.student_id,
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
      (s) => s.end_at && s.end_at < now,
    ).length;
    const upcomingSessions = sessions.filter((s) => s.start_at > now).length;
    const overdueFollowUps = todayFollowUps.filter(
      (f) => f.due_at && f.due_at < now,
    ).length;

    return {
      sessions: enrichedSessions.sort((a, b) => a.start_at - b.start_at),
      // Sort by due_at (no null check needed - filter ensures due_at exists)
      followUps: enrichedFollowUps.sort((a, b) => a.due_at! - b.due_at!),
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
