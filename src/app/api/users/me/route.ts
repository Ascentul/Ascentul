import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
// Workaround for "Type instantiation is excessively deep" error in Convex
const api: any = require('convex/_generated/api').api

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
    const client = new ConvexHttpClient(url)
    const user = await client.query(api.users.getUserByClerkId, { clerkId: userId })
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}