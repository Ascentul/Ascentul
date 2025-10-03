import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch recommendations from Convex
    const recommendations = await convex.query(api.recommendations.getDailyRecommendations, {
      clerkId: userId,
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Error fetching daily recommendations:', error)
    return NextResponse.json({ error: 'Failed to fetch daily recommendations' }, { status: 500 })
  }
}
