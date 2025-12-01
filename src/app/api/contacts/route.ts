import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/contacts - list current user's contacts
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'application',
    httpMethod: 'GET',
    httpPath: '/api/contacts',
  });

  const startTime = Date.now();
  log.info('Contacts list request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const contacts = await convexServer.query(
      api.contacts.getUserContacts,
      { clerkId: userId },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Contacts list request completed', {
      event: 'request.success',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { count: contacts?.length ?? 0 },
    });

    return NextResponse.json(
      { contacts },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Failed to load contacts';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Contacts list request failed', toErrorCode(error), {
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

// POST /api/contacts - create a contact
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'application',
    httpMethod: 'POST',
    httpPath: '/api/contacts',
  });

  const startTime = Date.now();
  log.info('Contact creation request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    let body;
    try {
      body = await request.json();
    } catch {
      log.warn('Invalid JSON body', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Invalid JSON' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const name: string = body.full_name ?? body.name ?? 'Unnamed';
    const contact = await convexServer.mutation(
      api.contacts.createContact,
      {
        clerkId: userId,
        name,
        company: body.company ?? undefined,
        position: body.position ?? undefined,
        email: body.email ?? undefined,
        phone: body.phone ?? undefined,
        linkedin_url: body.linkedin_url ?? undefined,
        notes: body.notes ?? undefined,
        relationship: body.relationship_type ?? undefined,
        last_contact: (() => {
          if (!body.last_contact_date) return undefined;
          const parsed = Date.parse(body.last_contact_date);
          return Number.isNaN(parsed) ? undefined : parsed;
        })(),
      },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Contact created successfully', {
      event: 'data.created',
      clerkId: userId,
      httpStatus: 201,
      durationMs,
    });

    return NextResponse.json(
      { contact },
      {
        status: 201,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Failed to create contact';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Contact creation request failed', toErrorCode(error), {
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
