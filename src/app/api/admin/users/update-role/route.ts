import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Update user role via Clerk (source of truth)
 *
 * This endpoint:
 * 1. Verifies caller is super_admin
 * 2. Validates the role transition
 * 3. Updates Clerk publicMetadata.role
 * 4. Webhook automatically syncs to Convex
 *
 * POST /api/admin/users/update-role
 * Body: { userId: string, newRole: string, currentRole: string, universityId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get caller's role from Clerk
    const client = await clerkClient()
    const caller = await client.users.getUser(userId)
    const callerRole = (caller.publicMetadata as any)?.role

    // Only super_admin can update roles
    if (callerRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only super admins can update user roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId: targetUserId, newRole, currentRole, universityId } = body

    if (!targetUserId || !newRole) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, newRole' },
        { status: 400 }
      )
    }

    // Validate role is allowed
    const allowedRoles = ['super_admin', 'university_admin', 'advisor', 'student', 'individual', 'staff', 'user']
    if (!allowedRoles.includes(newRole)) {
      return NextResponse.json(
        { error: `Invalid role: ${newRole}` },
        { status: 400 }
      )
    }

    // Get target user from Clerk
    const targetUser = await client.users.getUser(targetUserId)
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Critical validation: prevent removing the last super_admin
    if (currentRole === 'super_admin' && newRole !== 'super_admin') {
      // Query Clerk for all super_admin users (excluding the target user)
      // LIMITATION: Clerk getUserList limits to 500 results per request
      // For large user bases, implement pagination or fail-safe approach
      const allUsers = await client.users.getUserList({ limit: 500 })

      // Fail-safe: If we hit the limit, we can't reliably verify all super_admins
      if (allUsers.data.length >= 500) {
        console.warn('[API] User base at/exceeds 500 - super_admin count may be incomplete. Failing safe.')
        return NextResponse.json(
          {
            error: 'Cannot safely verify super_admin count. User base too large for single query. Please contact support or implement pagination.'
          },
          { status: 400 }
        )
      }

      const otherSuperAdmins = allUsers.data.filter(
        u => (u.publicMetadata as any)?.role === 'super_admin' && u.id !== targetUserId
      )

      if (otherSuperAdmins.length === 0) {
        return NextResponse.json(
          { error: 'Cannot remove the last super admin. Assign another super admin first.' },
          { status: 400 }
        )
      }

      console.log(`[API] Downgrading super_admin. ${otherSuperAdmins.length} other super_admin(s) exist.`)
    }

    // Validate university requirements
    if ((newRole === 'student' || newRole === 'university_admin' || newRole === 'advisor') && !universityId) {
      return NextResponse.json(
        { error: `${newRole} role requires a university affiliation` },
        { status: 400 }
      )
    }

    // Validate university exists if provided
    if (universityId) {
      // Validate ID format before type assertion
      // Convex IDs are alphanumeric strings that start with a table identifier
      if (typeof universityId !== 'string' || universityId.trim().length === 0) {
        return NextResponse.json(
          { error: 'Invalid university ID format - must be a non-empty string' },
          { status: 400 }
        )
      }

      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
      if (!convexUrl) {
        return NextResponse.json(
          { error: 'Server configuration error: NEXT_PUBLIC_CONVEX_URL not set' },
          { status: 500 }
        )
      }

      const convex = new ConvexHttpClient(convexUrl)
      try {
        const university = await convex.query(api.universities.getUniversity, {
          universityId: universityId as Id<"universities">
        })

        if (!university) {
          return NextResponse.json(
            { error: 'Invalid university ID - university does not exist' },
            { status: 400 }
          )
        }

        // Warn if university is not active
        if (university.status !== 'active' && university.status !== 'trial') {
          console.warn(`[API] Assigning user to university with status: ${university.status}`)
        }
      } catch (error) {
        console.error('[API] University validation error:', error)
        return NextResponse.json(
          { error: 'Invalid university ID format' },
          { status: 400 }
        )
      }
    }

    // Update Clerk publicMetadata with new role
    await client.users.updateUser(targetUserId, {
      publicMetadata: {
        ...targetUser.publicMetadata,
        role: newRole,
        // Include university_id if provided
        ...(universityId ? { university_id: universityId } : {}),
      },
    })

    console.log(`[API] Updated role for user ${targetUser.emailAddresses[0]?.emailAddress || targetUser.id}: ${currentRole} → ${newRole}`)

    // The Clerk webhook will automatically sync this change to Convex

    return NextResponse.json({
      success: true,
      message: `Role updated successfully. Webhook will sync to database.`,
      user: {
        id: targetUser.id,
        email: targetUser.emailAddresses[0]?.emailAddress || 'no-email',
        newRole,
      },
    })
  } catch (error) {
    console.error('[API] Role update error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update role',
      },
      { status: 500 }
    )
  }
}
