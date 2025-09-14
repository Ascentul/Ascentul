import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
    const client = new ConvexHttpClient(url)

    const { searchParams } = new URL(_request.url)
    const limit = Math.min(Math.max(parseInt(String(searchParams.get('limit') || '10')) || 10, 1), 50)
    const cursor = searchParams.get('cursor') || undefined
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'

    const page = await client.query(api.career_paths.getUserCareerPathsPaginated, { clerkId: userId, cursor: cursor as any, limit })
    const items: any[] = page?.items || []

    // Map only those entries that contain a structured path we can render
    let paths = (items || [])
      .map((doc: any) => {
        const p = doc?.steps?.path
        if (!p || !Array.isArray(p?.nodes)) return null
        return {
          docId: doc._id,
          id: p.id || doc._id,
          name: p.name || doc.target_role || 'Career Path',
          nodes: p.nodes,
          savedAt: doc.created_at,
        }
      })
      .filter(Boolean) as any[]

    if (sort === 'asc') paths = paths.reverse()

    return NextResponse.json({ paths, nextCursor: page?.nextCursor || null })
  } catch (error: any) {
    console.error('GET /api/career-paths error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
