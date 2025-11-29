import { NextResponse } from 'next/server'
import { api } from 'convex/_generated/api'
import { convexServer } from '@/lib/convex-server';
import { requireConvexToken } from '@/lib/convex-auth';

// GET /api/achievements - list all available achievements (public read)
export async function GET() {
  try {
    // Public endpoint, but still pass token if available to satisfy auth in Convex if required
    let achievements
    try {
      const { token } = await requireConvexToken()
      achievements = await convexServer.query(api.achievements.getAllAchievements, {}, token)
    } catch {
      // Fallback to unauthenticated if token not available
      achievements = await convexServer.query(api.achievements.getAllAchievements, {})
    }
    return NextResponse.json({ achievements })
  } catch (e: unknown) {
    console.error('Failed to load achievements:', e)
    return NextResponse.json({ error: 'Failed to load achievements' }, { status: 500 })
  }
}
