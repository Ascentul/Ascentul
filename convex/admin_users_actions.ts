"use node";

/**
 * Node.js actions for admin user management
 * These need to run in Node.js runtime to access environment variables
 * and make authenticated fetch requests to Next.js API routes
 */

import { v } from "convex/values";
import { action } from "./_generated/server";

// Workaround for "Type instantiation is excessively deep" error in Convex
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const { api, internal }: any = require("./_generated/api");

/**
 * Soft delete a user (super_admin only)
 * Public action that handles both Convex and Clerk
 */
export const softDeleteUser = action({
  args: {
    targetClerkId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{success: boolean; message: string; userId: any}> => {
    // Get app URL from environment
    const appUrl = process.env.CONVEX_APP_URL || process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      throw new Error(
        "Server configuration error: App URL not configured. " +
        "Set CONVEX_APP_URL or NEXT_PUBLIC_APP_URL in Convex dashboard."
      );
    }

    // Get admin identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Not authenticated");
    }

    // Soft delete in Convex
    const result: {success: boolean; message: string; userId: any} = await ctx.runMutation(internal.admin_users._softDeleteUserInternal, {
      targetClerkId: args.targetClerkId,
      adminClerkId: identity.subject,
      reason: args.reason,
    });

    // Disable Clerk account (ban user to prevent login)
    try {
      // Call our backend API to disable the Clerk user
      const response = await fetch(`${appUrl}/api/admin/clerk-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable',
          clerkId: args.targetClerkId,
        }),
      });

      if (!response.ok) {
        console.error('Failed to disable Clerk account, but Convex delete succeeded');
      }
    } catch (clerkError) {
      // Log error but don't fail the operation - user is still marked deleted in Convex
      console.error('Failed to disable Clerk account:', clerkError);
    }

    return result;
  },
})

/**
 * Hard delete a test user (super_admin only)
 * Permanently removes user and cascades delete to all related data
 * ONLY works for users marked as test users
 */
export const hardDeleteUser = action({
  args: {
    targetClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get app URL from environment
    const appUrl = process.env.CONVEX_APP_URL || process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      throw new Error(
        "Server configuration error: App URL not configured. " +
        "Set CONVEX_APP_URL or NEXT_PUBLIC_APP_URL in Convex dashboard."
      );
    }

    // Get admin identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Not authenticated");
    }

    // Get admin user
    const admin = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!admin || admin.role !== "super_admin") {
      throw new Error("Forbidden: Only super admins can hard delete users");
    }

    // Get target user
    const targetUser = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.targetClerkId,
    });

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Prevent deleting self
    if (targetUser.clerkId === admin.clerkId) {
      throw new Error("Cannot delete your own account");
    }

    // ONLY allow hard delete for test users
    if (!targetUser.is_test_user) {
      throw new Error(
        "Cannot hard delete real users. Only test users can be permanently deleted. Use softDeleteUser instead."
      );
    }

    // CASCADE DELETE: Remove all related data
    // This is a destructive operation that cannot be undone
    // IMPORTANT: Must match validTables list in _getRecordsByUserId
    const tablesToCascade = [
      "applications",
      "resumes",
      "cover_letters",
      "goals",
      "projects",
      "networking_contacts", // Corrected from "contacts"
      "contact_interactions",
      "followup_actions", // Corrected from "followups"
      "career_paths",
      "ai_coach_conversations",
      "ai_coach_messages",
      "support_tickets",
      "user_achievements", // Corrected from "achievements"
      "user_daily_activity", // Corrected from "activity"
      "job_searches", // Added - missing from original list
      "daily_recommendations", // Added - missing from original list
    ];

    let deletedRecords = 0;

    for (const tableName of tablesToCascade) {
      try {
        // Query records for this user
        const records = await ctx.runQuery(
          internal.admin_users._getRecordsByUserId,
          {
            tableName,
            userId: targetUser._id,
          }
        );

        // Delete each record
        for (const recordId of records) {
          await ctx.runMutation(internal.admin_users._deleteRecord, {
            tableName,
            recordId,
          });
          deletedRecords++;
        }
      } catch (error) {
        console.warn(`Warning: Could not cascade delete from ${tableName}:`, error);
        // Continue with other tables even if one fails
      }
    }

    // Create audit log BEFORE deleting the user
    await ctx.runMutation(internal.audit_logs._createAuditLogInternal, {
      action: "user_hard_deleted",
      target_type: "user",
      target_id: targetUser._id,
      target_email: targetUser.email,
      target_name: targetUser.name,
      performed_by_id: admin._id,
      performed_by_email: admin.email,
      performed_by_name: admin.name,
      reason: "Test user permanently deleted (hard delete)",
      metadata: {
        targetRole: targetUser.role,
        targetUniversityId: targetUser.university_id,
        deletedRecordsCount: deletedRecords,
        isTestUser: true,
      },
    });

    // Finally, delete the user record
    await ctx.runMutation(internal.admin_users._deleteUserRecord, {
      userId: targetUser._id,
    });

    // Delete from Clerk (permanently remove identity)
    try {
      const response = await fetch(`${appUrl}/api/admin/clerk-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          clerkId: args.targetClerkId,
        }),
      });

      if (!response.ok) {
        console.error('Failed to delete Clerk account, but Convex delete succeeded');
        // Continue - user is already deleted from Convex
      }
    } catch (clerkError) {
      // Log error but don't fail the operation - user is already deleted from Convex
      console.error('Failed to delete Clerk account:', clerkError);
    }

    return {
      success: true,
      message: `Test user permanently deleted. Removed ${deletedRecords} related records.`,
      deletedRecords,
    };
  },
})

/**
 * Restore a soft-deleted user (super_admin only)
 * Re-activates the user account and clears deletion metadata
 */
export const restoreDeletedUser = action({
  args: {
    targetClerkId: v.string(),
  },
  handler: async (ctx, args): Promise<{success: boolean; message: string; userId: any}> => {
    // Get app URL from environment
    const appUrl = process.env.CONVEX_APP_URL || process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      throw new Error(
        "Server configuration error: App URL not configured. " +
        "Set CONVEX_APP_URL or NEXT_PUBLIC_APP_URL in Convex dashboard."
      );
    }

    // Get admin identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Not authenticated");
    }

    // Get admin user
    const admin = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!admin || admin.role !== "super_admin") {
      throw new Error("Forbidden: Only super admins can restore deleted users");
    }

    // Get target user
    const targetUser = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: args.targetClerkId,
    });

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Verify user is actually deleted
    if (targetUser.account_status !== "deleted") {
      throw new Error("User is not deleted. Cannot restore an active user.");
    }

    // Restore in Convex
    const result = await ctx.runMutation(internal.admin_users._restoreUserInternal, {
      targetUserId: targetUser._id,
      adminId: admin._id,
    });

    // Re-enable Clerk account (unban user to allow login)
    try {
      const response = await fetch(`${appUrl}/api/admin/clerk-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable',
          clerkId: args.targetClerkId,
        }),
      });

      if (!response.ok) {
        console.error('Failed to re-enable Clerk account, but Convex restore succeeded');
      }
    } catch (clerkError) {
      // Log error but don't fail the operation - user is still marked active in Convex
      console.error('Failed to re-enable Clerk account:', clerkError);
    }

    return result;
  },
})
