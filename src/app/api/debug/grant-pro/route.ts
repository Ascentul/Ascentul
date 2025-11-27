import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { convexServer } from '@/lib/convex-server';

async function requireAdminAuth(_request: NextRequest): Promise<{ userId: string } | { error: NextResponse }> {
  if (process.env.NODE_ENV === 'production') {
    return { error: NextResponse.json({ error: 'Disabled in production' }, { status: 403 }) }
  }

  const { userId } = await auth()

  if (!userId) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }
  }

  try {
    const user = await convexServer.query(api.users.getUserByClerkId, { clerkId: userId })
    const userRole = user?.role
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
    }
  } catch (error) {
    console.error('requireAdminAuth: Failed to fetch user', error)
    return { error: NextResponse.json({ error: 'Authentication failed' }, { status: 401 }) }
  }

  return { userId }
}

async function findClerkUserIdByEmail(email: string, clerkSecret?: string): Promise<string | null> {
  try {
    if (!clerkSecret) return null
    const url = new URL('https://api.clerk.com/v1/users')
    url.searchParams.set('email_address', email)
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${clerkSecret}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    const items = Array.isArray(data) ? data : (data?.data || [])
    const first = items?.[0]
    return first?.id || null
  } catch {
    return null
  }
}

async function upgradeToPremiumByClerkId(clerkId: string) {
  return convexServer.mutation(api.users.updateUser, {
    clerkId,
    updates: {
      subscription_plan: 'premium',
      subscription_status: 'active',
    },
  })
}

async function upgradeToPremiumByConvexId(id: Id<'users'>) {
  return convexServer.mutation(api.users.updateUserById, {
    id,
    updates: {
      subscription_plan: 'premium',
      subscription_status: 'active',
    },
  })
}

async function processUpgrade(params: {
  convexId?: string
  email?: string
  clerkId?: string
  fallbackUserId: string
}): Promise<NextResponse> {
  const { convexId, email, clerkId, fallbackUserId } = params

  // Handle convexId path
  if (convexId) {
    // Validate convexId format before casting
    // Convex IDs use Crockford's Base32 encoding which excludes i, l, o, u
    // to avoid confusion with similar-looking characters (1/I/l, 0/O)
    if (!convexId.match(/^[0-9a-hj-km-np-tv-z]+$/)) {
      return NextResponse.json({
        error: 'Invalid convexId format',
        detail: 'Convex IDs must be Crockford Base32 encoded (0-9, a-h, j-k, m-n, p-z, excluding i, l, o, u)',
        provided: convexId,
      }, { status: 400 })
    }

    try {
      await upgradeToPremiumByConvexId(convexId as Id<'users'>)
    } catch (error) {
      console.error('Failed to upgrade by convexId:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return NextResponse.json({
        error: 'Failed to upgrade user by convexId',
        detail: errorMessage,
        convexId,
      }, { status: 400 })
    }
    return NextResponse.json({ success: true, convexId, plan: 'premium', status: 'active' }, { status: 200 })
  }

  // Determine target clerk ID
  let targetClerkId: string | null = null
  if (clerkId) {
    targetClerkId = clerkId
  } else if (email) {
    targetClerkId = await findClerkUserIdByEmail(email, process.env.CLERK_SECRET_KEY)
  } else {
    targetClerkId = fallbackUserId
  }

  if (!targetClerkId) {
    return NextResponse.json({
      error: 'No target user found',
      detail: email ? 'No Clerk user found with provided email' : 'Unable to resolve user from provided parameters',
      params: { emailProvided: !!email, clerkIdProvided: !!clerkId, fallbackUsed: !email && !clerkId },
    }, { status: 400 })
  }

  try {
    await upgradeToPremiumByClerkId(targetClerkId)
    return NextResponse.json({ success: true, clerkId: targetClerkId, plan: 'premium', status: 'active' }, { status: 200 })
  } catch (error) {
    console.error('Failed to upgrade by clerkId:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      error: 'Failed to upgrade user by clerkId',
      detail: errorMessage,
      clerkId: targetClerkId,
    }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    if ('error' in authResult) return authResult.error

    const { searchParams } = new URL(request.url)
    return await processUpgrade({
      convexId: searchParams.get('convexId') || undefined,
      email: searchParams.get('email') || undefined,
      clerkId: searchParams.get('clerkId') || undefined,
      fallbackUserId: authResult.userId,
    })
  } catch (error) {
    console.error('grant-pro GET error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAuth(request)
    if ('error' in authResult) return authResult.error

    const body = await request.json().catch(() => ({})) as { email?: string, clerkId?: string, convexId?: string, id?: string }
    return await processUpgrade({
      convexId: body.convexId || body.id,
      email: body.email,
      clerkId: body.clerkId,
      fallbackUserId: authResult.userId,
    })
  } catch (error) {
    console.error('grant-pro POST error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
