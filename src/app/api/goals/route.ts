import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { convexServer } from '@/lib/convex-server';

const mapGoal = (doc: any) => ({
  id: doc._id,
  title: doc.title,
  description: doc.description ?? '',
  status: doc.status,
  progress: doc.progress ?? 0,
  dueDate: doc.target_date ? new Date(doc.target_date).toISOString() : undefined,
  checklist: doc.checklist ?? [],
  created_at: doc.created_at,
  updated_at: doc.updated_at,
  completedAt: doc.completed_at ? new Date(doc.completed_at).toISOString() : undefined,
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const goals = await convexServer.query(api.goals.getUserGoals, { clerkId: userId })
    return NextResponse.json({ goals: goals.map(mapGoal) })
  } catch (error: any) {
    console.error('GET /api/goals error:', error)
    const msg = error?.message || 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (!body?.title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

    const args = {
      clerkId: userId,
      title: String(body.title),
      description: body.description ? String(body.description) : undefined,
      status: body.status || 'not_started',
      target_date: body.dueDate ? Date.parse(body.dueDate) : undefined,
      progress: typeof body.progress === 'number' ? body.progress : 0,
      checklist: Array.isArray(body.checklist) ? body.checklist : undefined,
      category: body.category ? String(body.category) : undefined,
    }
    const id = await convexServer.mutation(api.goals.createGoal, args)
    return NextResponse.json({ id }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/goals error:', error)
    const msg = error?.message || 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
