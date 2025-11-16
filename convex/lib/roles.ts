/**
 * Authorization utilities for role-based access control
 */

import { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import { DataModel } from "../_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * Get the authenticated user from context
 * Throws error if user is not authenticated
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthorized: User not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("Unauthorized: User not found in database");
  }

  return user;
}

/**
 * Check if the authenticated user is a super admin
 * Throws error if user is not a super admin
 */
export async function requireSuperAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthenticatedUser(ctx);

  if (user.role !== "super_admin") {
    throw new Error("Forbidden: Only super admins can perform this action");
  }

  return user;
}

/**
 * Check if the authenticated user is a university admin
 * Throws error if user is not a university admin
 */
export async function requireUniversityAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthenticatedUser(ctx);

  if (user.role !== "university_admin") {
    throw new Error("Forbidden: Only university admins can perform this action");
  }

  if (!user.university_id) {
    throw new Error("Forbidden: University admin must be associated with a university");
  }

  return user;
}

/**
 * Check if the authenticated user is an advisor
 * Throws error if user is not an advisor
 */
export async function requireAdvisor(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthenticatedUser(ctx);

  if (user.role !== "advisor") {
    throw new Error("Forbidden: Only advisors can perform this action");
  }

  return user;
}

/**
 * Check if authenticated user can access another user's data
 * Rules:
 * - super_admin: can access anyone
 * - university_admin: can access users in their university
 * - user: can only access their own data
 */
export async function requireUserAccess(
  ctx: QueryCtx | MutationCtx,
  targetClerkId: string
) {
  const authenticatedUser = await getAuthenticatedUser(ctx);

  // Super admins can access anyone
  if (authenticatedUser.role === "super_admin") {
    return authenticatedUser;
  }

  // Users can access their own data
  if (authenticatedUser.clerkId === targetClerkId) {
    return authenticatedUser;
  }

  // University admins can access users in their university
  if (authenticatedUser.role === "university_admin") {
    if (!authenticatedUser.university_id) {
      throw new Error("Forbidden: University admin must have an associated university");
    }

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", targetClerkId))
      .unique();

    if (
      targetUser &&
      targetUser.university_id === authenticatedUser.university_id
    ) {
      return authenticatedUser;
    }
  }

  throw new Error("Forbidden: You cannot access this user's data");
}

/**
 * Check if user account is active (not deleted, not suspended)
 */
export function checkAccountActive(user: {
  account_status?: "pending_activation" | "active" | "suspended" | "deleted";
}) {
  if (user.account_status === "deleted") {
    throw new Error("Forbidden: User account has been deleted");
  }

  if (user.account_status === "suspended") {
    throw new Error("Forbidden: User account has been suspended");
  }

  // Allow pending_activation and active statuses
  return true;
}
