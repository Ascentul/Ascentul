/**
 * Advisor Session Mutations
 *
 * Create, update, and delete advising sessions
 * Features: autosave, version control, conflict detection
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  getCurrentUser,
  requireAdvisorRole,
  requireTenant,
  assertCanAccessStudent,
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
      start_at: args.start_at,
      end_at,
      duration_minutes: args.duration_minutes,
      location: args.location || null,
      meeting_url: args.meeting_url || null,
      notes: args.notes || null,
      visibility: args.visibility || "advisor_only",
      status: "scheduled",
      version: 1,
      created_at: now,
      updated_at: now,
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
      throw new Error("Session not found");
    }

    // Verify ownership
    if (session.advisor_id !== sessionCtx.userId) {
      throw new Error("Unauthorized: Not your session");
    }

    // Verify tenant isolation
    if (session.university_id !== universityId) {
      throw new Error("Unauthorized: Session not in your university");
    }

    // Version check for conflict detection
    if (session.version !== args.version) {
      throw new Error(
        "Conflict: Session has been modified by another process. Please refresh and try again."
      );
    }

    const updates: {
      version: number;
      updated_at: number;
      title?: string;
      session_type?: "career_planning" | "resume_review" | "mock_interview" | "application_strategy" | "general_advising" | "other";
      start_at?: number;
      end_at?: number;
      duration_minutes?: number;
      location?: string;
      meeting_url?: string;
      notes?: string;
      visibility?: "shared" | "advisor_only";
      status?: "scheduled" | "completed" | "cancelled" | "no_show";
    } = {
      version: session.version + 1,
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
    }
    if (args.duration_minutes !== undefined) {
      updates.duration_minutes = args.duration_minutes;
    }

    // Recalculate end_at if either start or duration changed
    if (args.start_at !== undefined || args.duration_minutes !== undefined) {
      const start = args.start_at ?? session.start_at;
      const duration = args.duration_minutes ?? session.duration_minutes ?? 0;
      updates.end_at = start + duration * 60 * 1000;
    }

    if (args.location !== undefined) {
      updates.location = args.location || undefined;
    }
    if (args.meeting_url !== undefined) {
      updates.meeting_url = args.meeting_url || undefined;
    }
    if (args.notes !== undefined) {
      updates.notes = args.notes || undefined;
    }
    if (args.visibility !== undefined) {
      updates.visibility = args.visibility || undefined;
    }
    if (args.status !== undefined) {
      updates.status = args.status || undefined;
    }

    await ctx.db.patch(args.session_id, updates);

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
      throw new Error("Session not found");
    }

    // Verify ownership
    if (session.advisor_id !== sessionCtx.userId) {
      throw new Error("Unauthorized: Not your session");
    }

    // Verify tenant isolation
    if (session.university_id !== universityId) {
      throw new Error("Unauthorized: Session not in your university");
    }

    await ctx.db.delete(args.session_id);

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
      throw new Error("Session not found");
    }

    // Verify ownership
    if (session.advisor_id !== sessionCtx.userId) {
      throw new Error("Unauthorized: Not your session");
    }

    // Verify tenant isolation
    if (session.university_id !== universityId) {
      throw new Error("Unauthorized: Session not in your university");
    }

    await ctx.db.patch(args.session_id, {
      status: "cancelled",
      notes: args.reason
        ? `${session.notes || ""}\n\nCancellation reason: ${args.reason}`
        : session.notes,
      version: session.version + 1,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});
