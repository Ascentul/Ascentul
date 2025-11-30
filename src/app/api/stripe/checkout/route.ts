import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import Stripe from 'stripe';
import { convexServer } from '@/lib/convex-server';

const stripeSecret = process.env.STRIPE_SECRET_KEY;

// Default to current stable Stripe API version; override via STRIPE_API_VERSION when needed.
const stripeApiVersion = (process.env.STRIPE_API_VERSION || '2025-11-17.clover') as Stripe.StripeConfig['apiVersion'];

// Plan configuration for dynamic price_data
const PLAN_CONFIG: Record<
  string,
  Record<
    string,
    {
      amount: number;
      interval: "month" | "year";
      interval_count?: number;
      productName: string;
    }
  >
> = {
  premium: {
    monthly: {
      amount: 3000, // $30.00
      interval: "month",
      interval_count: 1,
      productName: "Ascentful Premium Monthly",
    },
    quarterly: {
      amount: 3000,
      interval: "month",
      interval_count: 3,
      productName: "Ascentful Premium",
    },
    annual: {
      amount: 24000, // $240.00
      interval: "year",
      interval_count: 1,
      productName: "Ascentful Premium Annual",
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json({ error: "Failed to obtain auth token" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (err) {
      console.error('Failed to parse request body:', err);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const plan = (body?.plan as string) || "premium";
    const interval = (body?.interval as string) || "monthly";

    if (!PLAN_CONFIG[plan]?.[interval]) {
      return NextResponse.json(
        { error: "Invalid plan or interval" },
        { status: 400 },
      );
    }

    const origin = request.headers.get("origin") || new URL(request.url).origin;

    // If Stripe is not configured, return error
    if (!stripeSecret) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: stripeApiVersion });
    // Fetch current user record to get/create customer
    const user = await convexServer.query(
      api.users.getUserByClerkId,
      { clerkId: userId },
      token
    );

    if (!user) {
      return NextResponse.json(
        { error: "User record not found" },
        { status: 404 },
      );
    }

    let customerId = user.stripe_customer_id as string | null;

    if (!customerId) {
      if (!user.email) {
        return NextResponse.json(
          { error: "User email is required for checkout" },
          { status: 400 },
        );
      }

      // Check if a Stripe customer already exists for this user by searching Stripe
      // This handles the edge case where Stripe customer was created but Convex update failed
      // Use Search API to query by metadata instead of email-only list (more accurate for shared emails)
      // Escape special characters in userId to prevent query injection
      const escapedUserId = userId.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
      const existingCustomers = await stripe.customers.search({
        query: `metadata['clerk_id']:'${escapedUserId}'`,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        // Found existing customer - use it and update Convex
        customerId = existingCustomers.data[0].id;
        console.log(`[Stripe Checkout] Found existing Stripe customer ${customerId} for user ${userId}`);

        // Update Convex with the existing customer ID
        try {
          await convexServer.mutation(
            api.users.updateUser,
            {
              clerkId: userId,
              updates: { stripe_customer_id: customerId },
            },
            token
          );
        } catch (convexError) {
          console.error('Failed to sync existing Stripe customer ID to Convex:', convexError);
          // Continue with checkout - the customer exists in Stripe and will be found again on retry
          console.error(`[Stripe Checkout] Failed to sync existing Stripe customer: ${customerId} for user ${userId}`);
        }
      } else {
        // No existing customer - create new one
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: user.name || undefined,
          metadata: {
            clerk_id: userId,
            clerkId: userId, // Keep for backward compatibility with portal route
            user_id: user._id,
          },
        });
        customerId = customer.id;

        // Update user with stripe customer ID
        // IMPORTANT: If this fails, we'll have an orphaned Stripe customer, but on retry
        // the check above will find it and recover gracefully
        try {
          await convexServer.mutation(
            api.users.updateUser,
            {
              clerkId: userId,
              updates: { stripe_customer_id: customerId },
            },
            token
          );
        } catch (convexError) {
          console.error('Failed to save Stripe customer ID to Convex:', convexError);
          // Log the orphaned customer ID for manual cleanup if needed
          console.error(`[Stripe Checkout] Orphaned Stripe customer: ${customerId} for user ${userId}`);
          throw new Error('Failed to save customer information. Please try again.');
        }
      }
    }

    const cfg = PLAN_CONFIG[plan][interval];
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: cfg.productName },
            recurring: {
              interval: cfg.interval,
              ...(cfg.interval_count
                ? { interval_count: cfg.interval_count }
                : {}),
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
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
