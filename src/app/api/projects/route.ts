import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'application',
    httpMethod: 'GET',
    httpPath: '/api/projects',
  });

  const startTime = Date.now();
  log.info('Projects list request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const projects = await convexServer.query(
      api.projects.getUserProjects,
      { clerkId: userId },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Projects list request completed', {
      event: 'request.success',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { count: projects?.length ?? 0 },
    });

    return NextResponse.json(
      { projects },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Projects list request failed', toErrorCode(error), {
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

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'application',
    httpMethod: 'POST',
    httpPath: '/api/projects',
  });

  const startTime = Date.now();
  log.info('Project creation request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const body = await request.json();
    const {
      title,
      description,
      technologies,
      github_url,
      live_url,
      image_url,
      role,
      start_date,
      end_date,
      company,
    } = body;

    if (!title) {
      log.warn('Missing required field: title', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
      });
      return NextResponse.json(
        { error: 'Title is required' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const projectId = await convexServer.mutation(
      api.projects.createProject,
      {
        clerkId: userId,
        title: String(title),
        role: role ? String(role) : undefined,
        start_date: start_date ? Number(start_date) : undefined,
        end_date: end_date ? Number(end_date) : undefined,
        company: company ? String(company) : undefined,
        url: live_url ? String(live_url) : github_url ? String(github_url) : undefined,
        description: description ? String(description) : undefined,
        type: 'personal',
        image_url: image_url ? String(image_url) : undefined,
        technologies: Array.isArray(technologies) ? technologies.map(String) : [],
      },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Project created successfully', {
      event: 'data.created',
      clerkId: userId,
      httpStatus: 201,
      durationMs,
    });

    return NextResponse.json(
      { projectId },
      {
        status: 201,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Project creation request failed', toErrorCode(error), {
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
