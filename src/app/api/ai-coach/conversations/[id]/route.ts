import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'ai-coach',
    httpMethod: 'GET',
    httpPath: '/api/ai-coach/conversations/[id]',
  });

  const startTime = Date.now();

  try {
    const { userId } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const { id: conversationId } = await params;
    log.debug('Fetching conversation messages', { extra: { conversationId } });

    // For now, return empty array as messages might not be fully implemented
    // In a real implementation, this would fetch messages for the specific conversation
    const durationMs = Date.now() - startTime;
    log.info('Conversation messages fetched', {
      event: 'request.success',
      httpStatus: 200,
      durationMs,
    });

    return NextResponse.json([], {
      headers: { 'x-correlation-id': correlationId },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    log.error('Failed to fetch conversation messages', toErrorCode(error), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
