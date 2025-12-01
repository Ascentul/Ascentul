import { auth } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await authResult.getToken({ template: 'convex' });
    if (!token) {
      return NextResponse.json({ error: 'Failed to obtain auth token' }, { status: 401 });
    }

    // Fetch recommendations from Convex
    const recommendations = await fetchQuery(
      api.recommendations.getDailyRecommendations,
      {
        clerkId: userId,
      },
      { token },
    );

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error fetching daily recommendations:', error);
    return NextResponse.json({ error: 'Failed to fetch daily recommendations' }, { status: 500 });
  }
}
