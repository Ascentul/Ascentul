import { NextResponse } from 'next/server'
import { api } from 'convex/_generated/api'
import { convexServer } from '@/lib/convex-server';

// GET /api/achievements - list all available achievements (public read)
export async function GET() {
  try {
    let achievements = await convexServer.query(api.achievements.getAllAchievements, {})
    if (!achievements || achievements.length === 0) {
      // Seed defaults if empty, then reload
      await convexServer.mutation(api.achievements.seedDefaults, {})
      achievements = await convexServer.query(api.achievements.getAllAchievements, {})
    }
    return NextResponse.json({ achievements })
  } catch (e: unknown) {
    console.error('Failed to load achievements:', e)
    return NextResponse.json({ error: 'Failed to load achievements' }, { status: 500 })
  }
}
