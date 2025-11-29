import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { convexServer } from '@/lib/convex-server';

export const runtime = 'nodejs'
// Convex IDs use base32hex (digits 0-9 + letters A-V, case-insensitive)
const isValidId = (id: string) => /^[0-9a-v]+$/i.test(id.trim());

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Validate ID format before mutation
    const id = params.id
    if (!id || typeof id !== 'string' || id.trim() === '' || !isValidId(id)) {
      return NextResponse.json({ error: 'Invalid career path ID' }, { status: 400 })
    }

    try {
      await convexServer.mutation(api.career_paths.deleteCareerPath, {
        clerkId: userId,
        id: id as Id<'career_paths'>,
      })
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
