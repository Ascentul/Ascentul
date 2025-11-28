/**
 * Advisor Authorization Guards
 *
 * Centralized permission checking for advisor features with FERPA-style compliance.
 * All advisor queries/mutations must use these guards to enforce:
 * - Tenant isolation (university_id)
 * - Role-based access (advisor, university_admin, super_admin)
 * - Student ownership (via student_advisors.is_owner)
 */

import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Session context extracted from Clerk JWT and Convex user record
 */
export interface AdvisorSessionContext {
  userId: Id<"users">;
  clerkId: string;
  role: "advisor" | "university_admin" | "super_admin" | "student" | "individual" | "user" | "staff";
  universityId: Id<"universities"> | undefined;
  email: string;
}

/**
 * Get current user from Clerk ID with all necessary context
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
  clerkId?: string,
): Promise<AdvisorSessionContext> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  if (clerkId && identity.subject !== clerkId) {
    throw new Error("Unauthorized: clerk session mismatch");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  return {
    userId: user._id,
    clerkId: user.clerkId,
    role: user.role,
    universityId: user.university_id,
    email: user.email,
  };
}

/**
 * Require user to have a university_id (tenant scope)
 * Throws if user is not associated with a university
 */
export function requireTenant(sessionCtx: AdvisorSessionContext): Id<"universities"> {
  if (!sessionCtx.universityId) {
    throw new Error("Missing tenant: User must be associated with a university");
  }
  return sessionCtx.universityId;
}

/**
 * Require user to be an advisor
 * Throws if user role is not advisor, university_admin, or super_admin
 */
export function requireAdvisorRole(sessionCtx: AdvisorSessionContext): void {
  const allowedRoles: typeof sessionCtx.role[] = [
    "advisor",
    "university_admin",
    "super_admin",
  ];

  if (!allowedRoles.includes(sessionCtx.role)) {
    throw new Error(
      `Unauthorized: Role "${sessionCtx.role}" is not authorized for advisor features`,
    );
  }
}

/**
 * Check if advisor can access a specific student
 *
 * Rules:
 * - super_admin: can access any student
 * - university_admin: can access students in their university
 * - advisor: can ONLY access students they own (student_advisors.is_owner = true)
 *
 * @returns The student record if authorized
 * @throws Error if unauthorized
 */
export async function assertCanAccessStudent(
  ctx: QueryCtx | MutationCtx,
  sessionCtx: AdvisorSessionContext,
  studentId: Id<"users">,
) {
  // Require tenant first
  const universityId = requireTenant(sessionCtx);

  // Get student record
  const student = await ctx.db.get(studentId);

  if (!student) {
    throw new Error("Student not found");
  }

  // Check tenant isolation - student must be in same university
  // SECURITY: Reject if student has no university_id OR belongs to different university
  if (!student.university_id || student.university_id !== universityId) {
    throw new Error(
      "Unauthorized: Student is not in your university (tenant isolation)",
    );
  }

  // Super admin can access any student in their tenant
  if (sessionCtx.role === "super_admin") {
    return student;
  }

  // University admin can access all students in their university
  if (sessionCtx.role === "university_admin") {
    return student;
  }

  // Advisors must have ownership relationship
  if (sessionCtx.role === "advisor") {
    const ownership = await ctx.db
      .query("student_advisors")
      .withIndex("by_advisor", (q) =>
        q.eq("advisor_id", sessionCtx.userId).eq("university_id", universityId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("student_id"), studentId),
          q.eq(q.field("is_owner"), true),
        ),
      )
      .unique();

    if (!ownership) {
      throw new Error(
        "Unauthorized: Advisor is not the primary owner for this student",
      );
    }

    return student;
  }

  throw new Error(
    `Unauthorized: Role "${sessionCtx.role}" cannot access student data`,
  );
}

/**
 * Check if advisor can access a specific student (returns boolean instead of throwing)
 * Useful for filtering lists
 */
export async function canAccessStudent(
  ctx: QueryCtx | MutationCtx,
  sessionCtx: AdvisorSessionContext,
  studentId: Id<"users">,
): Promise<boolean> {
  try {
    await assertCanAccessStudent(ctx, sessionCtx, studentId);
    return true;
  } catch (error) {
    // Expected authorization errors - return false
    if (error instanceof Error && (
      error.message.startsWith("Unauthorized") ||
      error.message === "Student not found"
    )) {
      return false;
    }
    // Unexpected errors - log and rethrow for visibility
    console.error("Unexpected error in canAccessStudent:", error);
    throw error;
  }
    // Unexpected errors - log and rethrow for visibility
    console.error("Unexpected error in canAccessStudent:", error);
    throw error;
  }
}

/**
 * Get list of all student IDs that the advisor owns
 * Used for bulk filtering in list queries
 */
export async function getOwnedStudentIds(
  ctx: QueryCtx | MutationCtx,
  sessionCtx: AdvisorSessionContext,
): Promise<Id<"users">[]> {
  const universityId = requireTenant(sessionCtx);

  // Super admin and university admin can access all students
  if (
    sessionCtx.role === "super_admin" ||
    sessionCtx.role === "university_admin"
  ) {
    const students = await ctx.db
      .query("users")
      .withIndex("by_university", (q) => q.eq("university_id", universityId))
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();

    return students.map((s) => s._id);
  }

  // Advisors only get students they own
  if (sessionCtx.role === "advisor") {
    const assignments = await ctx.db
      .query("student_advisors")
      .withIndex("by_advisor_owner", (q) =>
        q.eq("advisor_id", sessionCtx.userId).eq("is_owner", true).eq("university_id", universityId),
      )
      .collect();

    return assignments.map((a) => a.student_id);
  }

  return [];
}

/**
 * Check if a note/session/comment should be visible based on visibility setting
 *
 * Rules:
 * - "shared": visible to student and all advisors
 * - "advisor_only": visible only to advisors (not students)
 * - Supervisors (university_admin, super_admin) can always see private notes
 */
export function canViewPrivateContent(
  sessionCtx: AdvisorSessionContext,
  visibility: "shared" | "advisor_only",
  authorId?: Id<"users">,
): boolean {
  // Shared content is visible to everyone
  if (visibility === "shared") {
    return true;
  }

  // Private content rules
  if (visibility === "advisor_only") {
    // Students cannot see advisor-only content
    if (sessionCtx.role === "student" || sessionCtx.role === "user") {
      return false;
    }

    // Supervisors can see all private content
    if (
      sessionCtx.role === "super_admin" ||
      sessionCtx.role === "university_admin"
    ) {
      return true;
    }

    // Advisors can see their own private content
    if (sessionCtx.role === "advisor") {
      return !authorId || authorId === sessionCtx.userId;
    }
  }

  return false;
}

/**
 * Audit log helper - create audit entry for sensitive actions
 * Must be called for: stage changes, review status changes, visibility changes, student assignments
 */
export async function createAuditLog(
  ctx: MutationCtx,
  params: {
    actorId: Id<"users">;
    universityId: Id<"universities"> | undefined;
    action: string;
    entityType: string;
    entityId: string;
    studentId?: Id<"users">;
    previousValue?: unknown;
    newValue?: unknown;
    ipAddress: string;
    userAgent?: string;
  },
): Promise<Id<"audit_logs">> {
  return await ctx.db.insert("audit_logs", {
    actor_id: params.actorId,
    university_id: params.universityId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    student_id: params.studentId,
    previous_value: params.previousValue,
    new_value: params.newValue,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
    created_at: Date.now(),
  });
}
