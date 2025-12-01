import { api } from 'convex/_generated/api';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';

export async function GET() {
  try {
    const { userId, token } = await requireConvexToken();

    const conversations = await fetchQuery(
      api.ai_coach.getConversations,
      { clerkId: userId },
      { token },
    );

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch conversations';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await requireConvexToken();

    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newConversation = await fetchMutation(
      api.ai_coach.createConversation,
      { clerkId: userId, title },
      { token },
    );

    return NextResponse.json(newConversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    const message = error instanceof Error ? error.message : 'Failed to create conversation';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
