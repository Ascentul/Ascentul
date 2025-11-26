/**
 * Admin operations (Convex is source of truth)
 *
 * This module contains admin-level operations like role management.
 * Key principle: Convex is the canonical source, Clerk mirrors best-effort.
 */

import { v } from "convex/values"
import { action, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

// Workaround for "Type instantiation is excessively deep" error in Convex
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const api: any = require("./_generated/api").api

/**
 * Update a user's role (Convex is source of truth)
 *
 * Flow:
 * 1. Authenticate caller (must be super_admin)
 * 2. Validate role transition business rules
 * 3. UPDATE CONVEX FIRST (canonical source)
 * 4. Mirror to Clerk publicMetadata (best-effort, log errors but don't fail)
 *
 * This ensures immediate UI reactivity via Convex queries while keeping
 * Clerk publicMetadata in sync for convenience (e.g., Clerk Dashboard display)
 */
export const updateUserRole = action({
  args: {
    userId: v.id("users"),
    newRole: v.union(
      v.literal("super_admin"),
      v.literal("university_admin"),
      v.literal("advisor"),
      v.literal("student"),
      v.literal("individual"),
      v.literal("staff"),
      v.literal("user"),
    ),
    universityId: v.optional(v.id("universities")),
  },
  handler: async (ctx, args): Promise<any> => {
    // 1. Authenticate and authorize (super_admin only)
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized - Please sign in")
    }

    const caller: any = await ctx.runQuery(api.users.getUserByClerkId, {
      clerkId: identity.subject,
    })

    if (!caller || caller.role !== "super_admin") {
      throw new Error("Forbidden - Only super admins can update user roles")
    }

    // 2. Get target user
    const targetUser = await ctx.runQuery(api.admin.get, {
      id: args.userId,
    })

    if (!targetUser) {
      throw new Error("User not found")
    }

    // 3. Validate role transition using existing business logic
    const validation = await ctx.runQuery(api.roleValidation.validateRoleTransition, {
      userId: targetUser.clerkId,
      currentRole: targetUser.role,
      newRole: args.newRole,
      universityId: args.universityId,
    })

    if (!validation.valid) {
      throw new Error(validation.error || "Invalid role transition")
    }

    // Log warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn("[updateUserRole] Warnings:", validation.warnings)
    }

    // Critical protection: Prevent demoting the last super_admin
    // This ensures there is always at least one super_admin to manage the platform
    if (targetUser.role === "super_admin" && args.newRole !== "super_admin") {
      // Use efficient filtered query instead of fetching all users
      const superAdminCount = await ctx.runQuery(api.users.countUsersByRole, {
        role: "super_admin",
      })

      if (superAdminCount <= 1) {
        throw new Error(
          "Cannot demote the last super_admin. Platform requires at least one super_admin for administration."
        )
      }

      console.warn(`[updateUserRole] Demoting super_admin: ${superAdminCount - 1} super_admins will remain`)
    }

    // 4. UPDATE CONVEX FIRST (canonical source of truth)
    const updatedUser: any = await ctx.runMutation(api.users.setRole, {
      userId: args.userId,
      newRole: args.newRole,
      universityId: args.universityId,
      actorId: caller._id,
    })

    console.log(`[updateUserRole] Updated Convex: ${targetUser.email} ${targetUser.role} → ${args.newRole}`)

    // 5. Mirror to Clerk publicMetadata (best-effort)
    // This keeps Clerk metadata in sync for convenience but does NOT block on failure
    try {
      const clerkSecretKey = process.env.CLERK_SECRET_KEY
      if (!clerkSecretKey) {
        console.error("[updateUserRole] CLERK_SECRET_KEY not configured, cannot sync to Clerk")
      } else {
        // IMPORTANT: Use updateUserMetadata endpoint to merge metadata, not replace it
        // This prevents accidentally wiping out subscription, billing, or other fields
        const response = await fetch(`https://api.clerk.com/v1/users/${targetUser.clerkId}/metadata`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            public_metadata: {
              role: args.newRole,
              university_id: args.universityId || null, // null removes the key
              _role_source: "convex", // Migration flag
            },
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[updateUserRole] Clerk sync failed (non-critical): ${response.status} ${errorText}`)
        } else {
          console.log(`[updateUserRole] Synced to Clerk publicMetadata: ${targetUser.email}`)
        }
      }
    } catch (clerkError) {
      // Log error but don't fail - Convex is already updated (source of truth)
      console.error("[updateUserRole] Clerk sync error (Convex is still correct):", clerkError)
    }

    return updatedUser
  },
})

/**
 * List all users with their roles (for admin UI)
 * Only accessible by super_admin
 *
 * @deprecated Use api.users.getAllUsersMinimal instead - it has proper pagination
 * This function is kept for backwards compatibility but should not be used for new code
 */
export const listUsersWithRoles = query({
  args: {},
  handler: async (ctx) => {
    // Authenticate and authorize
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized - Please sign in")
    }

    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!caller || caller.role !== "super_admin") {
      throw new Error("Forbidden - Only super admins can list all users")
    }

    // WARNING: Unbounded query - use api.users.getAllUsersMinimal for production
    // Limited to 1000 users to prevent performance issues
    return await ctx.db.query("users").order("desc").take(1000)
  },
})

/**
 * Get a single user by Convex ID (for admin operations)
 * Only accessible by super_admin
 */
export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    // Authenticate
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized - Please sign in")
    }

    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!caller) {
      throw new Error("Unauthorized - User not found")
    }

    // Get target user
    const user = await ctx.db.get(args.id)
    if (!user) {
      throw new Error("User not found")
    }

    // Authorization: super_admin can view anyone
    // University_admin can view users in their university
    // Users can view themselves
    const isSelf = caller._id === user._id
    const sameUniversity =
      caller.university_id && user.university_id &&
      caller.university_id === user.university_id
    const canView =
      caller.role === "super_admin" ||
      isSelf ||
      (caller.role === "university_admin" && sameUniversity)

    if (!canView) {
      throw new Error("Forbidden - Cannot access this user")
    }

    return user
  },
})
