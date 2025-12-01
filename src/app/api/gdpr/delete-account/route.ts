/**
 * GDPR Account Deletion API Route
 *
 * Implements GDPR Article 17 (Right to Erasure / Right to be Forgotten)
 * Provides users with the ability to request account deletion with a 30-day grace period
 */

import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST - Request account deletion
 */
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'gdpr',
    httpMethod: 'POST',
    httpPath: '/api/gdpr/delete-account',
  });

  const startTime = Date.now();
  log.info('GDPR account deletion request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    // Parse request body for optional reason (do not log reason - may contain PII)
    let body: { reason?: string; immediateDelete?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    // Request account deletion
    let result;
    try {
      result = await convexServer.mutation(
        api.gdpr.requestAccountDeletion,
        {
          reason: body.reason,
          immediateDelete: body.immediateDelete,
        },
        token,
      );
    } catch (error: unknown) {
      log.warn('Failed to request account deletion', {
        event: 'gdpr.deletion.failed',
        errorCode: toErrorCode(error),
      });
      const message = error instanceof Error ? error.message : 'Failed to request account deletion';
      return NextResponse.json(
        { error: message },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const durationMs = Date.now() - startTime;
    log.info('GDPR account deletion requested', {
      event: 'gdpr.deletion.requested',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { immediateDelete: body.immediateDelete ?? false },
    });

    return NextResponse.json(result, {
      status: 200,
      headers: { 'x-correlation-id': correlationId },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('GDPR account deletion request failed', toErrorCode(error), {
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

/**
 * DELETE - Cancel a pending deletion request
 */
export async function DELETE(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'gdpr',
    httpMethod: 'DELETE',
    httpPath: '/api/gdpr/delete-account',
  });

  const startTime = Date.now();
  log.info('GDPR deletion cancellation request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    // Cancel deletion request
    let result;
    try {
      result = await convexServer.mutation(api.gdpr.cancelAccountDeletion, {}, token);
    } catch (error: unknown) {
      log.warn('Failed to cancel account deletion', {
        event: 'gdpr.cancellation.failed',
        errorCode: toErrorCode(error),
      });
      const message = error instanceof Error ? error.message : 'Failed to cancel deletion request';
      return NextResponse.json(
        { error: message },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const durationMs = Date.now() - startTime;
    log.info('GDPR deletion cancelled', {
      event: 'gdpr.deletion.cancelled',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: { 'x-correlation-id': correlationId },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('GDPR deletion cancellation request failed', toErrorCode(error), {
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

/**
 * GET - Check deletion status
 */
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'gdpr',
    httpMethod: 'GET',
    httpPath: '/api/gdpr/delete-account',
  });

  const startTime = Date.now();
  log.info('GDPR deletion status request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    // Get deletion status
    let deletionStatus;
    try {
      deletionStatus = await convexServer.query(api.gdpr.getDeletionStatus, {}, token);
    } catch (error) {
      log.warn('Failed to fetch deletion status', {
        event: 'gdpr.status.failed',
        errorCode: toErrorCode(error),
      });
      return NextResponse.json(
        { error: 'Failed to fetch deletion status' },
        {
          status: 500,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const durationMs = Date.now() - startTime;
    log.info('GDPR deletion status fetched', {
      event: 'request.success',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
    });

    return NextResponse.json(deletionStatus || { hasPendingDeletion: false }, {
      status: 200,
      headers: { 'x-correlation-id': correlationId },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Failed to check deletion status';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('GDPR deletion status request failed', toErrorCode(error), {
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
