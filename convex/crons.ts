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

export default crons
