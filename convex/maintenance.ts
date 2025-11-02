/**
 * Maintenance and cleanup functions for scheduled cron jobs
 */

import { internalMutation } from './_generated/server'

/**
 * Cleanup old audit logs to prevent unbounded growth
 * Deletes logs older than 90 days while maintaining compliance
 */
export const cleanupOldAuditLogs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const RETENTION_DAYS = 90
    const cutoffTime = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000

    // Query old logs in batches to avoid timeout
    const oldLogs = await ctx.db
      .query('agent_audit_logs')
      .withIndex('by_created_at')
      .filter((q) => q.lt(q.field('created_at'), cutoffTime))
      .take(1000) // Process max 1000 per run to avoid timeout

    let deletedCount = 0

    for (const log of oldLogs) {
      await ctx.db.delete(log._id)
      deletedCount++
    }

    console.log(
      `[Maintenance] Deleted ${deletedCount} audit logs older than ${RETENTION_DAYS} days`
    )

    return {
      success: true,
      deleted_count: deletedCount,
      cutoff_date: new Date(cutoffTime).toISOString(),
    }
  },
})

/**
 * Cleanup old request logs used for rate limiting
 * Deletes logs older than 24 hours (rate limit windows are much shorter)
 */
export const cleanupOldRequestLogs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const RETENTION_HOURS = 24
    const cutoffTime = Date.now() - RETENTION_HOURS * 60 * 60 * 1000

    // Query old request logs in batches
    // Use by_created_at index for cross-user cleanup (more efficient than by_user_created)
    const oldLogs = await ctx.db
      .query('agent_request_logs')
      .withIndex('by_created_at')
      .filter((q) => q.lt(q.field('created_at'), cutoffTime))
      .take(5000) // Higher batch size since these are lightweight records

    let deletedCount = 0

    for (const log of oldLogs) {
      await ctx.db.delete(log._id)
      deletedCount++
    }

    console.log(
      `[Maintenance] Deleted ${deletedCount} request logs older than ${RETENTION_HOURS} hours`
    )

    return {
      success: true,
      deleted_count: deletedCount,
      cutoff_date: new Date(cutoffTime).toISOString(),
    }
  },
})
