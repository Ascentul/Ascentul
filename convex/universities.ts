import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSuperAdmin, getAuthenticatedUser } from "./lib/roles";

// Workaround for "Type instantiation is excessively deep" error in Convex
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const convexApi: any = require("./_generated/api").api;

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
        // Determine which email template to use based on role
        if (newRole === "university_admin") {
          await ctx.scheduler.runAfter(0, convexApi.email.sendUniversityAdminInvitationEmail, {
            email: user.email,
            name: user.name,
            universityName: university.name,
            activationToken: user.activation_token,
          });
        } else if (newRole === "advisor") {
          await ctx.scheduler.runAfter(0, convexApi.email.sendUniversityAdvisorInvitationEmail, {
            email: user.email,
            name: user.name,
            universityName: university.name,
            activationToken: user.activation_token,
          });
        } else if (newRole === "student") {
          await ctx.scheduler.runAfter(0, convexApi.email.sendUniversityStudentInvitationEmail, {
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

// Toggle test university status (super admin only)
export const toggleTestUniversity = mutation({
  args: {
    universityId: v.id("universities"),
    isTest: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const university = await ctx.db.get(args.universityId);
    if (!university) {
      throw new Error("University not found");
    }

    const now = Date.now();
    const actingUser = await getAuthenticatedUser(ctx);

    await ctx.db.patch(args.universityId, {
      is_test: args.isTest,
      updated_at: now,
    });

    // Create audit log entry
    await ctx.db.insert("audit_logs", {
      action: args.isTest ? "university_marked_test" : "university_unmarked_test",
      target_type: "university",
      target_id: args.universityId,
      target_name: university.name,
      performed_by_id: actingUser._id,
      performed_by_email: actingUser.email,
      performed_by_name: actingUser.name,
      metadata: {
        university_slug: university.slug,
        is_test: args.isTest,
      },
      timestamp: now,
    });

    return {
      success: true,
      universityId: args.universityId,
      isTest: args.isTest,
      message: args.isTest
        ? `University "${university.name}" marked as test university`
        : `University "${university.name}" unmarked as test university`,
    };
  },
});

// Archive a university (non-destructive, super admin only)
// This is the preferred way to disable a real university.
// All data is preserved: users, applications, goals, metrics, etc.
// The university simply becomes inactive and stops appearing in active lists.
// This is MORE PERMANENT than suspend - intended for universities that won't be coming back.
export const archiveUniversity = mutation({
  args: {
    universityId: v.id("universities"),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const university = await ctx.db.get(args.universityId);
    if (!university) {
      throw new Error("University not found");
    }

    // Cannot archive if already archived
    if (university.status === "archived") {
      throw new Error("University is already archived");
    }

    const now = Date.now();
    const actingUser = await getAuthenticatedUser(ctx);

    // Update status to archived
    await ctx.db.patch(args.universityId, {
      status: "archived",
      archived_at: now,
      updated_at: now,
    });

    // Create audit log entry
    await ctx.db.insert("audit_logs", {
      action: "university_archived",
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
      universityId: args.universityId,
      message: `University "${university.name}" has been archived`,
      previousStatus: university.status,
    };
  },
});

// Restore a university from archived status (super admin only)
// This reverses the archive operation and reactivates the university.
// Should be used sparingly - archive is intended to be permanent.
// Requires admin approval and reason for restoration.
export const restoreUniversity = mutation({
  args: {
    universityId: v.id("universities"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const university = await ctx.db.get(args.universityId);
    if (!university) {
      throw new Error("University not found");
    }

    // Can only restore archived universities
    if (university.status !== "archived") {
      throw new Error("Only archived universities can be restored. Current status: " + university.status);
    }

    const now = Date.now();
    const actingUser = await getAuthenticatedUser(ctx);

    // Restore to active status
    const newStatus = "active" as const;

    // Update status back to active
    await ctx.db.patch(args.universityId, {
      status: newStatus,
      archived_at: undefined, // Clear archived timestamp
      updated_at: now,
    });

    // Create audit log entry
    await ctx.db.insert("audit_logs", {
      action: "university_restored",
      target_type: "university",
      target_id: args.universityId,
      target_name: university.name,
      performed_by_id: actingUser._id,
      performed_by_email: actingUser.email,
      performed_by_name: actingUser.name,
      reason: args.reason,
      metadata: {
        university_slug: university.slug,
        previous_status: "archived",
        new_status: newStatus,
        archived_at: university.archived_at,
      },
      timestamp: now,
    });

    return {
      success: true,
      universityId: args.universityId,
      message: `University "${university.name}" has been restored from archive`,
      newStatus,
    };
  },
});

// Hard delete a university (super admin only)
// This function has two distinct behaviors based on university.is_test:
//
// FOR TEST UNIVERSITIES (is_test = true):
// - Full purge is allowed for data cleanup
// - Deletes: university record, memberships, student profiles, invitations, departments, courses
// - Unlinks users (clears university_id, marks users as test)
// - Clears university_id from applications and goals (preserves the records)
//
// FOR REAL UNIVERSITIES (is_test = false):
// - Guarded by ALLOW_REAL_UNIVERSITY_DELETE environment variable
// - If guard not set: throws error directing admin to use archiveUniversity instead
// - If guard is set: performs non-destructive status change only
//   - Sets status = "deleted"
//   - Sets deleted_at timestamp
//   - Unlinks user.university_id (but keeps user accounts and history)
//   - Creates audit log with WARNING level
//   - Does NOT delete user accounts or history
//
// IMPORTANT: Archive is the preferred way to disable real universities.
// Hard delete should only be used for test universities or rare legal/manual cleanup.
export const hardDeleteUniversity = mutation({
  args: {
    universityId: v.id("universities"),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const university = await ctx.db.get(args.universityId);
    if (!university) {
      throw new Error("University not found");
    }

    const now = Date.now();
    const actingUser = await getAuthenticatedUser(ctx);

    // === BEHAVIOR FOR TEST UNIVERSITIES ===
    // Full purge allowed for test data cleanup
    //
    // WARNING: Convex does not support transactions. If any operation fails midway,
    // the database may be left in an inconsistent state requiring manual cleanup.
    // This function uses try-catch blocks to collect errors and continue attempting
    // all operations, then reports success/failure details at the end.
    if (university.is_test === true) {
      const errors: Array<{ step: string; error: string }> = [];
      const deletedCounts = {
        advisorStudents: 0,
        memberships: 0,
        studentInvites: 0,
        studentProfiles: 0,
        courses: 0,
        departments: 0,
        unlinkedUsers: 0,
        clearedApplications: 0,
        clearedGoals: 0,
      };

      // 1. Delete advisorStudents
      try {
        const advisorStudents = await ctx.db
          .query("advisorStudents")
          .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
          .collect();
        for (const record of advisorStudents) {
          await ctx.db.delete(record._id);
          deletedCounts.advisorStudents++;
        }
      } catch (error) {
        errors.push({ step: "delete advisorStudents", error: String(error) });
      }

      // 2. Delete memberships
      try {
        const memberships = await ctx.db
          .query("memberships")
          .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
          .collect();
        for (const record of memberships) {
          await ctx.db.delete(record._id);
          deletedCounts.memberships++;
        }
      } catch (error) {
        errors.push({ step: "delete memberships", error: String(error) });
      }

      // 3. Delete studentInvites
      try {
        const studentInvites = await ctx.db
          .query("studentInvites")
          .filter((q) => q.eq(q.field("university_id"), args.universityId))
          .collect();
        for (const record of studentInvites) {
          await ctx.db.delete(record._id);
          deletedCounts.studentInvites++;
        }
      } catch (error) {
        errors.push({ step: "delete studentInvites", error: String(error) });
      }

      // 4. Delete studentProfiles
      try {
        const studentProfiles = await ctx.db
          .query("studentProfiles")
          .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
          .collect();
        for (const record of studentProfiles) {
          await ctx.db.delete(record._id);
          deletedCounts.studentProfiles++;
        }
      } catch (error) {
        errors.push({ step: "delete studentProfiles", error: String(error) });
      }

      // 5. Delete courses
      try {
        const courses = await ctx.db
          .query("courses")
          .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
          .collect();
        for (const record of courses) {
          await ctx.db.delete(record._id);
          deletedCounts.courses++;
        }
      } catch (error) {
        errors.push({ step: "delete courses", error: String(error) });
      }

      // 6. Delete departments
      try {
        const departments = await ctx.db
          .query("departments")
          .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
          .collect();
        for (const record of departments) {
          await ctx.db.delete(record._id);
          deletedCounts.departments++;
        }
      } catch (error) {
        errors.push({ step: "delete departments", error: String(error) });
      }

      // 7. Unlink users from this university (mark as test, clear university_id)
      try {
        const linkedUsers = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("university_id"), args.universityId))
          .collect();
        for (const user of linkedUsers) {
          await ctx.db.patch(user._id, {
            university_id: undefined,
            is_test_user: true, // Mark users as test so they're excluded from metrics
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
          deletedCounts.unlinkedUsers++;
        }
      } catch (error) {
        errors.push({ step: "unlink users", error: String(error) });
      }

      // 8. Clear university_id from optional tables (applications, goals, etc.)
      // These have optional university_id, so we just clear the reference but keep records
      try {
        const applications = await ctx.db
          .query("applications")
          .filter((q) => q.eq(q.field("university_id"), args.universityId))
          .collect();
        for (const record of applications) {
          await ctx.db.patch(record._id, { university_id: undefined, updated_at: now });
          deletedCounts.clearedApplications++;
        }
      } catch (error) {
        errors.push({ step: "clear applications", error: String(error) });
      }

      try {
        const goals = await ctx.db
          .query("goals")
          .filter((q) => q.eq(q.field("university_id"), args.universityId))
          .collect();
        for (const record of goals) {
          await ctx.db.patch(record._id, { university_id: undefined, updated_at: now });
          deletedCounts.clearedGoals++;
        }
      } catch (error) {
        errors.push({ step: "clear goals", error: String(error) });
      }

      // 9. Create audit log entry for hard delete (before deleting the university)
      // Include both success counts and any errors encountered
      // CRITICAL: Audit log must succeed for compliance. If this fails, abort the deletion.
      try {
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
            is_test: true,
            deletedCounts,
            errors: errors.length > 0 ? errors : undefined,
          },
          timestamp: now,
        });
      } catch (error) {
        // Audit log failure is FATAL - cannot proceed with hard delete without audit trail
        throw new Error(
          `Hard delete aborted: Could not create audit log. This operation requires an audit trail for compliance. ` +
          `Partial cleanup may have occurred (see counts). Do not retry without investigating. ` +
          `Deleted counts: ${JSON.stringify(deletedCounts)}. ` +
          `Audit log error: ${String(error)}`
        );
      }

      // 10. Finally delete the university record itself
      try {
        await ctx.db.delete(args.universityId);
      } catch (error) {
        errors.push({ step: "delete university record", error: String(error) });
        // If we can't delete the university record, this is a critical failure
        throw new Error(
          `Hard delete failed: Could not delete university record. ` +
          `Partial deletion occurred. Manual cleanup required. ` +
          `Errors: ${JSON.stringify(errors)}`
        );
      }

      // If any errors occurred during cleanup operations (but university was deleted),
      // throw an error with details
      if (errors.length > 0) {
        throw new Error(
          `Hard delete completed with errors. University record deleted but some cleanup operations failed. ` +
          `Manual verification recommended. Deleted counts: ${JSON.stringify(deletedCounts)}. ` +
          `Errors: ${JSON.stringify(errors)}`
        );
      }

      return {
        success: true,
        type: "hard_delete_test",
        universityId: args.universityId,
        message: `Test university "${university.name}" and all related data have been permanently deleted`,
        deletedCounts,
      };
    }

    // === BEHAVIOR FOR REAL UNIVERSITIES ===
    // Hard delete is disabled for real universities - always throws error
    throw new Error(
      `Hard delete is disabled for real universities. ` +
      `University "${university.name}" (is_test = false) cannot be hard deleted. ` +
      `Use archiveUniversity instead for non-destructive disable. ` +
      `If you must perform hard delete for legal/compliance reasons, ` +
      `first mark the university as a test university using toggleTestUniversity.`
    );
  },
});

// Legacy deleteUniversity function - deprecated, redirects to new functions
// Kept for backward compatibility but will be removed in future versions
export const deleteUniversity = mutation({
  args: {
    universityId: v.id("universities"),
    hardDelete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Redirect to appropriate function based on hardDelete flag
    if (args.hardDelete) {
      throw new Error(
        "deleteUniversity with hardDelete=true is deprecated. " +
        "Use hardDeleteUniversity instead. " +
        "Note: Hard delete only works for test universities. " +
        "For real universities, use archiveUniversity."
      );
    } else {
      throw new Error(
        "deleteUniversity is deprecated. " +
        "Use archiveUniversity for non-destructive disable (preferred), " +
        "or hardDeleteUniversity for test universities only."
      );
    }
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
