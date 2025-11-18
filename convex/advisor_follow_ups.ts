/**
 * Advisor Follow-ups Mutations
 *
 * ⚠️ DEPRECATED: This file uses the legacy advisor_follow_ups table.
 * NEW CODE: Use convex/followups.ts with the unified follow_ups table instead.
 * MIGRATION: See convex/migrate_follow_ups.ts for data migration.
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

    // RACE CONDITION MITIGATION: Make this operation idempotent
    // If already completed, return success without error (concurrent completion is acceptable)
    // This prevents errors when multiple users complete the same follow-up simultaneously
    if (followUp.status === "done") {
      // Already completed - return existing completion data (idempotent)
      return {
        success: true,
        followUpId: args.followUpId,
        alreadyCompleted: true,
        completed_at: followUp.completed_at,
        completed_by: followUp.completed_by,
      };
    }

    const now = Date.now();

    // CONCURRENCY NOTE: There's still a race window between the status check above
    // and this patch. If two requests execute concurrently, both might pass the check.
    // However, the operation is idempotent - the final state will be consistent,
    // and we accept that one request's completed_by might overwrite the other.
    // For critical audit requirements, consider adding a version field to the schema.
    await ctx.db.patch(args.followUpId, {
      status: "done",
      completed_at: now,
      completed_by: sessionCtx.userId,
    });

    // Audit log (FERPA compliance - capture all modified fields)
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: followUp.university_id,
      action: "follow_up.completed",
      entityType: "advisor_follow_up",
      entityId: args.followUpId,
      studentId: followUp.student_id,
      previousValue: {
        status: followUp.status,
        completed_at: followUp.completed_at,
        completed_by: followUp.completed_by,
      },
      newValue: {
        status: "done",
        completed_at: now,
        completed_by: sessionCtx.userId,
      },
      ipAddress: "server",
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

    // RACE CONDITION MITIGATION: Make this operation idempotent
    // If already open, return success without error (concurrent reopen is acceptable)
    if (followUp.status !== "done") {
      // Already reopened - return success (idempotent)
      return {
        success: true,
        followUpId: args.followUpId,
        alreadyOpen: true,
      };
    }

    // CONCURRENCY NOTE: Similar race window exists between status check and patch
    // See completeFollowUp for detailed explanation. The operation is idempotent.
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
      previousValue: {
        status: followUp.status,
        completed_at: followUp.completed_at,
        completed_by: followUp.completed_by,
      },
      newValue: {
        status: "open",
        completed_at: undefined,
        completed_by: undefined,
      },
      ipAddress: "server",
    });

    return { success: true };
  },
});
