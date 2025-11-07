/**
 * Advisor Follow-ups Mutations
 *
 * Manages follow-up tasks for advisors:
 * - Complete follow-ups
 * - Update follow-up status
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  getCurrentUser,
  requireAdvisorRole,
  requireTenant,
  assertCanAccessStudent,
  createAuditLog,
} from "./advisor_auth";

/**
 * Mark follow-up as complete
 */
export const completeFollowUp = mutation({
  args: {
    clerkId: v.string(),
    followUpId: v.id("advisor_follow_ups"),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const followUp = await ctx.db.get(args.followUpId);
    if (!followUp) {
      throw new Error("Follow-up not found");
    }

    // Verify tenant isolation
    if (followUp.university_id !== universityId) {
      throw new Error("Unauthorized: Follow-up belongs to different university");
    }

    // Verify advisor can access this student
    await assertCanAccessStudent(ctx, sessionCtx, followUp.student_id);

    // Verify advisor is the owner or has permission
    if (
      followUp.advisor_id !== sessionCtx.userId &&
      sessionCtx.role !== "university_admin" &&
      sessionCtx.role !== "super_admin"
    ) {
      throw new Error("Unauthorized: Not the assigned advisor for this follow-up");
    }

    const now = Date.now();

    await ctx.db.patch(args.followUpId, {
      status: "done",
      completed_at: now,
      completed_by: sessionCtx.userId,
    });

    // Audit log
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: followUp.university_id,
      action: "follow_up.completed",
      entityType: "advisor_follow_up",
      entityId: args.followUpId,
      studentId: followUp.student_id,
      previousValue: { status: "open" },
      newValue: { status: "done", completed_at: now },
    });

    return { success: true };
  },
});

/**
 * Reopen a completed follow-up
 */
export const reopenFollowUp = mutation({
  args: {
    clerkId: v.string(),
    followUpId: v.id("advisor_follow_ups"),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const followUp = await ctx.db.get(args.followUpId);
    if (!followUp) {
      throw new Error("Follow-up not found");
    }

    // Verify tenant isolation
    if (followUp.university_id !== universityId) {
      throw new Error("Unauthorized: Follow-up belongs to different university");
    }

    // Verify advisor can access this student
    await assertCanAccessStudent(ctx, sessionCtx, followUp.student_id);

    // Verify advisor is the owner or has permission
    if (
      followUp.advisor_id !== sessionCtx.userId &&
      sessionCtx.role !== "university_admin" &&
      sessionCtx.role !== "super_admin"
    ) {
      throw new Error("Unauthorized: Not the assigned advisor for this follow-up");
    }

    await ctx.db.patch(args.followUpId, {
      status: "open",
      completed_at: undefined,
      completed_by: undefined,
    });

    // Audit log
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: followUp.university_id,
      action: "follow_up.reopened",
      entityType: "advisor_follow_up",
      entityId: args.followUpId,
      studentId: followUp.student_id,
      previousValue: { status: "done" },
      newValue: { status: "open" },
    });

    return { success: true };
  },
});
