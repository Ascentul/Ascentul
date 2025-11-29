import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { convexServer } from '@/lib/convex-server';

// Convex IDs use Crockford base32hex (digits + a-hjkmnpqrstvwxyz; excludes i,l,o,u)
const isValidId = (id: string) => /^[0-9a-hjkmnpqrstv-z]+$/i.test(id.trim());

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: goalIdParam } = await context.params
    if (!goalIdParam || typeof goalIdParam !== 'string' || goalIdParam.trim() === '' || !isValidId(goalIdParam)) {
      return NextResponse.json({ error: 'Invalid goal ID' }, { status: 400 })
    }
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
    if (body.completedAt) updates.completed_at = Date.parse(body.completedAt)
    // When completedAt is explicitly null, set to undefined so Convex clears the timestamp
    if (body.completedAt === null) updates.completed_at = undefined

    await convexServer.mutation(api.goals.updateGoal, {
      clerkId: userId,
      goalId: goalIdParam as Id<'goals'>,
      updates,
    })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('PUT /api/goals/[id] error:', error)
    const msg = error?.message || 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: goalIdParam } = await context.params
    if (!goalIdParam || typeof goalIdParam !== 'string' || goalIdParam.trim() === '' || !isValidId(goalIdParam)) {
      return NextResponse.json({ error: 'Invalid goal ID' }, { status: 400 })
    }
    await convexServer.mutation(api.goals.deleteGoal, { clerkId: userId, goalId: goalIdParam as Id<'goals'> })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DELETE /api/goals/[id] error:', error)
    const msg = error?.message || 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
