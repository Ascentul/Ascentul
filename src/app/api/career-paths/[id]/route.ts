import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { isValidConvexId } from '@/lib/convex-ids';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export const runtime = 'nodejs';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const correlationId = getCorrelationIdFromRequest(_request);
  const log = createRequestLogger(correlationId, {
    feature: 'career-path',
    httpMethod: 'DELETE',
    httpPath: '/api/career-paths/[id]',
  });

  const startTime = Date.now();
  log.info('Career path delete request started', { event: 'request.start' });

  try {
    const { id } = await params;
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    // Validate ID format before mutation
    if (!id || typeof id !== 'string' || id.trim() === '' || !isValidConvexId(id)) {
      log.warn('Invalid career path ID', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Invalid career path ID' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    try {
      await convexServer.mutation(
        api.career_paths.deleteCareerPath,
        {
          clerkId: userId,
          id: id as Id<'career_paths'>,
        },
        token,
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete career path';
      const lower = message.toLowerCase();
      if (lower.includes('not found')) {
        log.warn('Career path not found', { event: 'data.not_found', errorCode: 'NOT_FOUND' });
        return NextResponse.json(
          { error: message },
          {
            status: 404,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }
      if (lower.includes('unauthorized')) {
        log.warn('Unauthorized to delete career path', {
          event: 'auth.forbidden',
          errorCode: 'FORBIDDEN',
        });
        return NextResponse.json(
          { error: message },
          {
            status: 403,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }
      log.error('Career path deletion failed', toErrorCode(err), {
        event: 'data.delete_failed',
        httpStatus: 500,
      });
      return NextResponse.json(
        { error: message },
        {
          status: 500,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const durationMs = Date.now() - startTime;
    log.info('Career path deleted successfully', {
      event: 'data.deleted',
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
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Career path delete request failed', toErrorCode(error), {
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
