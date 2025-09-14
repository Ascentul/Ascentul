import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

// POST /api/achievements/award { achievement_id }
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
  const client = new ConvexHttpClient(url)

  const body = await request.json().catch(() => ({} as any))
  const achievementId = body.achievement_id as string
  if (!achievementId) return NextResponse.json({ error: 'achievement_id is required' }, { status: 400 })

  try {
    const id = await client.mutation(api.achievements.awardAchievement, { clerkId: userId, achievement_id: achievementId as any })
    return NextResponse.json({ userAchievementId: id }, { status: 201 })
  } catch (e: any) {
    const message = typeof e?.message === 'string' && e.message.includes('Already') ? 'Already earned' : 'Failed to award achievement'
    const status = message === 'Already earned' ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

