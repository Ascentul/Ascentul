/**
 * Advisor Student Management
 *
 * Queries and mutations for advisor caseload management:
 * - Get students assigned to advisor
 * - Student profile views
 * - Add advisor notes
 * - Assignment management (admin only)
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  getCurrentUser,
  requireTenant,
  requireAdvisorRole,
  getOwnedStudentIds,
  assertCanAccessStudent,
  createAuditLog,
} from "./advisor_auth";
import { requireSuperAdmin } from "./lib/roles";
import { ACTIVE_STAGES } from './advisor_constants';

/**
 * Get advisor's caseload (all students they own)
 */
export const getMyCaseload = query({
  args: {
    clerkId: v.string(),
    filters: v.optional(
      v.object({
        major: v.optional(v.string()),
        graduationYear: v.optional(v.string()),
        departmentId: v.optional(v.id("departments")),
        atRisk: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Get student IDs this advisor owns
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);

    if (studentIds.length === 0) {
      return [];
    }

    // Fetch full student records
    const students = await Promise.all(
      studentIds.map((id) => ctx.db.get(id)),
    );

    // Filter out nulls and apply filters
    let filteredStudents = students.filter(
      (s): s is NonNullable<typeof s> => s !== null,
    );

    // Calculate time thresholds once at the top for reuse
    const now = Date.now();
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    if (args.filters) {
      const filters = args.filters;

      if (filters.major) {
        filteredStudents = filteredStudents.filter(
          (s) => s.major === filters.major,
        );
      }

      if (filters.graduationYear) {
        filteredStudents = filteredStudents.filter(
          (s) => s.graduation_year === filters.graduationYear,
        );
      }

      if (filters.departmentId) {
        filteredStudents = filteredStudents.filter(
          (s) => s.department_id === filters.departmentId,
        );
      }

      // At-risk filter (engagement-based): students with no activity in 60+ days
      // NOTE: This differs from outcome-based at-risk in advisor_dashboard.ts (>5 apps, no offers)
      // Student list shows engagement risk, dashboard shows outcome risk
      // Include students with no updated_at (legacy data) as at-risk
      if (filters.atRisk) {
        filteredStudents = filteredStudents.filter(
          (s) => !s.updated_at || s.updated_at < sixtyDaysAgo,
        );
      }
    }

    const studentIdSet = new Set<Id<"users">>(filteredStudents.map((s) => s._id));

    // Aggregate follow-ups once (from unified follow_ups table)
    // Use collect() instead of take() to ensure accurate counts for all students
    const openFollowUps = await ctx.db
      .query('follow_ups')
      .withIndex('by_university', (q) => q.eq('university_id', universityId))
      .filter((q) =>
        q.and(
          q.eq(q.field('status'), 'open'),
          q.eq(q.field('created_by_id'), sessionCtx.userId),
        ),
      )
      .collect();

    const followUpsByStudent = new Map<Id<'users'>, number>();
    for (const followUp of openFollowUps) {
      if (!studentIdSet.has(followUp.user_id)) continue;
      followUpsByStudent.set(
        followUp.user_id,
        (followUpsByStudent.get(followUp.user_id) || 0) + 1,
      );
    }

    // Aggregate upcoming sessions once
    // Use collect() instead of take() to ensure accurate next session for all students
    const upcomingSessions = await ctx.db
      .query("advisor_sessions")
      .withIndex("by_advisor", (q) =>
        q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId),
      )
      .filter((q) => q.gte(q.field("start_at"), now))
      .order("asc")
      .collect();

    const nextSessionByStudent = new Map<
      Id<"users">,
      { id: Id<"advisor_sessions">; scheduledAt?: number; title?: string | null }
    >();

    for (const session of upcomingSessions) {
      if (!studentIdSet.has(session.student_id)) continue;
      if (nextSessionByStudent.has(session.student_id)) continue;
      nextSessionByStudent.set(session.student_id, {
        id: session._id,
        scheduledAt: session.scheduled_at ?? session.start_at,
        title: session.title || session.session_type,
      });
    }

    // Aggregate application stats once
    // Use collect() instead of take() to ensure accurate counts for all students
    const advisorApplications = await ctx.db
      .query("applications")
      .withIndex("by_advisor", (q) =>
        q.eq("assigned_advisor_id", sessionCtx.userId),
      )
      .collect();

    const activeStages = new Set(ACTIVE_STAGES);
    const appStatsByStudent = new Map<
      Id<"users">,
      { active: number; hasOffer: boolean }
    >();

    for (const application of advisorApplications) {
      if (!studentIdSet.has(application.user_id)) continue;
      const stats =
        appStatsByStudent.get(application.user_id) ?? {
          active: 0,
          hasOffer: false,
        };
      if (application.stage && activeStages.has(application.stage)) {
        stats.active += 1;
      }
      // Check for offers using stage with status fallback during migration
      // See docs/TECH_DEBT_APPLICATION_STATUS_STAGE.md
      if (
        application.stage === "Offer" ||
        application.stage === "Accepted" ||
        (!application.stage && application.status === "offer")
      ) {
        stats.hasOffer = true;
      }
      appStatsByStudent.set(application.user_id, stats);
    }

    const enrichedStudents = filteredStudents
      .map((student) => {
        if (!student) return null;
        const followUps = followUpsByStudent.get(student._id) ?? 0;
        const nextSession = nextSessionByStudent.get(student._id) ?? null;
        const appStats = appStatsByStudent.get(student._id) ?? {
          active: 0,
          hasOffer: false,
        };
        const isAtRisk = !student.updated_at || student.updated_at < sixtyDaysAgo;

        return {
          ...student,
          metadata: {
            openFollowUpsCount: followUps,
            nextSession,
            activeApplicationsCount: appStats.active,
            hasOffer: appStats.hasOffer,
            isAtRisk,
            lastActivity: student.updated_at,
          },
        };
      })
      .filter((student) => student !== null);

    return enrichedStudents;
  },
});

/**
 * Get detailed student profile with all career data
 */
export const getStudentProfile = query({
  args: {
    clerkId: v.string(),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    // Check ownership/access
    const student = await assertCanAccessStudent(
      ctx,
      sessionCtx,
      args.studentId,
    );

    const universityId = requireTenant(sessionCtx);

    // Fetch all related data in parallel
    // Use collect() for single-student queries to avoid silently truncating data
    const [
      goals,
      applications,
      resumes,
      coverLetters,
      projects,
      sessions,
      followUps,
      reviews,
    ] = await Promise.all([
      // Goals
      ctx.db
        .query("goals")
        .withIndex("by_user", (q) => q.eq("user_id", args.studentId))
        .collect(),

      // Applications
      ctx.db
        .query("applications")
        .withIndex("by_user", (q) => q.eq("user_id", args.studentId))
        .collect(),

      // Resumes
      ctx.db
        .query("resumes")
        .withIndex("by_user", (q) => q.eq("user_id", args.studentId))
        .collect(),

      // Cover Letters
      ctx.db
        .query("cover_letters")
        .withIndex("by_user", (q) => q.eq("user_id", args.studentId))
        .collect(),

      // Projects
      ctx.db
        .query("projects")
        .withIndex("by_user", (q) => q.eq("user_id", args.studentId))
        .collect(),

      // Advisor sessions (fetch once, slice for recent activity)
      ctx.db
        .query("advisor_sessions")
        .withIndex("by_student", (q) =>
          q.eq("student_id", args.studentId).eq("university_id", universityId),
        )
        .order("desc")
        .collect(),

      // Follow-ups (from unified follow_ups table)
      ctx.db
        .query('follow_ups')
        .withIndex('by_user_university', (q) =>
          q.eq('user_id', args.studentId).eq('university_id', universityId),
        )
        .order('desc')
        .collect(),

      // Reviews
      ctx.db
        .query("advisor_reviews")
        .withIndex("by_student", (q) =>
          q.eq("student_id", args.studentId).eq("university_id", universityId),
        )
        .order("desc")
        .collect(),
    ]);

    return {
      student,
      goals,
      applications,
      resumes,
      coverLetters,
      projects,
      sessions,
      recentActivity: sessions.slice(0, 10), // First 10 sessions for activity feed
      followUps,
      reviews,
    };
  },
});

/**
 * Add advisor-only note to student profile
 */
export const addAdvisorNote = mutation({
  args: {
    clerkId: v.string(),
    studentId: v.id("users"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);

    // Validate note is not empty
    if (!args.note.trim()) {
      throw new Error("Note cannot be empty");
    }

    // Check ownership
    await assertCanAccessStudent(ctx, sessionCtx, args.studentId);
    const universityId = requireTenant(sessionCtx);

    // Get current notes
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    const currentNotes = student.university_admin_notes || "";
    const timestamp = new Date().toISOString();
    const userName = sessionCtx.email.includes("@")
      ? sessionCtx.email.split("@")[0]
      : sessionCtx.email;

    const newNote = `[${timestamp}] ${userName}: ${args.note}`;
    const updatedNotes = currentNotes
      ? `${currentNotes}\n\n${newNote}`
      : newNote;

    // Update student record
    await ctx.db.patch(args.studentId, {
      university_admin_notes: updatedNotes,
      updated_at: Date.now(),
    });

    // Create audit log
    // NOTE: Store structural metadata only, not full note content (PII/FERPA compliance)
    // Full notes are stored in the student record; audit log tracks the action
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: "advisor.note_added",
      entityType: "student",
      entityId: args.studentId,
      studentId: args.studentId,
      newValue: {
        noteAdded: true,
        noteLength: args.note.length,
        timestamp: Date.now(),
      },
      ipAddress: "server",
    });

    return { success: true };
  },
});

/**
 * Assign student to advisor (admin only)
 */
export const assignStudentToAdvisor = mutation({
  args: {
    clerkId: v.string(),
    studentId: v.id("users"),
    advisorId: v.id("users"),
    isOwner: v.boolean(),
    sharedType: v.optional(v.union(v.literal("reviewer"), v.literal("temp"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);

    // Only university_admin and super_admin can assign students
    if (
      sessionCtx.role !== "university_admin" &&
      sessionCtx.role !== "super_admin"
    ) {
      throw new Error("Unauthorized: Only admins can assign students");
    }

    const universityId = requireTenant(sessionCtx);

    // Verify student and advisor are in same university
    const [student, advisor] = await Promise.all([
      ctx.db.get(args.studentId),
      ctx.db.get(args.advisorId),
    ]);

    if (!student || !advisor) {
      throw new Error("Student or advisor not found");
    }

    if (
      student.university_id !== universityId ||
      advisor.university_id !== universityId
    ) {
      throw new Error(
        "Student and advisor must be in the same university as admin",
      );
    }

    if (advisor.role !== "advisor") {
      throw new Error("Assigned user must have advisor role");
    }

    // UNIQUENESS ENFORCEMENT: Exactly one owner per student
    //
    // Design: Convex mutations are atomic and serialized. We use a two-phase approach:
    // 1. Pre-check: Remove any existing owner before setting new one
    // 2. Post-check: Verify exactly one owner exists after operation (catches edge cases)
    //
    // This is sufficient because:
    // - Convex transactions are serialized (no concurrent writes to same data)
    // - Post-check with auto-correction handles any unexpected states
    // - All changes are audit-logged for compliance
    //
    // For enterprise deployments needing stronger guarantees, consider:
    // - Adding a version field to student_advisors for optimistic locking
    // - Using Convex's scheduled mutations for serialized processing
    //
    // TRANSACTION SAFETY: Convex mutations are fully transactional - if any
    // operation fails (e.g., the insert below), ALL operations are rolled back,
    // including the owner demotions. This ensures no orphan state where a
    // student has no primary advisor.
    if (args.isOwner) {
      // Find ALL current owners (handles corrupted state with multiple owners)
      const existingOwners = await ctx.db
        .query("student_advisors")
        .withIndex("by_student_owner", (q) =>
          q.eq("student_id", args.studentId).eq("is_owner", true),
        )
        .collect();

      // Demote all existing owners (safe: rolled back if subsequent ops fail)
      for (const existingOwner of existingOwners) {
        await ctx.db.patch(existingOwner._id, {
          is_owner: false,
          updated_at: Date.now(),
        });
      }

      if (existingOwners.length > 1) {
        console.warn(
          `[assignStudentToAdvisor] Found ${existingOwners.length} existing owners for student ${args.studentId}. All have been demoted.`,
        );
      }
    }

    // Check if assignment already exists
    const existing = await ctx.db
      .query("student_advisors")
      .withIndex("by_advisor", (q) =>
        q.eq("advisor_id", args.advisorId).eq("university_id", universityId),
      )
      .filter((q) => q.eq(q.field("student_id"), args.studentId))
      .unique();

    const now = Date.now();
    let resultId: Id<"student_advisors">;

    if (existing) {
      // Update existing assignment
      await ctx.db.patch(existing._id, {
        is_owner: args.isOwner,
        shared_type: args.sharedType,
        notes: args.notes,
        updated_at: now,
      });

      // Audit log
      await createAuditLog(ctx, {
        actorId: sessionCtx.userId,
        universityId,
        action: "student.advisor_updated",
        entityType: "student_advisor",
        entityId: existing._id,
        studentId: args.studentId,
        previousValue: { is_owner: existing.is_owner },
        newValue: { is_owner: args.isOwner },
        ipAddress: "server",
      });

      resultId = existing._id;
    } else {
      // Create new assignment
      const assignmentId = await ctx.db.insert("student_advisors", {
        student_id: args.studentId,
        advisor_id: args.advisorId,
        university_id: universityId,
        is_owner: args.isOwner,
        shared_type: args.sharedType,
        assigned_at: now,
        assigned_by: sessionCtx.userId,
        notes: args.notes,
        created_at: now,
        updated_at: now,
      });

      // Audit log
      await createAuditLog(ctx, {
        actorId: sessionCtx.userId,
        universityId,
        action: "student.advisor_assigned",
        entityType: "student_advisor",
        entityId: assignmentId,
        studentId: args.studentId,
        newValue: { advisor_id: args.advisorId, is_owner: args.isOwner },
        ipAddress: "server",
      });

      resultId = assignmentId;
    }

    // Post-operation consistency check: verify exactly one owner exists
    // This catches race conditions where concurrent transactions may have
    // created multiple owners or removed the owner unexpectedly
    if (args.isOwner) {
      const owners = await ctx.db
        .query("student_advisors")
        .withIndex("by_student_owner", (q) =>
          q.eq("student_id", args.studentId).eq("is_owner", true),
        )
        .collect();

      if (owners.length !== 1) {
        console.warn(
          `[assignStudentToAdvisor] Consistency warning: Found ${owners.length} owners for student ${args.studentId}. Expected exactly 1.`
        );

        if (owners.length > 1) {
          // Auto-correct: if multiple owners, keep only the most recently assigned
          const sortedByTime = owners.sort((a, b) => (b.assigned_at ?? 0) - (a.assigned_at ?? 0));
          for (let i = 1; i < sortedByTime.length; i++) {
            await ctx.db.patch(sortedByTime[i]._id, { is_owner: false });

            // Audit the auto-correction for compliance
            await createAuditLog(ctx, {
              actorId: sessionCtx.userId,
              universityId,
              action: "student.owner_auto_corrected",
              entityType: "student_advisor",
              entityId: sortedByTime[i]._id,
              studentId: args.studentId,
              previousValue: { is_owner: true },
              newValue: { is_owner: false, reason: "duplicate_owner_correction" },
              ipAddress: "server",
            });
          }
          console.log(`[assignStudentToAdvisor] Auto-corrected: kept ${sortedByTime[0].advisor_id} as owner`);
        } else if (owners.length === 0) {
          // Zero owners after isOwner=true operation indicates a bug - escalate
          throw new Error(
            `Consistency error: No owner found for student ${args.studentId} after owner assignment. ` +
            `This indicates a database integrity issue that requires investigation.`
          );
        }
      }
    }

    return resultId;
  },
});

/**
 * Remove student-advisor assignment (admin only)
 */
export const removeStudentAdvisor = mutation({
  args: {
    clerkId: v.string(),
    assignmentId: v.id("student_advisors"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);

    // Only university_admin and super_admin can remove assignments
    if (
      sessionCtx.role !== "university_admin" &&
      sessionCtx.role !== "super_admin"
    ) {
      throw new Error("Unauthorized: Only admins can remove assignments");
    }

    const universityId = requireTenant(sessionCtx);

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.university_id !== universityId) {
      throw new Error("Assignment not in your university");
    }

    // Prevent orphaning a student without any advisor
    // Get all other advisors for this student (excluding the one being removed)
    const otherAdvisors = await ctx.db
      .query("student_advisors")
      .withIndex("by_student", (q) =>
        q.eq("student_id", assignment.student_id).eq("university_id", universityId),
      )
      .filter((q) => q.neq(q.field("_id"), args.assignmentId))
      .collect();

    if (otherAdvisors.length === 0) {
      throw new Error(
        "Cannot remove the only advisor. Assign another advisor first.",
      );
    }

    // If removing an owner, ensure another owner exists
    if (assignment.is_owner) {
      const hasAnotherOwner = otherAdvisors.some((a) => a.is_owner);
      if (!hasAnotherOwner) {
        throw new Error(
          "Cannot remove the owner advisor. Assign another advisor as owner first.",
        );
      }
    }

    // Audit log before deletion
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: "student.advisor_removed",
      entityType: "student_advisor",
      entityId: args.assignmentId,
      studentId: assignment.student_id,
      previousValue: {
        advisor_id: assignment.advisor_id,
        is_owner: assignment.is_owner,
        reason: args.reason,
      },
      ipAddress: "server",
    });

    await ctx.db.delete(args.assignmentId);

    return { success: true };
  },
});

/**
 * DIAGNOSTIC: Find students with duplicate owners
 *
 * This query identifies data integrity issues where a student has
 * more than one advisor marked as is_owner=true.
 *
 * SECURITY: Requires super_admin role - exposes student-advisor relationships
 *
 * Run: npx convex run advisor_students:findDuplicateOwners
 */
export const findDuplicateOwners = query({
  args: {},
  handler: async (ctx) => {
    // SECURITY: Only super_admin can run diagnostic queries
    // This prevents information disclosure about student-advisor relationships
    await requireSuperAdmin(ctx);

    // Get all ownership records
    const allOwnerRecords = await ctx.db
      .query("student_advisors")
      .filter((q) => q.eq(q.field("is_owner"), true))
      .collect();

    // Group by student_id
    const ownersByStudent = new Map<string, typeof allOwnerRecords>();
    for (const record of allOwnerRecords) {
      const studentId = record.student_id;
      if (!ownersByStudent.has(studentId)) {
        ownersByStudent.set(studentId, []);
      }
      ownersByStudent.get(studentId)!.push(record);
    }

    // Find students with multiple owners
    const duplicates: Array<{
      studentId: string;
      ownerCount: number;
      owners: Array<{
        assignmentId: string;
        advisorId: string;
        assignedAt: number;
      }>;
    }> = [];

    for (const [studentId, records] of ownersByStudent) {
      if (records.length > 1) {
        duplicates.push({
          studentId,
          ownerCount: records.length,
          owners: records.map((r) => ({
            assignmentId: r._id,
            advisorId: r.advisor_id,
            assignedAt: r.assigned_at,
          })),
        });
      }
    }

    // Find students with NO owners
    const allStudentAssignments = await ctx.db.query("student_advisors").collect();
    const studentsWithAssignments = new Set(allStudentAssignments.map((a) => a.student_id));
    const studentsWithOwners = new Set(allOwnerRecords.map((r) => r.student_id));

    const orphanedStudents: string[] = [];
    for (const studentId of studentsWithAssignments) {
      if (!studentsWithOwners.has(studentId)) {
        orphanedStudents.push(studentId);
      }
    }

    return {
      summary: {
        totalOwnerRecords: allOwnerRecords.length,
        studentsWithDuplicateOwners: duplicates.length,
        studentsWithNoOwner: orphanedStudents.length,
      },
      duplicates,
      orphanedStudents,
    };
  },
});
