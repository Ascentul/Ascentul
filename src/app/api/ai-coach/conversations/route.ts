import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'ai-coach',
    httpMethod: 'GET',
    httpPath: '/api/ai-coach/conversations',
  });

  const startTime = Date.now();
  log.info('Conversations list request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const conversations = await convexServer.query(
      api.ai_coach.getConversations,
      { clerkId: userId },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Conversations list request completed', {
      event: 'request.success',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { count: conversations?.length ?? 0 },
    });

    return NextResponse.json(conversations, {
      headers: { 'x-correlation-id': correlationId },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Failed to fetch conversations';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Conversations list request failed', toErrorCode(error), {
      event: 'request.error',
      httpStatus: status,
      durationMs,
    });
    return NextResponse.json(
      { error: message },
      {
        status,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'ai-coach',
    httpMethod: 'POST',
    httpPath: '/api/ai-coach/conversations',
  });

  const startTime = Date.now();
  log.info('Conversation creation request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      log.warn('Missing required field: title', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
      });
      return NextResponse.json(
        { error: 'Title is required' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const newConversation = await convexServer.mutation(
      api.ai_coach.createConversation,
      { clerkId: userId, title },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Conversation created successfully', {
      event: 'data.created',
      clerkId: userId,
      httpStatus: 201,
      durationMs,
    });

    return NextResponse.json(newConversation, {
      status: 201,
      headers: { 'x-correlation-id': correlationId },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Failed to create conversation';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Conversation creation request failed', toErrorCode(error), {
      event: 'request.error',
      httpStatus: status,
      durationMs,
    });
    return NextResponse.json(
      { error: message },
      {
        status,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
