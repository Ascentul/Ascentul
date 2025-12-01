import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

interface PriceInfo {
  unit_amount: number | null;
  currency: string;
}

interface PricesResult {
  monthly?: PriceInfo;
  annual?: PriceInfo;
}

// Default to current stable Stripe API version; override via STRIPE_API_VERSION when needed.
const stripeApiVersion = (process.env.STRIPE_API_VERSION ||
  '2025-11-17.clover') as Stripe.StripeConfig['apiVersion'];

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'billing',
    httpMethod: 'GET',
    httpPath: '/api/stripe/prices',
  });

  const startTime = Date.now();
  log.info('Stripe prices request started', { event: 'request.start' });

  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      // No Stripe configured; return empty so UI hides amounts gracefully
      log.info('Stripe not configured, returning empty prices', {
        event: 'billing.config.not_configured',
      });
      return NextResponse.json(
        {},
        {
          status: 200,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const stripe = new Stripe(secret, { apiVersion: stripeApiVersion });

    const monthlyId = process.env.STRIPE_PRICE_ID_MONTHLY;
    const annualId = process.env.STRIPE_PRICE_ID_ANNUAL;

    const result: PricesResult = {};

    if (monthlyId) {
      const price = await stripe.prices.retrieve(monthlyId);
      result.monthly = {
        unit_amount: price.unit_amount ?? null,
        currency: price.currency ?? 'usd',
      };
    }
    if (annualId) {
      const price = await stripe.prices.retrieve(annualId);
      result.annual = {
        unit_amount: price.unit_amount ?? null,
        currency: price.currency ?? 'usd',
      };
    }

    const durationMs = Date.now() - startTime;
    log.info('Stripe prices fetched', {
      event: 'billing.prices.fetched',
      httpStatus: 200,
      durationMs,
      extra: {
        hasMonthly: !!result.monthly,
        hasAnnual: !!result.annual,
      },
    });

    return NextResponse.json(result, {
      status: 200,
      headers: { 'x-correlation-id': correlationId },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Check if this is a Stripe API error vs other errors (e.g., network issues)
    if (error instanceof Stripe.errors.StripeError) {
      log.error('Stripe API error fetching prices', toErrorCode(error), {
        event: 'billing.prices.stripe_error',
        httpStatus: 500,
        durationMs,
      });
      return NextResponse.json(
        { error: 'Failed to fetch pricing information' },
        {
          status: 500,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Other errors (e.g., network issues) - also return error status
    log.error('Failed to retrieve prices', toErrorCode(error), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Failed to retrieve prices' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
