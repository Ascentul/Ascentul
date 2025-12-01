import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

// GET /api/achievements - list all available achievements (public read)
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'achievements',
    httpMethod: 'GET',
    httpPath: '/api/achievements',
  });

  const startTime = Date.now();
  log.debug('Achievements list request started', { event: 'request.start' });

  try {
    // Public endpoint, but still pass token if available to satisfy auth in Convex if required
    let achievements;
    try {
      const { token } = await requireConvexToken();
      achievements = await convexServer.query(api.achievements.getAllAchievements, {}, token);
    } catch (authError) {
      // Only fall back if token is unavailable, not for other errors
      if (authError instanceof Error && authError.message.includes('token')) {
        achievements = await convexServer.query(api.achievements.getAllAchievements, {});
      } else {
        throw authError;
      }
    }

    const durationMs = Date.now() - startTime;
    log.debug('Achievements list request completed', {
      event: 'request.success',
      httpStatus: 200,
      durationMs,
      extra: { count: achievements?.length || 0 },
    });

    return NextResponse.json(
      { achievements },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (e: unknown) {
    const durationMs = Date.now() - startTime;
    log.error('Failed to load achievements', toErrorCode(e), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Failed to load achievements' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
