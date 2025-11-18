/**
 * Clerk Sync API Route
 * Handles Clerk account operations (ban/unban) for soft delete/restore
 * Called from Convex actions to sync account status with Clerk
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { disableClerkUser, enableClerkUser, deleteClerkUser } from '@/lib/clerkAdmin'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authenticated admin
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, clerkId } = body

    // Validate required fields (fail fast before expensive operations)
    if (!action || !clerkId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, clerkId' },
        { status: 400 }
      )
    }

    // CRITICAL: Verify super_admin role
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Initialize authenticated Convex client
    const convex = new ConvexHttpClient(convexUrl)
    const authResult = await auth()
    const token = await authResult.getToken({ template: 'convex' })

    if (token) {
      convex.setAuth(token)
    }

    const adminUser = await convex.query(api.users.getUserByClerkId, {
      clerkId: userId,
    })

    if (!adminUser || adminUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Super admin role required' },
        { status: 403 }
      )
    }

    // Perform the requested action
    if (action === 'disable') {
      // Get target user info for audit log
      const targetUser = await convex.query(api.users.getUserByClerkId, {
        clerkId: clerkId,
      })

      if (!targetUser) {
        return NextResponse.json(
          { error: 'Target user not found in database' },
          { status: 404 }
        )
      }

      await disableClerkUser(clerkId)

      // Audit log: Clerk account disabled
      try {
        await convex.mutation(api.audit_logs.createAuditLog, {
          action: 'clerk_user_disabled',
          target_type: 'user',
          target_id: targetUser._id,
          target_email: targetUser.email,
          target_name: targetUser.name,
          performed_by_id: adminUser._id,
          performed_by_email: adminUser.email,
          performed_by_name: adminUser.name,
          reason: 'Clerk account disabled (ban) via sync API',
        })
      } catch (auditError) {
        console.error('Failed to create audit log for Clerk disable:', auditError)
        // Don't fail the operation if audit logging fails
      }

      return NextResponse.json({
        success: true,
        message: 'Clerk user disabled successfully',
      })
    } else if (action === 'enable') {
      // Get target user info for audit log
      const targetUser = await convex.query(api.users.getUserByClerkId, {
        clerkId: clerkId,
      })

      if (!targetUser) {
        return NextResponse.json(
          { error: 'Target user not found in database' },
          { status: 404 }
        )
      }

      await enableClerkUser(clerkId)

      // Audit log: Clerk account enabled
      try {
        await convex.mutation(api.audit_logs.createAuditLog, {
          action: 'clerk_user_enabled',
          target_type: 'user',
          target_id: targetUser._id,
          target_email: targetUser.email,
          target_name: targetUser.name,
          performed_by_id: adminUser._id,
          performed_by_email: adminUser.email,
          performed_by_name: adminUser.name,
          reason: 'Clerk account enabled (unban) via sync API',
        })
      } catch (auditError) {
        console.error('Failed to create audit log for Clerk enable:', auditError)
        // Don't fail the operation if audit logging fails
      }

      return NextResponse.json({
        success: true,
        message: 'Clerk user enabled successfully',
      })
    } else if (action === 'delete') {
      // Permanently delete Clerk user (only for hard delete of test users)

      // DEFENSE-IN-DEPTH: Verify the target user is a test user
      const targetUser = await convex.query(api.users.getUserByClerkId, {
        clerkId: clerkId,
      })

      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        )
      }

      if (!targetUser.is_test_user) {
        return NextResponse.json(
          { error: 'Forbidden: Permanent deletion only allowed for test users' },
          { status: 403 }
        )
      }

      await deleteClerkUser(clerkId)

      // Audit log: Clerk account permanently deleted
      try {
        await convex.mutation(api.audit_logs.createAuditLog, {
          action: 'clerk_user_deleted',
          target_type: 'user',
          target_id: targetUser._id,
          target_email: targetUser.email,
          target_name: targetUser.name,
          performed_by_id: adminUser._id,
          performed_by_email: adminUser.email,
          performed_by_name: adminUser.name,
          reason: 'Clerk account permanently deleted via sync API (test user)',
          metadata: {
            isTestUser: true,
          },
        })
      } catch (auditError) {
        console.error('Failed to create audit log for Clerk delete:', auditError)
        // Don't fail the operation if audit logging fails
      }

      return NextResponse.json({
        success: true,
        message: 'Clerk user permanently deleted',
      })
    } else {
      return NextResponse.json(
        { error: `Invalid action: ${action}` },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Clerk sync API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync Clerk account',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
      },
      { status: 500 }
    )
  }
}
