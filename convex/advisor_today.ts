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
 */
export const getTodayOverview = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = startOfDay.getTime();
    const endTimestamp = endOfDay.getTime();

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
    const followUps = await ctx.db
      .query("advisor_follow_ups")
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

    // Enrich sessions with student data
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const student = await ctx.db.get(session.student_id);
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
      }),
    );

    // Enrich follow-ups with student data
    const enrichedFollowUps = await Promise.all(
      todayFollowUps.map(async (followUp) => {
        const student = await ctx.db.get(followUp.student_id);
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
      }),
    );

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
      followUps: enrichedFollowUps.sort((a, b) => {
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        return a.due_at - b.due_at;
      }),
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
