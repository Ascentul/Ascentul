import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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

export async function GET() {
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      // No Stripe configured; return empty so UI hides amounts gracefully
      return NextResponse.json({}, { status: 200 });
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

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Stripe prices error:', error);

    // Check if this is a Stripe API error vs other errors (e.g., network issues)
    if (error instanceof Stripe.errors.StripeError) {
      // Actual Stripe API failure - return error status
      return NextResponse.json({ error: 'Failed to fetch pricing information' }, { status: 500 });
    }

    // Other errors (e.g., network issues) - also return error status
    return NextResponse.json({ error: 'Failed to retrieve prices' }, { status: 500 });
  }
}
