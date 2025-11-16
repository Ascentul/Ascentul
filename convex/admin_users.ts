/**
 * Admin user management functions
 * Allows super admins and university admins to create users
 */

import { v } from "convex/values"
import { mutation, query, action } from "./_generated/server"
import { api } from "./_generated/api"
import { requireSuperAdmin } from "./lib/roles"

/**
 * Generate a random activation token
 */
function generateActivationToken(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}


/**
 * Create a new user account (admin only)
 * User will receive activation email with magic link to set up account
 */
export const createUserByAdmin = mutation({
  args: {
    adminClerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.optional(v.union(
      v.literal("user"),
      v.literal("student"),
      v.literal("staff"),
      v.literal("university_admin"),
      v.literal("advisor"),
    )),
    university_id: v.optional(v.id("universities")),
    sendActivationEmail: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify admin permissions
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.adminClerkId))
      .unique()

    if (!admin) {
      throw new Error("Admin not found")
    }

    const isSuperAdmin = admin.role === "super_admin"
    const isUniversityAdmin = (admin.role === "university_admin" || admin.role === "advisor") && admin.university_id === args.university_id

    if (!isSuperAdmin && !isUniversityAdmin) {
      throw new Error("Unauthorized - Only admins, super admins, university admins, and advisors can create users")
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique()

    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    // Generate activation token
    const activationToken = generateActivationToken()
    const activationExpiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours

    // Create user with pending activation status
    // Note: This creates a placeholder in Convex. Actual Clerk account
    // will be created when user activates via the activation link.
    const userId = await ctx.db.insert("users", {
      clerkId: `pending_${activationToken}`, // Temporary until activated
      email: args.email,
      name: args.name,
      username: args.email.split('@')[0],
      role: args.role || "user",
      // Students always get university plan, others get university plan if they have university_id
      subscription_plan: args.role === "student" ? "university" : (args.university_id ? "university" : "free"),
      subscription_status: "active",
      university_id: args.university_id,
      account_status: "pending_activation",
      activation_token: activationToken,
      activation_expires_at: activationExpiresAt,
      created_by_admin: true,
      onboarding_completed: false,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    // Schedule email to be sent if requested (default: true for backwards compatibility)
    const shouldSendEmail = args.sendActivationEmail !== false
    if (shouldSendEmail) {
      try {
        // Determine which email template to use based on university affiliation
        if (args.university_id) {
          // Get university details for the invitation email
          const university = await ctx.db.get(args.university_id)
          const universityName = university?.name || "University"

          // Send university-specific invitation email based on role
          const userRole = args.role || "user"

          if (userRole === "university_admin") {
            await ctx.scheduler.runAfter(0, api.email.sendUniversityAdminInvitationEmail, {
              email: args.email,
              name: args.name,
              universityName,
              activationToken,
            })
          } else if (userRole === "advisor") {
            await ctx.scheduler.runAfter(0, api.email.sendUniversityAdvisorInvitationEmail, {
              email: args.email,
              name: args.name,
              universityName,
              activationToken,
            })
          } else {
            // For students and other university users, send student invitation
            await ctx.scheduler.runAfter(0, api.email.sendUniversityStudentInvitationEmail, {
              email: args.email,
              name: args.name,
              universityName,
              activationToken,
            })
          }
        } else {
          // Non-university users get the generic activation email
          await ctx.scheduler.runAfter(0, api.email.sendActivationEmail, {
            email: args.email,
            name: args.name,
            activationToken,
          })
        }
      } catch (emailError) {
        console.warn("Failed to schedule activation email:", emailError)
        // Don't fail the user creation if email scheduling fails
      }
    }

    return {
      userId,
      activationToken,
      message: shouldSendEmail
        ? "User created successfully. Activation email will be sent shortly."
        : "User created successfully. No activation email sent.",
    }
  },
})

/**
 * Get user by activation token
 * Used by the activation page to verify token validity
 */
export const getUserByActivationToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by activation token
    const users = await ctx.db.query("users").collect()
    const user = users.find(u => u.activation_token === args.token)

    if (!user) {
      return null
    }

    // Check if token expired
    if (user.activation_expires_at && user.activation_expires_at < Date.now()) {
      return null
    }

    // Return user data (excluding sensitive information)
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      university_id: user.university_id,
      account_status: user.account_status,
      temp_password: user.temp_password, // Needed for verification
    }
  },
})

/**
 * Activate user account using activation token
 * This will be called from the activation page
 */
export const activateUserAccount = mutation({
  args: {
    activationToken: v.string(),
    clerkId: v.string(), // Clerk ID from newly created account
  },
  handler: async (ctx, args) => {
    // Find user by activation token
    const users = await ctx.db.query("users").collect()
    const user = users.find(u => u.activation_token === args.activationToken)

    if (!user) {
      throw new Error("Invalid activation token")
    }

    // Check if token expired
    if (user.activation_expires_at && user.activation_expires_at < Date.now()) {
      throw new Error("Activation token has expired")
    }

    // Check if already activated
    if (user.account_status === "active") {
      throw new Error("Account already activated")
    }

    // Activate account and link to Clerk ID
    await ctx.db.patch(user._id, {
      clerkId: args.clerkId, // Replace pending clerkId with real one
      account_status: "active",
      activation_token: undefined, // Clear token
      activation_expires_at: undefined,
      temp_password: undefined, // Clear temp password
      updated_at: Date.now(),
    })

    return {
      success: true,
      message: "Account activated successfully",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  },
})

/**
 * Regenerate activation token and resend activation email
 * Used for "Resend Activation" feature
 */
export const regenerateActivationToken = mutation({
  args: {
    adminClerkId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin permissions
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.adminClerkId))
      .unique()

    if (!admin || !["super_admin", "university_admin", "advisor"].includes(admin.role)) {
      throw new Error("Unauthorized: Only admins can regenerate activation tokens")
    }

    // Get the user
    const user = await ctx.db.get(args.userId)

    if (!user) {
      throw new Error("User not found")
    }

    // Check if user is already activated
    if (user.account_status === "active") {
      throw new Error("User account is already active")
    }

    // For university admins, check they can only manage their own university users
    if (admin.role === "university_admin" && user.university_id !== admin.university_id) {
      throw new Error("Unauthorized: Cannot manage users outside your university")
    }

    // Generate new activation token
    const activationToken = generateActivationToken()
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    await ctx.db.patch(user._id, {
      activation_token: activationToken,
      activation_expires_at: expiresAt,
      clerkId: `pending_${activationToken}`, // Ensure consistent pending state
      account_status: "pending_activation",
      updated_at: Date.now(),
    })

    // Schedule email send (runs in background)
    // Use university-specific email template if user is affiliated with a university
    try {
      if (user.university_id) {
        // Get university details for the invitation email
        const university = await ctx.db.get(user.university_id)
        const universityName = university?.name || "University"

        // Send university-specific invitation email based on role
        if (user.role === "university_admin") {
          await ctx.scheduler.runAfter(0, api.email.sendUniversityAdminInvitationEmail, {
            email: user.email,
            name: user.name,
            universityName,
            activationToken,
          })
        } else if (user.role === "advisor") {
          await ctx.scheduler.runAfter(0, api.email.sendUniversityAdvisorInvitationEmail, {
            email: user.email,
            name: user.name,
            universityName,
            activationToken,
          })
        } else {
          // For students and other university users, send student invitation
          await ctx.scheduler.runAfter(0, api.email.sendUniversityStudentInvitationEmail, {
            email: user.email,
            name: user.name,
            universityName,
            activationToken,
          })
        }
      } else {
        // Non-university users get the generic activation email
        await ctx.scheduler.runAfter(0, api.email.sendActivationEmail, {
          email: user.email,
          name: user.name,
          activationToken,
        })
      }
    } catch (emailError) {
      console.warn("Failed to schedule activation email:", emailError)
      throw new Error("Failed to send activation email: " + (emailError as Error).message)
    }

    return {
      success: true,
      message: "New activation email sent successfully",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      }
    }
  },
})

/**
 * Get pending activation users (admin only)
 */
export const getPendingActivations = mutation({
  args: {
    adminClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.adminClerkId))
      .unique()

    if (!admin || !["super_admin", "university_admin", "advisor"].includes(admin.role)) {
      throw new Error("Unauthorized")
    }

    // Get all pending users
    const allUsers = await ctx.db.query("users").collect()
    let pendingUsers = allUsers.filter(u => u.account_status === "pending_activation")

    // Filter by university for university admins
    if (admin.role === "university_admin" && admin.university_id) {
      pendingUsers = pendingUsers.filter(u => u.university_id === admin.university_id)
    }

    return pendingUsers.map(u => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      university_id: u.university_id,
      created_at: u.created_at,
      activation_expires_at: u.activation_expires_at,
    }))
  },
})

/**
 * Soft delete a user - Internal mutation (super_admin only)
 * Sets account_status to "deleted" and preserves all data for FERPA compliance
 */
export const _softDeleteUserInternal = mutation({
  args: {
    targetClerkId: v.string(),
    adminClerkId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get admin user
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.adminClerkId))
      .unique();

    if (!admin || admin.role !== "super_admin") {
      throw new Error("Forbidden: Only super admins can soft delete users");
    }

    // Get target user
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.targetClerkId))
      .unique();

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Prevent deleting self
    if (targetUser.clerkId === admin.clerkId) {
      throw new Error("Cannot delete your own account");
    }

    // Prevent deleting test users with soft delete
    if (targetUser.is_test_user) {
      throw new Error(
        "Cannot soft delete test users. Use hardDeleteUser instead."
      );
    }

    // Already deleted? Treat as idempotent to avoid noisy errors in UI
    if (targetUser.account_status === "deleted") {
      return {
        success: true,
        message: "User already deleted. No changes applied.",
        userId: targetUser._id,
      };
    }

    // Soft delete: Set status to deleted, preserve all data
    await ctx.db.patch(targetUser._id, {
      account_status: "deleted",
      deleted_at: Date.now(),
      deleted_by: admin._id,
      deleted_reason: args.reason || "Deleted by administrator",
      updated_at: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("audit_logs", {
      action: "user_soft_deleted",
      target_type: "user",
      target_id: targetUser._id,
      target_email: targetUser.email,
      target_name: targetUser.name,
      performed_by_id: admin._id,
      performed_by_email: admin.email,
      performed_by_name: admin.name,
      reason: args.reason || "Deleted by administrator",
      metadata: {
        targetRole: targetUser.role,
        targetUniversityId: targetUser.university_id,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: "User soft deleted successfully. Data preserved for compliance.",
      userId: targetUser._id,
    };
  },
})

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
    // CRITICAL: Validate required environment variable
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error(
        "Server configuration error: NEXT_PUBLIC_APP_URL is not set. " +
        "This variable is required for Clerk account synchronization. " +
        "See .env.example for setup instructions."
      );
    }

    // Get admin identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Not authenticated");
    }

    // Soft delete in Convex
    const result: {success: boolean; message: string; userId: any} = await ctx.runMutation(api.admin_users._softDeleteUserInternal, {
      targetClerkId: args.targetClerkId,
      adminClerkId: identity.subject,
      reason: args.reason,
    });

    // Disable Clerk account (ban user to prevent login)
    try {
      // Call our backend API to disable the Clerk user
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/clerk-sync`, {
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
    // CRITICAL: Validate required environment variable
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error(
        "Server configuration error: NEXT_PUBLIC_APP_URL is not set. " +
        "This variable is required for Clerk account synchronization. " +
        "See .env.example for setup instructions."
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
          api.admin_users._getRecordsByUserId,
          {
            tableName,
            userId: targetUser._id,
          }
        );

        // Delete each record
        for (const recordId of records) {
          await ctx.runMutation(api.admin_users._deleteRecord, {
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
    await ctx.runMutation(api.audit_logs.createAuditLog, {
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
    await ctx.runMutation(api.admin_users._deleteUserRecord, {
      userId: targetUser._id,
    });

    // Delete from Clerk (permanently remove identity)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/clerk-sync`, {
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
    // CRITICAL: Validate required environment variable
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error(
        "Server configuration error: NEXT_PUBLIC_APP_URL is not set. " +
        "This variable is required for Clerk account synchronization. " +
        "See .env.example for setup instructions."
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
    const result = await ctx.runMutation(api.admin_users._restoreUserInternal, {
      targetUserId: targetUser._id,
      adminId: admin._id,
    });

    // Re-enable Clerk account (unban user to allow login)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/clerk-sync`, {
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

/**
 * Internal mutation to restore a deleted user
 */
export const _restoreUserInternal = mutation({
  args: {
    targetUserId: v.id("users"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const targetUser = await ctx.db.get(args.targetUserId);

    if (!targetUser) {
      throw new Error("User not found");
    }

    if (targetUser.account_status !== "deleted") {
      throw new Error("User is not deleted");
    }

    // Get admin info for audit log
    const admin = await ctx.db.get(args.adminId);
    if (!admin) {
      throw new Error("Admin user not found - cannot complete restore");
    }

    // Restore the user
    await ctx.db.patch(targetUser._id, {
      account_status: "active",
      // Clear deletion metadata but preserve in history
      deleted_at: undefined,
      deleted_by: undefined,
      deleted_reason: undefined,
      // Add restoration metadata
      restored_at: Date.now(),
      restored_by: args.adminId,
      updated_at: Date.now(),
    });

    // Create audit log (guaranteed to have admin info due to check above)
    await ctx.db.insert("audit_logs", {
      action: "user_restored",
      target_type: "user",
      target_id: targetUser._id,
      target_email: targetUser.email,
      target_name: targetUser.name,
      performed_by_id: admin._id,
      performed_by_email: admin.email,
      performed_by_name: admin.name,
      reason: "User account restored from deleted status",
      metadata: {
        targetRole: targetUser.role,
        targetUniversityId: targetUser.university_id,
      },
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: "User restored successfully. Account is now active.",
      userId: targetUser._id,
    };
  },
})

/**
 * Mark a user as a test user (super_admin only)
 * Test users can be hard deleted, while real users can only be soft deleted
 */
export const markTestUser = mutation({
  args: {
    targetClerkId: v.string(),
    isTestUser: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Require super admin
    const admin = await requireSuperAdmin(ctx);

    // Get target user
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.targetClerkId))
      .unique();

    if (!targetUser) {
      throw new Error("User not found");
    }

    // Prevent marking self as test user
    if (targetUser.clerkId === admin.clerkId) {
      throw new Error("Cannot mark your own account as a test user");
    }

    // Update test user flag
    await ctx.db.patch(targetUser._id, {
      is_test_user: args.isTestUser,
      updated_at: Date.now(),
    });

    return {
      success: true,
      message: args.isTestUser
        ? "User marked as test user. Can now be hard deleted."
        : "Test user flag removed. User can only be soft deleted.",
      userId: targetUser._id,
    };
  },
})

/**
 * Internal helper: Get records by user_id for cascade delete
 */
export const _getRecordsByUserId = query({
  args: {
    tableName: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Validate table name against known tables with user_id field
    // IMPORTANT: Keep this list in sync with schema.ts tables that have user_id
    const validTables = [
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

    if (!validTables.includes(args.tableName)) {
      console.warn(`Invalid table name attempted: ${args.tableName}`);
      return [];
    }

    try {
      // Use by_user index for efficient lookups (O(log n) vs O(n) full table scan)
      const records = await (ctx.db.query(args.tableName as any) as any)
        .withIndex("by_user", (q: any) => q.eq("user_id", args.userId))
        .collect();

      return records.map((r: any) => r._id);
    } catch (error) {
      console.error(`Error querying ${args.tableName} for user ${args.userId}:`, error);
      return [];
    }
  },
})

/**
 * Internal helper: Delete a single record
 */
export const _deleteRecord = mutation({
  args: {
    tableName: v.string(),
    recordId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.recordId as any);
  },
})

/**
 * Internal helper: Delete user record
 */
export const _deleteUserRecord = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
  },
})
