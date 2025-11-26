import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
// Workaround for "Type instantiation is excessively deep" error in Convex
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const api: any = require("./_generated/api").api;

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

async function getActingUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }

  const actingUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!actingUser) {
    throw new Error("Unauthorized");
  }

  return actingUser;
}

// Get user by Clerk ID
// Automatically resolves profile_image storage ID to URL if it exists
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return null;

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
    let user = null as any;

    // Prefer Clerk ID (should always be provided by Clerk webhooks)
    if (args.clerkId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId!))
        .unique();
    }

    // Fallback to email (indexed) - legacy support
    if (!user && args.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .unique();
    }

    if (!user) throw new Error("User not found for subscription update");

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
        ...(args.role ? { role: args.role } : {}),
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
      role: args.role ?? "user",
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
    const actingUser = await getActingUser(ctx);
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!targetUser) {
      throw new Error("User not found");
    }

    const isSelf = actingUser._id === targetUser._id;
    const sameUniversity =
      actingUser.university_id && targetUser.university_id &&
      actingUser.university_id === targetUser.university_id;
    const canManageTenant = actingUser.role === "super_admin" ||
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
    if (roleChanged) {
      await logRoleChange(ctx, targetUser, oldRole, newRole!);
    }

    return targetUser._id;
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
    const actingUser = await getActingUser(ctx);
    const user = await ctx.db.get(args.id);

    if (!user) {
      throw new Error("User not found");
    }

    const isSelf = actingUser._id === user._id;
    const sameUniversity =
      actingUser.university_id && user.university_id &&
      actingUser.university_id === user.university_id;
    const canManageTenant = actingUser.role === "super_admin" ||
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
    if (roleChanged) {
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

// Get all users with minimal fields (admin only) - optimized for bandwidth
export const getAllUsersMinimal = query({
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

// Toggle hide/show progress card preference
export const toggleHideProgressCard = mutation({
  args: {
    clerkId: v.string(),
    hide: v.boolean(),
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
      hide_progress_card: args.hide,
      updated_at: Date.now(),
    });

    return user._id;
  },
});

/**
 * Set user role (Convex is source of truth)
 * This is the canonical role update mutation - should be called by actions/admin flows
 * Does NOT update Clerk - that should be done by the action layer
 */
export const setRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(
      v.literal("super_admin"),
      v.literal("university_admin"),
      v.literal("advisor"),
      v.literal("student"),
      v.literal("individual"),
      v.literal("staff"),
      v.literal("user"),
    ),
    universityId: v.optional(v.id("universities")),
    actorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Validate university_id constraints based on role requirements
    const requiresUniversity = ["student", "university_admin", "advisor"].includes(args.newRole);
    const forbidsUniversity = args.newRole === "individual";

    if (requiresUniversity && !args.universityId) {
      throw new Error(`Role '${args.newRole}' requires a university_id`);
    }
    if (forbidsUniversity && args.universityId) {
      throw new Error(`Role 'individual' must not have a university_id`);
    }

    // Critical protection: Prevent demoting the last super_admin
    // This ensures there is always at least one super_admin to manage the platform
    if (user.role === "super_admin" && args.newRole !== "super_admin") {
      // Efficient filtered query - only fetches super_admins, not all users
      const superAdmins = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "super_admin"))
        .collect();

      if (superAdmins.length <= 1) {
        throw new Error(
          "Cannot demote the last super_admin. Platform requires at least one super_admin for administration."
        );
      }
    }

    const oldRole = user.role;

    // Update user role and university_id in Convex
    // For non-university roles, explicitly set undefined to clear the field
    await ctx.db.patch(args.userId, {
      role: args.newRole,
      university_id: requiresUniversity ? args.universityId : undefined,
      updated_at: Date.now(),
    });

    // Log the role change for audit trail
    await logRoleChange(ctx, user, oldRole, args.newRole);

    // Return the updated user
    return await ctx.db.get(args.userId);
  },
});

/**
 * Count users by role (efficient for role-based checks)
 * Uses filtered query instead of fetching all users
 */
export const countUsersByRole = query({
  args: {
    role: v.union(
      v.literal("super_admin"),
      v.literal("university_admin"),
      v.literal("advisor"),
      v.literal("student"),
      v.literal("individual"),
      v.literal("staff"),
      v.literal("user"),
    ),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), args.role))
      .collect();

    return users.length;
  },
});
