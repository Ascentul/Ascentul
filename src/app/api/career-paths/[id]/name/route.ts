import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { fetchMutation } from 'convex/nextjs'

export const runtime = 'nodejs'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const name = String(body?.name || '').trim()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    await fetchMutation(api.career_paths.updateCareerPathName, {
      clerkId: userId,
      id: params.id,
      name
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('PATCH /api/career-paths/[id]/name error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
