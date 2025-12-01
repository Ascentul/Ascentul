/**
 * GDPR Data Export API Route
 *
 * Implements GDPR Article 15 (Right of Access) and Article 20 (Right to Data Portability)
 * Provides users with a downloadable JSON file containing all their personal data
 */

import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'gdpr',
    httpMethod: 'POST',
    httpPath: '/api/gdpr/export-data',
  });

  const startTime = Date.now();
  log.info('GDPR data export request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    // Get the user's data export
    let exportData;
    try {
      exportData = await convexServer.query(
        api.gdpr.getUserDataForExport,
        { clerkId: userId },
        token,
      );
    } catch (error) {
      // Log only error code to avoid PII leakage in GDPR context
      log.warn('Failed to fetch user data for export', {
        event: 'gdpr.export.failed',
        errorCode: toErrorCode(error),
      });
      return NextResponse.json(
        { error: 'Failed to export user data' },
        {
          status: 500,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    if (!exportData) {
      log.warn('No data found for user', { event: 'gdpr.export.no_data' });
      return NextResponse.json(
        { error: 'No data found for user' },
        {
          status: 404,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Format the JSON with proper indentation for readability
    const jsonContent = JSON.stringify(exportData, null, 2);

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const filename = `personal-data-export-${date}.json`;

    const durationMs = Date.now() - startTime;
    log.info('GDPR data export completed', {
      event: 'gdpr.export.success',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
    });

    // Return as downloadable JSON file
    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'x-correlation-id': correlationId,
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('GDPR data export request failed', toErrorCode(error), {
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

// GET endpoint for checking export status / initiating from browser
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'gdpr',
    httpMethod: 'GET',
    httpPath: '/api/gdpr/export-data',
  });

  const startTime = Date.now();
  log.info('GDPR export info request started', { event: 'request.start' });

  try {
    const { userId } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const durationMs = Date.now() - startTime;
    log.info('GDPR export info request completed', {
      event: 'request.success',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
    });

    // Return info about the export endpoint
    return NextResponse.json(
      {
        message: 'Use POST request to download your personal data',
        gdprArticles: ['Article 15 - Right of Access', 'Article 20 - Right to Data Portability'],
        format: 'JSON',
        instructions:
          'Submit a POST request to this endpoint to receive a downloadable JSON file containing all your personal data.',
      },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isAuthError = message === 'Unauthorized' || message === 'Failed to obtain auth token';
    log.error('GDPR export info request failed', toErrorCode(error), {
      event: 'request.error',
      httpStatus: isAuthError ? 401 : 500,
      durationMs,
    });
    return NextResponse.json(
      { error: isAuthError ? 'Unauthorized' : 'Internal server error' },
      {
        status: isAuthError ? 401 : 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
