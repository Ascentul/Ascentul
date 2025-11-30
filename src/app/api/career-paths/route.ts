import { NextRequest, NextResponse } from 'next/server'
import { fetchQuery } from 'convex/nextjs'
import { api } from 'convex/_generated/api'
import { requireConvexToken } from '@/lib/convex-auth'

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
    const { userId, token } = await requireConvexToken()

    const { searchParams } = new URL(_request.url)
    const limit = Math.min(Math.max(parseInt(String(searchParams.get('limit') || '10')) || 10, 1), 50)
    const cursor = searchParams.get('cursor') || undefined
    // Note: sort parameter removed - Convex cursor-based pagination requires consistent
    // sort direction. Backend always returns newest first (desc order).

    const page = await fetchQuery(
      api.career_paths.getUserCareerPathsPaginated,
      { clerkId: userId, cursor, limit },
      { token }
    )

    // Map only those entries that contain a structured path we can render
    const items = (page?.items || []) as CareerPathDocument[]
    const paths = items
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

    return NextResponse.json({ paths, nextCursor: page?.nextCursor || null })
  } catch (error: unknown) {
    console.error('GET /api/career-paths error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
