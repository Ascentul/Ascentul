import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

/**
 * Validate a role transition
 *
 * POST /api/admin/users/validate-role
 * Body: { userId: string, currentRole: string, newRole: string, universityId?: string }
 * Returns: { valid: boolean, error?: string, warnings?: string[], requiredActions?: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { valid: false, error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    if (!convexUrl) {
      console.error('[API] Missing NEXT_PUBLIC_CONVEX_URL')
      return NextResponse.json(
        { valid: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { userId: targetUserId, currentRole, newRole, universityId } = body

    if (!targetUserId || !currentRole || !newRole) {
      return NextResponse.json(
        { valid: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use Convex query to validate (centralizes business logic)
    const convex = new ConvexHttpClient(convexUrl)

    const result = await convex.query(api.actions.roleValidation.validateRoleTransition, {
      userId: targetUserId,
      currentRole,
      newRole,
      universityId: universityId as Id<"universities"> | undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Role validation error:', error)
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      },
      { status: 500 }
    )
  }
}
