import { auth } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'ai-coach',
    httpMethod: 'GET',
    httpPath: '/api/recommendations/daily',
  });

  const startTime = Date.now();
  log.debug('Daily recommendations request started', { event: 'request.start' });

  try {
    const authResult = await auth();
    const { userId } = authResult;

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

    const token = await authResult.getToken({ template: 'convex' });
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

    // Fetch recommendations from Convex
    const recommendations = await fetchQuery(
      api.recommendations.getDailyRecommendations,
      {
        clerkId: userId,
      },
      { token },
    );

    const durationMs = Date.now() - startTime;
    log.debug('Daily recommendations request completed', {
      event: 'request.success',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
    });

    return NextResponse.json(recommendations, {
      headers: { 'x-correlation-id': correlationId },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    log.error('Error fetching daily recommendations', toErrorCode(error), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Failed to fetch daily recommendations' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
