import { auth } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { NextResponse } from 'next/server';

import { isValidConvexId } from '@/lib/convex-ids';
import { convexServer } from '@/lib/convex-server';

// POST /api/achievements/award { achievement_id }
export async function POST(request: Request) {
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = await getToken({ template: 'convex' });
  if (!token) {
    return NextResponse.json({ error: 'Failed to obtain auth token' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}) as any);
  const achievementId = body.achievement_id as string;
  if (!achievementId)
    return NextResponse.json({ error: 'achievement_id is required' }, { status: 400 });
  if (!isValidConvexId(achievementId))
    return NextResponse.json({ error: 'Invalid achievement ID format' }, { status: 400 });

  try {
    const id = await convexServer.mutation(
      api.achievements.awardAchievement,
      { clerkId: userId, achievement_id: achievementId as Id<'achievements'> },
      token,
    );
    return NextResponse.json({ userAchievementId: id }, { status: 201 });
  } catch (e: any) {
    const message =
      typeof e?.message === 'string' && e.message.includes('Already')
        ? 'Already earned'
        : 'Failed to award achievement';
    const status = message === 'Already earned' ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
