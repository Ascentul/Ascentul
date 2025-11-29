import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";

// ============================================================================
// Audit Log PII Redaction & Retention Helpers
// ============================================================================

// Helper to redact PII from legacy fields
function redactLegacyFields(log: Doc<"audit_logs">) {
  return {
    performed_by_name: log.performed_by_name != null ? "[REDACTED]" : log.performed_by_name,
    performed_by_email: log.performed_by_email != null ? "[REDACTED]" : log.performed_by_email,
    target_name: log.target_name != null ? "[REDACTED]" : log.target_name,
    target_email: log.target_email != null ? "[REDACTED]" : log.target_email,
  };
}

// Helper to redact PII from new JSON fields
function redactJsonField(value: any) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return "[REDACTED]";
  if (typeof value !== "object") return value;

  // Recursively replace string values with [REDACTED]
  const clone: any = Array.isArray(value) ? [] : {};
  for (const key of Object.keys(value)) {
    const val = (value as any)[key];
    if (val === null || val === undefined) {
      clone[key] = val;
    } else if (typeof val === "string") {
      clone[key] = "[REDACTED]";
    } else if (typeof val === "object") {
      clone[key] = redactJsonField(val);
    } else {
      clone[key] = val;
    }
  }
  return clone;
}

// ============================================================================
// PII Redaction for a Student
// ============================================================================
export const redactStudentPII = internalMutation({
  args: {
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const studentId = args.studentId as Id<"users">;

    // Query audit logs by student (new format uses student_id in metadata) if such an index exists
    // Fallback: scan by student_id field if present; otherwise paginate all logs
    let cursor: string | null = null;
    let isDone = false;
    let redactedCount = 0;

    while (!isDone) {
      const page = await ctx.db
        .query("audit_logs")
        .order("asc")
        .paginate({ cursor, numItems: 200 });

      for (const log of page.page) {
        // Check if this log involves the student
        const involvesStudent =
          log.student_id === studentId ||
          log.target_id === studentId ||
          (log.metadata && (log.metadata as any).student_id === studentId);

        if (!involvesStudent) continue;

        const updates: Record<string, any> = {};

        // Legacy fields
        Object.assign(updates, redactLegacyFields(log));

        // New JSON fields
        if (log.previous_value !== undefined) {
          updates.previous_value = redactJsonField(log.previous_value);
        }
        if (log.new_value !== undefined) {
          updates.new_value = redactJsonField(log.new_value);
        }

        // Check if any field actually changed (not just present)
        const hasChanges = Object.entries(updates).some(
          ([key, value]) => value !== (log as any)[key]
        );
        if (hasChanges) {
          await ctx.db.patch(log._id, updates);
          redactedCount += 1;
        }
      }

      cursor = page.continueCursor;
      isDone = page.isDone;
    }

    return { redactedCount };
  },
});

// ============================================================================
// Retention Job: delete audit logs older than 7 years
// ============================================================================

// Placeholder export hook (stub for future S3/R2 export)
async function exportAuditLogsForArchive(_logs: Doc<"audit_logs">[]) {
  // TODO: Implement export to long-term storage (S3/R2) before deletion
  console.log(`[audit_logs] Stub export called for ${_logs.length} log(s)`);
}

export const deleteExpiredAuditLogs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sevenYearsMs = 7 * 365 * 24 * 60 * 60 * 1000;
    const cutoff = now - sevenYearsMs;

    let cursor: string | null = null;
    let isDone = false;
    let deletedCount = 0;

    while (!isDone) {
      const page = await ctx.db
        .query("audit_logs")
        .order("asc")
        .paginate({ cursor, numItems: 200 });

      const expired = page.page.filter((log) => (log.created_at ?? log.timestamp ?? 0) < cutoff);

      if (expired.length > 0) {
        await exportAuditLogsForArchive(expired);
        for (const log of expired) {
          await ctx.db.delete(log._id);
          deletedCount += 1;
        }
      }

      cursor = page.continueCursor;
      isDone = page.isDone;
    }

    return { deletedCount, cutoff };
  },
});

