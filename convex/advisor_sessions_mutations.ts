/**
 * Advisor Session Mutations
 *
 * Create, update, and delete advising sessions
 * Features: autosave, version control, conflict detection
 */

import { mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import {
  getCurrentUser,
  requireAdvisorRole,
  requireTenant,
  assertCanAccessStudent,
  createAuditLog,
} from "./advisor_auth";

/**
 * Valid session types
 */
const sessionTypeValidator = v.union(
  v.literal("career_planning"),
  v.literal("resume_review"),
  v.literal("mock_interview"),
  v.literal("application_strategy"),
  v.literal("general_advising"),
  v.literal("other")
);

/**
 * Valid session statuses
 */
const sessionStatusValidator = v.union(
  v.literal("scheduled"),
  v.literal("completed"),
  v.literal("cancelled"),
  v.literal("no_show")
);

/**
 * Valid visibility options
 */
const visibilityValidator = v.union(
  v.literal("shared"),
  v.literal("advisor_only")
);

/**
 * Create a new advising session
 */
export const createSession = mutation({
  args: {
    clerkId: v.string(),
    student_id: v.id("users"),
    title: v.string(),
    session_type: sessionTypeValidator,
    start_at: v.number(),
    duration_minutes: v.number(),
    location: v.optional(v.string()),
    meeting_url: v.optional(v.string()),
    notes: v.optional(v.string()),
    visibility: v.optional(visibilityValidator),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Validate timing fields
    if (args.start_at <= 0) {
      throw new ConvexError("start_at must be a valid timestamp", { code: "VALIDATION_ERROR" });
    }
    if (args.duration_minutes <= 0 || args.duration_minutes > 1440) {
      throw new ConvexError("duration_minutes must be between 1 and 1440 (24 hours)", {
        code: "VALIDATION_ERROR",
      });
    }

    // Verify advisor can access this student
    await assertCanAccessStudent(ctx, sessionCtx, args.student_id);

    const now = Date.now();
    const end_at = args.start_at + args.duration_minutes * 60 * 1000;

    const sessionId = await ctx.db.insert("advisor_sessions", {
      advisor_id: sessionCtx.userId,
      student_id: args.student_id,
      university_id: universityId,
      title: args.title,
      session_type: args.session_type,
      scheduled_at: args.start_at, // Always set for date-range query consistency
      start_at: args.start_at,
      end_at,
      duration_minutes: args.duration_minutes,
      location: args.location,
      meeting_url: args.meeting_url,
      notes: args.notes,
      visibility: args.visibility || "advisor_only",
      status: "scheduled",
      version: 1,
      created_at: now,
      updated_at: now,
    });

    // Audit log for FERPA compliance
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: "session.created",
      entityType: "advisor_session",
      entityId: sessionId,
      studentId: args.student_id,
      newValue: {
        title: args.title,
        session_type: args.session_type,
        start_at: args.start_at,
        duration_minutes: args.duration_minutes,
        visibility: args.visibility || "advisor_only",
      },
      ipAddress: "server",
    });

    return sessionId;
  },
});

/**
 * Update an existing session (with version control)
 */
export const updateSession = mutation({
  args: {
    clerkId: v.string(),
    session_id: v.id("advisor_sessions"),
    title: v.optional(v.string()),
    session_type: v.optional(sessionTypeValidator),
    start_at: v.optional(v.number()),
    duration_minutes: v.optional(v.number()),
    location: v.optional(v.string()),
    meeting_url: v.optional(v.string()),
    notes: v.optional(v.string()),
    visibility: v.optional(visibilityValidator),
    status: v.optional(sessionStatusValidator),
    version: v.number(), // For conflict detection
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const session = await ctx.db.get(args.session_id);
    if (!session) {
      throw new ConvexError("Session not found", { code: "NOT_FOUND" });
    }

    // Verify ownership
    if (session.advisor_id !== sessionCtx.userId) {
      throw new ConvexError("Unauthorized: Not your session", { code: "UNAUTHORIZED" });
    }

    // Verify tenant isolation
    if (session.university_id !== universityId) {
      throw new ConvexError("Unauthorized: Session not in your university", { code: "UNAUTHORIZED" });
    }

    // Version check for conflict detection
    if ((session.version ?? 0) !== args.version) {
      throw new ConvexError(
        "Conflict: Session has been modified by another process. Please refresh and try again.",
        { code: "VERSION_CONFLICT" },
      );
    }

    // Validate timing fields if provided
    if (args.start_at !== undefined && args.start_at <= 0) {
      throw new ConvexError("start_at must be a valid timestamp", { code: "VALIDATION_ERROR" });
    }
    if (args.duration_minutes !== undefined && (args.duration_minutes <= 0 || args.duration_minutes > 1440)) {
      throw new ConvexError("duration_minutes must be between 1 and 1440 (24 hours)", { code: "VALIDATION_ERROR" });
    }

    const updates: {
      version: number;
      updated_at: number;
      title?: string;
      session_type?: "career_planning" | "resume_review" | "mock_interview" | "application_strategy" | "general_advising" | "other";
      scheduled_at?: number;
      start_at?: number;
      end_at?: number;
      duration_minutes?: number;
      location?: string;
      meeting_url?: string;
      notes?: string;
      visibility?: "shared" | "advisor_only";
      status?: "scheduled" | "completed" | "cancelled" | "no_show";
    } = {
      version: (session.version ?? 0) + 1,
      updated_at: Date.now(),
    };

    // Only update provided fields
    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.session_type !== undefined) {
      updates.session_type = args.session_type;
    }
    if (args.start_at !== undefined) {
      updates.start_at = args.start_at;
      // Keep scheduled_at in sync with start_at for query consistency
      updates.scheduled_at = args.start_at;
    }
    if (args.duration_minutes !== undefined) {
      updates.duration_minutes = args.duration_minutes;
    }

    // Recalculate end_at if either start or duration changed
    if (args.start_at !== undefined || args.duration_minutes !== undefined) {
      const start = args.start_at ?? session.start_at;
      // Default to 60 minutes if duration_minutes is missing from both args and existing session
      const DEFAULT_DURATION_MINUTES = 60;
      const duration = args.duration_minutes ?? session.duration_minutes ?? DEFAULT_DURATION_MINUTES;
      if (!start || start <= 0) {
        throw new ConvexError("Cannot calculate end_at: start_at is missing or invalid", {
          code: "VALIDATION_ERROR",
        });
      }
      updates.end_at = start + duration * 60 * 1000;
      // Persist the default duration if it was missing from the session
      if (!session.duration_minutes && !args.duration_minutes) {
        updates.duration_minutes = DEFAULT_DURATION_MINUTES;
      }
    }

    if (args.location !== undefined) {
      updates.location = args.location;
    }
    if (args.meeting_url !== undefined) {
      updates.meeting_url = args.meeting_url;
    }
    if (args.notes !== undefined) {
      updates.notes = args.notes;
    }
    if (args.visibility !== undefined) {
      updates.visibility = args.visibility;
    }
    if (args.status !== undefined) {
      updates.status = args.status;

      // Validate status consistency with timing fields
      if (args.status === "completed") {
        // Ensure end_at is set for completed sessions
        const endAt = updates.end_at ?? session.end_at;
        if (!endAt) {
          throw new ConvexError("Cannot mark session as completed: end_at must be set", {
            code: "VALIDATION_ERROR",
          });
        }
      }

      if (args.status === "scheduled") {
        // Ensure start_at is set for scheduled sessions
        const startAt = updates.start_at ?? session.start_at;
        if (!startAt) {
          throw new ConvexError("Cannot mark session as scheduled: start_at must be set", {
            code: "VALIDATION_ERROR",
          });
        }
      }
    }

    await ctx.db.patch(args.session_id, updates);

    // Audit log for FERPA compliance - track what changed
    const changedFields: Record<string, any> = {};
    if (args.title !== undefined) changedFields.title = args.title;
    if (args.session_type !== undefined) changedFields.session_type = args.session_type;
    if (args.start_at !== undefined) changedFields.start_at = args.start_at;
    if (args.duration_minutes !== undefined) changedFields.duration_minutes = args.duration_minutes;
    if (args.location !== undefined) changedFields.location = args.location;
    if (args.meeting_url !== undefined) changedFields.meeting_url = args.meeting_url;
    if (args.notes !== undefined) changedFields.notes = args.notes;
    if (args.visibility !== undefined) changedFields.visibility = args.visibility;
    if (args.status !== undefined) changedFields.status = args.status;

    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: "session.updated",
      entityType: "advisor_session",
      entityId: args.session_id,
      studentId: session.student_id,
      previousValue: {
        version: session.version,
        ...(args.title !== undefined && { title: session.title }),
        ...(args.session_type !== undefined && { session_type: session.session_type }),
        ...(args.start_at !== undefined && { start_at: session.start_at }),
        ...(args.duration_minutes !== undefined && { duration_minutes: session.duration_minutes }),
        ...(args.location !== undefined && { location: session.location }),
        ...(args.meeting_url !== undefined && { meeting_url: session.meeting_url }),
        ...(args.notes !== undefined && { notes: session.notes }),
        ...(args.visibility !== undefined && { visibility: session.visibility }),
        ...(args.status !== undefined && { status: session.status }),
      },
      newValue: {
        ...changedFields,
        version: updates.version,
      },
      ipAddress: "server",
    });

    return { success: true, version: updates.version };
  },
});

/**
 * Delete a session
 */
export const deleteSession = mutation({
  args: {
    clerkId: v.string(),
    session_id: v.id("advisor_sessions"),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const session = await ctx.db.get(args.session_id);
    if (!session) {
      throw new ConvexError("Session not found", { code: "NOT_FOUND" });
    }

    // Verify ownership
    if (session.advisor_id !== sessionCtx.userId) {
      throw new ConvexError("Unauthorized: Not your session", { code: "UNAUTHORIZED" });
    }

    // Verify tenant isolation
    if (session.university_id !== universityId) {
      throw new ConvexError("Unauthorized: Session not in your university", { code: "UNAUTHORIZED" });
    }

    await ctx.db.delete(args.session_id);

    // Audit log for FERPA compliance
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: "session.deleted",
      entityType: "advisor_session",
      entityId: args.session_id,
      studentId: session.student_id,
      previousValue: {
        title: session.title,
        session_type: session.session_type,
        status: session.status,
      },
      ipAddress: "server",
    });

    return { success: true };
  },
});

/**
 * Cancel a session (soft delete - sets status to cancelled)
 */
export const cancelSession = mutation({
  args: {
    clerkId: v.string(),
    session_id: v.id("advisor_sessions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const session = await ctx.db.get(args.session_id);
    if (!session) {
      throw new ConvexError("Session not found", { code: "NOT_FOUND" });
    }

    // Verify ownership
    if (session.advisor_id !== sessionCtx.userId) {
      throw new ConvexError("Unauthorized: Not your session", { code: "UNAUTHORIZED" });
    }

    // Verify tenant isolation
    if (session.university_id !== universityId) {
      throw new ConvexError("Unauthorized: Session not in your university", { code: "UNAUTHORIZED" });
    }

    // Only allow cancelling scheduled sessions
    if (session.status !== "scheduled") {
      throw new ConvexError(`Cannot cancel session with status: ${session.status}`, {
        code: "VALIDATION_ERROR",
      });
    }

    await ctx.db.patch(args.session_id, {
      status: "cancelled",
      notes: args.reason
        ? `${session.notes || ""}\n\nCancellation reason: ${args.reason}`
        : session.notes,
      version: (session.version ?? 0) + 1,
      updated_at: Date.now(),
    });

    // Audit log for FERPA compliance
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: "session.cancelled",
      entityType: "advisor_session",
      entityId: args.session_id,
      studentId: session.student_id,
      previousValue: {
        status: session.status,
      },
      newValue: {
        status: "cancelled",
        reason: args.reason,
      },
      ipAddress: "server",
    });

    return { success: true };
  },
});
