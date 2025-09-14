import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

export const runtime = 'nodejs'

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })

    const client = new ConvexHttpClient(url)
    await client.mutation(api.career_paths.deleteCareerPath, { clerkId: userId, id: params.id as any })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DELETE /api/career-paths/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
