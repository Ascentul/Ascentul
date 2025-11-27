import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { getActingUser, logRoleChange } from "./users_core";
import { isServiceRequest } from "./lib/roles";
import { validateRoleTransition, type UserRole } from "./lib/roleValidation";

// Create or update user from Clerk webhook
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
    profile_image: v.optional(v.string()),
    serviceToken: v.optional(v.string()),
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

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        username: args.username,
        profile_image: args.profile_image,
        ...(safeRole ? { role: safeRole } : {}),
        ...(args.subscription_plan ? { subscription_plan: args.subscription_plan } : {}),
        ...(args.subscription_status ? { subscription_status: args.subscription_status } : {}),
        updated_at: Date.now(),
      });
      return existingUser._id;
    }

    const pendingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.or(
        q.eq(q.field("clerkId"), ""),
        q.eq(q.field("account_status"), "pending_activation")
      ))
      .first();

    if (pendingUser) {
      await ctx.db.patch(pendingUser._id, {
        clerkId: args.clerkId,
        name: args.name,
        username: args.username || pendingUser.username,
        profile_image: args.profile_image,
        account_status: "active",
        subscription_plan: args.subscription_plan || pendingUser.subscription_plan || "free",
        subscription_status: args.subscription_status || pendingUser.subscription_status || "active",
        updated_at: Date.now(),
      });

      console.log(`[createUser] Activated pending university student: ${args.email}`);
      return pendingUser._id;
    }

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

    if (!args.role || args.role === "user") {
      try {
        await ctx.scheduler.runAfter(0, api.email.sendWelcomeEmail, {
          email: args.email,
          name: args.name,
        })
      } catch (emailError) {
        console.warn("Failed to schedule welcome email:", emailError)
      }
    }

    return userId;
  },
});

export const createUserFromClerk = createUser;

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

    const roleChanged = args.updates.role && args.updates.role !== targetUser.role;
    const oldRole = targetUser.role;
    const newRole = args.updates.role;

    if (roleChanged && newRole) {
      const targetUniversityId = args.updates.university_id !== undefined
        ? args.updates.university_id
        : targetUser.university_id;

      const validation = await validateRoleTransition(
        ctx,
        targetUser.clerkId,
        oldRole as UserRole,
        newRole as UserRole,
        targetUniversityId ?? undefined
      );

      if (!validation.valid) {
        throw new Error(validation.error || "Invalid role transition");
      }
    }

    await ctx.db.patch(targetUser._id, {
      ...cleanUpdates,
      updated_at: Date.now(),
    });

    if (roleChanged && !isService) {
      await logRoleChange(ctx, targetUser, oldRole, newRole!);
    }

    return targetUser._id;
  },
});

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

    const roleChanged = args.updates.role && args.updates.role !== user.role;
    const oldRole = user.role;
    const newRole = args.updates.role;

    // Validate role transition if role is being changed
    if (roleChanged && newRole) {
      // Use the university_id from updates if provided, otherwise use existing
      const targetUniversityId = args.updates.university_id !== undefined
        ? args.updates.university_id
        : user.university_id;

      const validation = await validateRoleTransition(
        ctx,
        user.clerkId,
        oldRole as UserRole,
        newRole as UserRole,
        targetUniversityId ?? undefined
      );

      if (!validation.valid) {
        throw new Error(validation.error || "Invalid role transition");
      }
    }

    await ctx.db.patch(args.id, {
      ...cleanUpdates,
      updated_at: Date.now(),
    });

    if (roleChanged && !isService) {
      await logRoleChange(ctx, user, oldRole, newRole!);
    }

    return args.id;
  },
});

export const deleteUser = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    throw new Error(
      "deleteUser is deprecated. Use admin_users:softDeleteUser or admin_users:hardDeleteUser instead."
    );
  },
});

/**
 * Ensure a membership record exists for a user with a university-based role.
 * Creates a new membership if one doesn't exist, or updates the university_id if changed.
 *
 * This is called when a super admin assigns a role like student/advisor/university_admin
 * to ensure the user has the required membership record for authorization checks.
 */
export const ensureMembership = mutation({
  args: {
    clerkId: v.string(),
    role: v.union(
      v.literal("student"),
      v.literal("advisor"),
      v.literal("university_admin"),
    ),
    universityId: v.id("universities"),
  },
  handler: async (ctx, args) => {
    // Verify caller is super_admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: User not authenticated");
    }

    const callingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!callingUser || callingUser.role !== "super_admin") {
      throw new Error("Forbidden: Only super admins can manage memberships");
    }

    // Get target user by clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Check for existing membership with this role
    const existingMembership = await ctx.db
      .query("memberships")
      .withIndex("by_user_role", (q) => q.eq("user_id", user._id).eq("role", args.role))
      .first();

    const now = Date.now();

    if (existingMembership) {
      // Update if university changed or status is not active
      if (existingMembership.university_id !== args.universityId || existingMembership.status !== "active") {
        await ctx.db.patch(existingMembership._id, {
          university_id: args.universityId,
          status: "active",
          updated_at: now,
        });
        console.log(`[ensureMembership] Updated membership for user ${args.clerkId} with role ${args.role}`);
      }
      return existingMembership._id;
    }

    // Create new membership
    const membershipId = await ctx.db.insert("memberships", {
      user_id: user._id,
      university_id: args.universityId,
      role: args.role,
      status: "active",
      created_at: now,
      updated_at: now,
    });

    console.log(`[ensureMembership] Created membership for user ${args.clerkId} with role ${args.role}`);
    return membershipId;
  },
});
