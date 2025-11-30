import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { ClerkPublicMetadata } from '@/types/clerk'
import { VALID_USER_ROLES, UserRole } from '@/lib/constants/roles'
import { isValidUserRole } from '@/lib/validation/roleValidation'
import { convexServer } from '@/lib/convex-server'
import { requireConvexToken } from '@/lib/convex-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Sync user role from Clerk to Convex (diagnostic repair utility)
 *
 * This endpoint syncs Convex to match Clerk's publicMetadata.role when they
 * have become out of sync (e.g., webhook failure, manual Clerk Dashboard edit).
 *
 * IMPORTANT: This follows the Clerk-first pattern:
 * - Clerk publicMetadata.role is the source of truth for authorization
 * - This endpoint ALWAYS reads from or writes to Clerk first
 * - Convex is only updated AFTER Clerk is verified to have the correct role
 * - If you need to CHANGE a role, use /api/admin/users/update-role instead
 *
 * Two modes of operation:
 * 1. With role in body: Updates Clerk first, verifies the update, then syncs to Convex
 * 2. Without role in body: Reads current role from Clerk and syncs to Convex
 *
 * Security measures:
 * - Requires super_admin role
 * - Prevents self-modification (to avoid accidental lockout)
 * - Mode 1: Verifies Clerk was updated before syncing to Convex (prevents desync)
 * - Mode 2: Only syncs what's already in Clerk (pure repair operation)
 *
 * POST /api/admin/users/sync-role-to-convex
 * Body: { userId: string (Clerk ID), role?: string (optional - if provided, updates Clerk first) }
 *
 * @security Requires super_admin role
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth()
    const { userId: callerId } = authResult

    if (!callerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Verify caller is super_admin
    const client = await clerkClient()
    const caller = await client.users.getUser(callerId)
    const callerRole = (caller.publicMetadata as ClerkPublicMetadata)?.role

    if (callerRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only super admins can sync roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role: requestedRole } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    // Prevent self-modification to avoid accidental lockout
    if (userId === callerId) {
      return NextResponse.json(
        { error: 'Cannot modify your own role. Use another super_admin account.' },
        { status: 403 }
      )
    }

    // Get target user from Clerk
    const targetUser = await client.users.getUser(userId)
    const currentClerkRole = (targetUser.publicMetadata as ClerkPublicMetadata)?.role

    let roleToSync: string

    if (requestedRole) {
      // Mode 1: Clerk-first update - update Clerk, then sync to Convex
      if (!isValidUserRole(requestedRole)) {
        return NextResponse.json(
          { error: `Invalid role: ${requestedRole}. Must be one of: ${VALID_USER_ROLES.join(', ')}` },
          { status: 400 }
        )
      }

      // Update Clerk first (source of truth)
      await client.users.updateUser(userId, {
        publicMetadata: {
          ...targetUser.publicMetadata,
          role: requestedRole,
        },
      })

      // CRITICAL: Verify Clerk was actually updated before syncing to Convex
      // This prevents desync if Clerk update failed silently or was rejected
      const verifiedUser = await client.users.getUser(userId)
      const verifiedClerkRole = (verifiedUser.publicMetadata as ClerkPublicMetadata)?.role

      if (verifiedClerkRole !== requestedRole) {
        return NextResponse.json(
          {
            error: `Clerk update verification failed. Expected "${requestedRole}" but Clerk has "${verifiedClerkRole}". Convex not updated.`,
          },
          { status: 500 }
        )
      }

      roleToSync = requestedRole
      console.log(`[API] Updated Clerk role for user ${userId}: ${currentClerkRole} → ${requestedRole}`)
    } else {
      // Mode 2: Sync from Clerk - read current Clerk role and sync to Convex
      if (!currentClerkRole) {
        return NextResponse.json(
          { error: 'User has no role in Clerk publicMetadata. Please set a role first.' },
          { status: 400 }
        )
      }

      if (!isValidUserRole(currentClerkRole)) {
        return NextResponse.json(
          { error: `Invalid role in Clerk: ${currentClerkRole}. Please fix in Clerk Dashboard first.` },
          { status: 400 }
        )
      }

      roleToSync = currentClerkRole
      console.log(`[API] Syncing existing Clerk role to Convex for user ${userId}: ${roleToSync}`)
    }

    const { token } = await requireConvexToken()

    // Validate university-affiliation constraints per CLAUDE.md role rules
    const UNIVERSITY_REQUIRED_ROLES = ['student', 'university_admin', 'advisor']
    const UNIVERSITY_FORBIDDEN_ROLES = ['individual']

    if (UNIVERSITY_REQUIRED_ROLES.includes(roleToSync) || UNIVERSITY_FORBIDDEN_ROLES.includes(roleToSync)) {
      const convexUser = await convexServer.query(
        api.users.getUserByClerkId,
        { clerkId: userId },
        token
      )

      if (UNIVERSITY_REQUIRED_ROLES.includes(roleToSync) && !convexUser?.university_id) {
        return NextResponse.json(
          {
            error: `Role "${roleToSync}" requires university affiliation. Please assign user to a university first.`,
          },
          { status: 400 }
        )
      }

      if (UNIVERSITY_FORBIDDEN_ROLES.includes(roleToSync) && convexUser?.university_id) {
        return NextResponse.json(
          {
            error: `Role "${roleToSync}" cannot have university affiliation. Please remove user from university first.`,
          },
          { status: 400 }
        )
      }
    }

    // Sync to Convex (Clerk is already source of truth at this point)
    await convexServer.mutation(
      api.users.updateUser,
      {
        clerkId: userId,
        updates: {
          role: roleToSync as UserRole,
        },
      },
      token
    )

    console.log(`[API] Synced role to Convex for user ${userId}: ${roleToSync}`)

    return NextResponse.json({
      success: true,
      message: requestedRole
        ? 'Role updated in Clerk and synced to Convex'
        : 'Role synced from Clerk to Convex',
      user: {
        id: targetUser.id,
        email: targetUser.emailAddresses[0]?.emailAddress || 'no-email',
        previousClerkRole: currentClerkRole || 'none',
        syncedRole: roleToSync,
      },
    })
  } catch (error) {
    console.error('[API] Sync to Convex error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync role to Convex',
      },
      { status: 500 }
    )
  }
}
