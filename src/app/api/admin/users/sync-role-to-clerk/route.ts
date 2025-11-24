import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'
import { ClerkPublicMetadata } from '@/types/clerk'
import { VALID_USER_ROLES } from '@/lib/constants/roles'
import { isValidUserRole } from '@/lib/validation/roleValidation'

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

    // Prevent self-modification to avoid accidental lockout
    if (userId === callerId) {
      return NextResponse.json(
        { error: 'Cannot modify your own role. Use another super_admin account.' },
        { status: 403 }
      )
    }

    // Validate role is allowed
    if (!isValidUserRole(role)) {
      return NextResponse.json(
        { error: `Invalid role: ${role}. Must be one of: ${VALID_USER_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    // Get target user
    const targetUser = await client.users.getUser(userId)
    const oldRole = (targetUser.publicMetadata as ClerkPublicMetadata)?.role

    // Update Clerk publicMetadata
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...targetUser.publicMetadata,
        role,
      },
    })

    console.log(`[API] Synced role to Clerk for user ${targetUser.id}: ${oldRole} → ${role}`)

    // Create audit log entry
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (convexUrl) {
      try {
        const convex = new ConvexHttpClient(convexUrl)

        // Get caller's Convex user for audit log
        const callerConvexUser = await convex.query(api.users.getUserByClerkId, {
          clerkId: callerId,
        })

        if (callerConvexUser) {
          await convex.mutation(api.audit_logs.createAuditLog, {
            action: 'sync_role_to_clerk',
            target_type: 'user',
            target_id: userId,
            target_email: targetUser.emailAddresses[0]?.emailAddress,
            target_name: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim(),
            performed_by_id: callerConvexUser._id,
            performed_by_email: caller.emailAddresses[0]?.emailAddress,
            performed_by_name: `${caller.firstName || ''} ${caller.lastName || ''}`.trim(),
            reason: 'Manual role sync from Convex to Clerk',
            metadata: {
              old_role: oldRole,
              new_role: role,
              sync_direction: 'convex_to_clerk',
            },
          })
        }
      } catch (auditError) {
        // Don't fail the operation if audit logging fails
        console.error('[API] Failed to create audit log:', auditError)
      }
    }

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
