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

// Plan configuration for dynamic price_data
const PLAN_CONFIG: Record<
  string,
  Record<
    string,
    {
      amount: number;
      interval: 'month' | 'year';
      interval_count?: number;
      productName: string;
    }
  >
> = {
  premium: {
    monthly: {
      amount: 3000, // $30.00
      interval: 'month',
      interval_count: 1,
      productName: 'Ascentful Premium Monthly',
    },
    quarterly: {
      amount: 3000,
      interval: 'month',
      interval_count: 3,
      productName: 'Ascentful Premium',
    },
    annual: {
      amount: 24000, // $240.00
      interval: 'year',
      interval_count: 1,
      productName: 'Ascentful Premium Annual',
    },
  },
};

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'billing',
    httpMethod: 'POST',
    httpPath: '/api/stripe/checkout',
  });

  const startTime = Date.now();
  log.info('Stripe checkout request started', { event: 'request.start' });

  try {
    const { userId, token } = await requireConvexToken();
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    let body;
    try {
      body = await request.json();
    } catch (err) {
      log.warn('Invalid JSON in request body', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
      });
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const plan = (body?.plan as string) || 'premium';
    const interval = (body?.interval as string) || 'monthly';

    if (!PLAN_CONFIG[plan]?.[interval]) {
      log.warn('Invalid plan or interval', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
        extra: { plan, interval },
      });
      return NextResponse.json(
        { error: 'Invalid plan or interval' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const origin = request.headers.get('origin') || new URL(request.url).origin;

    // If Stripe is not configured, return error
    if (!stripeSecret) {
      log.warn('Stripe not configured', {
        event: 'billing.config.error',
        errorCode: 'CONFIG_ERROR',
      });
      return NextResponse.json(
        { error: 'Stripe not configured' },
        {
          status: 500,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: stripeApiVersion });
    // Fetch current user record to get/create customer
    const user = await convexServer.query(api.users.getUserByClerkId, { clerkId: userId }, token);

    if (!user) {
      log.warn('User record not found', { event: 'data.not_found', errorCode: 'NOT_FOUND' });
      return NextResponse.json(
        { error: 'User record not found' },
        {
          status: 404,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    let customerId = user.stripe_customer_id as string | null;

    if (!customerId) {
      if (!user.email) {
        log.warn('User email required for checkout', {
          event: 'validation.failed',
          errorCode: 'BAD_REQUEST',
        });
        return NextResponse.json(
          { error: 'User email is required for checkout' },
          {
            status: 400,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }

      // Check if a Stripe customer already exists for this user by searching Stripe
      const escapedUserId = userId.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const existingCustomers = await stripe.customers.search({
        query: `metadata["clerk_id"]:"${escapedUserId}"`,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        // Found existing customer - use it and update Convex
        customerId = existingCustomers.data[0].id;
        log.info('Found existing Stripe customer', {
          event: 'billing.customer.found',
          clerkId: userId,
        });

        // Update Convex with the existing customer ID
        try {
          await convexServer.mutation(
            api.users.updateUser,
            {
              clerkId: userId,
              updates: { stripe_customer_id: customerId },
            },
            token,
          );
        } catch (convexError) {
          log.warn('Failed to sync existing Stripe customer ID to Convex', {
            event: 'billing.sync.failed',
            errorCode: toErrorCode(convexError),
          });
          // Continue with checkout - the customer exists in Stripe and will be found again on retry
        }
      } else {
        // No existing customer - create new one
        const customer = await stripe.customers.create(
          {
            email: user.email || undefined,
            name: user.name || undefined,
            metadata: {
              clerk_id: userId,
              clerkId: userId,
              user_id: user._id,
            },
          },
          {
            idempotencyKey: `create-customer-${userId}`,
          },
        );
        customerId = customer.id;

        log.info('Created new Stripe customer', {
          event: 'billing.customer.created',
          clerkId: userId,
        });

        // Update user with stripe customer ID
        try {
          await convexServer.mutation(
            api.users.updateUser,
            {
              clerkId: userId,
              updates: { stripe_customer_id: customerId },
            },
            token,
          );
        } catch (convexError) {
          log.error('Failed to save Stripe customer ID to Convex', toErrorCode(convexError), {
            event: 'billing.sync.failed',
          });
          throw new Error('Failed to save customer information. Please try again.');
        }
      }
    }

    const cfg = PLAN_CONFIG[plan][interval];
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: cfg.productName },
            recurring: {
              interval: cfg.interval,
              ...(cfg.interval_count ? { interval_count: cfg.interval_count } : {}),
            },
            unit_amount: cfg.amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/account?checkout=success`,
      cancel_url: `${origin}/account?checkout=cancel`,
      allow_promotion_codes: true,
      client_reference_id: userId,
      metadata: { clerk_id: userId, plan, interval },
      subscription_data: {
        metadata: { clerk_id: userId, plan, interval },
      },
    });

    if (!session.url) {
      log.error('Failed to create checkout session', 'STRIPE_ERROR', {
        event: 'billing.checkout.failed',
      });
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        {
          status: 500,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const durationMs = Date.now() - startTime;
    log.info('Stripe checkout session created', {
      event: 'billing.checkout.created',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { plan, interval },
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
    log.error('Stripe checkout request failed', toErrorCode(error), {
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
