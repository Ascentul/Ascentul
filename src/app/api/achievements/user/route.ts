import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { convexServer } from '@/lib/convex-server';

// GET /api/achievements/user - list achievements earned by current user
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const userAchievements = await convexServer.query(api.achievements.getUserAchievements, { clerkId: userId })
    return NextResponse.json({ userAchievements })
  } catch (e: any) {
    console.error('Failed to load user achievements:', e)
    return NextResponse.json({ error: 'Failed to load user achievements' }, { status: 500 })
  }
}
