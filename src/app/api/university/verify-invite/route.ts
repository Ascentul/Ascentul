import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

/**
 * Verify a university invite token before signup.
 * Returns invite metadata (email, universityName, expiresAt) when valid.
 */
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'university',
    httpMethod: 'GET',
    httpPath: '/api/university/verify-invite',
  });

  const startTime = Date.now();
  log.info('University invite verification request started', { event: 'request.start' });

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      log.warn('Missing token', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Missing token' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const result = await convexServer.query(api.students.validateInviteToken, { token });

    const durationMs = Date.now() - startTime;
    log.info('University invite verification completed', {
      event: 'university.invite_verified',
      httpStatus: 200,
      durationMs,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: { 'x-correlation-id': correlationId },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    log.error('Invite verification failed', toErrorCode(error), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Invite verification failed' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
