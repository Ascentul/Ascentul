import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

import { hasAdvisorAccess } from '@/lib/constants/roles';
import { requireConvexToken } from '@/lib/convex-auth';
import { convexServer } from '@/lib/convex-server';
import { sendUniversityInvitationEmail } from '@/lib/email';
import { getErrorMessage } from '@/lib/errors';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(req);
  const log = createRequestLogger(correlationId, {
    feature: 'university',
    httpMethod: 'POST',
    httpPath: '/api/university/send-invitations',
  });

  const startTime = Date.now();
  log.info('Send invitations request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const body = await req.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      log.warn('No emails provided', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'No emails provided' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Validate individual email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(
      (email: unknown) => typeof email !== 'string' || !emailRegex.test(email),
    );
    if (invalidEmails.length > 0) {
      log.warn('Invalid email formats detected', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
        extra: { invalidCount: invalidEmails.length },
      });
      return NextResponse.json(
        { error: 'Invalid email format detected', invalidEmails },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Get the university admin's info to fetch university name
    const adminUser = await convexServer.query(
      api.users.getUserByClerkId,
      { clerkId: userId },
      token,
    );

    const isAdmin = adminUser && hasAdvisorAccess(adminUser.role);
    if (!isAdmin || !adminUser?.university_id) {
      log.warn('Unauthorized - not a university admin', {
        event: 'auth.forbidden',
        errorCode: 'FORBIDDEN',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 403,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const universityId = adminUser.university_id;

    // Get the university details
    const university = await convexServer.query(
      api.universities.getUniversity,
      {
        universityId,
      },
      token,
    );

    if (!university) {
      log.warn('University not found', { event: 'data.not_found', errorCode: 'NOT_FOUND' });
      return NextResponse.json(
        { error: 'University not found' },
        {
          status: 404,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    log.info('Sending invitations', {
      event: 'university.invitations.sending',
      extra: { emailCount: emails.length, universityId: String(universityId) },
    });

    // Send invitation emails (do not log actual email addresses)
    const results = await Promise.allSettled(
      emails.map(async (email: string) => {
        try {
          // Create stored invite and send secure tokenized link
          const { token: inviteToken } = await convexServer.action(
            api.students.createInvite,
            {
              universityId,
              email,
              createdByClerkId: userId,
            },
            token,
          );

          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.ascentful.io';
          const inviteLink = `${baseUrl}/student-invite/${encodeURIComponent(inviteToken)}`;

          await sendUniversityInvitationEmail(email, university.name, inviteLink);
          return { email, success: true };
        } catch (error: unknown) {
          log.warn('Failed to send invitation', {
            event: 'email.failed',
            errorCode: toErrorCode(error),
          });
          const message = getErrorMessage(error);
          return { email, success: false, error: message };
        }
      }),
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    const durationMs = Date.now() - startTime;
    log.info('Invitations sent', {
      event: 'university.invitations.completed',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { total: emails.length, successful, failed },
    });

    return NextResponse.json(
      {
        success: true,
        total: emails.length,
        successful,
        failed,
        results: results.map((r, i) =>
          r.status === 'fulfilled'
            ? r.value
            : {
                email: emails[i],
                success: false,
                error: getErrorMessage(r.reason, 'Unknown error'),
              },
        ),
      },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const message = getErrorMessage(error, 'Internal server error');
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Send invitations request failed', toErrorCode(error), {
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
