/**
 * Centralized role constants (Next.js frontend)
 *
 * This file defines the canonical list of user roles for the Next.js application.
 * Import this instead of hardcoding role arrays to prevent divergence.
 *
 * ⚠️ IMPORTANT: This array is duplicated in convex/lib/roleValidation.ts
 * due to module boundary restrictions (Convex cannot import from Next.js src/).
 * When adding/removing roles, update BOTH files:
 * - src/lib/constants/roles.ts (this file)
 * - convex/lib/roleValidation.ts
 *
 * These are kept in sync via __tests__/role-sync.test.ts
 *
 * @see convex/lib/roleValidation.ts for role transition validation logic
 */

export const VALID_USER_ROLES = [
  'super_admin',
  'university_admin',
  'advisor',
  'student',
  'individual',
  'staff',
  'user',
] as const

export type UserRole = typeof VALID_USER_ROLES[number]

/**
 * Type guard to check if a string is a valid user role
 */
export function isValidUserRole(role: string): role is UserRole {
  return VALID_USER_ROLES.includes(role as UserRole)
}
