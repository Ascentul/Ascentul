import { auth } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { NextResponse } from 'next/server';

// GET /api/achievements/user - list achievements earned by current user
export async function GET() {
  const { userId, getToken } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const token = await getToken({ template: 'convex' });
  if (!token) {
    return NextResponse.json({ error: 'Failed to obtain auth token' }, { status: 401 });
  }

  try {
    const userAchievements = await fetchQuery(
      api.achievements.getUserAchievements,
      { clerkId: userId },
      { token },
    );
    return NextResponse.json({ userAchievements });
  } catch (e) {
    console.error('Failed to load user achievements:', e);
    return NextResponse.json({ error: 'Failed to load user achievements' }, { status: 500 });
  }
}
