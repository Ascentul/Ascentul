import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { isValidConvexId } from '@/lib/convex-ids';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'goal',
    httpMethod: 'PUT',
    httpPath: '/api/goals/[id]',
  });

  const startTime = Date.now();
  log.info('Goal update request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    const { id: goalIdParam } = await context.params;

    if (
      !goalIdParam ||
      typeof goalIdParam !== 'string' ||
      goalIdParam.trim() === '' ||
      !isValidConvexId(goalIdParam)
    ) {
      log.warn('Invalid goal ID', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Invalid goal ID' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    log.debug('Updating goal', { event: 'data.update.start', extra: { goalId: goalIdParam } });

    let body: any;
    try {
      body = await request.json();
    } catch {
      log.warn('Invalid JSON in request body', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
      });
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const updates: any = {};
    if (typeof body.title === 'string') updates.title = body.title;
    if (typeof body.description === 'string') updates.description = body.description;
    if (typeof body.status === 'string') updates.status = body.status;
    if (typeof body.progress === 'number') updates.progress = body.progress;
    if (Array.isArray(body.checklist)) updates.checklist = body.checklist;
    if (body.dueDate) updates.target_date = Date.parse(body.dueDate);
    if (body.target_date && typeof body.target_date === 'number')
      updates.target_date = body.target_date;
    if (typeof body.category === 'string') updates.category = body.category;
    if (typeof body.completed === 'boolean') updates.completed = body.completed;
    if (body.completedAt) updates.completed_at = Date.parse(body.completedAt);
    // When completedAt is explicitly null, set to undefined so Convex clears the timestamp
    if (body.completedAt === null) updates.completed_at = undefined;

    await convexServer.mutation(
      api.goals.updateGoal,
      {
        clerkId: userId,
        goalId: goalIdParam as Id<'goals'>,
        updates,
        correlationId,
      },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Goal updated successfully', {
      event: 'data.updated',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { goalId: goalIdParam, updatedFields: Object.keys(updates) },
    });

    return NextResponse.json(
      { ok: true },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    log.error('Goal update request failed', toErrorCode(error), {
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

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'goal',
    httpMethod: 'DELETE',
    httpPath: '/api/goals/[id]',
  });

  const startTime = Date.now();
  log.info('Goal deletion request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    const { id: goalIdParam } = await context.params;

    if (
      !goalIdParam ||
      typeof goalIdParam !== 'string' ||
      goalIdParam.trim() === '' ||
      !isValidConvexId(goalIdParam)
    ) {
      log.warn('Invalid goal ID', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Invalid goal ID' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    log.debug('Deleting goal', { event: 'data.delete.start', extra: { goalId: goalIdParam } });

    await convexServer.mutation(
      api.goals.deleteGoal,
      {
        clerkId: userId,
        goalId: goalIdParam as Id<'goals'>,
        correlationId,
      },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Goal deleted successfully', {
      event: 'data.deleted',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { goalId: goalIdParam },
    });

    return NextResponse.json(
      { ok: true },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    log.error('Goal deletion request failed', toErrorCode(error), {
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
