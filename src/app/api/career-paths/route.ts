import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { convexServer } from '@/lib/convex-server';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface CareerPathNode {
  id: string
  title: string
  level: string
  salaryRange: string
  yearsExperience: string
  skills: Array<{ name: string; level: string }>
  description: string
  growthPotential: string
  icon: string
}

interface CareerPathDocument {
  _id: string
  target_role?: string
  created_at: number
  steps?: {
    path?: {
      id?: string
      name?: string
      nodes?: CareerPathNode[]
    }
  }
}

interface CareerPathResponse {
  docId: string
  id: string
  name: string
  nodes: CareerPathNode[]
  savedAt: number
}

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(_request.url)
    const limit = Math.min(Math.max(parseInt(String(searchParams.get('limit') || '10')) || 10, 1), 50)
    const cursor = searchParams.get('cursor') || undefined
    const sort = (searchParams.get('sort') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'

    const page = await convexServer.query(api.career_paths.getUserCareerPathsPaginated, { clerkId: userId, cursor, limit }) as { items?: CareerPathDocument[]; continueCursor?: string } | null
    const items = (page?.items || []) as CareerPathDocument[]

    // Map only those entries that contain a structured path we can render
    let paths = items
      .map((doc): CareerPathResponse | null => {
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
      .filter((path): path is CareerPathResponse => path !== null)

    if (sort === 'asc') paths = paths.reverse()

    return NextResponse.json({ paths, nextCursor: page?.continueCursor || null })
  } catch (error: any) {
    console.error('GET /api/career-paths error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
