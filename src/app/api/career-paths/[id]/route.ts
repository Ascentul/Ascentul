import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { isValidConvexId } from '@/lib/convex-ids';
import { convexServer } from '@/lib/convex-server';

export const runtime = 'nodejs';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { userId, token } = await requireConvexToken();

    // Validate ID format before mutation
    if (!id || typeof id !== 'string' || id.trim() === '' || !isValidConvexId(id)) {
      return NextResponse.json({ error: 'Invalid career path ID' }, { status: 400 });
    }

    try {
      await convexServer.mutation(
        api.career_paths.deleteCareerPath,
        {
          clerkId: userId,
          id: id as Id<'career_paths'>,
        },
        token,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete career path';
      console.error('Delete career path error:', err);
      const lower = message.toLowerCase();
      if (lower.includes('not found')) {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      if (lower.includes('unauthorized')) {
        return NextResponse.json({ error: message }, { status: 403 });
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error('DELETE /api/career-paths/[id] error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
