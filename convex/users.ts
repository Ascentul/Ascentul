import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthenticatedUser, assertUniversityAccess, isServiceRequest } from "./lib/roles";

/**
 * Internal helper: Resolve profile_image storage ID to URL
 * If the profile_image is a storage ID (not a URL), convert it to a URL
 * This ensures backward compatibility with old URL-based images
 */
async function resolveProfileImageUrl(ctx: QueryCtx, profileImage: string | undefined): Promise<string | null> {
  if (!profileImage) return null;

  // If it's already a URL, return it as-is (backward compatibility)
  if (profileImage.startsWith("http")) {
    return profileImage;
  }

  // It's a storage ID, convert to URL
  try {
    const url = await ctx.storage.getUrl(profileImage);
    return url;
  } catch {
    // Invalid storage ID, return null
    return null;
  }
}

/**
 * Internal helper: Log role changes to audit_logs
 * Only logs when performed by super_admin
 * Gracefully handles errors without failing the parent operation
 */
async function logRoleChange(
  ctx: MutationCtx,
  targetUser: any,
  oldRole: string,
  newRole: string
) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return; // No authenticated user

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    // Only log if performed by super_admin
    if (admin && admin.role === "super_admin") {
      await ctx.db.insert("audit_logs", {
        action: "user_role_changed",
        target_type: "user",
        target_id: targetUser._id,
        target_email: targetUser.email,
        target_name: targetUser.name,
        performed_by_id: admin._id,
        performed_by_email: admin.email,
        performed_by_name: admin.name,
        reason: `Role changed from ${oldRole} to ${newRole}`,
        metadata: {
          old_role: oldRole,
          new_role: newRole,
          target_university_id: targetUser.university_id,
        },
        timestamp: Date.now(),
      });
    }
  } catch (auditError) {
    console.error("Failed to create role change audit log:", auditError);
    // Don't fail the update if audit logging fails
  }
}

async function getActingUser(ctx: MutationCtx, serviceToken?: string) {
  const identity = await ctx.auth.getUserIdentity();
  const isService = isServiceRequest(serviceToken);

  if (!identity && !isService) {
    throw new Error("Unauthorized");
  }

  if (isService) {
    return { actingUser: null as any, isService: true };
  }

  const actingUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity!.subject))
    .unique();

  if (!actingUser) {
    throw new Error("Unauthorized");
  }

  return { actingUser, isService: false };
}

// Get user by Clerk ID
// Automatically resolves profile_image storage ID to URL if it exists
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
          assertUniversityAccess(currentUser, user.university_id as any);
        } else {
          throw new Error("Unauthorized");
        }
      }
    }

    // Resolve profile_image storage ID to URL
    const profileImageUrl = await resolveProfileImageUrl(ctx, user.profile_image);

    return {
      ...user,
      profile_image: profileImageUrl,
    };
  },
});

// DEPRECATED: Legacy Stripe integration - Use Clerk Billing instead
// Kept for backwards compatibility only
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

    // Prefer Clerk ID (should always be provided by Clerk webhooks or user self)
    if (args.clerkId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId!))
        .unique();
    }

    // Fallback to email (indexed) - only service or super_admin should use this
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

// Create or update user from Clerk webhook
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
    profile_image: v.optional(v.string()),
    serviceToken: v.optional(v.string()),
    // Allow optionally setting initial role (e.g., from Clerk public metadata)
    role: v.optional(
      v.union(
        v.literal("individual"),
        v.literal("user"),
        v.literal("student"),
        v.literal("staff"),
        v.literal("university_admin"),
        v.literal("advisor"),
        v.literal("super_admin"),
      ),
    ),
    // Cached subscription data synced from Clerk Billing via webhook
    subscription_plan: v.optional(v.union(
      v.literal("free"),
      v.literal("premium"),
      v.literal("university"),
    )),
    subscription_status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("cancelled"),
      v.literal("past_due"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const isService = isServiceRequest(args.serviceToken);

    if (!identity && !isService) {
      throw new Error("Unauthorized");
    }

    if (!isService && identity!.subject !== args.clerkId) {
      throw new Error("Unauthorized: Clerk identity mismatch");
    }

    const actingUser = !isService
      ? await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity!.subject))
        .unique()
      : null;

    const privilegedRoles = new Set([
      "super_admin",
      "university_admin",
      "advisor",
      "staff",
    ]);

    const canAssignPrivileged = actingUser?.role === "super_admin";
    const requestedRole = args.role;
    const safeRole = requestedRole && (canAssignPrivileged || !privilegedRoles.has(requestedRole))
      ? requestedRole
      : undefined;

    const resolvedRole = safeRole ?? "user";

    // First, try to find existing user by Clerk ID
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
        profile_image: args.profile_image,
        // If an explicit role is provided (e.g., from Clerk metadata), sync it
        ...(safeRole ? { role: safeRole } : {}),
        // Update cached subscription data if provided
        ...(args.subscription_plan ? { subscription_plan: args.subscription_plan } : {}),
        ...(args.subscription_status ? { subscription_status: args.subscription_status } : {}),
        updated_at: Date.now(),
      });
      return existingUser._id;
    }

    // Check if there's a pending university student with this email (invited but not yet signed up)
    const pendingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.or(
        q.eq(q.field("clerkId"), ""),
        q.eq(q.field("account_status"), "pending_activation")
      ))
      .first();

    if (pendingUser) {
      // Activate the pending user by updating with Clerk ID
      await ctx.db.patch(pendingUser._id, {
        clerkId: args.clerkId,
        name: args.name,
        username: args.username || pendingUser.username,
        profile_image: args.profile_image,
        account_status: "active",
        // Preserve university assignment from invitation
        // Update cached subscription data if provided, otherwise keep university plan
        subscription_plan: args.subscription_plan || pendingUser.subscription_plan || "free",
        subscription_status: args.subscription_status || pendingUser.subscription_status || "active",
        updated_at: Date.now(),
      });

      console.log(`[createUser] Activated pending university student: ${args.email}`);
      return pendingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      username: args.username || `user_${Date.now()}`,
      profile_image: args.profile_image,
      role: resolvedRole,
      subscription_plan: args.subscription_plan ?? "free",
      subscription_status: args.subscription_status ?? "active",
      onboarding_completed: false,
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Send welcome email to new self-registered users
    // Only send if not created by admin and is a regular user
    if (!args.role || args.role === "user") {
      try {
        await ctx.scheduler.runAfter(0, api.email.sendWelcomeEmail, {
          email: args.email,
          name: args.name,
        })
      } catch (emailError) {
        console.warn("Failed to schedule welcome email:", emailError)
        // Don't fail user creation if email scheduling fails
      }
    }

    return userId;
  },
});

// Alias for Clerk webhook - same as createUser
export const createUserFromClerk = createUser;

// Update user profile
export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    serviceToken: v.optional(v.string()),
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
      city: v.optional(v.string()),
      phone_number: v.optional(v.string()),
      website: v.optional(v.string()),
      skills: v.optional(v.string()),
      current_company: v.optional(v.string()),
      current_position: v.optional(v.string()),
      experience_level: v.optional(v.string()),
      industry: v.optional(v.string()),
      career_goals: v.optional(v.string()),
      education: v.optional(v.string()),
      education_history: v.optional(
        v.array(
          v.object({
            id: v.string(),
            school: v.optional(v.string()),
            degree: v.optional(v.string()),
            field_of_study: v.optional(v.string()),
            start_year: v.optional(v.string()),
            end_year: v.optional(v.string()),
            is_current: v.optional(v.boolean()),
            description: v.optional(v.string()),
          }),
        ),
      ),
      work_history: v.optional(
        v.array(
          v.object({
            id: v.string(),
            role: v.optional(v.string()),
            company: v.optional(v.string()),
            start_date: v.optional(v.string()),
            end_date: v.optional(v.string()),
            is_current: v.optional(v.boolean()),
            location: v.optional(v.string()),
            summary: v.optional(v.string()),
          }),
        ),
      ),
      achievements_history: v.optional(
        v.array(
          v.object({
            id: v.string(),
            title: v.optional(v.string()),
            description: v.optional(v.string()),
            date: v.optional(v.string()),
            organization: v.optional(v.string()),
          }),
        ),
      ),
      university_name: v.optional(v.string()),
      major: v.optional(v.string()),
      graduation_year: v.optional(v.string()),
      dream_job: v.optional(v.string()),
      onboarding_completed: v.optional(v.boolean()),
      role: v.optional(
        v.union(
          v.literal("individual"),
          v.literal("user"),
          v.literal("student"),
          v.literal("staff"),
          v.literal("university_admin"),
          v.literal("advisor"),
          v.literal("super_admin"),
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
    const { actingUser, isService } = await getActingUser(ctx, args.serviceToken);
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!targetUser) {
      throw new Error("User not found");
    }

    const isSelf = !isService && actingUser._id === targetUser._id;
    const sameUniversity =
      !isService &&
      actingUser.university_id &&
      targetUser.university_id &&
      actingUser.university_id === targetUser.university_id;
    const canManageTenant = isService ||
      actingUser.role === "super_admin" ||
      (actingUser.role === "university_admin" && sameUniversity);

    if (!isSelf && !canManageTenant) {
      throw new Error("Unauthorized");
    }

    const protectedFields = new Set([
      "role",
      "university_id",
      "subscription_plan",
      "subscription_status",
      "account_status",
      "department_id",
    ]);

    // Filter out undefined values from updates
    const cleanUpdates = Object.fromEntries(
      Object.entries(args.updates).filter(([_, value]) => value !== undefined)
    );

    if (
      !isService &&
      actingUser.role !== "super_admin" &&
      Object.keys(cleanUpdates).some((key) => protectedFields.has(key))
    ) {
      throw new Error("Unauthorized to change restricted fields");
    }

    // Track role changes for audit logging
    const roleChanged = args.updates.role && args.updates.role !== targetUser.role;
    const oldRole = targetUser.role;
    const newRole = args.updates.role;

    await ctx.db.patch(targetUser._id, {
      ...cleanUpdates,
      updated_at: Date.now(),
    });

    // Create audit log for role changes (super admin actions)
    if (roleChanged && !isService) {
      await logRoleChange(ctx, targetUser, oldRole, newRole!);
    }

    return targetUser._id;
  },
});

// Update user profile by Convex document ID (useful for admin/dev utilities)
export const updateUserById = mutation({
  args: {
    id: v.id("users"),
    serviceToken: v.optional(v.string()),
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
      city: v.optional(v.string()),
      phone_number: v.optional(v.string()),
      website: v.optional(v.string()),
      skills: v.optional(v.string()),
      current_company: v.optional(v.string()),
      current_position: v.optional(v.string()),
      experience_level: v.optional(v.string()),
      industry: v.optional(v.string()),
      career_goals: v.optional(v.string()),
      education: v.optional(v.string()),
      education_history: v.optional(
        v.array(
          v.object({
            id: v.string(),
            school: v.optional(v.string()),
            degree: v.optional(v.string()),
            field_of_study: v.optional(v.string()),
            start_year: v.optional(v.string()),
            end_year: v.optional(v.string()),
            is_current: v.optional(v.boolean()),
            description: v.optional(v.string()),
          }),
        ),
      ),
      work_history: v.optional(
        v.array(
          v.object({
            id: v.string(),
            role: v.optional(v.string()),
            company: v.optional(v.string()),
            start_date: v.optional(v.string()),
            end_date: v.optional(v.string()),
            is_current: v.optional(v.boolean()),
            location: v.optional(v.string()),
            summary: v.optional(v.string()),
          }),
        ),
      ),
      achievements_history: v.optional(
        v.array(
          v.object({
            id: v.string(),
            title: v.optional(v.string()),
            description: v.optional(v.string()),
            date: v.optional(v.string()),
            organization: v.optional(v.string()),
          }),
        ),
      ),
      university_name: v.optional(v.string()),
      major: v.optional(v.string()),
      graduation_year: v.optional(v.string()),
      dream_job: v.optional(v.string()),
      onboarding_completed: v.optional(v.boolean()),
      role: v.optional(
        v.union(
          v.literal("individual"),
          v.literal("user"),
          v.literal("student"),
          v.literal("staff"),
          v.literal("university_admin"),
          v.literal("advisor"),
          v.literal("super_admin"),
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
    const { actingUser, isService } = await getActingUser(ctx, args.serviceToken);
    const user = await ctx.db.get(args.id);

    if (!user) {
      throw new Error("User not found");
    }

    const isSelf = !isService && actingUser._id === user._id;
    const sameUniversity =
      !isService &&
      actingUser.university_id && user.university_id &&
      actingUser.university_id === user.university_id;
    const canManageTenant = isService ||
      actingUser.role === "super_admin" ||
      (actingUser.role === "university_admin" && sameUniversity);

    if (!isSelf && !canManageTenant) {
      throw new Error("Unauthorized");
    }

    const protectedFields = new Set([
      "role",
      "university_id",
      "subscription_plan",
      "subscription_status",
      "account_status",
      "department_id",
    ]);

    // Filter out undefined values from updates
    const cleanUpdates = Object.fromEntries(
      Object.entries(args.updates).filter(([_, value]) => value !== undefined)
    );

    if (
      !isService &&
      actingUser.role !== "super_admin" &&
      Object.keys(cleanUpdates).some((key) => protectedFields.has(key))
    ) {
      throw new Error("Unauthorized to change restricted fields");
    }

    // Track role changes for audit logging
    const roleChanged = args.updates.role && args.updates.role !== user.role;
    const oldRole = user.role;
    const newRole = args.updates.role;

    await ctx.db.patch(args.id, {
      ...cleanUpdates,
      updated_at: Date.now(),
    });

    // Create audit log for role changes (super admin actions)
    if (roleChanged && !isService) {
      await logRoleChange(ctx, user, oldRole, newRole!);
    }

    return args.id;
  },
});

/**
 * DEPRECATED: Legacy deleteUser function
 * DO NOT USE - No longer performs deletions
 * Use admin_users:softDeleteUser or admin_users:hardDeleteUser instead
 */
export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    throw new Error(
      "deleteUser is deprecated. Use admin_users:softDeleteUser or admin_users:hardDeleteUser instead."
    );
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
    const currentUser = await getAuthenticatedUser(ctx);

    // Only Super Admin can access global user list
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

    return users;
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

    // Only Super Admin can access global user list
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

    // Return only essential fields to reduce bandwidth
    // Resolve profile images in parallel
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
        // Exclude: education_history, work_history, achievements_history, bio, etc.
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

// Update onboarding progress
export const updateOnboardingProgress = mutation({
  args: {
    clerkId: v.string(),
    completed_tasks: v.array(v.string()),
  },
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

// Toggle hide/show progress card preference
export const toggleHideProgressCard = mutation({
  args: {
    clerkId: v.string(),
    hide: v.boolean(),
  },
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
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      hide_progress_card: args.hide,
      updated_at: Date.now(),
    });

    return user._id;
  },
});
