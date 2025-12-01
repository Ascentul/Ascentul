import { auth } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { fetchMutation } from 'convex/nextjs';
import { NextRequest, NextResponse } from 'next/server';

import { isValidConvexId } from '@/lib/convex-ids';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'career-path',
    httpMethod: 'PATCH',
    httpPath: '/api/career-paths/[id]/name',
  });

  const startTime = Date.now();
  log.info('Career path rename request started', { event: 'request.start' });

  try {
    const { id } = await params;
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

    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || '').trim();
    if (!name) {
      log.warn('Name is required', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'name is required' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Validate ID format using Convex ID pattern
    if (!isValidConvexId(id)) {
      log.warn('Invalid career path ID', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Invalid career path ID' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    await fetchMutation(
      api.career_paths.updateCareerPathName,
      {
        clerkId: userId,
        id: id as Id<'career_paths'>,
        name,
      },
      { token },
    );

    const durationMs = Date.now() - startTime;
    log.info('Career path renamed successfully', {
      event: 'data.updated',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
    });

    return NextResponse.json(
      { ok: true },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    log.error('Career path rename request failed', toErrorCode(error), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
