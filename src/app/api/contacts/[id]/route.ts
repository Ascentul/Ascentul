import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { isValidConvexId } from '@/lib/convex-ids';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

// GET /api/contacts/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'application',
    httpMethod: 'GET',
    httpPath: '/api/contacts/[id]',
  });

  const startTime = Date.now();
  log.info('Contact fetch request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const { id } = await params;
    if (!isValidConvexId(id)) {
      log.warn('Invalid contact ID format', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
      });
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const contact = await convexServer.query(
      api.contacts.getContactById,
      {
        clerkId: userId,
        contactId: id as Id<'networking_contacts'>,
      },
      token,
    );

    if (!contact) {
      log.warn('Contact not found', { event: 'data.not_found', errorCode: 'NOT_FOUND' });
      return NextResponse.json(
        { error: 'Contact not found' },
        {
          status: 404,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const durationMs = Date.now() - startTime;
    log.info('Contact fetch request completed', {
      event: 'request.success',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
    });

    return NextResponse.json(
      { contact },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Failed to fetch contact';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Contact fetch request failed', toErrorCode(error), {
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

// PUT /api/contacts/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'application',
    httpMethod: 'PUT',
    httpPath: '/api/contacts/[id]',
  });

  const startTime = Date.now();
  log.info('Contact update request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const { id } = await params;
    if (!isValidConvexId(id)) {
      log.warn('Invalid contact ID format', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
      });
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      log.warn('Invalid JSON body', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const contact = await convexServer.mutation(
      api.contacts.updateContact,
      {
        clerkId: userId,
        contactId: id as Id<'networking_contacts'>,
        updates: {
          name: (body.full_name ?? body.name) as string | undefined,
          company: body.company as string | undefined,
          position: body.position as string | undefined,
          email: body.email as string | undefined,
          phone: body.phone as string | undefined,
          notes: body.notes as string | undefined,
          last_contact: (() => {
            if (typeof body.last_contact_date !== 'string') return undefined;
            const parsed = Date.parse(body.last_contact_date);
            if (Number.isNaN(parsed)) {
              return undefined;
            }
            return parsed;
          })(),
        },
      },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Contact updated successfully', {
      event: 'data.updated',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
    });

    return NextResponse.json(
      { contact },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Failed to update contact';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Contact update request failed', toErrorCode(error), {
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

// DELETE /api/contacts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'application',
    httpMethod: 'DELETE',
    httpPath: '/api/contacts/[id]',
  });

  const startTime = Date.now();
  log.info('Contact deletion request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const { id } = await params;
    if (!isValidConvexId(id)) {
      log.warn('Invalid contact ID format', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
      });
      return NextResponse.json(
        { error: 'Invalid contact ID format' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    await convexServer.mutation(
      api.contacts.deleteContact,
      { clerkId: userId, contactId: id as Id<'networking_contacts'> },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Contact deleted successfully', {
      event: 'data.deleted',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
    });

    return NextResponse.json(
      { success: true },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Failed to delete contact';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Contact deletion request failed', toErrorCode(error), {
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
