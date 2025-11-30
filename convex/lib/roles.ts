/**
 * Authorization utilities for role-based access control
 */

import { GenericQueryCtx, GenericMutationCtx } from "convex/server";
import { DataModel } from "../_generated/dataModel";

type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;
type Ctx = QueryCtx | MutationCtx;

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Compares two strings in constant time regardless of where they differ.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  
  // Compare against a fixed length to avoid timing leaks
  let result = aBuffer.length ^ bBuffer.length;
  const minLength = Math.min(aBuffer.length, bBuffer.length);
  
  for (let i = 0; i < minLength; i++) {
    result |= aBuffer[i] ^ bBuffer[i];
  }
  
  return result === 0;
}

/**
 * Internal service token check for server-to-server calls
 * This is used by trusted backends (e.g., webhooks) when no user identity exists.
 *
 * SECURITY: Uses timing-safe comparison to prevent timing attacks.
 */
export function isServiceRequest(token: string | undefined) {
  const expected = process.env.CONVEX_INTERNAL_SERVICE_TOKEN;
  if (!expected || !token) {
    return false;
  }
  return timingSafeEqual(token, expected);
}

/**
 * Get the authenticated user from context
 * Throws error if user is not authenticated or account is deleted/suspended
 *
 * SECURITY: This function now automatically verifies account_status.
 * Deleted or suspended users will be blocked from all authenticated endpoints.
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

  // SECURITY FIX: Always verify account is active
  // Prevents deleted/suspended users from accessing any endpoints
  checkAccountActive(user);

  return user;
}

/**
 * Fetch active membership for the authenticated user and optional role
 */
export async function requireMembership(
  ctx: Ctx,
  opts: { role?: "student" | "advisor" | "university_admin" }
) {
  const user = await getAuthenticatedUser(ctx);

  let membership = null as any;

  if (opts.role) {
    membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_role", (q) => q.eq("user_id", user._id).eq("role", opts.role!))
      .first();
  } else {
    membership = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .first();
  }
  if (!membership) {
    throw new Error("Unauthorized: Membership not found");
  }

  if (membership.status !== "active") {
    throw new Error("Unauthorized: Inactive membership");
  }

  return { user, membership };
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
 * Throws error if user is not an advisor or lacks university affiliation
 *
 * SECURITY: Advisors MUST have university_id to ensure tenant isolation.
 * This matches the pattern used in requireUniversityAdmin().
 */
export async function requireAdvisor(ctx: QueryCtx | MutationCtx) {
  const user = await getAuthenticatedUser(ctx);

  if (user.role !== "advisor") {
    throw new Error("Forbidden: Only advisors can perform this action");
  }

  // SECURITY FIX: Advisors must have university affiliation
  // Prevents advisors without university_id from bypassing tenant checks
  if (!user.university_id) {
    throw new Error("Forbidden: Advisor must be associated with a university");
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

/**
 * Assert that the acting user can manage a target university.
 * Super admins can manage all; university admins/advisors must match their university_id.
 */
export function assertUniversityAccess(
  actingUser: { role?: string; university_id?: string | null },
  targetUniversityId?: string | null,
) {
  if (actingUser.role === "super_admin") {
    return;
  }

  if (
    !actingUser.university_id ||
    !targetUniversityId ||
    actingUser.university_id !== targetUniversityId
  ) {
    throw new Error("Unauthorized: Tenant access denied");
  }
}
