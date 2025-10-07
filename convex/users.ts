import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    return user;
  },
});

// Set Stripe customer ID by Clerk ID (helper for server routes)
export const setStripeCustomer = mutation({
  args: { clerkId: v.string(), stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
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

// Update user subscription fields based on Stripe identifiers
export const updateSubscriptionByIdentifier = mutation({
  args: {
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
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
    setStripeIds: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let user = null as any;

    // Prefer Clerk ID if provided
    if (args.clerkId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId!))
        .unique();
    }

    // Fallback to email (indexed)
    if (!user && args.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .unique();
    }

    // As a last resort, try scanning by Stripe IDs (no index)
    if (!user && (args.stripeCustomerId || args.stripeSubscriptionId)) {
      const all = await ctx.db.query("users").collect();
      user = all.find(
        (u: any) =>
          (args.stripeCustomerId &&
            u.stripe_customer_id === args.stripeCustomerId) ||
          (args.stripeSubscriptionId &&
            u.stripe_subscription_id === args.stripeSubscriptionId),
      );
    }

    if (!user) throw new Error("User not found for Stripe update");

    await ctx.db.patch(user._id, {
      subscription_plan: args.subscription_plan,
      subscription_status: args.subscription_status,
      ...(args.setStripeIds
        ? {
            stripe_customer_id:
              args.stripeCustomerId ?? user.stripe_customer_id,
            stripe_subscription_id:
              args.stripeSubscriptionId ?? user.stripe_subscription_id,
          }
        : {}),
      updated_at: Date.now(),
    });

    return user._id;
  },
});

// Create or update user from Clerk webhook
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
    // Allow optionally setting initial role (e.g., from Clerk public metadata)
    role: v.optional(
      v.union(
        v.literal("user"),
        v.literal("staff"),
        v.literal("university_admin"),
        v.literal("advisor"),
        v.literal("super_admin"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        username: args.username,
        // If an explicit role is provided (e.g., from Clerk metadata), sync it
        ...(args.role ? { role: args.role } : {}),
        updated_at: Date.now(),
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      username: args.username || `user_${Date.now()}`,
      role: args.role ?? "user",
      subscription_plan: "free",
      subscription_status: "active",
      onboarding_completed: false,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    return userId;
  },
});

// Update user profile
export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      username: v.optional(v.string()),
      profile_image: v.optional(v.string()),
      cover_image: v.optional(v.string()),
      linkedin_url: v.optional(v.string()),
      bio: v.optional(v.string()),
      job_title: v.optional(v.string()),
      company: v.optional(v.string()),
      location: v.optional(v.string()),
      website: v.optional(v.string()),
      skills: v.optional(v.string()),
      current_company: v.optional(v.string()),
      current_position: v.optional(v.string()),
      experience_level: v.optional(v.string()),
      industry: v.optional(v.string()),
      career_goals: v.optional(v.string()),
      education: v.optional(v.string()),
      university_name: v.optional(v.string()),
      major: v.optional(v.string()),
      graduation_year: v.optional(v.string()),
      dream_job: v.optional(v.string()),
      onboarding_completed: v.optional(v.boolean()),
      role: v.optional(
        v.union(
          v.literal("user"),
          v.literal("admin"),
          v.literal("super_admin"),
          v.literal("university_admin"),
          v.literal("staff"),
        ),
      ),
      subscription_plan: v.optional(
        v.union(
          v.literal("free"),
          v.literal("premium"),
          v.literal("university"),
        ),
      ),
      subscription_status: v.optional(
        v.union(
          v.literal("active"),
          v.literal("inactive"),
          v.literal("cancelled"),
          v.literal("past_due"),
        ),
      ),
      university_id: v.optional(v.id("universities")),
      department_id: v.optional(v.id("departments")),
      account_status: v.optional(
        v.union(
          v.literal("active"),
          v.literal("suspended"),
          v.literal("pending_activation"),
        ),
      ),
      // Allow updating Stripe IDs via this mutation as well
      stripe_customer_id: v.optional(v.string()),
      stripe_subscription_id: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Filter out undefined values from updates
    const cleanUpdates = Object.fromEntries(
      Object.entries(args.updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(user._id, {
      ...cleanUpdates,
      updated_at: Date.now(),
    });

    return user._id;
  },
});

// Update user profile by Convex document ID (useful for admin/dev utilities)
export const updateUserById = mutation({
  args: {
    id: v.id("users"),
    updates: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      username: v.optional(v.string()),
      profile_image: v.optional(v.string()),
      linkedin_url: v.optional(v.string()),
      bio: v.optional(v.string()),
      job_title: v.optional(v.string()),
      company: v.optional(v.string()),
      location: v.optional(v.string()),
      website: v.optional(v.string()),
      skills: v.optional(v.string()),
      current_company: v.optional(v.string()),
      current_position: v.optional(v.string()),
      experience_level: v.optional(v.string()),
      industry: v.optional(v.string()),
      career_goals: v.optional(v.string()),
      education: v.optional(v.string()),
      university_name: v.optional(v.string()),
      major: v.optional(v.string()),
      graduation_year: v.optional(v.string()),
      dream_job: v.optional(v.string()),
      onboarding_completed: v.optional(v.boolean()),
      role: v.optional(
        v.union(
          v.literal("user"),
          v.literal("admin"),
          v.literal("super_admin"),
          v.literal("university_admin"),
          v.literal("staff"),
        ),
      ),
      subscription_plan: v.optional(
        v.union(
          v.literal("free"),
          v.literal("premium"),
          v.literal("university"),
        ),
      ),
      subscription_status: v.optional(
        v.union(
          v.literal("active"),
          v.literal("inactive"),
          v.literal("cancelled"),
          v.literal("past_due"),
        ),
      ),
      university_id: v.optional(v.id("universities")),
      department_id: v.optional(v.id("departments")),
      account_status: v.optional(
        v.union(
          v.literal("active"),
          v.literal("suspended"),
          v.literal("pending_activation"),
        ),
      ),
      university_admin_notes: v.optional(v.string()),
      stripe_customer_id: v.optional(v.string()),
      stripe_subscription_id: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) {
      throw new Error("User not found");
    }

    // Filter out undefined values from updates
    const cleanUpdates = Object.fromEntries(
      Object.entries(args.updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(args.id, {
      ...cleanUpdates,
      updated_at: Date.now(),
    });
    return args.id;
  },
});

// Delete user
export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.delete(user._id);
    return user._id;
  },
});

// Get all users (admin only)
export const getAllUsers = query({
  args: {
    clerkId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    // Only Super Admin can access global user list
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }

    const users = await ctx.db
      .query("users")
      .order("desc")
      .paginate({
        numItems: args.limit || 50,
        cursor: null,
      });

    return users;
  },
});

// Get users by university (university admin only)
export const getUsersByUniversity = query({
  args: {
    clerkId: v.string(),
    universityId: v.id("universities"),
  },
  handler: async (ctx, args) => {
    // Check if user is admin for this university
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!currentUser) {
      throw new Error("User not found");
    }

    const isAuthorized =
      currentUser.role === "super_admin" ||
      ((currentUser.role === "university_admin" || currentUser.role === "advisor") &&
        currentUser.university_id === args.universityId);

    if (!isAuthorized) {
      throw new Error("Unauthorized");
    }

    const users = await ctx.db
      .query("users")
      .withIndex("by_university", (q) =>
        q.eq("university_id", args.universityId),
      )
      .collect();

    return users;
  },
});

// Get onboarding progress
export const getOnboardingProgress = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return { completed_tasks: [] };
    }

    return {
      completed_tasks: (user as any).completed_tasks || [],
      onboarding_completed: user.onboarding_completed || false,
    };
  },
});

// Update onboarding progress
export const updateOnboardingProgress = mutation({
  args: {
    clerkId: v.string(),
    completed_tasks: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Determine if onboarding is complete (all 5 tasks done)
    const onboarding_completed = args.completed_tasks.length >= 5;

    await ctx.db.patch(user._id, {
      completed_tasks: args.completed_tasks,
      onboarding_completed,
      updated_at: Date.now(),
    });

    return user._id;
  },
});
