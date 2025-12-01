import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { requireConvexToken } from '@/lib/convex-auth';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
// Default to current stable Stripe API version; override via STRIPE_API_VERSION when needed.
const stripeApiVersion = (process.env.STRIPE_API_VERSION ||
  '2025-11-17.clover') as Stripe.StripeConfig['apiVersion'];

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'billing',
    httpMethod: 'POST',
    httpPath: '/api/stripe/portal',
  });

  const startTime = Date.now();
  log.info('Stripe portal request started', { event: 'request.start' });

  try {
    // requireConvexToken throws if userId is missing or token fails
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const origin = request.headers.get('origin') || new URL(request.url).origin;

    if (!stripeSecret) {
      // Mock manage billing URL when Stripe is not configured
      log.info('Stripe not configured, returning mock portal URL', {
        event: 'billing.config.mock',
      });
      return NextResponse.json(
        { url: `${origin}/account?portal=mock` },
        {
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: stripeApiVersion });

    // Fetch Convex user by Clerk ID
    const user = await convexServer.query(api.users.getUserByClerkId, { clerkId: userId }, token);
    if (!user) {
      log.warn('User record not found', { event: 'data.not_found', errorCode: 'NOT_FOUND' });
      return NextResponse.json(
        { error: 'User not found' },
        {
          status: 404,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    let customerId = user.stripe_customer_id as string | undefined;

    // Create customer in Stripe if missing, and store in Convex
    if (!customerId) {
      if (!user.email) {
        log.warn('User email required for portal', {
          event: 'validation.failed',
          errorCode: 'BAD_REQUEST',
        });
        return NextResponse.json(
          { error: 'User email is required' },
          {
            status: 400,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          clerk_id: user.clerkId,
          clerkId: user.clerkId, // Keep for backward compatibility
        },
      });
      customerId = customer.id;
      log.info('Created new Stripe customer for portal', {
        event: 'billing.customer.created',
        clerkId: userId,
      });

      try {
        await convexServer.mutation(
          api.users.setStripeCustomer,
          { clerkId: user.clerkId, stripeCustomerId: customerId },
          token,
        );
      } catch (convexError) {
        // Customer exists in Stripe; checkout route's search logic will recover on next request
        log.warn('Failed to save Stripe customer ID to Convex', {
          event: 'billing.sync.failed',
          errorCode: toErrorCode(convexError),
        });
      }
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/account`,
    });

    const durationMs = Date.now() - startTime;
    log.info('Stripe portal session created', {
      event: 'billing.portal.created',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
    });

    return NextResponse.json(
      { url: session.url },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status =
      message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500;
    log.error('Stripe portal request failed', toErrorCode(error), {
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
