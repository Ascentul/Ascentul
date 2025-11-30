/**
 * Advisor Applications Queries
 *
 * Provides queries for viewing and managing student applications:
 * - Get applications for advisor's students
 * - Filter by stage, student, date range
 * - Application pipeline views (Kanban, table)
 */

import { query, mutation, QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';
import { api } from './_generated/api';
import {
  getCurrentUser,
  requireAdvisorRole,
  requireTenant,
  getOwnedStudentIds,
  createAuditLog,
} from './advisor_auth';
import { ALL_STAGES, ACTIVE_STAGES, STAGE_TRANSITIONS, isTerminalStage, requiresReasonCode } from './advisor_constants';
import { mapStageToStatus } from './migrate_application_status_to_stage';

/**
 * Enriched application with student information
 */
type EnrichedApplication = {
  _id: Id<'applications'>;
  user_id: Id<'users'>;
  student_name: string;
  student_email: string;
  student_graduation_year: string | undefined;
  company_name: string;
  position_title: string;
  stage: string | undefined;
  status: string | undefined;
  application_url: string | undefined;
  location: string | undefined;
  applied_date: number | undefined;
  next_step: string | undefined;
  next_step_date: number | undefined;
  notes: string | undefined;
  created_at: number;
  updated_at: number;
  assigned_advisor_id: Id<'users'> | undefined;
};

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
        .query('applications')
        .withIndex('by_user', (q) => q.eq('user_id', studentId))
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
    studentId: v.optional(v.id('users')),
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

    // Batch fetch student data to avoid N+1 queries
    const uniqueStudentIds = [...new Set(filteredApps.map((app) => app.user_id))];
    const students = await Promise.all(
      uniqueStudentIds.map((id) => ctx.db.get(id))
    );
    const studentMap = new Map(
      students.filter((student) => student !== null).map((student) => [student._id, student])
    );

    // Enrich with student data from map
    const enrichedApps: EnrichedApplication[] = filteredApps.map((app) => {
      const student = studentMap.get(app.user_id);

      return {
        _id: app._id,
        user_id: app.user_id,
        student_name: student?.name || 'Unknown',
        student_email: student?.email || '',
        student_graduation_year: student?.graduation_year,
        company_name: app.company,
        position_title: app.job_title,
        stage: app.stage || 'Prospect',
        status: app.status,
        application_url: app.url,
        location: app.location,
        applied_date: app.applied_at,
        next_step: app.next_step,
        next_step_date: app.due_date,
        notes: app.notes,
        created_at: app.created_at,
        updated_at: app.updated_at,
        assigned_advisor_id: app.assigned_advisor_id,
      };
    });

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
    requireTenant(sessionCtx); // Validates tenant context

    // Get owned student IDs (already scoped to universityId via getOwnedStudentIds)
    // Note: applications table doesn't have university_id, so tenant isolation
    // is enforced through student IDs
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);

    // Fetch all applications using shared helper (optimized with Promise.all)
    const allApplications = await fetchApplicationsForStudents(ctx, studentIds);

    if (allApplications.length === 0) {
      return {};
    }

    // Batch fetch student data to avoid N+1 queries
    const uniqueStudentIds = [...new Set(allApplications.map((app) => app.user_id))];
    const students = await Promise.all(
      uniqueStudentIds.map((id) => ctx.db.get(id))
    );
    const studentMap = new Map(
      students.filter((student) => student !== null).map((student) => [student._id, student])
    );

    // Enrich with student data from map
    const enrichedApps: EnrichedApplication[] = allApplications.map((app) => {
      const student = studentMap.get(app.user_id);

      return {
        _id: app._id,
        user_id: app.user_id,
        student_name: student?.name || 'Unknown',
        student_email: student?.email || '',
        student_graduation_year: student?.graduation_year,
        company_name: app.company,
        position_title: app.job_title,
        stage: app.stage || 'Prospect',
        status: app.status,
        application_url: app.url,
        location: app.location,
        applied_date: app.applied_at,
        next_step: app.next_step,
        next_step_date: app.due_date,
        notes: app.notes,
        created_at: app.created_at,
        updated_at: app.updated_at,
        assigned_advisor_id: app.assigned_advisor_id,
      };
    });

    // Group by stage
    const grouped: Record<string, EnrichedApplication[]> = {};
    for (const stage of ALL_STAGES) {
      grouped[stage] = enrichedApps
        .filter((app) => app.stage === stage)
        .sort((a, b) => b.updated_at - a.updated_at);
    }

    return grouped;
  },
});

/**
 * Get application pipeline stats with detailed need-action breakdown
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
        needActionBreakdown: {
          no_next_step: 0,
          overdue: 0,
          due_soon: 0,
          stale: 0,
        },
        conversionRate: 0,
      };
    }

    // Count by stage
    const active = allApplications.filter((app) =>
      ACTIVE_STAGES.includes(app.stage || 'Prospect'),
    ).length;

    const offers = allApplications.filter((app) => app.stage === 'Offer').length;
    const accepted = allApplications.filter((app) => app.stage === 'Accepted').length;
    const rejected = allApplications.filter((app) => app.stage === 'Rejected').length;

    // Count students with applications
    const studentsWithApps = new Set(allApplications.map((app) => app.user_id.toString()));

    // Applications needing action with detailed breakdown
    const now = Date.now();
    const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);

    const needActionBreakdown = {
      no_next_step: 0,
      overdue: 0,
      due_soon: 0,
      stale: 0,
    };

    const activeApps = allApplications.filter((app) =>
      ACTIVE_STAGES.includes(app.stage || 'Prospect')
    );

    for (const app of activeApps) {
      let needsAction = false;

      // Rule 1: No next step set
      if (!app.next_step) {
        needActionBreakdown.no_next_step++;
        needsAction = true;
      }

      // Rule 2: Overdue (due date in the past)
      if (app.due_date && app.due_date < now) {
        needActionBreakdown.overdue++;
        needsAction = true;
      }

      // Rule 3: Due soon (within 3 days)
      if (
        app.due_date &&
        app.due_date >= now &&
        app.due_date <= threeDaysFromNow
      ) {
        needActionBreakdown.due_soon++;
        needsAction = true;
      }

      // Rule 4: Stale (no activity in 14+ days)
      if (app.updated_at < fourteenDaysAgo) {
        needActionBreakdown.stale++;
        needsAction = true;
      }
    }

    // Total needing action (count unique applications, not reasons)
    const needingActionSet = new Set<string>();
    for (const app of activeApps) {
      const hasNoNextStep = !app.next_step;
      const isOverdue = app.due_date && app.due_date < now;
      const isDueSoon =
        app.due_date &&
        app.due_date >= now &&
        app.due_date <= threeDaysFromNow;
      const isStale = app.updated_at < fourteenDaysAgo;

      if (hasNoNextStep || isOverdue || isDueSoon || isStale) {
        needingActionSet.add(app._id.toString());
      }
    }

    return {
      total: allApplications.length,
      active,
      offers,
      accepted,
      rejected,
      studentsWithApps: studentsWithApps.size,
      needingAction: needingActionSet.size,
      needActionBreakdown,
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
    applicationId: v.id('applications'),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Verify advisor owns this student
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);
    if (!studentIds.some((id) => id === application.user_id)) {
      throw new Error('Unauthorized: Not your student\'s application');
    }

    // Enrich with student data
    const student = await ctx.db.get(application.user_id);

    return {
      ...application,
      student_name: student?.name || 'Unknown',
      student_email: student?.email || '',
    };
  },
});

/**
 * Convex validator for ApplicationStage
 * Generated from ALL_STAGES constant to maintain single source of truth
 */
const applicationStageValidator = v.union(
  ...ALL_STAGES.map((stage) => v.literal(stage))
);

// Note: requiresReasonCode imported from advisor_constants.ts

/**
 * Update application stage (with transition validation)
 */
export const updateApplicationStage = mutation({
  args: {
    clerkId: v.string(),
    applicationId: v.id('applications'),
    newStage: applicationStageValidator,
    notes: v.optional(v.string()),
    reason_code: v.optional(v.string()), // Required for Rejected/Withdrawn stages
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Verify advisor owns this student
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);
    if (!studentIds.some((id) => id === application.user_id)) {
      throw new Error('Unauthorized: Not your student\'s application');
    }

    const currentStage = application.stage || 'Prospect';
    const newStage = args.newStage;

    // Validate transition using stage logic
    const allowedTransitions = STAGE_TRANSITIONS[currentStage] || [];
    if (!allowedTransitions.includes(newStage)) {
      throw new Error(
        `Invalid transition from ${currentStage} to ${newStage}. Allowed: ${allowedTransitions.join(", ")}`,
      );
    }

    // Require notes for terminal states
    if (isTerminalStage(newStage) && !args.notes) {
      throw new Error(
        `Notes required when moving to ${newStage} state`,
      );
    }

    // Require reason_code for Rejected/Withdrawn stages
    if (requiresReasonCode(newStage) && !args.reason_code) {
      throw new Error(
        `Reason code required when moving to ${newStage} state`,
      );
    }

    const now = Date.now();

    // Build update object
    // MIGRATION FIX: Sync both stage and legacy status fields for data consistency
    // See docs/TECH_DEBT_APPLICATION_STATUS_STAGE.md
    const updates: any = {
      stage: newStage,
      stage_set_at: now,
      status: mapStageToStatus(newStage), // Keep legacy field in sync
      updated_at: now,
    };

    // Set reason_code for Rejected/Withdrawn stages
    if (args.reason_code) {
      updates.reason_code = args.reason_code;
    }

    // Append notes if provided
    if (args.notes) {
      const currentNotes = application.notes || '';
      const timestamp = new Date(now).toISOString().split('T')[0];
      const newNoteEntry = `[${timestamp}] Stage changed to ${newStage}: ${args.notes}`;

      updates.notes = currentNotes
        ? `${currentNotes}\n\n${newNoteEntry}`
        : newNoteEntry;
    }

    await ctx.db.patch(args.applicationId, updates);

    // Audit log for FERPA compliance
    // NOTE: Store structural metadata only, not full notes content (PII compliance)
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: 'application.stage_changed',
      entityType: 'application',
      entityId: args.applicationId,
      studentId: application.user_id,
      previousValue: { stage: currentStage },
      newValue: {
        stage: newStage,
        hasNotes: Boolean(args.notes),
        notesLength: args.notes?.length ?? 0,
        reason_code: args.reason_code,
      },
      ipAddress: 'server',
    });

    return {
      success: true,
      previousStage: currentStage,
      newStage,
    };
  },
});

/**
 * Update application next step (without stage change)
 * Enables inline editing of next step and due date
 */
export const updateApplicationNextStep = mutation({
  args: {
    clerkId: v.string(),
    applicationId: v.id('applications'),
    nextStep: v.string(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    // Verify advisor owns this student
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);
    if (!studentIds.some((id) => id === application.user_id)) {
      throw new Error('Unauthorized: Not your student\'s application');
    }

    const now = Date.now();

    await ctx.db.patch(args.applicationId, {
      next_step: args.nextStep,
      due_date: args.dueDate,
      updated_at: now,
    });

    // Audit log for FERPA compliance
    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: 'application.next_step_updated',
      entityType: 'application',
      entityId: args.applicationId,
      studentId: application.user_id,
      previousValue: { next_step: application.next_step, due_date: application.due_date },
      newValue: { next_step: args.nextStep, due_date: args.dueDate },
      ipAddress: 'server',
    });

    return {
      success: true,
      applicationId: args.applicationId,
    };
  },
});

/**
 * Bulk update application stages
 * Validates permissions and transitions for each application
 */
export const bulkUpdateApplicationStage = mutation({
  args: {
    clerkId: v.string(),
    applicationIds: v.array(v.id('applications')),
    newStage: applicationStageValidator,
    notes: v.optional(v.string()),
    reason_code: v.optional(v.string()), // Required for Rejected/Withdrawn stages
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Get owned student IDs for permission checking
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);
    const studentIdSet = new Set(studentIds.map(id => id.toString()));

    // Fetch all applications in parallel
    const applications = await Promise.all(
      args.applicationIds.map((id) => ctx.db.get(id))
    );

    const now = Date.now();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };
    const changeRecords: Array<{
      applicationId: Id<'applications'>;
      previousStage?: string;
      newStage: string;
      success: boolean;
      error?: string;
      notesAdded: boolean;
    }> = [];

    // Process each application
    for (let i = 0; i < applications.length; i++) {
      const application = applications[i];
      const applicationId = args.applicationIds[i];

      try {
        // Check if application exists
        if (!application) {
          results.failed++;
          results.errors.push(`Application ${applicationId} not found`);
          changeRecords.push({
            applicationId,
            previousStage: undefined,
            newStage: args.newStage,
            success: false,
            error: `Application ${applicationId} not found`,
            notesAdded: Boolean(args.notes),
          });
          continue;
        }

        // Verify permission
        if (!studentIdSet.has(application.user_id.toString())) {
          results.failed++;
          results.errors.push(
            `Unauthorized: Application ${applicationId} does not belong to your student`
          );
          changeRecords.push({
            applicationId,
            previousStage: application.stage,
            newStage: args.newStage,
            success: false,
            error: `Unauthorized: Application ${applicationId} does not belong to your student`,
            notesAdded: Boolean(args.notes),
          });
          continue;
        }

        const currentStage = application.stage || 'Prospect';
        const newStage = args.newStage;

        // Validate transition
        const allowedTransitions = STAGE_TRANSITIONS[currentStage] || [];
        if (!allowedTransitions.includes(newStage)) {
          results.failed++;
          results.errors.push(
            `Invalid transition from ${currentStage} to ${newStage} for application ${applicationId}`
          );
          changeRecords.push({
            applicationId,
            previousStage: currentStage,
            newStage,
            success: false,
            error: `Invalid transition from ${currentStage} to ${newStage} for application ${applicationId}`,
            notesAdded: Boolean(args.notes),
          });
          continue;
        }

        // Require notes for terminal states
        if (isTerminalStage(newStage) && !args.notes) {
          results.failed++;
          results.errors.push(
            `Notes required when moving application ${applicationId} to ${newStage}`
          );
          changeRecords.push({
            applicationId,
            previousStage: currentStage,
            newStage,
            success: false,
            error: `Notes required when moving application ${applicationId} to ${newStage}`,
            notesAdded: false,
          });
          continue;
        }

        // Require reason_code for Rejected/Withdrawn stages
        if (requiresReasonCode(newStage) && !args.reason_code) {
          results.failed++;
          results.errors.push(
            `Reason code required when moving application ${applicationId} to ${newStage}`
          );
          changeRecords.push({
            applicationId,
            previousStage: currentStage,
            newStage,
            success: false,
            error: `Reason code required when moving application ${applicationId} to ${newStage}`,
            notesAdded: Boolean(args.notes),
          });
          continue;
        }

        // Build update object
        // MIGRATION FIX: Sync both stage and legacy status fields for data consistency
        // See docs/TECH_DEBT_APPLICATION_STATUS_STAGE.md
        const updates: any = {
          stage: newStage,
          stage_set_at: now,
          status: mapStageToStatus(newStage), // Keep legacy field in sync
          updated_at: now,
        };

        // Set reason_code for Rejected/Withdrawn stages
        if (args.reason_code) {
          updates.reason_code = args.reason_code;
        }

        // Append notes if provided
        if (args.notes) {
          const currentNotes = application.notes || '';
          const timestamp = new Date(now).toISOString().split('T')[0];
          const newNoteEntry = `[${timestamp}] Bulk stage change to ${newStage}: ${args.notes}`;

          updates.notes = currentNotes
            ? `${currentNotes}\n\n${newNoteEntry}`
            : newNoteEntry;
        }

        await ctx.db.patch(applicationId, updates);
        results.success++;
        changeRecords.push({
          applicationId,
          previousStage: currentStage,
          newStage,
          success: true,
          notesAdded: Boolean(args.notes),
        });
      } catch (error) {
        results.failed++;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(
          `Error updating application ${applicationId}: ${errorMessage}`
        );
        changeRecords.push({
          applicationId,
          previousStage: application?.stage,
          newStage: args.newStage,
          success: false,
          error: `Error updating application ${applicationId}: ${errorMessage}`,
          notesAdded: Boolean(args.notes),
        });
      }
    }

    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: 'applications.bulk_stage_change',
      entityType: 'application',
      entityId: 'bulk',
      previousValue: {
        stages: changeRecords
          .filter((change) => change.previousStage !== undefined)
          .map((change) => ({
            applicationId: change.applicationId,
            previousStage: change.previousStage,
          })),
      },
      newValue: {
        newStage: args.newStage,
        notes: args.notes,
        reason_code: args.reason_code,
        applicationIds: args.applicationIds,
        results,
        changes: changeRecords,
      },
      ipAddress: 'server',
    });

    return results;
  },
});

/**
 * Bulk archive applications (convenience wrapper)
 * Moves multiple applications to Archived stage
 */
export const bulkArchiveApplications = mutation({
  args: {
    clerkId: v.string(),
    applicationIds: v.array(v.id('applications')),
    reason: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: number; failed: number; errors: string[] }> => {
    // Delegate to bulkUpdateApplicationStage with Archived stage
    return await ctx.runMutation(api.advisor_applications.bulkUpdateApplicationStage, {
      clerkId: args.clerkId,
      applicationIds: args.applicationIds,
      newStage: 'Archived',
      notes: `Archived: ${args.reason}`,
    });
  },
});

/**
 * Bulk update next steps
 * Sets next step and optional due date for multiple applications
 */
export const bulkUpdateNextStep = mutation({
  args: {
    clerkId: v.string(),
    applicationIds: v.array(v.id('applications')),
    nextStep: v.string(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Get owned student IDs for permission checking
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);
    const studentIdSet = new Set(studentIds.map(id => id.toString()));

    // Fetch all applications in parallel
    const applications = await Promise.all(
      args.applicationIds.map((id) => ctx.db.get(id))
    );

    const now = Date.now();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };
    const changeRecords: {
      applicationId: Id<'applications'>;
      success: boolean;
      error?: string;
    }[] = [];

    // Process each application
    for (let i = 0; i < applications.length; i++) {
      const application = applications[i];
      const applicationId = args.applicationIds[i];

      try {
        // Check if application exists
        if (!application) {
          results.failed++;
          results.errors.push(`Application ${applicationId} not found`);
          continue;
        }

        // Verify permission
        if (!studentIdSet.has(application.user_id.toString())) {
          results.failed++;
          results.errors.push(
            `Unauthorized: Application ${applicationId} does not belong to your student`
          );
          continue;
        }

        // Update next step
        await ctx.db.patch(applicationId, {
          next_step: args.nextStep,
          due_date: args.dueDate,
          updated_at: now,
        });

        results.success++;
        changeRecords.push({ applicationId, success: true });
      } catch (error) {
        results.failed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(
          `Error updating application ${applicationId}: ${message}`
        );
        changeRecords.push({ applicationId, success: false, error: message });
      }
    }

    const previousValues = applications.map((app, idx) => ({
      applicationId: args.applicationIds[idx],
      next_step: app?.next_step,
      due_date: app?.due_date,
    }));

    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: 'applications.bulk_update_next_step',
      entityType: 'application',
      entityId: 'bulk',
      previousValue: { changes: previousValues },
      newValue: {
        nextStep: args.nextStep,
        dueDate: args.dueDate,
        applicationIds: args.applicationIds,
        results,
        changes: changeRecords,
      },
      ipAddress: 'server',
    });

    return results;
  },
});

/**
 * Bulk mark applications as reviewed
 * Updates the updated_at timestamp to clear the "stale" flag
 */
export const bulkMarkReviewed = mutation({
  args: {
    clerkId: v.string(),
    applicationIds: v.array(v.id('applications')),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx, args.clerkId);
    requireAdvisorRole(sessionCtx);
    const universityId = requireTenant(sessionCtx);

    // Get owned student IDs for permission checking
    const studentIds = await getOwnedStudentIds(ctx, sessionCtx);
    const studentIdSet = new Set(studentIds.map(id => id.toString()));

    // Fetch all applications in parallel
    const applications = await Promise.all(
      args.applicationIds.map((id) => ctx.db.get(id))
    );

    const now = Date.now();
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };
    const changeRecords: {
      applicationId: Id<'applications'>;
      success: boolean;
      error?: string;
    }[] = [];

    // Process each application
    for (let i = 0; i < applications.length; i++) {
      const application = applications[i];
      const applicationId = args.applicationIds[i];

      try {
        // Check if application exists
        if (!application) {
          results.failed++;
          results.errors.push(`Application ${applicationId} not found`);
          continue;
        }

        // Verify permission
        if (!studentIdSet.has(application.user_id.toString())) {
          results.failed++;
          results.errors.push(
            `Unauthorized: Application ${applicationId} does not belong to your student`
          );
          continue;
        }

        // Mark as reviewed by updating the updated_at timestamp
        // This clears the "stale" flag since it's based on updated_at
        await ctx.db.patch(applicationId, {
          updated_at: now,
        });

        results.success++;
        changeRecords.push({ applicationId, success: true });
      } catch (error) {
        results.failed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(
          `Error marking application ${applicationId} as reviewed: ${message}`
        );
        changeRecords.push({ applicationId, success: false, error: message });
      }
    }

    await createAuditLog(ctx, {
      actorId: sessionCtx.userId,
      universityId,
      action: 'applications.bulk_mark_reviewed',
      entityType: 'application',
      entityId: 'bulk',
      previousValue: null,
      newValue: {
        applicationIds: args.applicationIds,
        results,
        changes: changeRecords,
      },
      ipAddress: 'server',
    });

    return results;
  },
});
