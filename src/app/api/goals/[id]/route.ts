import { NextRequest, NextResponse } from 'next/server'
// Other imports continue below...
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { convexServer } from '@/lib/convex-server';
import { requireConvexToken } from '@/lib/convex-auth';
import { isValidConvexId } from '@/lib/convex-ids';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId, token } = await requireConvexToken()
    const { id: goalIdParam } = await context.params
    if (!goalIdParam || typeof goalIdParam !== 'string' || goalIdParam.trim() === '' || !isValidConvexId(goalIdParam)) {
      return NextResponse.json({ error: 'Invalid goal ID' }, { status: 400 })
    }
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

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

    await convexServer.mutation(
      api.goals.updateGoal,
      {
        clerkId: userId,
        goalId: goalIdParam as Id<'goals'>,
        updates,
      },
      token
    )
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('PUT /api/goals/[id] error:', error)
    const msg = error?.message || 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId, token } = await requireConvexToken()
    const { id: goalIdParam } = await context.params
    if (!goalIdParam || typeof goalIdParam !== 'string' || goalIdParam.trim() === '' || !isValidConvexId(goalIdParam)) {
      return NextResponse.json({ error: 'Invalid goal ID' }, { status: 400 })
    }
    await convexServer.mutation(
      api.goals.deleteGoal,
      { clerkId: userId, goalId: goalIdParam as Id<'goals'> },
      token
    )
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('DELETE /api/goals/[id] error:', error)
    const msg = error?.message || 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
