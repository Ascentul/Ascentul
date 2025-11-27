import { v } from "convex/values";
import { query } from "./_generated/server";
import { resolveProfileImageUrl } from "./users_core";
import { assertUniversityAccess, getAuthenticatedUser, isServiceRequest } from "./lib/roles";

// Get user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string(), serviceToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const isService = isServiceRequest(args.serviceToken);
    if (!identity && !isService) {
      throw new Error("Unauthorized");
    }

    const actingUser = !isService
      ? await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity!.subject))
        .unique()
      : null;

    if (!isService && !actingUser) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return null;

    if (!isService) {
      const currentUser = actingUser!;
      const isSelf = currentUser.clerkId === user.clerkId;
      const actingRole = currentUser.role;
      if (
        !isSelf &&
        actingRole !== "super_admin"
      ) {
        if (actingRole === "university_admin" || actingRole === "advisor") {
          if (!user.university_id) {
            throw new Error("Unauthorized - target user has no university");
          }
          assertUniversityAccess(currentUser, user.university_id);
        } else {
          throw new Error("Unauthorized");
        }
      }
    }

    const profileImageUrl = await resolveProfileImageUrl(ctx, user.profile_image);

    return {
      ...user,
      profile_image: profileImageUrl,
    };
  },
});

// Get all users (admin only)
export const getAllUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    if (currentUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }

    const limit = args.limit || 50;
    const result = await ctx.db
      .query("users")
      .order("desc")
      .paginate({ numItems: limit, cursor: null });

    return {
      page: result.page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

// Get all users with minimal fields (admin only) - optimized for bandwidth
export const getAllUsersMinimal = query({
  args: {
    clerkId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    if (currentUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }

    const users = await ctx.db
      .query("users")
      .order("desc")
      .paginate({
        numItems: args.limit || 50,
        cursor: null,
      });

    const resolvedUsers = await Promise.all(
      users.page.map(async (user) => ({
        _id: user._id,
        _creationTime: user._creationTime,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        account_status: user.account_status,
        is_test_user: user.is_test_user,
        deleted_at: user.deleted_at,
        deleted_by: user.deleted_by,
        deleted_reason: user.deleted_reason,
        university_id: user.university_id,
        profile_image: await resolveProfileImageUrl(ctx, user.profile_image),
        created_at: user.created_at,
        updated_at: user.updated_at,
      }))
    );

    return {
      ...users,
      page: resolvedUsers,
    };
  },
});

// Get users by university (university admin only)
export const getUsersByUniversity = query({
  args: {
    clerkId: v.string(),
    universityId: v.id("universities"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const isSuperAdmin = currentUser.role === "super_admin";
    const isUniversityScoped = (currentUser.role === "university_admin" || currentUser.role === "advisor") &&
      currentUser.university_id === args.universityId;

    if (!isSuperAdmin && !isUniversityScoped) {
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
    const actingUser = await getAuthenticatedUser(ctx);
    const isSelf = actingUser.clerkId === args.clerkId;
    if (!isSelf && actingUser.role !== "super_admin") {
      throw new Error("Unauthorized");
    }

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
