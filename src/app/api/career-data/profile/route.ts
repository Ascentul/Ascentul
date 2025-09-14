import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

function getClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) throw new Error('Convex URL not configured')
  return new ConvexHttpClient(url)
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const client = getClient()
    let user: any = null
    try {
      user = await client.query(api.users.getUserByClerkId, { clerkId: userId })
    } catch {
      // ignore; can still return a mock profile
    }

    // Build a lightweight profile shape used by the generator
    const profile = {
      name: user?.name || 'User',
      email: user?.email || undefined,
      currentRole: 'Professional',
      currentLevel: 'mid',
      skills: ['Communication', 'Problem Solving'],
      experienceYears: 3,
      education: [
        { degree: 'Bachelors', field: 'General Studies', institution: 'University' },
      ],
      workHistory: [],
    }

    return NextResponse.json(profile)
  } catch (error: any) {
    console.error('GET /api/career-data/profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
