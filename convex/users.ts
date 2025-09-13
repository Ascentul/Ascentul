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

// Create or update user from Clerk webhook
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
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
      role: "user",
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
      onboarding_completed: v.optional(v.boolean()),
      role: v.optional(v.union(v.literal("user"), v.literal("admin"), v.literal("super_admin"), v.literal("university_admin"), v.literal("staff"))),
      subscription_plan: v.optional(v.union(v.literal("free"), v.literal("premium"), v.literal("university"))),
      subscription_status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("cancelled"), v.literal("past_due"))),
      university_id: v.optional(v.id("universities")),
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

    await ctx.db.patch(user._id, {
      ...args.updates,
      updated_at: Date.now(),
    });

    return user._id;
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

    if (!currentUser || !["admin", "super_admin", "university_admin"].includes(currentUser.role)) {
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
      (currentUser.role === "university_admin" && currentUser.university_id === args.universityId);

    if (!isAuthorized) {
      throw new Error("Unauthorized");
    }

    const users = await ctx.db
      .query("users")
      .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
      .collect();

    return users;
  },
});
