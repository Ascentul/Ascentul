import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSuperAdmin, getAuthenticatedUser } from "./lib/roles";

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
    await requireSuperAdmin(ctx);
    const existing = await ctx.db
      .query("universities")
      .withIndex("by_slug", q => q.eq("slug", args.slug))
      .unique();

    if (existing) return existing._id;

    const creator = await getAuthenticatedUser(ctx);
    const created_by_id = creator?._id ?? undefined;

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

// Assign a university to a user by Clerk ID or email and optionally make them an admin
export const assignUniversityToUser = mutation({
  args: {
    userClerkId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    universitySlug: v.string(),
    makeAdmin: v.optional(v.boolean()),
    sendInviteEmail: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actingUser = await getAuthenticatedUser(ctx);
    const isSuperAdmin = actingUser.role === "super_admin";

    // Find user by clerkId or email - at least one must be provided
    if (!args.userClerkId && !args.userEmail) {
      throw new Error("Either userClerkId or userEmail must be provided");
    }

    let user = null;

    if (args.userClerkId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", q => q.eq("clerkId", args.userClerkId!))
        .unique();
    } else if (args.userEmail) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", q => q.eq("email", args.userEmail!))
        .unique();
    }

    if (!user) throw new Error("User not found");

    const university = await ctx.db
      .query("universities")
      .withIndex("by_slug", q => q.eq("slug", args.universitySlug))
      .unique();
    if (!university) throw new Error("University not found");

    // University admins can only assign within their university
    if (
      !isSuperAdmin &&
      !(actingUser.role === "university_admin" && actingUser.university_id === university._id)
    ) {
      throw new Error("Unauthorized");
    }

    // Determine new role if making admin
    const newRole = args.makeAdmin ? "university_admin" as const : user.role;

    if (!isSuperAdmin && user.university_id && user.university_id !== university._id) {
      throw new Error("User already assigned to a different university");
    }

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
  args: {
    clerkId: v.optional(v.string()),
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const universities = await ctx.db
      .query("universities")
      .collect();

    // By default, exclude soft-deleted universities
    if (!args.includeDeleted) {
      return universities.filter((u) => u.status !== "deleted");
    }

    return universities;
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
    await requireSuperAdmin(ctx);
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

// Delete a university (soft or hard delete - super admin only)
// Soft delete: marks as deleted, preserves data
// Hard delete: permanently removes university and all related data (for test universities)
export const deleteUniversity = mutation({
  args: {
    universityId: v.id("universities"),
    hardDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const university = await ctx.db.get(args.universityId);
    if (!university) {
      throw new Error("University not found");
    }

    const now = Date.now();

    // Get the acting user for audit logging
    const actingUser = await getAuthenticatedUser(ctx);

    // Soft delete: just mark as deleted
    if (!args.hardDelete) {
      await ctx.db.patch(args.universityId, {
        status: "deleted",
        deleted_at: now,
        updated_at: now,
      });

      // Create audit log entry for soft delete
      await ctx.db.insert("audit_logs", {
        action: "university_soft_deleted",
        target_type: "university",
        target_id: args.universityId,
        target_name: university.name,
        performed_by_id: actingUser._id,
        performed_by_email: actingUser.email,
        performed_by_name: actingUser.name,
        metadata: {
          university_slug: university.slug,
          previous_status: university.status,
        },
        timestamp: now,
      });

      return {
        success: true,
        type: "soft_delete",
        universityId: args.universityId,
        message: `University "${university.name}" has been soft deleted`,
      };
    }

    // Hard delete: remove all related data
    // 1. Delete advisorStudents
    const advisorStudents = await ctx.db
      .query("advisorStudents")
      .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
      .collect();
    for (const record of advisorStudents) {
      await ctx.db.delete(record._id);
    }

    // 2. Delete memberships
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
      .collect();
    for (const record of memberships) {
      await ctx.db.delete(record._id);
    }

    // 3. Delete studentInvites
    const studentInvites = await ctx.db
      .query("studentInvites")
      .filter((q) => q.eq(q.field("university_id"), args.universityId))
      .collect();
    for (const record of studentInvites) {
      await ctx.db.delete(record._id);
    }

    // 4. Delete studentProfiles
    const studentProfiles = await ctx.db
      .query("studentProfiles")
      .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
      .collect();
    for (const record of studentProfiles) {
      await ctx.db.delete(record._id);
    }

    // 5. Delete courses
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
      .collect();
    for (const record of courses) {
      await ctx.db.delete(record._id);
    }

    // 6. Delete departments
    const departments = await ctx.db
      .query("departments")
      .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
      .collect();
    for (const record of departments) {
      await ctx.db.delete(record._id);
    }

    // 7. Unlink users from this university (don't delete users, just clear university_id)
    const linkedUsers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("university_id"), args.universityId))
      .collect();
    for (const user of linkedUsers) {
      await ctx.db.patch(user._id, {
        university_id: undefined,
        // Reset role if they were university_admin or advisor
        ...(user.role === "university_admin" || user.role === "advisor"
          ? { role: "user" as const }
          : {}),
        // Reset subscription if it was university plan
        ...(user.subscription_plan === "university"
          ? { subscription_plan: "free" as const }
          : {}),
        updated_at: now,
      });
    }

    // 8. Clear university_id from optional tables (applications, goals, etc.)
    // These have optional university_id, so we just clear them
    const applications = await ctx.db
      .query("applications")
      .filter((q) => q.eq(q.field("university_id"), args.universityId))
      .collect();
    for (const record of applications) {
      await ctx.db.patch(record._id, { university_id: undefined, updated_at: now });
    }

    const goals = await ctx.db
      .query("goals")
      .filter((q) => q.eq(q.field("university_id"), args.universityId))
      .collect();
    for (const record of goals) {
      await ctx.db.patch(record._id, { university_id: undefined, updated_at: now });
    }

    // 9. Create audit log entry for hard delete (before deleting the university)
    const deletedCounts = {
      advisorStudents: advisorStudents.length,
      memberships: memberships.length,
      studentInvites: studentInvites.length,
      studentProfiles: studentProfiles.length,
      courses: courses.length,
      departments: departments.length,
      unlinkedUsers: linkedUsers.length,
      clearedApplications: applications.length,
      clearedGoals: goals.length,
    };

    await ctx.db.insert("audit_logs", {
      action: "university_hard_deleted",
      target_type: "university",
      target_id: args.universityId,
      target_name: university.name,
      performed_by_id: actingUser._id,
      performed_by_email: actingUser.email,
      performed_by_name: actingUser.name,
      metadata: {
        university_slug: university.slug,
        university_status: university.status,
        deletedCounts,
      },
      timestamp: now,
    });

    // 10. Finally delete the university record itself
    await ctx.db.delete(args.universityId);

    return {
      success: true,
      type: "hard_delete",
      universityId: args.universityId,
      message: `University "${university.name}" and all related data have been permanently deleted`,
      deletedCounts,
    };
  },
});

// Get university admin counts for all universities (optimized for bandwidth)
// Returns a map of university_id -> count of admins
export const getUniversityAdminCounts = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Fetch all university_admin users using the by_role index
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "university_admin"))
      .collect();

    // Count admins per university
    const counts: Record<string, number> = {};
    for (const admin of admins) {
      if (admin.university_id) {
        const uniId = admin.university_id as string;
        counts[uniId] = (counts[uniId] || 0) + 1;
      }
    }

    return counts;
  }
});
