import { auth } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

// GET /api/achievements/user - list achievements earned by current user
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'career-path',
    httpMethod: 'GET',
    httpPath: '/api/achievements/user',
  });

  const startTime = Date.now();
  log.debug('User achievements request started', { event: 'request.start' });

  const { userId, getToken } = await auth();
  if (!userId) {
    log.warn('User not authenticated', { event: 'auth.failed', errorCode: 'UNAUTHORIZED' });
    return NextResponse.json(
      { error: 'Unauthorized' },
      {
        status: 401,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
  log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

  const token = await getToken({ template: 'convex' });
  if (!token) {
    log.warn('Failed to obtain auth token', {
      event: 'auth.token_failed',
      errorCode: 'UNAUTHORIZED',
    });
    return NextResponse.json(
      { error: 'Failed to obtain auth token' },
      {
        status: 401,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }

  try {
    const userAchievements = await fetchQuery(
      api.achievements.getUserAchievements,
      { clerkId: userId },
      { token },
    );

    const durationMs = Date.now() - startTime;
    log.debug('User achievements request completed', {
      event: 'request.success',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { count: userAchievements?.length || 0 },
    });

    return NextResponse.json(
      { userAchievements },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (e) {
    const durationMs = Date.now() - startTime;
    log.error('Failed to load user achievements', toErrorCode(e), {
      event: 'request.error',
      clerkId: userId,
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Failed to load user achievements' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
