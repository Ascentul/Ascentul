/**
 * Convex actions for role validation
 *
 * These actions expose the role validation business logic from
 * convex/lib/roleValidation.ts so it can be called from API routes.
 */

import { query } from "../_generated/server"
import { v } from "convex/values"
import { type UserRole, getRoleRouteAccess } from "../lib/roleValidation"

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
    const oldRole = currentRole as UserRole
    const targetRole = newRole as UserRole

    const warnings: string[] = []
    const requiredActions: string[] = []

    // Rule 1: Student role requires university_id
    if (targetRole === "student" && !universityId) {
      return {
        valid: false,
        error: "Student role requires a university affiliation. Please assign a university first.",
      }
    }

    // Rule 2: University admin role requires university_id
    if (targetRole === "university_admin" && !universityId) {
      return {
        valid: false,
        error: "University admin role requires a university affiliation. Please assign a university first.",
      }
    }

    // Rule 3: Advisor role requires university_id
    if (targetRole === "advisor" && !universityId) {
      return {
        valid: false,
        error: "Advisor role requires a university affiliation. Please assign a university first.",
      }
    }

    // Rule 4: Individual role should NOT have university_id
    if (targetRole === "individual" && universityId) {
      warnings.push(
        "Individual users should not be affiliated with a university. Consider removing university affiliation."
      )
      requiredActions.push("Remove university_id if transitioning to individual role")
    }

    // Rule 5: Cannot remove the last super_admin
    if (oldRole === "super_admin" && targetRole !== "super_admin") {
      // Count total super admins (excluding the user being changed)
      const superAdmins = await ctx.db
        .query("users")
        .filter(q => q.eq(q.field("role"), "super_admin"))
        .collect()

      // Exclude the current user from the count since they're being downgraded
      const otherSuperAdminCount = superAdmins.filter(u => u.clerkId !== userId).length

      if (otherSuperAdminCount === 0) {
        return {
          valid: false,
          error: "Cannot remove the last super admin. Assign another super admin first.",
        }
      }

      warnings.push(
        "Downgrading from super_admin will remove all platform administration privileges."
      )
    }

    // Rule 6: Transitioning from student requires handling student profile
    if (oldRole === "student" && targetRole !== "student") {
      requiredActions.push("Student profile data will be preserved but user loses university access")
    }

    // Rule 7: Transitioning to student may require creating student profile
    if (oldRole !== "student" && targetRole === "student") {
      requiredActions.push("Student profile will be created if it doesn't exist")
    }

    // Rule 8: Changing university roles may affect memberships
    if (
      (oldRole === "university_admin" || oldRole === "advisor") &&
      (targetRole !== "university_admin" && targetRole !== "advisor")
    ) {
      warnings.push("University admin privileges will be revoked")
      requiredActions.push("Remove from university admin/advisor groups")
    }

    // Rule 9: Verify university exists if assigning university role
    if (universityId && (targetRole === "student" || targetRole === "university_admin" || targetRole === "advisor")) {
      try {
        const university = await ctx.db.get(universityId)
        if (!university) {
          return {
            valid: false,
            error: "The specified university does not exist.",
          }
        }

        // Check if university is active (only if this is a university record)
        if ('status' in university) {
          if (university.status !== "active" && university.status !== "trial") {
            warnings.push(
              `Warning: This university has status "${university.status}". User may have limited access.`
            )
          }
        }
      } catch (e) {
        return {
          valid: false,
          error: "Invalid university ID format.",
        }
      }
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      requiredActions: requiredActions.length > 0 ? requiredActions : undefined,
    }
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
    const roles: UserRole[] = [
      "super_admin",
      "university_admin",
      "advisor",
      "student",
      "individual",
      "staff",
      "user",
    ]

    return roles.map((role) => ({
      role,
      routes: getRoleRouteAccess(role),
    }))
  },
})
