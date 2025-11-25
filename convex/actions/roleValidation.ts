/**
 * Convex queries for role validation
 *
 * These queries expose the role validation business logic from
 * convex/lib/roleValidation.ts so it can be called from API routes.
 */

import { query } from "../_generated/server"
import { v } from "convex/values"
import { type UserRole, VALID_ROLES, getRoleRouteAccess, validateRoleTransition as libValidateRoleTransition, isValidUserRole } from "../lib/roleValidation"

/**
 * Validate a role transition
 *
 * This query performs role validation and can be called from API routes.
 * It checks business rules for role transitions and returns warnings/errors.
 */
export const validateRoleTransition = query({
  args: {
    userId: v.string(),
    currentRole: v.string(),
    newRole: v.string(),
    universityId: v.optional(v.id("universities")),
  },
  handler: async (ctx, args) => {
    const { userId, currentRole, newRole, universityId } = args

    if (!isValidUserRole(currentRole)) {
      throw new Error(`Invalid current role: ${currentRole}`)
    }
    if (!isValidUserRole(newRole)) {
      throw new Error(`Invalid new role: ${newRole}`)
    }

    return await libValidateRoleTransition(
      ctx,
      userId,
      currentRole as UserRole,
      newRole as UserRole,
      universityId
    )
  },
})

/**
 * Get all role route access mappings
 *
 * Returns the complete mapping of roles to their allowed routes.
 * This is the single source of truth for route access control.
 */
export const getAllRoleRoutes = query({
  args: {},
  handler: async () => {
    return VALID_ROLES.map((role) => ({
      role,
      routes: getRoleRouteAccess(role),
    }))
  },
})
