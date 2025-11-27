/**
 * Shared role validation utilities
 *
 * Provides reusable helpers for validating user roles across API routes,
 * webhooks, and other server-side code.
 */

import { VALID_USER_ROLES, UserRole } from '@/lib/constants/roles'

/**
 * Validates if a value is a valid user role
 *
 * @param role - The value to validate
 * @returns The role as UserRole if valid, null otherwise
 */
export function validateRole(role: unknown): UserRole | null {
  if (role && typeof role === 'string' && VALID_USER_ROLES.includes(role as UserRole)) {
    return role as UserRole
  }
  return null
}

/**
 * Validates a role and logs a warning if invalid
 *
 * @param role - The value to validate
 * @param context - Context string for logging (e.g., "Clerk Webhook", "API Route")
 * @returns The role as UserRole if valid, null otherwise
 */
export function validateRoleOrWarn(role: unknown, context: string): UserRole | null {
  const validated = validateRole(role)
  if (role && !validated) {
    console.warn(`[${context}] Invalid role: "${role}". Will be set to null.`)
  }
  return validated
}

/**
 * Type guard to check if a string is a valid user role
 *
 * @param role - The value to check
 * @returns True if the value is a valid UserRole
 */
export function isValidUserRole(role: string): role is UserRole {
  return VALID_USER_ROLES.includes(role as UserRole)
}
