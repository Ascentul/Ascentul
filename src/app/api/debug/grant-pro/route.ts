import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { convexServer } from '@/lib/convex-server';

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

export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
    }

    const { userId } = getAuth(request)

    // Require authentication even in non-production
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify admin/super_admin role for security
    const user = await convexServer.query(api.users.getUserByClerkId, { clerkId: userId })
    const userRole = user?.role
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || undefined
    const convexId = searchParams.get('convexId') || undefined

    // If a Convex user document ID is provided, prefer it
    if (convexId) {
      await upgradeToPremiumByConvexId(convexId as Id<'users'>)
      return NextResponse.json({ success: true, convexId, plan: 'premium', status: 'active' }, { status: 200 })
    }

    let targetClerkId: string | null = null
    if (email) {
      targetClerkId = await findClerkUserIdByEmail(email, process.env.CLERK_SECRET_KEY)
    } else {
      targetClerkId = userId || null
    }

    if (!targetClerkId) {
      return NextResponse.json({ error: 'No target user found (sign in or provide ?email=)' }, { status: 400 })
    }

    await upgradeToPremiumByClerkId(targetClerkId)

    return NextResponse.json({ success: true, clerkId: targetClerkId, plan: 'premium', status: 'active' }, { status: 200 })
  } catch (error) {
    console.error('grant-pro GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Disabled in production' }, { status: 403 })
    }

    const { userId } = getAuth(request)

    // Require authentication even in non-production
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify admin/super_admin role for security
    const user = await convexServer.query(api.users.getUserByClerkId, { clerkId: userId })
    const userRole = user?.role
    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({})) as { email?: string, clerkId?: string, convexId?: string, id?: string }

    // Prefer explicit Convex user document ID if provided
    const providedConvexId = body.convexId || body.id
    if (providedConvexId) {
      await upgradeToPremiumByConvexId(providedConvexId as Id<'users'>)
      return NextResponse.json({ success: true, convexId: providedConvexId, plan: 'premium', status: 'active' }, { status: 200 })
    }

    let targetClerkId: string | null = null
    if (body.clerkId) {
      targetClerkId = body.clerkId
    } else if (body.email) {
      targetClerkId = await findClerkUserIdByEmail(body.email, process.env.CLERK_SECRET_KEY)
    } else {
      targetClerkId = userId || null
    }

    if (!targetClerkId) {
      return NextResponse.json({ error: 'No target user found (provide email/clerkId or sign in)' }, { status: 400 })
    }

    await upgradeToPremiumByClerkId(targetClerkId)

    return NextResponse.json({ success: true, clerkId: targetClerkId, plan: 'premium', status: 'active' }, { status: 200 })
  } catch (error) {
    console.error('grant-pro POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
