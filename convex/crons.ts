/**
 * Scheduled cron jobs for automated maintenance tasks
 */

import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

/**
 * Daily cleanup of old audit logs (90-day retention)
 * Runs daily at 2 AM UTC to prevent unbounded database growth
 */
crons.daily(
  'cleanup-old-audit-logs',
  { hourUTC: 2, minuteUTC: 0 },
  internal.maintenance.cleanupOldAuditLogs
)

/**
 * Hourly cleanup of old request logs (24-hour retention)
 * Runs every hour to keep rate limit table lean and fast
 */
crons.hourly(
  'cleanup-old-request-logs',
  { minuteUTC: 15 }, // Run at :15 past every hour
  internal.maintenance.cleanupOldRequestLogs
)

/**
 * Hourly nudge sweep - Urgent and time-sensitive nudges
 * Evaluates high-priority rules like upcoming interviews
 * Runs every hour at :30 to catch time-sensitive events
 */
crons.hourly(
  'nudge-hourly-sweep',
  { minuteUTC: 30 },
  internal.nudges.sweepJobs.hourlySweep
)

/**
 * Daily nudge sweep - All nudge rules
 * Comprehensive evaluation of all nudge rules for all eligible users
 * Runs daily at 9 AM UTC (early morning for most timezones)
 */
crons.daily(
  'nudge-daily-sweep',
  { hourUTC: 9, minuteUTC: 0 },
  internal.nudges.sweepJobs.dailySweep
)

/**
 * Weekly nudge sweep - Weekly progress reviews
 * Sends weekly summary and goal check-in nudges
 * Runs every Monday at 9 AM UTC
 */
crons.weekly(
  'nudge-weekly-sweep',
  { dayOfWeek: 'monday', hourUTC: 9, minuteUTC: 0 },
  internal.nudges.sweepJobs.weeklySweep
)

export default crons
