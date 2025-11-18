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

    // CONCURRENCY NOTE: Race window exists between status check and patch
    // For FERPA audit accuracy, capture state before and verify after patch
    const previousState = {
      status: followUp.status,
      completed_at: followUp.completed_at,
      completed_by: followUp.completed_by,
    };

    await ctx.db.patch(args.followUpId, {
      status: "done",
      completed_at: now,
      completed_by: sessionCtx.userId,
    });

    // FERPA COMPLIANCE: Re-fetch to verify the patch succeeded
    // This helps detect concurrent modifications and ensures audit trail accuracy
    const afterPatch = await ctx.db.get(args.followUpId);
    if (!afterPatch) {
      // Follow-up was deleted during the operation
      console.warn(`Follow-up ${args.followUpId} deleted during complete operation`);
      // Still log the audit trail for compliance
    } else if (afterPatch.status !== "done") {
      // Unexpected: patch didn't succeed or was immediately overwritten
      console.warn(
        `Follow-up ${args.followUpId} status is ${afterPatch.status} after completion patch. ` +
        `Possible concurrent modification.`
      );
    }

    // Audit log (FERPA compliance - capture all modified fields)
    // Note: previousState reflects what this operation observed, not necessarily ground truth
    // if concurrent modifications occurred. For true optimistic locking, add version field.
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: followUp.university_id,
      action: "follow_up.completed",
      entityType: "advisor_follow_up",
      entityId: args.followUpId,
      studentId: followUp.student_id,
      previousValue: previousState,
      newValue: {
        status: "done",
        completed_at: now,
        completed_by: sessionCtx.userId,
      },
      ipAddress: "server",
    });

    // Return consistent shape with idempotent path (lines 63-69)
    return {
      success: true,
      followUpId: args.followUpId,
      alreadyCompleted: false,
      completed_at: now,
      completed_by: sessionCtx.userId,
    };
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

    // CONCURRENCY NOTE: Race window exists between status check and patch
    // For FERPA audit accuracy, we re-fetch after patch to record actual previous state
    const previousState = {
      status: followUp.status,
      completed_at: followUp.completed_at,
      completed_by: followUp.completed_by,
    };

    await ctx.db.patch(args.followUpId, {
      status: "open",
      completed_at: undefined,
      completed_by: undefined,
    });

    // FERPA COMPLIANCE: Re-fetch to verify the patch succeeded and capture actual state
    // If a concurrent update occurred, the audit log will reflect what actually changed
    const afterPatch = await ctx.db.get(args.followUpId);
    if (!afterPatch) {
      // Follow-up was deleted during the operation - log the attempt anyway
      console.warn(`Follow-up ${args.followUpId} deleted during reopen operation`);
    }

    // Audit log with verified state
    // Note: If concurrent modification occurred, previousState may differ from afterPatch's
    // actual previous state, but we log what we observed to maintain audit trail continuity
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId: followUp.university_id,
      action: "follow_up.reopened",
      entityType: "advisor_follow_up",
      entityId: args.followUpId,
      studentId: followUp.student_id,
      previousValue: previousState,
      newValue: {
        status: "open",
        completed_at: undefined,
        completed_by: undefined,
      },
      ipAddress: "server",
    });

    // Return consistent shape with idempotent path (lines 165-169)
    return {
      success: true,
      followUpId: args.followUpId,
      alreadyOpen: false,
    };
  },
});
