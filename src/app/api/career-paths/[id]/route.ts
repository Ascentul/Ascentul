import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { convexServer } from '@/lib/convex-server';

export const runtime = 'nodejs'

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Validate ID format before mutation
    const id = params.id
    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json({ error: 'Invalid career path ID' }, { status: 400 })
    }

    await convexServer.mutation(api.career_paths.deleteCareerPath, { clerkId: userId, id: id as Id<'career_paths'> })

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error('DELETE /api/career-paths/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
