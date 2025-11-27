/**
 * Audit logging system for tracking admin actions
 * Provides compliance trail for FERPA, GDPR, and investor reporting
 */

import { v } from "convex/values"
import { mutation, query, internalMutation } from "./_generated/server"
import { requireSuperAdmin } from "./lib/roles"
import { paginationOptsValidator } from "convex/server"
import { Id } from "./_generated/dataModel"

/**
 * Internal audit log creation without auth check
 * Used by actions that have already verified super admin permissions
 * SECURITY: internalMutation ensures this can only be called from server-side code, not clients
 */
export const _createAuditLogInternal = internalMutation({
  args: {
    action: v.string(),
    target_type: v.string(),
    target_id: v.string(),
    target_email: v.optional(v.string()),
    target_name: v.optional(v.string()),
    performed_by_id: v.id("users"),
    performed_by_email: v.optional(v.string()),
    performed_by_name: v.optional(v.string()),
    reason: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("audit_logs", {
      action: args.action,
      target_type: args.target_type,
      target_id: args.target_id,
      target_email: args.target_email,
      target_name: args.target_name,
      performed_by_id: args.performed_by_id,
      performed_by_email: args.performed_by_email,
      performed_by_name: args.performed_by_name,
      reason: args.reason,
      metadata: args.metadata,
      timestamp: Date.now(),
      created_at: Date.now(),
    })
  },
})

/**
 * Create an audit log entry
 * External API with super admin verification
 * SECURITY: Only callable by super admins to prevent audit log tampering
 */
export const createAuditLog = mutation({
  args: {
    action: v.string(),
    target_type: v.string(),
    target_id: v.string(),
    target_email: v.optional(v.string()),
    target_name: v.optional(v.string()),
    performed_by_id: v.id("users"),
    performed_by_email: v.optional(v.string()),
    performed_by_name: v.optional(v.string()),
    reason: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // CRITICAL: Verify super admin to prevent audit log forgery
    await requireSuperAdmin(ctx)

    await ctx.db.insert("audit_logs", {
      action: args.action,
      target_type: args.target_type,
      target_id: args.target_id,
      target_email: args.target_email,
      target_name: args.target_name,
      performed_by_id: args.performed_by_id,
      performed_by_email: args.performed_by_email,
      performed_by_name: args.performed_by_name,
      reason: args.reason,
      metadata: args.metadata,
      timestamp: Date.now(),
      created_at: Date.now(),
    })
  },
})

/**
 * Get audit logs with filtering and pagination
 * Super admin only
 */
export const getAuditLogs = query({
  args: {
    clerkId: v.string(),
    action: v.optional(v.string()),
    target_email: v.optional(v.string()),
    startDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify super admin
    await requireSuperAdmin(ctx)

    // Apply filters using indexes
    // NOTE: When startDate is provided with additional filters, we use iterative fetching
    // to ensure we return the requested number of results
    if (args.startDate) {
      const requestedLimit = args.limit || 100
      const hasAdditionalFilters = args.action || args.target_email

      // If no additional filters, we can fetch directly
      if (!hasAdditionalFilters) {
        return await ctx.db
          .query("audit_logs")
          .withIndex("by_timestamp", (q) => q.gte("timestamp", args.startDate!))
          .order("desc")
          .take(requestedLimit)
      }

      // Iterative fetching for filtered queries using proper (timestamp, id) cursor pagination
      // This approach handles non-unique timestamps correctly and avoids duplicates/gaps
      const matchingLogs: Array<any> = []
      const batchSize = 100
      const maxBatches = 10 // Safety limit to prevent infinite loops (max 1000 records scanned)

      // Cursor tracks both timestamp and ID for proper pagination
      // Start from the beginning (startDate) with no ID constraint initially
      let cursorTimestamp = args.startDate
      let cursorId: Id<"audit_logs"> | null = null
      let batchCount = 0
      let isFirstBatch = true

      while (matchingLogs.length < requestedLimit && batchCount < maxBatches) {
        // Fetch next batch
        // For descending order with (timestamp, id) cursor:
        // - First batch: timestamp >= startDate (no ID filter)
        // - Subsequent batches: timestamp < cursorTimestamp OR (timestamp == cursorTimestamp AND id < cursorId)
        let batch

        if (isFirstBatch) {
          // First batch: start from startDate, no ID filtering needed
          batch = await ctx.db
            .query("audit_logs")
            .withIndex("by_timestamp", (q) => q.gte("timestamp", cursorTimestamp))
            .order("desc")
            .take(batchSize + 1)
          isFirstBatch = false
        } else {
          // Subsequent batches: use (timestamp, id) cursor with bounded fetch
          // Over-fetch to account for records we need to skip at the same timestamp
          const rawBatch = await ctx.db
            .query("audit_logs")
            .withIndex("by_timestamp", (q) => q.lte("timestamp", cursorTimestamp))
            .order("desc")
            .take(batchSize * 2) // Over-fetch to account for cursor filtering

          // Filter to only records that come after our cursor position
          // In descending order: (timestamp < cursorTimestamp) OR (timestamp == cursorTimestamp AND id < cursorId)
          batch = rawBatch.filter(log => {
            const logTimestamp = log.timestamp ?? log.created_at ?? 0;
            if (logTimestamp < cursorTimestamp) {
              return true // All records with lower timestamp
            }
            if (logTimestamp === cursorTimestamp && cursorId) {
              return log._id < cursorId // Only IDs less than cursor for same timestamp
            }
            return false // Skip records at or after cursor
          }).slice(0, batchSize + 1)
        }

        if (batch.length === 0) {
          break // No more logs to fetch
        }

        // Apply in-memory filters
        const filteredBatch = batch.slice(0, batchSize).filter(log => {
          if (args.action && log.action !== args.action) return false
          if (args.target_email && log.target_email !== args.target_email) return false
          return true
        })

        matchingLogs.push(...filteredBatch)

        // Update cursor for next iteration using the last record we fetched (not filtered)
        const lastLog = batch[Math.min(batch.length - 1, batchSize - 1)]
        cursorTimestamp = lastLog.timestamp ?? lastLog.created_at ?? 0
        cursorId = lastLog._id

        // If we got fewer records than requested + 1, we've exhausted the database
        if (batch.length < batchSize + 1) {
          break
        }

        batchCount++
      }

      // Return up to requested limit
      return matchingLogs.slice(0, requestedLimit)
    } else if (args.action) {
      const logs = await ctx.db
        .query("audit_logs")
        .withIndex("by_action", (q) => q.eq("action", args.action!))
        .order("desc")
        .take(args.limit || 100)
      return logs
    } else if (args.target_email) {
      // Use by_target_email index for efficient email-based queries
      const logs = await ctx.db
        .query("audit_logs")
        .withIndex("by_target_email", (q) => q.eq("target_email", args.target_email!))
        .order("desc")
        .take(args.limit || 100)
      return logs
    } else {
      const logs = await ctx.db
        .query("audit_logs")
        .order("desc")
        .take(args.limit || 100)
      return logs
    }
  },
})

/**
 * Get audit logs with cursor-based pagination
 * Supports infinite scroll and large datasets
 * Super admin only
 */
export const getAuditLogsPaginated = query({
  args: {
    clerkId: v.string(),
    action: v.optional(v.string()),
    target_email: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Verify super admin
    await requireSuperAdmin(ctx)

    // Apply filters using indexes with pagination
    if (args.action) {
      return await ctx.db
        .query("audit_logs")
        .withIndex("by_action", (q) => q.eq("action", args.action!))
        .order("desc")
        .paginate(args.paginationOpts)
    } else if (args.target_email) {
      // Use by_target_email index for efficient paginated email-based queries
      return await ctx.db
        .query("audit_logs")
        .withIndex("by_target_email", (q) => q.eq("target_email", args.target_email!))
        .order("desc")
        .paginate(args.paginationOpts)
    } else {
      return await ctx.db
        .query("audit_logs")
        .order("desc")
        .paginate(args.paginationOpts)
    }
  },
})

/**
 * Get audit logs for a specific user
 * Shows all actions performed on this user
 */
export const getAuditLogsForUser = query({
  args: {
    clerkId: v.string(),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify super admin
    await requireSuperAdmin(ctx)

    // Use by_target index for efficient user-specific queries
    const logs = await ctx.db
      .query("audit_logs")
      .withIndex("by_target", (q) =>
        q.eq("target_type", "user").eq("target_id", args.targetUserId))
      .order("desc")
      .take(50)

    return logs
  },
})

/**
 * Create system-initiated audit log entry
 * For automatic operations like auto-assignment that don't require super_admin
 * SECURITY: Authenticated users can only log events where they are the performer
 */
export const createSystemAuditLog = mutation({
  args: {
    action: v.string(),
    target_type: v.string(),
    target_id: v.string(),
    target_email: v.optional(v.string()),
    target_name: v.optional(v.string()),
    performed_by_id: v.id("users"),
    performed_by_email: v.optional(v.string()),
    performed_by_name: v.optional(v.string()),
    reason: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify authenticated user can only log their own actions
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized: Authentication required")
    }

    // Verify the performer matches the authenticated user
    const performer = await ctx.db.get(args.performed_by_id)
    if (!performer || performer.clerkId !== identity.subject) {
      throw new Error("Forbidden: Can only create audit logs for your own actions")
    }

    await ctx.db.insert("audit_logs", {
      action: args.action,
      target_type: args.target_type,
      target_id: args.target_id,
      target_email: args.target_email,
      target_name: args.target_name,
      performed_by_id: args.performed_by_id,
      performed_by_email: args.performed_by_email,
      performed_by_name: args.performed_by_name,
      reason: args.reason,
      metadata: args.metadata,
      timestamp: Date.now(),
      created_at: Date.now(),
    })
  },
})

/**
 * Get audit log statistics
 * For admin dashboard/reporting
 *
 * PERFORMANCE NOTE:
 * - Uses indexed query (by_timestamp) for efficient date range filtering
 * - Loads filtered logs into memory for aggregation
 * - ALWAYS specify startDate to limit scope (e.g., last 30/90 days)
 * - Without startDate: loads ALL audit logs (acceptable for <100k logs)
 *
 * WHEN TO OPTIMIZE:
 * - When audit log count exceeds ~100,000 records
 * - If queries timeout or show performance degradation
 * - Consider pre-computed stats table updated on insert
 */
export const getAuditLogStats = query({
  args: {
    clerkId: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify super admin
    await requireSuperAdmin(ctx)

    // Use indexed query for better performance
    // NOTE: Always specify startDate in production for better performance
    const allLogs = args.startDate
      ? await ctx.db
          .query("audit_logs")
          .withIndex("by_timestamp", (q) => q.gte("timestamp", args.startDate!))
          .collect()
      : await ctx.db.query("audit_logs").collect() // Loads all logs - use with caution

    // Filter end date in memory if needed (can't use index for upper bound)
    const filteredLogs = args.endDate
      ? allLogs.filter(log => log.timestamp !== undefined && log.timestamp <= args.endDate!)
      : allLogs

    // Count by action type
    const actionCounts: Record<string, number> = {}
    filteredLogs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    })

    return {
      total: filteredLogs.length,
      byAction: actionCounts,
      dateRange: {
        start: args.startDate || (filteredLogs.length > 0 ? filteredLogs[filteredLogs.length - 1].timestamp : undefined),
        end: args.endDate || (filteredLogs.length > 0 ? filteredLogs[0].timestamp : undefined),
      },
    }
  },
})
