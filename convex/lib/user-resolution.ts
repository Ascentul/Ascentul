/**
 * Shared user resolution and validation helpers for agent tools
 *
 * CURRENT ARCHITECTURE (Efficient, Single Resolution):
 * =====================================================
 * API route resolves Clerk ID → Convex ID once, passes to all tools.
 * This is the PREFERRED pattern for performance (avoids N queries per request).
 *
 * ALTERNATIVE ARCHITECTURE (Paranoid, Multi Resolution):
 * =======================================================
 * Each tool accepts clerkUserId and resolves independently.
 * Use this only if you don't trust the API layer or need per-tool auth auditing.
 *
 * This module supports both patterns.
 */

import { QueryCtx, MutationCtx } from '../_generated/server'
import { Id, Doc } from '../_generated/dataModel'

type AnyCtx = QueryCtx | MutationCtx

/**
 * Resolve Convex user ID from Clerk user ID
 *
 * Use this if you're migrating tools to accept clerkUserId instead of userId.
 *
 * SECURITY NOTE: Error messages do not expose Clerk IDs to prevent PII leakage.
 * Clerk IDs are logged server-side for debugging but never returned to clients.
 *
 * @param ctx - Convex query or mutation context
 * @param clerkUserId - Clerk user ID from auth token
 * @returns Convex user document with full type safety
 * @throws Error if user not found (does not expose clerkUserId)
 */
export async function resolveUserByClerkId(
  ctx: AnyCtx,
  clerkUserId: string
): Promise<Doc<'users'>> {
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkUserId))
    .unique()

  if (!user) {
    // SECURITY: Log Clerk ID server-side but don't expose in error message
    console.error('[user-resolution] User not found for Clerk ID:', clerkUserId)
    throw new Error('User not found')
  }

  return user
}

/**
 * Lightweight version that only returns the Convex user ID
 */
export async function resolveUserIdByClerkId(
  ctx: AnyCtx,
  clerkUserId: string
): Promise<Id<'users'>> {
  const user = await resolveUserByClerkId(ctx, clerkUserId)
  return user._id
}

/**
 * Validate that a user ID exists (optional paranoid check for current architecture)
 *
 * Use this in tools if you want to add defensive validation without changing
 * the API contract from userId to clerkUserId.
 *
 * SECURITY NOTE: Error messages do not expose user IDs to prevent information leakage.
 * User IDs are logged server-side for debugging but never returned to clients.
 *
 * @param ctx - Convex context
 * @param userId - Convex user ID to validate
 * @returns User document with full type safety
 * @throws Error if user not found (does not expose userId)
 */
export async function validateUserId(
  ctx: AnyCtx,
  userId: Id<'users'>
): Promise<Doc<'users'>> {
  const user = await ctx.db.get(userId)

  if (!user) {
    // SECURITY: Log user ID server-side but don't expose in error message
    console.error('[user-resolution] User not found for ID:', userId)
    throw new Error('User not found')
  }

  return user
}
