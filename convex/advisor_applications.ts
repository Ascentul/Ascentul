/**
 * Advisor Applications Queries
 *
 * Provides queries for viewing and managing student applications:
 * - Get applications for advisor's students
 * - Filter by stage, student, date range
 * - Application pipeline views (Kanban, table)
 */

import { query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import {
  getCurrentUser,
  requireAdvisorRole,
  requireTenant,
  getOwnedStudentIds,
} from "./advisor_auth";

/**
 * Helper: Fetch applications for all owned students in parallel
 *
 * Uses Promise.all to avoid N+1 queries - all queries execute concurrently.
 * This is the optimal approach for Convex since it doesn't support
 * WHERE user_id IN [...] style queries.
 */
async function fetchApplicationsForStudents(
  ctx: QueryCtx,
  studentIds: Id<"users">[]
): Promise<Doc<"applications">[]> {
  if (studentIds.length === 0) {
    return [];
  }

  // Execute all queries in parallel
  const applicationsByStudent = await Promise.all(
    studentIds.map((studentId) =>
      ctx.db
        .query("applications")
        .withIndex("by_user", (q) => q.eq("user_id", studentId))
        .collect()
    )
  );

  // Flatten results
  return applicationsByStudent.flat();
}

/**
 * Get all applications for advisor's students
 */
export const getApplicationsForCaseload = query({
  args: {
    clerkId: v.string(),
    stage: v.optional(v.string()),
    studentId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Get owned student IDs (already scoped to universityId via getOwnedStudentIds)
    // Note: applications table doesn't have university_id, so tenant isolation
    // is enforced through student IDs
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);

    // Filter to specific student if provided
    const targetStudentIds = args.studentId
      ? studentIds.filter((id) => id === args.studentId)
      : studentIds;

    // Fetch all applications using shared helper (optimized with Promise.all)
    const allApplications = await fetchApplicationsForStudents(ctx, targetStudentIds);

    if (allApplications.length === 0) {
      return [];
    }

    // Filter by stage if provided
    let filteredApps = args.stage
      ? allApplications.filter((app) => app.stage === args.stage)
      : allApplications;

    // Enrich with student data
    const enrichedApps = await Promise.all(
      filteredApps.map(async (app) => {
        const student = await ctx.db.get(app.user_id);

        return {
          _id: app._id,
          user_id: app.user_id,
          student_name: student?.name || 'Unknown',
          student_email: student?.email || '',
          company_name: app.company,
          position_title: app.job_title,
          stage: app.stage,
          status: app.status,
          application_url: app.url,
          applied_date: app.applied_at,
          next_step: app.next_step,
          next_step_date: app.due_date,
          notes: app.notes,
          created_at: app.created_at,
          updated_at: app.updated_at,
        };
      }),
    );

    return enrichedApps.sort((a, b) => b.updated_at - a.updated_at);
  },
});

/**
 * Get applications grouped by stage (for Kanban view)
 */
export const getApplicationsByStage = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Get owned student IDs (already scoped to universityId via getOwnedStudentIds)
    // Note: applications table doesn't have university_id, so tenant isolation
    // is enforced through student IDs
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);

    // Fetch all applications using shared helper (optimized with Promise.all)
    const allApplications = await fetchApplicationsForStudents(ctx, studentIds);

    if (allApplications.length === 0) {
      return {};
    }

    // Enrich with student data
    const enrichedApps = await Promise.all(
      allApplications.map(async (app) => {
        const student = await ctx.db.get(app.user_id);

        return {
          _id: app._id,
          user_id: app.user_id,
          student_name: student?.name || 'Unknown',
          student_email: student?.email || '',
          company_name: app.company,
          position_title: app.job_title,
          stage: app.stage || 'Prospect',
          status: app.status,
          application_url: app.url,
          applied_date: app.applied_at,
          next_step: app.next_step,
          next_step_date: app.due_date,
          notes: app.notes,
          created_at: app.created_at,
          updated_at: app.updated_at,
        };
      }),
    );

    // Group by stage
    const stages = [
      "Prospect",
      "Applied",
      "Interview",
      "Offer",
      "Accepted",
      "Rejected",
      "Withdrawn",
      "Archived",
    ];

    const grouped: Record<string, any[]> = {};
    for (const stage of stages) {
      grouped[stage] = enrichedApps
        .filter((app) => app.stage === stage)
        .sort((a, b) => b.updated_at - a.updated_at);
    }

    return grouped;
  },
});

/**
 * Get application pipeline stats
 */
export const getApplicationStats = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Get owned student IDs (already scoped to universityId via getOwnedStudentIds)
    // Note: applications table doesn't have university_id, so tenant isolation
    // is enforced through student IDs
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);

    // Fetch all applications using shared helper (optimized with Promise.all)
    const allApplications = await fetchApplicationsForStudents(ctx, studentIds);

    if (allApplications.length === 0) {
      return {
        total: 0,
        active: 0,
        offers: 0,
        accepted: 0,
        rejected: 0,
        studentsWithApps: 0,
        needingAction: 0,
        conversionRate: 0,
      };
    }

    // Count by stage
    const activeStages = ["Prospect", "Applied", "Interview"];
    const active = allApplications.filter((app) =>
      activeStages.includes(app.stage || "Prospect"),
    ).length;

    const offers = allApplications.filter((app) => app.stage === "Offer").length;
    const accepted = allApplications.filter((app) => app.stage === "Accepted").length;
    const rejected = allApplications.filter((app) => app.stage === "Rejected").length;

    // Count students with applications
    const studentsWithApps = new Set(allApplications.map((app) => app.user_id.toString()));

    // Applications needing action (no next_step or overdue)
    const now = Date.now();
    const needingAction = allApplications.filter((app) => {
      if (!activeStages.includes(app.stage || 'Prospect')) return false;
      if (!app.next_step) return true;
      if (app.due_date && app.due_date < now) return true;
      return false;
    }).length;

    return {
      total: allApplications.length,
      active,
      offers,
      accepted,
      rejected,
      studentsWithApps: studentsWithApps.size,
      needingAction,
      conversionRate:
        active > 0 ? Math.round(((offers + accepted) / active) * 100) : 0,
    };
  },
});

/**
 * Get a single application by ID
 */
export const getApplicationById = query({
  args: {
    clerkId: v.string(),
    applicationId: v.id("applications"),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }

    // Verify advisor owns this student
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);
    if (!studentIds.some((id) => id === application.user_id)) {
      throw new Error("Unauthorized: Not your student's application");
    }

    // Enrich with student data
    const student = await ctx.db.get(application.user_id);

    return {
      ...application,
      student_name: student?.name || "Unknown",
      student_email: student?.email || "",
    };
  },
});
