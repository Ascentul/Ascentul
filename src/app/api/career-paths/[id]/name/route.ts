import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

export const runtime = 'nodejs'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const name = String(body?.name || '').trim()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })

    const client = new ConvexHttpClient(url)
    await client.mutation(api.career_paths.updateCareerPathName, { clerkId: userId, id: params.id as any, name })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('PATCH /api/career-paths/[id]/name error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
