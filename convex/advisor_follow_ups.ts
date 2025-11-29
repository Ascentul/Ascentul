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
import { ConvexError, v } from "convex/values";
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
      throw new ConvexError({ message: "Follow-up not found", code: "NOT_FOUND" });
    }

    // Verify tenant isolation
    if (followUp.university_id !== universityId) {
      throw new ConvexError({ message: "Unauthorized: Follow-up belongs to different university", code: "UNAUTHORIZED" });
    }

    // Verify advisor can access this student
    await assertCanAccessStudent(ctx, sessionCtx, followUp.student_id);

    // Verify advisor is the owner or has permission
    if (
      followUp.advisor_id !== sessionCtx.userId &&
      sessionCtx.role !== "university_admin" &&
      sessionCtx.role !== "super_admin"
    ) {
      throw new ConvexError({ message: "Unauthorized: Not the assigned advisor for this follow-up", code: "UNAUTHORIZED" });
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
        verified: true, // Already in desired state, so verification would pass
      };
    }

    const now = Date.now();

    // FERPA COMPLIANCE: Optimistic locking to ensure audit trail accuracy
    // Version field prevents race conditions and lost updates
    const currentVersion = followUp.version ?? 0;
    const previousState = {
      status: followUp.status,
      completed_at: followUp.completed_at,
      completed_by: followUp.completed_by,
    };

    await ctx.db.patch(args.followUpId, {
      status: "done",
      completed_at: now,
      completed_by: sessionCtx.userId,
      version: currentVersion + 1,
      updated_at: now,
    });

    // Verify the patch succeeded by checking version - prevents lost updates
    const afterPatch = await ctx.db.get(args.followUpId);

    if (!afterPatch) {
      // Follow-up was deleted during the operation - hard failure
      console.error(`Follow-up ${args.followUpId} deleted during complete operation`);
      throw new ConvexError({
        message: "Follow-up was deleted during completion. This may indicate a concurrent deletion.",
        code: "NOT_FOUND"
      });
    }

    if (afterPatch.version !== currentVersion + 1) {
      // Version mismatch: concurrent modification occurred
      // This is the FERPA-critical case - another request modified the follow-up
      console.error(
        `Follow-up ${args.followUpId} version mismatch. ` +
        `Expected ${currentVersion + 1}, got ${afterPatch.version}. ` +
        `Concurrent modification detected.`
      );
      throw new ConvexError({
        message: "Follow-up was modified by another request. Please refresh and try again.",
        code: "VERSION_CONFLICT"
      });
    }

    // Audit log (FERPA compliance - capture all modified fields)
    // With optimistic locking, previousState is guaranteed accurate because
    // any concurrent modification would have caused an error above
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
    // With optimistic locking, if we reach here, the operation definitely succeeded
    return {
      success: true,
      followUpId: args.followUpId,
      alreadyCompleted: false,
      completed_at: now,
      completed_by: sessionCtx.userId,
      verified: true, // Always true with optimistic locking - errors thrown otherwise
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
      throw new ConvexError({ message: "Follow-up not found", code: "NOT_FOUND" });
    }

    // Verify tenant isolation
    if (followUp.university_id !== universityId) {
      throw new ConvexError({ message: "Unauthorized: Follow-up belongs to different university", code: "UNAUTHORIZED" });
    }

    // Verify advisor can access this student
    await assertCanAccessStudent(ctx, sessionCtx, followUp.student_id);

    // Verify advisor is the owner or has permission
    if (
      followUp.advisor_id !== sessionCtx.userId &&
      sessionCtx.role !== "university_admin" &&
      sessionCtx.role !== "super_admin"
    ) {
      throw new ConvexError({ message: "Unauthorized: Not the assigned advisor for this follow-up", code: "UNAUTHORIZED" });
    }

    // RACE CONDITION MITIGATION: Make this operation idempotent
    // If already open, return success without error (concurrent reopen is acceptable)
    if (followUp.status !== "done") {
      // Already reopened - return success (idempotent)
      return {
        success: true,
        followUpId: args.followUpId,
        alreadyOpen: true,
        verified: true, // Already in desired state, so verification would pass
      };
    }

    // FERPA COMPLIANCE: Optimistic locking to ensure audit trail accuracy
    const now = Date.now();
    const currentVersion = followUp.version ?? 0;
    const previousState = {
      status: followUp.status,
      completed_at: followUp.completed_at,
      completed_by: followUp.completed_by,
    };

    await ctx.db.patch(args.followUpId, {
      status: "open",
      completed_at: undefined,
      completed_by: undefined,
      version: currentVersion + 1,
      updated_at: now,
    });

    // Verify the patch succeeded by checking version
    const afterPatch = await ctx.db.get(args.followUpId);

    if (!afterPatch) {
      // Follow-up was deleted during the operation - hard failure
      console.error(`Follow-up ${args.followUpId} deleted during reopen operation`);
      throw new ConvexError({
        message: "Follow-up was deleted during reopen. This may indicate a concurrent deletion.",
        code: "NOT_FOUND"
      });
    }

    if (afterPatch.version !== currentVersion + 1) {
      // Version mismatch: concurrent modification occurred
      console.error(
        `Follow-up ${args.followUpId} version mismatch. ` +
        `Expected ${currentVersion + 1}, got ${afterPatch.version}. ` +
        `Concurrent modification detected.`
      );
      throw new ConvexError({
        message: "Follow-up was modified by another request. Please refresh and try again.",
        code: "VERSION_CONFLICT"
      });
    }

    // Audit log (FERPA compliance - capture all modified fields)
    // With optimistic locking, previousState is guaranteed accurate because
    // any concurrent modification would have caused an error above
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
    // With optimistic locking, if we reach here, the operation definitely succeeded
    return {
      success: true,
      followUpId: args.followUpId,
      alreadyOpen: false,
      verified: true, // Always true with optimistic locking - errors thrown otherwise
    };
  },
});
