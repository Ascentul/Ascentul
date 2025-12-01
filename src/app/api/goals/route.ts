import { auth } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

import { isValidGoalStatus, VALID_GOAL_STATUSES } from '@/lib/constants/roles';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

const mapGoal = (doc: any) => ({
  id: doc._id,
  title: doc.title,
  description: doc.description ?? '',
  status: doc.status,
  progress: doc.progress ?? 0,
  dueDate: doc.target_date ? new Date(doc.target_date).toISOString() : undefined,
  checklist: doc.checklist ?? [],
  created_at: doc.created_at,
  updated_at: doc.updated_at,
  completedAt: doc.completed_at ? new Date(doc.completed_at).toISOString() : undefined,
});

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'goal',
    httpMethod: 'GET',
    httpPath: '/api/goals',
  });

  const startTime = Date.now();
  log.info('Goals list request started', { event: 'request.start' });

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      log.warn('Unauthorized goals list request', {
        event: 'auth.failed',
        errorCode: 'UNAUTHORIZED',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }
    const token = await getToken({ template: 'convex' });
    if (!token) {
      log.warn('Failed to obtain auth token', { event: 'auth.failed', errorCode: 'TOKEN_ERROR' });
      return NextResponse.json(
        { error: 'Failed to obtain auth token' },
        {
          status: 401,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const goals = await convexServer.query(api.goals.getUserGoals, { clerkId: userId }, token);

    const durationMs = Date.now() - startTime;
    log.info('Goals list request completed', {
      event: 'request.success',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { goalsCount: goals.length },
    });

    return NextResponse.json(
      { goals: goals.map(mapGoal) },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    log.error('Goals list request failed', toErrorCode(error), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    const msg = error?.message || 'Internal server error';
    return NextResponse.json(
      { error: msg },
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
    feature: 'goal',
    httpMethod: 'POST',
    httpPath: '/api/goals',
  });

  const startTime = Date.now();
  log.info('Goal creation request started', { event: 'request.start' });

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      log.warn('Unauthorized goal creation request', {
        event: 'auth.failed',
        errorCode: 'UNAUTHORIZED',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }
    const token = await getToken({ template: 'convex' });
    if (!token) {
      log.warn('Failed to obtain auth token', { event: 'auth.failed', errorCode: 'TOKEN_ERROR' });
      return NextResponse.json(
        { error: 'Failed to obtain auth token' },
        {
          status: 401,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      log.warn('Invalid JSON in request body', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
      });
      return NextResponse.json(
        { error: 'Invalid JSON' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    if (!body?.title) {
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

    // Validate status if provided
    if (body.status && !isValidGoalStatus(body.status)) {
      log.warn('Invalid status value', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
        extra: { providedStatus: body.status },
      });
      return NextResponse.json(
        {
          error: `Invalid status: ${body.status}. Valid values: ${VALID_GOAL_STATUSES.join(', ')}`,
        },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const args = {
      clerkId: userId,
      title: String(body.title),
      description: body.description ? String(body.description) : undefined,
      status: body.status || 'not_started',
      target_date: body.dueDate ? Date.parse(body.dueDate) : undefined,
      progress: typeof body.progress === 'number' ? body.progress : 0,
      checklist: Array.isArray(body.checklist) ? body.checklist : undefined,
      category: body.category ? String(body.category) : undefined,
      correlationId,
    };
    const id = await convexServer.mutation(api.goals.createGoal, args, token);

    const durationMs = Date.now() - startTime;
    log.info('Goal created successfully', {
      event: 'data.created',
      clerkId: userId,
      httpStatus: 201,
      durationMs,
      extra: { goalId: id, status: args.status },
    });

    return NextResponse.json(
      { id },
      {
        status: 201,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    log.error('Goal creation request failed', toErrorCode(error), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    const msg = error?.message || 'Internal server error';
    return NextResponse.json(
      { error: msg },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
