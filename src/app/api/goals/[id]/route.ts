import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

function getClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL
  if (!url) throw new Error('Convex URL not configured')
  return new ConvexHttpClient(url)
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json().catch(() => ({} as any))

    const updates: any = {}
    if (typeof body.title === 'string') updates.title = body.title
    if (typeof body.description === 'string') updates.description = body.description
    if (typeof body.status === 'string') updates.status = body.status
    if (typeof body.progress === 'number') updates.progress = body.progress
    if (Array.isArray(body.checklist)) updates.checklist = body.checklist
    if (body.dueDate) updates.target_date = Date.parse(body.dueDate)
    if (body.target_date && typeof body.target_date === 'number') updates.target_date = body.target_date
    if (typeof body.category === 'string') updates.category = body.category
    if (typeof body.completed === 'boolean') updates.completed = body.completed

    const client = getClient()
    await client.mutation(api.goals.updateGoal, {
      clerkId: userId,
      goalId: context.params.id as any,
      updates,
    })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('PUT /api/goals/[id] error:', error)
    const msg = error?.message || 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const client = getClient()
    await client.mutation(api.goals.deleteGoal, { clerkId: userId, goalId: context.params.id as any })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DELETE /api/goals/[id] error:', error)
    const msg = error?.message || 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
