/**
 * Role-based user classification for billing and metrics
 *
 * BILLABLE_ROLES: End users who count toward investor metrics and revenue
 * INTERNAL_ROLES: Staff/admins who get full access but don't count in metrics
 */

/**
 * Billable roles - these users count toward:
 * - Active user metrics
 * - MRR/ARR calculations
 * - Growth rates
 * - Investor reporting
 */
export const BILLABLE_ROLES = [
  'individual',  // Main end users (free → premium subscribers)
  'student',     // University students (count toward university seats)
] as const;

/**
 * Internal roles - these users get full platform access but DON'T count in:
 * - Investor metrics
 * - Revenue calculations
 * - Active user counts
 * - Growth rates
 *
 * These accounts are always assigned subscription_plan: 'free'
 */
export const INTERNAL_ROLES = [
  'super_admin',      // Platform administrators
  'staff',            // Ascentul staff members
  'university_admin', // University administrators (manage students, not billable themselves)
  'advisor',          // University advisors/counselors
] as const;

/**
 * Legacy role being migrated to 'individual'
 * Still supported for backward compatibility
 */
export const LEGACY_ROLES = [
  'user',  // Being migrated to 'individual'
] as const;

/**
 * All valid roles in the system
 */
export const ALL_ROLES = [
  ...BILLABLE_ROLES,
  ...INTERNAL_ROLES,
  ...LEGACY_ROLES,
] as const;

/**
 * Type for user roles
 */
export type Role = typeof ALL_ROLES[number];

/**
 * Type guard to check if a role is billable
 */
export function isBillableRole(role: string): boolean {
  return BILLABLE_ROLES.includes(role as any);
}

/**
 * Type guard to check if a role is internal
 */
export function isInternalRole(role: string): boolean {
  return INTERNAL_ROLES.includes(role as any);
}
