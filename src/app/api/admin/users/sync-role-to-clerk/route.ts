import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Update Clerk user role (manual sync utility)
 *
 * Updates a user's role in Clerk publicMetadata. Typically used to sync
 * a role from Convex to Clerk after detecting a mismatch, but the role
 * value must be provided in the request body (it is not automatically
 * fetched from Convex).
 *
 * POST /api/admin/users/sync-role-to-clerk
 * Body: { userId: string (Clerk ID), role: string }
 *
 * @security Requires super_admin role
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: callerId } = await auth()

    if (!callerId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Verify caller is super_admin
    const client = await clerkClient()
    const caller = await client.users.getUser(callerId)
    const callerRole = (caller.publicMetadata as any)?.role

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
    const allowedRoles = ['super_admin', 'university_admin', 'advisor', 'student', 'individual', 'staff', 'user']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role: ${role}. Must be one of: ${allowedRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Get target user
    const targetUser = await client.users.getUser(userId)

    // Update Clerk publicMetadata
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...targetUser.publicMetadata,
        role,
      },
    })

    console.log(`[API] Synced role to Clerk for ${targetUser.emailAddresses[0]?.emailAddress || targetUser.id}: ${role}`)

    return NextResponse.json({
      success: true,
      message: 'Role synced to Clerk successfully',
      user: {
        id: targetUser.id,
        email: targetUser.emailAddresses[0]?.emailAddress || 'no-email',
        role,
      },
    })
  } catch (error) {
    console.error('[API] Sync to Clerk error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync role to Clerk',
      },
      { status: 500 }
    )
  }
}
