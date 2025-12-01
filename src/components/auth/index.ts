/**
 * Auth Components
 *
 * Centralized exports for authorization components and hooks.
 *
 * Usage:
 * ```tsx
 * import { RoleGate, AdminGate, useHasRole, RequireRole } from '@/components/auth';
 * ```
 */

// Role-based gates (conditional rendering)
export { RoleGate, useHasRole, useUserRole } from './RoleGate';

// Shorthand gates for common patterns
export { AdminGate, AdvisorGate, UniversityAdminGate } from './AdminGate';

// Permission-based gates
export { PermissionGate, useHasPermission } from './PermissionGate';

// Role requirements (redirect on unauthorized)
export {
  RequireAdvisor,
  RequireRole,
  RequireSuperAdmin,
  RequireUniversityAdmin,
} from './RequireRole';
