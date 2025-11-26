import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { ClerkPublicMetadata } from '@/types/clerk'
import { VALID_USER_ROLES } from '@/lib/constants/roles'
import { isValidUserRole } from '@/lib/validation/roleValidation'

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
 * Body: { userId: string, newRole: string, universityId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth()
    const { userId } = authResult

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    // Get caller's role from Clerk
    const client = await clerkClient()
    const caller = await client.users.getUser(userId)
    const callerRole = (caller.publicMetadata as ClerkPublicMetadata)?.role

    // Only super_admin can update roles
    if (callerRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only super admins can update user roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId: targetUserId, newRole, universityId } = body

    if (!targetUserId || !newRole) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, newRole' },
        { status: 400 }
      )
    }

    // Validate role is allowed
    if (!isValidUserRole(newRole)) {
      return NextResponse.json(
        { error: `Invalid role: ${newRole}` },
        { status: 400 }
      )
    }

    // Prevent self-modification to avoid accidental lockout
    if (targetUserId === userId) {
      return NextResponse.json(
        { error: 'Cannot modify your own role. Use another super_admin account.' },
        { status: 403 }
      )
    }

    // Get target user from Clerk
    // Note: getUser() throws ClerkAPIResponseError if user not found
    let targetUser
    try {
      targetUser = await client.users.getUser(targetUserId)
    } catch (error: any) {
      if (error?.status === 404 || error?.errors?.[0]?.code === 'resource_not_found') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      throw error // Re-throw other errors to be caught by outer catch
    }

    // Extract current role from Clerk (source of truth, don't trust client)
    const currentRole = (targetUser.publicMetadata as ClerkPublicMetadata)?.role

    // Critical validation: prevent changing the super_admin role
    // BUSINESS RULE: There is only ONE super_admin (the founder).
    // The super_admin role should never be changed through the admin UI.
    // This prevents accidental lockout from the platform.
    //
    // If the founder needs to change their role for testing, they must:
    // 1. Use Clerk Dashboard to manually update publicMetadata.role
    // 2. Or temporarily disable this check in code
    if (currentRole === 'super_admin' && newRole !== 'super_admin') {
      return NextResponse.json(
        {
          error: 'Cannot change super_admin role. This role is reserved for the platform founder and cannot be modified through the admin interface. Use Clerk Dashboard for emergency role changes.'
        },
        { status: 403 }
      )
    }

    // Validate university requirements
    if ((newRole === 'student' || newRole === 'university_admin' || newRole === 'advisor') && !universityId) {
      return NextResponse.json(
        { error: `${newRole} role requires a university affiliation` },
        { status: 400 }
      )
    }

    // Prevent university_id for non-university roles
    if (newRole === 'individual' && universityId) {
      return NextResponse.json(
        { error: 'Individual role cannot have university affiliation' },
        { status: 400 }
      )
    }

    // Initialize Convex client early (used for validation and updates)
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Server configuration error: NEXT_PUBLIC_CONVEX_URL not set' },
        { status: 500 }
      )
    }
    const convex = new ConvexHttpClient(convexUrl)
    const convexToken = await authResult.getToken({ template: 'convex' })
    if (convexToken) {
      convex.setAuth(convexToken)
    }

    // Validate university exists if provided
    if (universityId) {
      // Validate ID format before querying
      // Convex IDs are URL-safe base32-encoded strings
      if (typeof universityId !== 'string' || universityId.trim().length === 0) {
        return NextResponse.json(
          { error: 'Invalid university ID format - must be a non-empty string' },
          { status: 400 }
        )
      }

      // Basic format check: Convex IDs are alphanumeric with possible underscores
      // More thorough validation happens when querying Convex
      if (!/^[a-z0-9_]+$/i.test(universityId)) {
        return NextResponse.json(
          { error: 'Invalid university ID format - contains invalid characters' },
          { status: 400 }
        )
      }

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
          { error: 'Invalid university ID format or university does not exist' },
          { status: 400 }
        )
      }
    }

    // Determine if we should remove university_id
    const requiresUniversity = ['student', 'university_admin', 'advisor'].includes(newRole)

    // Update Convex first (source of truth)
    await convex.mutation(api.users.updateUser, {
      clerkId: targetUserId,
      updates: {
        role: newRole as any,
        ...(requiresUniversity && universityId ? { university_id: universityId as Id<"universities"> } : {}),
      },
    })

    // Then mirror to Clerk metadata
    try {
      const newMetadata: Record<string, any> = {
        ...targetUser.publicMetadata,
        role: newRole,
      }

      if (requiresUniversity && universityId) {
        newMetadata.university_id = universityId
      } else if (!requiresUniversity) {
        delete newMetadata.university_id
      }

      await client.users.updateUser(targetUserId, {
        publicMetadata: newMetadata,
      })
    } catch (clerkError) {
      console.error(`[API] Clerk update failed after Convex success for user ${targetUserId}:`, clerkError)
      // Consider: revert Convex or mark for retry
      throw clerkError
    }

    console.log(`[API] Updated role for user ${targetUser.id}: ${currentRole} → ${newRole}`)

    return NextResponse.json({
      success: true,
      message: `Role updated successfully. Convex updated as source of truth.`,
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
