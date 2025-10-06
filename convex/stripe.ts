import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Record a payment from Stripe
export const recordPayment = mutation({
  args: {
    stripe_customer_id: v.string(),
    stripe_subscription_id: v.optional(v.string()),
    stripe_invoice_id: v.optional(v.string()),
    stripe_payment_intent_id: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("succeeded"),
      v.literal("pending"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    payment_type: v.union(
      v.literal("subscription"),
      v.literal("one_time"),
      v.literal("university_license"),
    ),
    plan_name: v.optional(v.string()),
    interval: v.optional(v.string()),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
    payment_date: v.number(),
  },
  handler: async (ctx, args) => {
    // Try to find the user by stripe_customer_id
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("stripe_customer_id"), args.stripe_customer_id))
      .first();

    const now = Date.now();

    // Insert payment record
    await ctx.db.insert("stripe_payments", {
      user_id: user?._id,
      stripe_customer_id: args.stripe_customer_id,
      stripe_subscription_id: args.stripe_subscription_id,
      stripe_invoice_id: args.stripe_invoice_id,
      stripe_payment_intent_id: args.stripe_payment_intent_id,
      amount: args.amount,
      currency: args.currency,
      status: args.status,
      payment_type: args.payment_type,
      plan_name: args.plan_name,
      interval: args.interval,
      description: args.description,
      metadata: args.metadata,
      payment_date: args.payment_date,
      created_at: now,
    });

    return { success: true };
  },
});

// Record a subscription event from Stripe
export const recordSubscriptionEvent = mutation({
  args: {
    stripe_customer_id: v.string(),
    stripe_subscription_id: v.string(),
    event_type: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("cancelled"),
      v.literal("renewed"),
      v.literal("trial_started"),
      v.literal("trial_ended"),
    ),
    subscription_status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("trialing"),
    ),
    plan_name: v.optional(v.string()),
    amount: v.optional(v.number()),
    event_date: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Try to find the user by stripe_customer_id
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("stripe_customer_id"), args.stripe_customer_id))
      .first();

    const now = Date.now();

    // Insert subscription event record
    await ctx.db.insert("stripe_subscription_events", {
      user_id: user?._id,
      stripe_customer_id: args.stripe_customer_id,
      stripe_subscription_id: args.stripe_subscription_id,
      event_type: args.event_type,
      subscription_status: args.subscription_status,
      plan_name: args.plan_name,
      amount: args.amount,
      event_date: args.event_date,
      metadata: args.metadata,
      created_at: now,
    });

    return { success: true };
  },
});
