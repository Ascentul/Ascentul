import sgMail from '@sendgrid/mail';
import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';

import { requireConvexToken } from '@/lib/convex-auth';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'support',
    httpMethod: 'GET',
    httpPath: '/api/support/tickets',
  });

  const startTime = Date.now();
  log.info('Support tickets list request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const tickets = await convexServer.query(
      api.support_tickets.listTickets,
      { clerkId: userId },
      token,
    );

    const durationMs = Date.now() - startTime;
    log.info('Support tickets list request completed', {
      event: 'request.success',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { count: tickets?.length ?? 0 },
    });

    return NextResponse.json(
      { tickets },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Support tickets list request failed', toErrorCode(error), {
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
    feature: 'support',
    httpMethod: 'POST',
    httpPath: '/api/support/tickets',
  });

  const startTime = Date.now();
  log.info('Support ticket creation request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const body = await request.json();
    const { subject, description, issueType, source } = body;

    if (!subject || !description) {
      log.warn('Missing required fields', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Subject and description are required' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Get user info to send email (do not log email address)
    const user = await convexServer.query(api.users.getUserByClerkId, { clerkId: userId }, token);

    const ticket = await convexServer.mutation(
      api.support_tickets.createTicket,
      {
        clerkId: userId,
        subject: String(subject),
        description: String(description),
        issue_type: issueType ? String(issueType) : undefined,
        source: source ? String(source) : 'in-app',
      },
      token,
    );

    log.info('Support ticket created', {
      event: 'data.created',
      clerkId: userId,
      extra: { issueType: issueType || 'general' },
    });

    // Send email notification to user
    if (process.env.SENDGRID_API_KEY && user?.email) {
      try {
        const msg = {
          to: user.email,
          from: process.env.SENDGRID_FROM_EMAIL || 'support@ascentful.com',
          subject: `Support Ticket Submitted - #${ticket?._id || 'Unknown'}`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
              <h2 style="color: #0C29AB;">Hi ${user.name || 'there'},</h2>

              <p>Thank you for contacting Ascentful support. We have received your support ticket and our team is evaluating it.</p>

              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #333;">Ticket Details:</h3>
                <p><strong>Ticket ID:</strong> #${ticket?._id || 'Unknown'}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Type:</strong> ${issueType}</p>
                <p><strong>Description:</strong> ${description}</p>
              </div>

              <p>We aim to respond to all support tickets within 24-48 hours. You will receive an email notification when there are updates to your ticket.</p>

              <p>If you have any urgent questions, please don't hesitate to reach out.</p>

              <p style="margin-top: 30px;">
                Best regards,<br>
                The Ascentful Support Team
              </p>
            </div>
          `,
        };

        await sgMail.send(msg);
        log.debug('Support ticket email sent', { event: 'email.sent' });
      } catch (emailError) {
        log.warn('Failed to send support ticket email', {
          event: 'email.failed',
          errorCode: toErrorCode(emailError),
        });
        // Don't fail the ticket creation if email fails
      }
    }

    const durationMs = Date.now() - startTime;
    log.info('Support ticket creation request completed', {
      event: 'request.success',
      clerkId: userId,
      httpStatus: 201,
      durationMs,
    });

    return NextResponse.json(
      {
        ticket,
        message: 'Support ticket submitted successfully!',
      },
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
    log.error('Support ticket creation request failed', toErrorCode(error), {
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
