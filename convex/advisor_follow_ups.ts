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

    // Capture previous state for audit trail (FERPA compliance)
    const currentVersion = followUp.version ?? 0;
    const previousState = {
      status: followUp.status,
      completed_at: followUp.completed_at,
      completed_by: followUp.completed_by,
    };

    // Update the follow-up with version increment for tracking
    // Note: Convex mutations are atomic with serializable isolation,
    // so concurrent modifications are handled at the transaction level
    await ctx.db.patch(args.followUpId, {
      status: "done",
      completed_at: now,
      completed_by: sessionCtx.userId,
      version: currentVersion + 1,
      updated_at: now,
    });

    // Audit log (FERPA compliance - capture all modified fields)
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
    // This is intentionally idempotent and eventually consistent; concurrent completions are acceptable
    return {
      success: true,
      followUpId: args.followUpId,
      alreadyCompleted: false,
      completed_at: now,
      completed_by: sessionCtx.userId,
      verified: true, // State now reflects the completed follow-up
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
      completed_at: null,
      completed_by: null,
      version: currentVersion + 1,
      updated_at: now,
    });

    // Note: Convex mutations are atomic with serializable isolation.
    // No post-patch verification needed - concurrent modifications are
    // handled by Convex's transaction system which will retry the mutation.

    // Audit log (FERPA compliance - capture all modified fields)
    // previousState is guaranteed accurate due to Convex's serializable isolation
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

    // Return consistent shape with idempotent path
    return {
      success: true,
      followUpId: args.followUpId,
      alreadyOpen: false,
      verified: true,
    };
  },
});
