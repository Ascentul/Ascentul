import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export const dynamic = 'force-dynamic';

type CoverLetterSource = 'manual' | 'ai_generated' | 'ai_optimized' | 'pdf_upload';
const ALLOWED_SOURCES = new Set<CoverLetterSource>([
  'manual',
  'ai_generated',
  'ai_optimized',
  'pdf_upload',
]);

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'cover-letter',
    httpMethod: 'GET',
    httpPath: '/api/cover-letters',
  });

  const startTime = Date.now();
  log.info('Cover letters list request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const coverLetters = await convexServer.query(
      api.cover_letters.getUserCoverLetters,
      { clerkId: userId },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Cover letters list request completed', {
      event: 'request.success',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { count: coverLetters?.length ?? 0 },
    });

    return NextResponse.json(
      { coverLetters },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    log.error('Cover letters list request failed', toErrorCode(error), {
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

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'cover-letter',
    httpMethod: 'POST',
    httpPath: '/api/cover-letters',
  });

  const startTime = Date.now();
  log.info('Cover letter creation request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    let body;
    try {
      body = await request.json();
    } catch (e) {
      log.warn('Invalid JSON body', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }
    const { title, content, company_name, position, job_description, source } = body as {
      title?: string;
      content?: string;
      company_name?: string;
      position?: string;
      job_description?: string;
      source?: string;
    };

    if (!title || !content) {
      log.warn('Missing required fields', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Title and content are required' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const coverLetter = await convexServer.mutation(
      api.cover_letters.createCoverLetter,
      {
        clerkId: userId,
        name: title,
        job_title: position ? String(position) : 'Position',
        company_name: company_name ? String(company_name) : undefined,
        template: 'standard',
        content: String(content),
        closing: 'Sincerely,',
        source: ALLOWED_SOURCES.has(source as CoverLetterSource)
          ? (source as CoverLetterSource)
          : 'manual',
      },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Cover letter created successfully', {
      event: 'data.created',
      clerkId: userId,
      httpStatus: 201,
      durationMs,
    });

    return NextResponse.json(
      { coverLetter },
      {
        status: 201,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    log.error('Cover letter creation request failed', toErrorCode(error), {
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
