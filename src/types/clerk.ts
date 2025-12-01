/**
 * Type definitions for Clerk publicMetadata
 *
 * These types ensure type safety when accessing user metadata
 * throughout the application.
 */

/**
 * Valid user roles in the system
 */
import { UserRole } from '@/lib/constants/roles';

/**
 * Type definitions for Clerk publicMetadata
 *
 * These types ensure type safety when accessing user metadata
 * throughout the application.
 */

export interface ClerkPublicMetadata {
  role?: UserRole;
  university_id?: string; // Clerk stores as string, convert to Id<"universities"> when using with Convex
}
