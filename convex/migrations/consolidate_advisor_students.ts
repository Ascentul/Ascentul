/**
 * Migration: Consolidate advisorStudents → student_advisors
 *
 * This migration copies all records from the legacy `advisorStudents` table
 * to the canonical `student_advisors` table.
 *
 * The `advisorStudents` table references `studentProfiles.student_profile_id`,
 * while `student_advisors` references `users.student_id` directly.
 *
 * Run: npx convex run migrations/consolidate_advisor_students:migrate
 * Dry run: npx convex run migrations/consolidate_advisor_students:dryRun
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireSuperAdmin } from "../lib/roles";

/**
 * Preview what would be migrated (dry run)
 * Requires super_admin role
 */
export const dryRun = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const advisorStudents = await ctx.db.query("advisorStudents").collect();

    const results = {
      totalRecords: advisorStudents.length,
      willMigrate: [] as Array<{
        advisorStudentId: string;
        studentProfileId: string;
        advisorId: string;
        userId: string | null;
        status: "will_migrate" | "already_exists" | "missing_user" | "missing_profile";
      }>,
      alreadyMigrated: 0,
      missingUsers: 0,
      missingProfiles: 0,
    };

    for (const record of advisorStudents) {
      // Get student profile to find user_id
      const studentProfile = await ctx.db.get(record.student_profile_id);

      if (!studentProfile) {
        results.willMigrate.push({
          advisorStudentId: record._id,
          studentProfileId: record.student_profile_id,
          advisorId: record.advisor_id,
          userId: null,
          status: "missing_profile",
        });
        results.missingProfiles++;
        continue;
      }

      const userId = studentProfile.user_id;

      // Validate user exists
      const user = await ctx.db.get(userId);
      if (!user) {
        results.willMigrate.push({
          advisorStudentId: record._id,
          studentProfileId: record.student_profile_id,
          advisorId: record.advisor_id,
          userId,
          status: "missing_user",
        });
        results.missingUsers++;
        continue;
      }

      // Check if already exists in student_advisors
      const existing = await ctx.db
        .query("student_advisors")
        .withIndex("by_advisor", (q) =>
          q.eq("advisor_id", record.advisor_id).eq("university_id", record.university_id)
        )
        .filter((q) => q.eq(q.field("student_id"), userId))
        .unique();

      if (existing) {
        results.willMigrate.push({
          advisorStudentId: record._id,
          studentProfileId: record.student_profile_id,
          advisorId: record.advisor_id,
          userId,
          status: "already_exists",
        });
        results.alreadyMigrated++;
      } else {
        results.willMigrate.push({
          advisorStudentId: record._id,
          studentProfileId: record.student_profile_id,
          advisorId: record.advisor_id,
          userId,
          status: "will_migrate",
        });
      }
    }

    return results;
  },
});

/**
 * Execute the migration (super_admin only)
 */
export const migrate = mutation({
  args: {
    deleteAfterMigration: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Require super_admin
    await requireSuperAdmin(ctx);

    const advisorStudents = await ctx.db.query("advisorStudents").collect();

    const results = {
      totalRecords: advisorStudents.length,
      migrated: 0,
      skippedAlreadyExists: 0,
      skippedMissingProfile: 0,
      skippedMissingUser: 0,
      deleted: 0,
      errors: [] as Array<{ id: string; error: string }>,
    };

    const now = Date.now();

    for (const record of advisorStudents) {
      try {
        // Get student profile to find user_id
        const studentProfile = await ctx.db.get(record.student_profile_id);

        if (!studentProfile) {
          results.skippedMissingProfile++;
          results.errors.push({
            id: record._id,
            error: `Student profile not found: ${record.student_profile_id}`,
          });
          continue;
        }

        const userId = studentProfile.user_id;

        // Validate user exists
        const user = await ctx.db.get(userId);
        if (!user) {
          results.skippedMissingUser++;
          results.errors.push({
            id: record._id,
            error: `User not found: ${userId}`,
          });
          continue;
        }

        // Check if already exists in student_advisors
        const existing = await ctx.db
          .query("student_advisors")
          .withIndex("by_advisor", (q) =>
            q.eq("advisor_id", record.advisor_id).eq("university_id", record.university_id)
          )
          .filter((q) => q.eq(q.field("student_id"), userId))
          .unique();

        if (existing) {
          // Record already exists in student_advisors - skip migration but still
          // allow deletion of the duplicate in advisorStudents if requested
          results.skippedAlreadyExists++;
        } else {
          // Check if student already has an owner
          const existingOwner = await ctx.db
            .query("student_advisors")
            .withIndex("by_student_owner", (q) =>
              q.eq("student_id", userId).eq("is_owner", true)
            )
            .unique();

          // Create new record in student_advisors
          await ctx.db.insert("student_advisors", {
            student_id: userId,
            advisor_id: record.advisor_id,
            university_id: record.university_id,
            is_owner: !existingOwner, // Set as owner if no existing owner
            shared_type: undefined, // No shared_type in legacy table
            assigned_at: record.created_at,
            assigned_by: record.assigned_by_id,
            notes: undefined,
            created_at: now,
            updated_at: now,
          });
          results.migrated++;
        }

        // Optionally delete the old record
        if (args.deleteAfterMigration) {
          await ctx.db.delete(record._id);
          results.deleted++;
        }
      } catch (error) {
        results.errors.push({
          id: record._id,
          error: String(error),
        });
      }
    }

    return results;
  },
});

/**
 * Check for inconsistencies between the two tables
 * Requires super_admin role
 */
export const auditInconsistencies = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const advisorStudents = await ctx.db.query("advisorStudents").collect();
    const studentAdvisors = await ctx.db.query("student_advisors").collect();

    const results = {
      inAdvisorStudentsOnly: [] as Array<{
        advisorStudentId: string;
        studentProfileId: string;
        advisorId: string;
      }>,
      inStudentAdvisorsOnly: [] as Array<{
        studentAdvisorId: string;
        studentId: string;
        advisorId: string;
      }>,
      inBoth: 0,
    };

    // Build a set of (student_id, advisor_id) from student_advisors
    const studentAdvisorSet = new Set<string>();
    for (const sa of studentAdvisors) {
      studentAdvisorSet.add(`${sa.student_id}:${sa.advisor_id}`);
    }

    // Check advisorStudents against student_advisors
    for (const as of advisorStudents) {
      const studentProfile = await ctx.db.get(as.student_profile_id);
      if (!studentProfile) continue;

      const key = `${studentProfile.user_id}:${as.advisor_id}`;
      if (studentAdvisorSet.has(key)) {
        results.inBoth++;
        studentAdvisorSet.delete(key); // Mark as matched
      } else {
        results.inAdvisorStudentsOnly.push({
          advisorStudentId: as._id,
          studentProfileId: as.student_profile_id,
          advisorId: as.advisor_id,
        });
      }
    }

    // Remaining items in set are only in student_advisors
    for (const key of studentAdvisorSet) {
      const [studentId, advisorId] = key.split(":");
      const sa = studentAdvisors.find(
        (s) => s.student_id === studentId && s.advisor_id === advisorId
      );
      if (sa) {
        results.inStudentAdvisorsOnly.push({
          studentAdvisorId: sa._id,
          studentId: sa.student_id,
          advisorId: sa.advisor_id,
        });
      }
    }

    return results;
  },
});
