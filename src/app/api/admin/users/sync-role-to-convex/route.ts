import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { ClerkPublicMetadata } from '@/types/clerk'
import { VALID_USER_ROLES, UserRole } from '@/lib/constants/roles'
import { isValidUserRole } from '@/lib/validation/roleValidation'
import { convexServer } from '@/lib/convex-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Update Convex user role (manual sync utility)
 *
 * Updates a user's role in the Convex database. Typically used to sync
 * a role from Clerk to Convex after detecting a mismatch, but the role
 * value must be provided in the request body (it is not automatically
 * fetched from Clerk).
 *
 * POST /api/admin/users/sync-role-to-convex
 * Body: { userId: string (Clerk ID), role: string }
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
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, role' },
        { status: 400 }
      )
    }

    // Validate role is allowed
    if (!isValidUserRole(role)) {
      return NextResponse.json(
        { error: `Invalid role: ${role}. Must be one of: ${VALID_USER_ROLES.join(', ')}` },
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

    // Update Convex (Clerk-first; Convex sync)
    await convexServer.mutation(api.users.updateUser, {
      clerkId: userId,
      updates: {
        role: role as UserRole,
      },
    })

    console.log(`[API] Synced role to Convex for ${targetUser.emailAddresses[0]?.emailAddress || targetUser.id}: ${role}`)

    return NextResponse.json({
      success: true,
      message: 'Role synced to Convex successfully',
      user: {
        id: targetUser.id,
        email: targetUser.emailAddresses[0]?.emailAddress || 'no-email',
        role,
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
