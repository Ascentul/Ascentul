import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

function getClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("Convex URL not configured");
  return new ConvexHttpClient(url);
}

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
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
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

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-02-24.acacia",
    });
    const client = getClient();

    // Fetch current user record to get/create customer
    const user = await client.query(api.users.getUserByClerkId, {
      clerkId: userId,
    });

    if (!user) {
      return NextResponse.json(
        { error: "User record not found" },
        { status: 404 },
      );
    }

    let customerId = user.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: { clerk_id: userId, user_id: user._id },
      });
      customerId = customer.id;

      // Update user with stripe customer ID
      await client.mutation(api.users.updateUser, {
        clerkId: userId,
        updates: { stripe_customer_id: customerId },
      });
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
