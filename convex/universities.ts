import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a university if it doesn't exist (by slug), otherwise return existing id
export const createUniversity = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    license_plan: v.union(
      v.literal("Starter"),
      v.literal("Basic"),
      v.literal("Pro"),
      v.literal("Enterprise"),
    ),
    license_seats: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("trial"),
      v.literal("suspended"),
    ),
    admin_email: v.optional(v.string()),
    created_by_clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("universities")
      .withIndex("by_slug", q => q.eq("slug", args.slug))
      .unique();

    if (existing) return existing._id;

    let created_by_id: any = undefined;
    if (args.created_by_clerkId) {
      const creator = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", q => q.eq("clerkId", args.created_by_clerkId as string))
        .unique();
      if (creator) created_by_id = creator._id;
    }

    const now = Date.now();
    const uniId = await ctx.db.insert("universities", {
      name: args.name,
      slug: args.slug,
      license_plan: args.license_plan,
      license_seats: args.license_seats,
      license_used: 0,
      license_start: now,
      license_end: undefined,
      status: args.status,
      admin_email: args.admin_email,
      created_by_id,
      created_at: now,
      updated_at: now,
    });

    return uniId;
  }
});

// Assign a university to a user by Clerk ID and optionally make them an admin
export const assignUniversityToUser = mutation({
  args: {
    userClerkId: v.string(),
    universitySlug: v.string(),
    makeAdmin: v.optional(v.boolean()),
    sendInviteEmail: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", args.userClerkId))
      .unique();
    if (!user) throw new Error("User not found");

    const university = await ctx.db
      .query("universities")
      .withIndex("by_slug", q => q.eq("slug", args.universitySlug))
      .unique();
    if (!university) throw new Error("University not found");

    // Determine new role if making admin
    const newRole = args.makeAdmin ? "university_admin" as const : user.role;

    await ctx.db.patch(user._id, {
      university_id: university._id,
      subscription_plan: "university",
      ...(args.makeAdmin ? { role: newRole } : {}),
      updated_at: Date.now(),
    });

    // Send invite email if requested and user is pending activation
    if (args.sendInviteEmail && user.account_status === "pending_activation" && user.activation_token) {
      try {
        const { api } = await import("./_generated/api");

        // Determine which email template to use based on role
        if (newRole === "university_admin") {
          await ctx.scheduler.runAfter(0, api.email.sendUniversityAdminInvitationEmail, {
            email: user.email,
            name: user.name,
            universityName: university.name,
            activationToken: user.activation_token,
          });
        } else if (newRole === "advisor") {
          await ctx.scheduler.runAfter(0, api.email.sendUniversityAdvisorInvitationEmail, {
            email: user.email,
            name: user.name,
            universityName: university.name,
            activationToken: user.activation_token,
          });
        } else if (newRole === "student") {
          await ctx.scheduler.runAfter(0, api.email.sendUniversityStudentInvitationEmail, {
            email: user.email,
            name: user.name,
            universityName: university.name,
            activationToken: user.activation_token,
          });
        }
      } catch (emailError) {
        console.warn("Failed to schedule university invitation email:", emailError);
        // Don't fail the assignment if email scheduling fails
      }
    }

    return user._id;
  }
});

// Get all universities for admin management
export const getAllUniversities = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // TODO: Add proper admin authorization check
    return await ctx.db
      .query("universities")
      .collect();
  }
});

// Update a university (admin only)
export const updateUniversity = mutation({
  args: {
    universityId: v.id("universities"),
    updates: v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      description: v.optional(v.string()),
      website: v.optional(v.string()),
      contact_email: v.optional(v.string()),
      license_plan: v.optional(v.union(
        v.literal("Starter"),
        v.literal("Basic"),
        v.literal("Pro"),
        v.literal("Enterprise"),
      )),
      license_seats: v.optional(v.number()),
      max_students: v.optional(v.number()),
      status: v.optional(v.union(
        v.literal("active"),
        v.literal("expired"),
        v.literal("trial"),
        v.literal("suspended"),
      )),
      admin_email: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // TODO: Add proper admin authorization check
    const { universityId, updates } = args;

    await ctx.db.patch(universityId, {
      ...updates,
      updated_at: Date.now(),
    });

    return universityId;
  }
});

// Update university settings (for university admin to update their own institution)
export const updateUniversitySettings = mutation({
  args: {
    clerkId: v.string(),
    universityId: v.id("universities"),
    settings: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      website: v.optional(v.string()),
      contact_email: v.optional(v.string()),
      max_students: v.optional(v.number()),
      license_seats: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!currentUser) throw new Error("User not found");

    // Check authorization: must be university_admin of this university or super_admin
    const isAuthorized =
      currentUser.role === "super_admin" ||
      (currentUser.role === "university_admin" && currentUser.university_id === args.universityId);

    if (!isAuthorized) throw new Error("Unauthorized - University admin access required");

    await ctx.db.patch(args.universityId, {
      ...args.settings,
      updated_at: Date.now(),
    });

    return {
      success: true,
      message: 'University settings updated successfully',
    };
  }
});

// Get university settings for current user's institution
export const getUniversitySettings = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!currentUser) throw new Error("User not found");

    // If user has a university_id, return that university's settings
    if (currentUser.university_id) {
      return await ctx.db.get(currentUser.university_id);
    }

    return null;
  }
});

// Get university by ID
export const getUniversity = query({
  args: { universityId: v.id("universities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.universityId);
  }
});

// Optional helper to fetch by slug
export const getUniversityBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("universities")
      .withIndex("by_slug", q => q.eq("slug", args.slug))
      .unique();
  }
});
