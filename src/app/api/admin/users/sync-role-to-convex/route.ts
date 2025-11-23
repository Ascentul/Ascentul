import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

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

    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
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

    // Get target user from Clerk
    const targetUser = await client.users.getUser(userId)

    // Update Convex
    const convex = new ConvexHttpClient(convexUrl)
    await convex.mutation(api.users.updateUser, {
      clerkId: userId,
      updates: {
        role: role as any,
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
