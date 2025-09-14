import { NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

// GET /api/achievements - list all available achievements (public read)
export async function GET() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
  const client = new ConvexHttpClient(url)
  try {
    let achievements = await client.query(api.achievements.getAllAchievements, {})
    if (!achievements || achievements.length === 0) {
      // Seed defaults if empty, then reload
      await client.mutation(api.achievements.seedDefaults, {})
      achievements = await client.query(api.achievements.getAllAchievements, {})
    }
    return NextResponse.json({ achievements })
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to load achievements' }, { status: 500 })
  }
}
