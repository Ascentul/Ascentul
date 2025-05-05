/**
 * Utility to get the correct redirect path based on user role
 * Used by authentication system to route users appropriately after login
 */

export function getRedirectByRole(role: string): string {
  switch (role) {
    case 'super_admin':
      return '/admin';
    case 'admin':
      return '/admin';
    case 'staff':
      return '/staff-dashboard';
    case 'university_admin':
      return '/university-admin';
    case 'university_user':
      return '/university';
    case 'user':
      return '/career-dashboard';
    default:
      return '/career-dashboard';
  }
}