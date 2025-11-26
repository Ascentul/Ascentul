import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
// Workaround for "Type instantiation is excessively deep" error in Convex
const api: any = require('convex/_generated/api').api

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

async function upgradeToPremiumByClerkId(convexUrl: string, clerkId: string) {
  const client = new ConvexHttpClient(convexUrl)
  return client.mutation(api.users.updateUser, {
    clerkId,
    updates: {
      subscription_plan: 'premium',
      subscription_status: 'active',
    },
  })
}

async function upgradeToPremiumByConvexId(convexUrl: string, id: string) {
  const client = new ConvexHttpClient(convexUrl)
  return client.mutation(api.users.updateUserById, {
    id: id as any,
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
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || undefined
    const convexId = searchParams.get('convexId') || undefined

    // If a Convex user document ID is provided, prefer it
    if (convexId) {
      await upgradeToPremiumByConvexId(convexUrl, convexId)
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

    await upgradeToPremiumByClerkId(convexUrl, targetClerkId)

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
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })

    const body = await request.json().catch(() => ({})) as { email?: string, clerkId?: string, convexId?: string, id?: string }

    // Prefer explicit Convex user document ID if provided
    const providedConvexId = body.convexId || body.id
    if (providedConvexId) {
      await upgradeToPremiumByConvexId(convexUrl, providedConvexId)
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

    await upgradeToPremiumByClerkId(convexUrl, targetClerkId)

    return NextResponse.json({ success: true, clerkId: targetClerkId, plan: 'premium', status: 'active' }, { status: 200 })
  } catch (error) {
    console.error('grant-pro POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
