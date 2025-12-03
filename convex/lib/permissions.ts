/**
 * Permission Matrix
 *
 * Programmatic enforcement of the documented permission matrix.
 * This provides fine-grained, action-level authorization beyond role checks.
 *
 * Permission Format: "{scope}.{resource}.{action}"
 * - scope: platform | university | student | self
 * - resource: users | settings | analytics | etc.
 * - action: view | create | edit | delete | manage
 *
 * Special Suffixes:
 * - `:own` - User can only perform action on their own resources
 * - `:university` - User can only perform action within their university
 */

import type { Id } from '../_generated/dataModel';
import type { UserRole } from './roleValidation';

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

/**
 * All permissions in the system with their allowed roles
 */
export const PERMISSIONS = {
  // Platform-level (super_admin only)
  'platform.settings.view': ['super_admin'],
  'platform.settings.manage': ['super_admin'],
  'platform.users.view': ['super_admin'],
  'platform.users.manage': ['super_admin'],
  'platform.universities.view': ['super_admin'],
  'platform.universities.manage': ['super_admin'],
  'platform.analytics.view': ['super_admin'],
  'platform.audit.view': ['super_admin'],
  'platform.billing.manage': ['super_admin'],

  // University-level
  'university.settings.view': ['super_admin', 'university_admin'],
  'university.settings.manage': ['super_admin', 'university_admin'],
  'university.students.view': ['super_admin', 'university_admin', 'advisor'],
  'university.students.manage': ['super_admin', 'university_admin'],
  'university.advisors.view': ['super_admin', 'university_admin'],
  'university.advisors.manage': ['super_admin', 'university_admin'],
  'university.analytics.view': ['super_admin', 'university_admin', 'advisor'],
  'university.invitations.manage': ['super_admin', 'university_admin'],
  'university.data.export': ['super_admin', 'university_admin'],

  // Advisor-level (student access)
  'advisor.students.view': ['super_admin', 'university_admin', 'advisor'],
  'advisor.students.assign': ['super_admin', 'university_admin'],
  'advisor.notes.view': ['super_admin', 'university_admin', 'advisor'],
  'advisor.notes.create': ['super_admin', 'university_admin', 'advisor'],
  'advisor.sessions.view': ['super_admin', 'university_admin', 'advisor'],
  'advisor.sessions.manage': ['super_admin', 'university_admin', 'advisor'],

  // Student-level (self-service)
  'student.profile.view': ['super_admin', 'university_admin', 'advisor', 'student', 'individual'],
  'student.profile.edit': ['student', 'individual'], // Own profile only
  'student.applications.view': [
    'super_admin',
    'university_admin',
    'advisor',
    'student',
    'individual',
  ],
  'student.applications.manage': ['student', 'individual'], // Own applications only
  'student.resumes.view': ['super_admin', 'university_admin', 'advisor', 'student', 'individual'],
  'student.resumes.manage': ['student', 'individual'], // Own resumes only
  'student.goals.view': ['super_admin', 'university_admin', 'advisor', 'student', 'individual'],
  'student.goals.manage': ['student', 'individual'], // Own goals only

  // Support tickets
  'support.tickets.view.all': ['super_admin', 'staff'],
  'support.tickets.view.university': ['university_admin'],
  'support.tickets.view.own': ['student', 'individual', 'user', 'advisor'],
  'support.tickets.create': [
    'super_admin',
    'university_admin',
    'advisor',
    'student',
    'individual',
    'staff',
    'user',
  ],
  'support.tickets.respond': ['super_admin', 'staff'],

  // Career tools (available to all authenticated users)
  'tools.ai_coach.use': [
    'super_admin',
    'university_admin',
    'advisor',
    'student',
    'individual',
    'staff',
    'user',
  ],
  'tools.resume_builder.use': [
    'super_admin',
    'university_admin',
    'advisor',
    'student',
    'individual',
    'staff',
    'user',
  ],
  'tools.cover_letter.use': [
    'super_admin',
    'university_admin',
    'advisor',
    'student',
    'individual',
    'staff',
    'user',
  ],
  'tools.career_paths.use': [
    'super_admin',
    'university_admin',
    'advisor',
    'student',
    'individual',
    'staff',
    'user',
  ],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// ============================================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================================

/**
 * Context for permission checks
 */
export interface PermissionContext {
  /** ID of the resource being accessed (for ownership checks) */
  resourceOwnerId?: Id<'users'> | string | null;
  /** University ID of the resource (for tenant isolation) */
  resourceUniversityId?: Id<'universities'> | string | null;
}

/**
 * User info needed for permission checks
 */
export interface PermissionUser {
  _id: Id<'users'> | string;
  role: UserRole;
  university_id?: Id<'universities'> | string | null;
}

/**
 * Check if a user has a specific permission
 *
 * @param user - The user to check
 * @param permission - The permission to check
 * @param context - Optional context for ownership/tenant checks
 * @returns true if user has permission
 */
export function hasPermission(
  user: PermissionUser,
  permission: Permission,
  context?: PermissionContext,
): boolean {
  const allowedRoles = PERMISSIONS[permission];

  // Check if user's role is in allowed roles
  if (!(allowedRoles as readonly string[]).includes(user.role)) {
    return false;
  }

  // Super admin bypasses all context checks
  if (user.role === 'super_admin') {
    return true;
  }

  // Handle self-only permissions (e.g., student.profile.edit)
  if (isSelfOnlyPermission(permission) && context?.resourceOwnerId) {
    return user._id === context.resourceOwnerId;
  }

  // Handle university-scoped permissions
  if (isUniversityScopedPermission(permission) && context?.resourceUniversityId) {
    if (!user.university_id) {
      return false;
    }
    return user.university_id === context.resourceUniversityId;
  }

  return true;
}

/**
 * Assert user has a specific permission
 * @throws Error if permission denied
 */
export function assertPermission(
  user: PermissionUser,
  permission: Permission,
  context?: PermissionContext,
): void {
  if (!hasPermission(user, permission, context)) {
    throw new Error(`Forbidden: Permission "${permission}" denied for role "${user.role}"`);
  }
}

/**
 * Check if a permission is self-only (user can only act on their own resources)
 */
function isSelfOnlyPermission(permission: Permission): boolean {
  // These permissions are restricted to the user's own resources
  const selfOnlyPermissions: Permission[] = [
    'student.profile.edit',
    'student.applications.manage',
    'student.resumes.manage',
    'student.goals.manage',
    'support.tickets.view.own',
  ];
  return selfOnlyPermissions.includes(permission);
}

/**
 * Check if a permission is university-scoped
 */
function isUniversityScopedPermission(permission: Permission): boolean {
  // Permissions that require university_id match for non-super_admin
  return (
    permission.startsWith('university.') ||
    permission.startsWith('advisor.') ||
    permission === 'support.tickets.view.university'
  );
}

// ============================================================================
// PERMISSION GROUPS
// ============================================================================

/**
 * Get all permissions for a specific role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return (Object.entries(PERMISSIONS) as [Permission, readonly string[]][])
    .filter(([, allowedRoles]) => allowedRoles.includes(role))
    .map(([permission]) => permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  user: PermissionUser,
  permissions: Permission[],
  context?: PermissionContext,
): boolean {
  return permissions.some((permission) => hasPermission(user, permission, context));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  user: PermissionUser,
  permissions: Permission[],
  context?: PermissionContext,
): boolean {
  return permissions.every((permission) => hasPermission(user, permission, context));
}

// ============================================================================
// FEATURE ACCESS HELPERS
// ============================================================================

/**
 * Check if user can access admin features
 */
export function canAccessAdmin(user: PermissionUser): boolean {
  return hasPermission(user, 'platform.settings.view');
}

/**
 * Check if user can access university admin features
 */
export function canAccessUniversityAdmin(user: PermissionUser): boolean {
  return hasPermission(user, 'university.settings.view');
}

/**
 * Check if user can access advisor features
 */
export function canAccessAdvisorFeatures(user: PermissionUser): boolean {
  return hasPermission(user, 'advisor.students.view');
}

/**
 * Check if user can manage students
 */
export function canManageStudents(user: PermissionUser): boolean {
  return hasPermission(user, 'university.students.manage');
}

/**
 * Check if user can export data
 */
export function canExportData(user: PermissionUser): boolean {
  return hasPermission(user, 'university.data.export');
}
