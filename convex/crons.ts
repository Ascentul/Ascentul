/**
 * Scheduled background jobs (cron jobs)
 *
 * Convex cron jobs run on a schedule to perform maintenance tasks.
 * Configure schedules in convex.json or via the Convex dashboard.
 *
 * Documentation: https://docs.convex.dev/scheduling/cron-jobs
 */

import { cronJobs } from "convex/server";

// Workaround for "Type instantiation is excessively deep" error in Convex
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const internal: any = require("./_generated/api").internal;

const crons = cronJobs();

/**
 * Monitor for duplicate student profiles
 *
 * Runs daily to detect race condition duplicates and alert administrators.
 * This is a defensive measure given Convex's lack of unique constraints.
 *
 * Schedule: Daily at 2 AM UTC (low traffic time)
 *
 * Actions taken:
 * - Queries for duplicate profiles
 * - Logs errors if duplicates found
 * - Provides cleanup instructions in logs
 *
 * Next steps if duplicates detected:
 * 1. Check Convex logs for duplicate report
 * 2. Run: npx convex run students:cleanupDuplicateProfiles --userId "affected-user-id"
 * 3. Consider investigating root cause (unusual traffic spike, bug, etc.)
 */
crons.daily(
  "monitor duplicate profiles",
  { hourUTC: 2, minuteUTC: 0 },
  internal.students.monitorDuplicateProfiles
);

/**
 * Auto-expire old student invites
 *
 * Runs hourly to mark expired invites as "expired" status.
 * Uses the by_expires_at index for efficient queries.
 *
 * Schedule: Every hour at :00
 *
 * Actions taken:
 * - Queries for invites with status="pending" and expires_at < now
 * - Updates status to "expired"
 * - Logs count of expired invites
 *
 * This prevents students from accepting stale invites and keeps the
 * invite table clean for admin views.
 */
crons.hourly(
  "expire old invites",
  { minuteUTC: 0 },
  internal.students.expireOldInvites
);

export default crons;
