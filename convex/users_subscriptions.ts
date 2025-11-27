import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { isServiceRequest } from "./lib/roles";

// DEPRECATED: Legacy Stripe integration - Use Clerk Billing instead
export const setStripeCustomer = mutation({
  args: { clerkId: v.string(), stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const actingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!actingUser) throw new Error("Unauthorized");

    const isSelf = actingUser.clerkId === args.clerkId;
    if (!isSelf && actingUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      stripe_customer_id: args.stripeCustomerId,
      updated_at: Date.now(),
    });

    return user._id;
  },
});

// Update user subscription fields - Clerk Billing provides clerkId directly
export const updateSubscriptionByIdentifier = mutation({
  args: {
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    serviceToken: v.optional(v.string()),
    subscription_plan: v.union(
      v.literal("free"),
      v.literal("premium"),
      v.literal("university"),
    ),
    subscription_status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("cancelled"),
      v.literal("past_due"),
    ),
    onboarding_completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const isService = isServiceRequest(args.serviceToken);
    if (!identity && !isService) {
      throw new Error("Unauthorized");
    }

    let actingUser = null as any;
    if (!isService) {
      actingUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity!.subject))
        .unique();
      if (!actingUser) {
        throw new Error("Unauthorized");
      }
    }

    let user = null as any;

    if (args.clerkId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId!))
        .unique();
    }

    if (!user && args.email && (isService || actingUser?.role === "super_admin")) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .unique();
    }

    if (!user) throw new Error("User not found for subscription update");

    const isSelf = !isService && actingUser.clerkId === user.clerkId;
    if (!isService && !isSelf && actingUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(user._id, {
      subscription_plan: args.subscription_plan,
      subscription_status: args.subscription_status,
      ...(args.onboarding_completed !== undefined
        ? { onboarding_completed: args.onboarding_completed }
        : {}),
      updated_at: Date.now(),
    });

    return user._id;
  },
});
