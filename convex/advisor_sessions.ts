/**
 * Advisor Sessions Management
 *
 * Queries and mutations for advisor session/appointment tracking:
 * - Create/update/delete sessions
 * - Session notes with privacy controls
 * - Task assignment during sessions
 * - Autosave support with version conflict detection
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  getCurrentUser,
  requireTenant,
  requireAdvisorRole,
  assertCanAccessStudent,
  canViewPrivateContent,
  createAuditLog,
} from "./advisor_auth";

/**
 * Get a single session by ID
 */
export const getSessionById = query({
  args: {
    clerkId: v.string(),
    sessionId: v.id("advisor_sessions"),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Verify tenant isolation
    if (session.university_id !== universityId) {
      throw new Error("Unauthorized: Session not in your university");
    }

    // Verify advisor can access this student
    await assertCanAccessStudent(ctx, sessionCtx, session.student_id);

    // Enrich with student data
    const student = await ctx.db.get(session.student_id);

    return {
      ...session,
      student_name: student?.name || "Unknown",
      student_email: student?.email || "",
    };
  },
});

/**
 * Get all sessions for advisor (optionally filtered by student and date range)
 *
 * Performance notes:
 * - Uses by_advisor_scheduled index for efficient startDate filtering
 * - LIMITATION: endDate is applied as in-memory filter after database query
 *   - Convex indexes only support range queries on the last field in the index
 *   - Index supports: advisor_id (exact) + scheduled_at (>=)
 *   - Cannot add scheduled_at (<=) to same index query
 *   - If querying large date ranges (e.g., all future sessions), many records
 *     will be fetched and then filtered in memory
 *
 * Optimization recommendations:
 * 1. Keep date ranges narrow (e.g., 1 month) to minimize in-memory filtering
 * 2. For calendar views, query only visible time period (week/month)
 * 3. Consider pagination for large result sets
 * 4. Alternative: Add status-based filtering if typical queries are
 *    "scheduled sessions" or "completed sessions" to reduce dataset size
 */
export const getSessions = query({
  args: {
    clerkId: v.string(),
    studentId: v.optional(v.id('users')),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    let sessions;

    if (args.studentId) {
      // Verify access to specific student
      await assertCanAccessStudent(ctx, sessionCtx, args.studentId);

      // Use student-specific index for optimal performance
      const studentId = args.studentId; // Capture for type narrowing
      sessions = await ctx.db
        .query('advisor_sessions')
        .withIndex('by_advisor_student', (q) =>
          q.eq('advisor_id', sessionCtx.userId)
           .eq('student_id', studentId)
           .eq('university_id', universityId)
        )
        .collect();
    } else if (args.startDate) {
      // Use scheduled index for efficient >= filtering on startDate
      // NOTE: This fetches ALL sessions >= startDate, then filters by endDate in memory
      sessions = await ctx.db
        .query('advisor_sessions')
        .withIndex('by_advisor_scheduled', (q) =>
          q.eq('advisor_id', sessionCtx.userId)
           .gte('scheduled_at', args.startDate)
        )
        .filter((q) => q.eq(q.field('university_id'), universityId))
        .collect();
    } else {
      // Default: fetch all advisor sessions
      sessions = await ctx.db
        .query('advisor_sessions')
        .withIndex('by_advisor', (q) =>
          q.eq('advisor_id', sessionCtx.userId).eq('university_id', universityId)
        )
        .collect();
    }

    // PERFORMANCE WARNING: In-memory filtering for endDate
    // If many sessions exist between startDate and far future, this could be slow
    // Recommendation: Keep date ranges narrow in client code
    if (args.endDate !== undefined) {
      const endDate = args.endDate; // Capture for type narrowing
      sessions = sessions.filter((s) => {
        // Note: scheduled_at should always be set after migration
        // Fallback to start_at for backward compatibility with old data
        const sessionDate = s.scheduled_at ?? s.start_at;
        return sessionDate <= endDate;
      });
    }

    return sessions;
  },
});

/**
 * Get sessions happening today for advisor
 *
 * @param clientTimezoneOffset - Client's timezone offset in minutes from UTC
 *   (e.g., -300 for EST/UTC-5, 540 for JST/UTC+9). If not provided, uses server time.
 */
export const getTodaySessions = query({
  args: {
    clerkId: v.string(),
    clientTimezoneOffset: v.optional(v.number()), // Minutes offset from UTC
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Calculate today's boundaries in client's timezone
    // If no offset provided, fall back to server time (legacy behavior)
    const now = Date.now();
    const offsetMs = (args.clientTimezoneOffset ?? 0) * 60 * 1000;
    // Adjust current time to client's local time for day boundary calculation
    // clientTimezoneOffset matches Date.getTimezoneOffset(): positive west of UTC (e.g., 300 for EST/UTC-5)
    // To get local time: UTC - offset
    const clientLocalTime = new Date(now - offsetMs);
    const startOfDayLocal = new Date(
      clientLocalTime.getFullYear(),
      clientLocalTime.getMonth(),
      clientLocalTime.getDate(),
    ).getTime();
    // Convert back to UTC for database comparison
    const startOfDay = startOfDayLocal + offsetMs;
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    // Use collect() to return all sessions for the day (typically < 20 for most advisors)
    const sessions = await ctx.db
      .query("advisor_sessions")
      .withIndex("by_advisor_scheduled", (q) =>
        q.eq("advisor_id", sessionCtx.userId).gte("scheduled_at", startOfDay),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("university_id"), universityId),
          q.lt(q.field("scheduled_at"), endOfDay),
        ),
      )
      .collect();

    return sessions;
  },
});

/**
 * Create new advisor session
 */
export const createSession = mutation({
  args: {
    clerkId: v.string(),
    studentId: v.id("users"),
    title: v.string(),
    scheduledAt: v.optional(v.number()),
    startAt: v.number(),
    endAt: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    sessionType: v.optional(
      v.union(
        v.literal("career_planning"),
        v.literal("resume_review"),
        v.literal("mock_interview"),
        v.literal("application_strategy"),
        v.literal("general_advising"),
        v.literal("other"),
      ),
    ),
    templateId: v.optional(v.string()),
    outcomes: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    visibility: v.union(v.literal("shared"), v.literal("advisor_only")),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Validate timing fields
    if (args.startAt <= 0) {
      throw new Error("startAt must be a valid timestamp");
    }
    if (args.durationMinutes !== undefined && (args.durationMinutes <= 0 || args.durationMinutes > 1440)) {
      throw new Error("durationMinutes must be between 1 and 1440 (24 hours)");
    }

    // Verify access to student
    await assertCanAccessStudent(ctx, sessionCtx, args.studentId);

    const now = Date.now();

    const sessionId = await ctx.db.insert("advisor_sessions", {
      student_id: args.studentId,
      advisor_id: sessionCtx.userId,
      university_id: universityId,
      title: args.title,
      scheduled_at: args.scheduledAt ?? args.startAt, // Fallback to startAt for query consistency
      start_at: args.startAt,
      end_at: args.endAt,
      duration_minutes: args.durationMinutes,
      session_type: args.sessionType,
      template_id: args.templateId,
      outcomes: args.outcomes,
      notes: args.notes,
      visibility: args.visibility,
      tasks: [],
      attachments: [],
      version: 1,
      created_at: now,
      updated_at: now,
    });

    // Audit log
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: "session.created",
      entityType: "advisor_session",
      entityId: sessionId,
      studentId: args.studentId,
      newValue: { title: args.title, visibility: args.visibility },
      ipAddress: "server",
    });

    return sessionId;
  },
});

/**
 * Update existing session (with version conflict detection)
 */
export const updateSession = mutation({
  args: {
    clerkId: v.string(),
    sessionId: v.id("advisor_sessions"),
    updates: v.object({
      title: v.optional(v.string()),
      scheduledAt: v.optional(v.number()),
      endAt: v.optional(v.number()),
      durationMinutes: v.optional(v.number()),
      sessionType: v.optional(
        v.union(
          v.literal("career_planning"),
          v.literal("resume_review"),
          v.literal("mock_interview"),
          v.literal("application_strategy"),
          v.literal("general_advising"),
          v.literal("other"),
        ),
      ),
      outcomes: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
      visibility: v.optional(
        v.union(v.literal("shared"), v.literal("advisor_only")),
      ),
      tasks: v.optional(
        v.array(
          v.object({
            id: v.string(),
            title: v.string(),
            due_at: v.optional(v.number()),
            owner: v.union(v.literal("student"), v.literal("advisor")),
            status: v.union(v.literal("open"), v.literal("done")),
          }),
        ),
      ),
    }),
    expectedVersion: v.optional(v.number()), // For optimistic concurrency control
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Verify tenant isolation
    const universityId = requireTenant(sessionCtx);
    if (session.university_id !== universityId) {
      throw new Error("Unauthorized: Session not in your university");
    }

    // Verify access to student
    await assertCanAccessStudent(ctx, sessionCtx, session.student_id);

    // Note: Intentionally allows any advisor with student access to update sessions,
    // enabling collaborative advising. Only completeSession enforces strict ownership.

    // Version conflict check
    if (
      args.expectedVersion !== undefined &&
      session.version !== args.expectedVersion
    ) {
      throw new Error(
        "Version conflict: Session was modified by another user. Please refresh and try again.",
      );
    }

    // Validate timing fields
    if (args.updates.durationMinutes !== undefined && (args.updates.durationMinutes <= 0 || args.updates.durationMinutes > 1440)) {
      throw new Error("durationMinutes must be between 1 and 1440 (24 hours)");
    }

    const previousVisibility = session.visibility;
    const newVersion = (session.version || 1) + 1;

    // Transform camelCase args to snake_case schema fields
    const patchData: any = {
      version: newVersion,
      updated_at: Date.now(),
    };

    if (args.updates.title !== undefined) patchData.title = args.updates.title;
    if (args.updates.scheduledAt !== undefined) patchData.scheduled_at = args.updates.scheduledAt;
    if (args.updates.endAt !== undefined) patchData.end_at = args.updates.endAt;
    if (args.updates.durationMinutes !== undefined) patchData.duration_minutes = args.updates.durationMinutes;
    if (args.updates.sessionType !== undefined) patchData.session_type = args.updates.sessionType;
    if (args.updates.outcomes !== undefined) patchData.outcomes = args.updates.outcomes;
    if (args.updates.notes !== undefined) patchData.notes = args.updates.notes;
    if (args.updates.visibility !== undefined) patchData.visibility = args.updates.visibility;
    if (args.updates.tasks !== undefined) patchData.tasks = args.updates.tasks;

    await ctx.db.patch(args.sessionId, patchData);

    // Audit log for visibility changes
    if (
      args.updates.visibility &&
      args.updates.visibility !== previousVisibility
    ) {
      await createAuditLog(ctx, {
        actorId: sessionCtx.userId,
        universityId: session.university_id,
        action: 'session.visibility_changed',
        entityType: 'advisor_session',
        entityId: args.sessionId,
        studentId: session.student_id,
        previousValue: previousVisibility,
        newValue: args.updates.visibility,
        ipAddress: "server",
      });
    }

    return { success: true, newVersion };
  },
});

/**
 * Delete session
 */
export const deleteSession = mutation({
  args: {
    clerkId: v.string(),
    sessionId: v.id("advisor_sessions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Verify tenant isolation
    const universityId = requireTenant(sessionCtx);
    if (session.university_id !== universityId) {
      throw new Error("Unauthorized: Session not in your university");
    }

    // Only session owner or admin can delete
    if (
      session.advisor_id !== sessionCtx.userId &&
      sessionCtx.role !== "super_admin" &&
      sessionCtx.role !== "university_admin"
    ) {
      throw new Error(
        "Unauthorized: Only the session creator or admin can delete it",
      );
    }

    // Audit log before deletion
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: session.university_id,
      action: "session.deleted",
      entityType: "advisor_session",
      entityId: args.sessionId,
      studentId: session.student_id,
      previousValue: { title: session.title, notes: session.notes, reason: args.reason },
      ipAddress: "server",
    });

    await ctx.db.delete(args.sessionId);

    return { success: true };
  },
});

/**
 * Add task to session
 */
export const addSessionTask = mutation({
  args: {
    clerkId: v.string(),
    sessionId: v.id("advisor_sessions"),
    task: v.object({
      id: v.string(),
      title: v.string(),
      due_at: v.optional(v.number()),
      owner: v.union(v.literal("student"), v.literal("advisor")),
      status: v.union(v.literal("open"), v.literal("done")),
    }),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Verify tenant isolation
    const universityId = requireTenant(sessionCtx);
    if (session.university_id !== universityId) {
      throw new Error("Unauthorized: Session not in your university");
    }

    await assertCanAccessStudent(ctx, sessionCtx, session.student_id);

    // Note: Unlike completeSession, this intentionally allows any advisor with
    // student access to add tasks, enabling collaborative advising workflows.
    // If strict ownership is needed, add: if (session.advisor_id !== sessionCtx.userId)

    const currentTasks = session.tasks || [];

    // Ensure task ID is unique within session
    if (currentTasks.some(t => t.id === args.task.id)) {
      throw new Error("Task ID already exists in this session");
    }

    const updatedTasks = [...currentTasks, args.task];

    await ctx.db.patch(args.sessionId, {
      tasks: updatedTasks,
      version: (session.version || 1) + 1,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Complete session (mark as done, finalize notes)
 */
export const completeSession = mutation({
  args: {
    clerkId: v.string(),
    sessionId: v.id("advisor_sessions"),
    finalNotes: v.optional(v.string()),
    outcomes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Verify tenant isolation
    const universityId = requireTenant(sessionCtx);
    if (session.university_id !== universityId) {
      throw new Error("Unauthorized: Session not in your university");
    }

    // Strict ownership check: Only the original advisor can complete their own session.
    // This differs from updateSession/addSessionTask which allow collaborative editing.
    if (session.advisor_id !== sessionCtx.userId) {
      throw new Error("Unauthorized: Only the session creator can complete it");
    }

    const now = Date.now();

    await ctx.db.patch(args.sessionId, {
      end_at: now,
      notes: args.finalNotes || session.notes,
      outcomes: args.outcomes || session.outcomes,
      version: (session.version || 1) + 1,
      updated_at: now,
    });

    // Audit log
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: session.university_id,
      action: "session.completed",
      entityType: "advisor_session",
      entityId: args.sessionId,
      studentId: session.student_id,
      newValue: { completed_at: now },
      ipAddress: "server",
    });

    return { success: true };
  },
});
