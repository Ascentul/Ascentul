import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

// GET /api/achievements/user - list achievements earned by current user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
  const client = new ConvexHttpClient(url)
  try {
    const userAchievements = await client.query(api.achievements.getUserAchievements, { clerkId: userId })
    return NextResponse.json({ userAchievements })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to load user achievements' }, { status: 500 })
  }
}
