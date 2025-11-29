import { NextRequest, NextResponse } from 'next/server'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { convexServer } from '@/lib/convex-server';
import { requireConvexToken } from '@/lib/convex-auth';
import { isValidConvexId } from '@/lib/convex-ids';

export const runtime = 'nodejs'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { userId, token } = await requireConvexToken()

    // Validate ID format before mutation
    if (!id || typeof id !== 'string' || id.trim() === '' || !isValidConvexId(id)) {
      return NextResponse.json({ error: 'Invalid career path ID' }, { status: 400 })
    }

    try {
      await convexServer.mutation(
        api.career_paths.deleteCareerPath,
        {
          clerkId: userId,
          id: id as Id<'career_paths'>,
        },
        token
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete career path'
      console.error('Delete career path error:', err)
      const lower = message.toLowerCase()
      const isClientError = lower.includes('not found') || lower.includes('unauthorized')
      return NextResponse.json({ error: message }, { status: isClientError ? 400 : 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error('DELETE /api/career-paths/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
