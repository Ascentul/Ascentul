import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { convexServer } from '@/lib/convex-server';

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const authResult = await auth()
    const { userId } = authResult
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const token = await authResult.getToken({ template: 'convex' })
    if (!token) {
      return NextResponse.json({ error: 'Failed to obtain auth token' }, { status: 401 })
    }
    convexServer.setAuth(token)

    const user = await convexServer.query(api.users.getUserByClerkId, { clerkId: userId })
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
