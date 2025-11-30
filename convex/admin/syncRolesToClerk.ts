/**
 * Admin utility to sync roles from Convex to Clerk in bulk
 * Use this to fix role mismatches across multiple users
 */

import { v } from "convex/values"
import { action, internalQuery } from "../_generated/server"
import { internal } from "../_generated/api"
import { isValidUserRole } from "../lib/roleValidation"
import { maskEmail } from "../lib/piiSafe"

/**
 * Sync all user roles from Convex to Clerk
 * This is a utility function for fixing bulk mismatches
 *
 * IMPORTANT: This requires CLERK_SECRET_KEY in environment
 * SECURITY: Only super_admin users can run this operation (verified via Clerk API)
 *
 * RATE LIMITING: Processes users in batches of 10 with 1-second delays
 * between batches to avoid hitting Clerk API rate limits
 *
 * Usage:
 * npx convex run admin/syncRolesToClerk:syncAllRolesToClerk --clerkId YOUR_CLERK_ID --dryRun true
 * npx convex run admin/syncRolesToClerk:syncAllRolesToClerk --clerkId YOUR_CLERK_ID
 */
export const syncAllRolesToClerk = action({
  args: {
    clerkId: v.string(),
    dryRun: v.optional(v.boolean()), // If true, only shows what would be synced
  },
  handler: async (ctx, args) => {
    // SECURITY: Verify the caller is authenticated and matches the provided clerkId
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Unauthorized: Authentication required')
    }

    // Extract Clerk ID from the authenticated identity token
    const authenticatedClerkId = identity.subject
    if (authenticatedClerkId !== args.clerkId) {
      throw new Error(
        'Unauthorized: Clerk ID mismatch. The provided clerkId must match your authenticated session.'
      )
    }

    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
    if (!CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY environment variable is required')
    }

    // Verify caller is super_admin by checking their Clerk role
    // Now safe to use args.clerkId since we've verified it matches the authenticated user
    const callerResponse = await fetch(
      `https://api.clerk.com/v1/users/${args.clerkId}`,
      {
        headers: {
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!callerResponse.ok) {
      throw new Error(`Failed to verify caller identity: ${callerResponse.status}`)
    }

    const caller = await callerResponse.json()
    const callerMetadata = caller.public_metadata as Record<string, unknown>
    const callerRole = typeof callerMetadata?.role === 'string' ? callerMetadata.role : null

    if (callerRole !== 'super_admin') {
      throw new Error('Unauthorized: Only super_admin can run this operation')
    }

    console.log(`[SyncRolesToClerk] Authorized: ${maskEmail(caller.email_addresses?.[0]?.email_address) || args.clerkId} (super_admin)`)

    // Get all users from Convex using pagination
    const allUsers: Array<{
      _id: string
      clerkId: string
      email: string
      name: string
      role: string
    }> = []

    let cursor: string | null = null
    let totalFetched = 0

    do {
      const page: { users: Array<{ _id: string; clerkId: string; email: string; name: string; role: string }>; cursor: string | null } = await ctx.runQuery(internal.admin.syncRolesToClerk.getAllUsersInternal, {
        cursor: cursor ?? undefined,
        pageSize: 100,
      })

      allUsers.push(...page.users)
      totalFetched += page.users.length
      cursor = page.cursor

      if (cursor) {
        console.log(`[SyncRolesToClerk] Fetched ${totalFetched} users so far...`)
      }
    } while (cursor)

    const users = allUsers
    console.log(`[SyncRolesToClerk] Found ${users.length} users in Convex`)

    const results: {
      total: number
      synced: number
      skipped: number
      errors: number
      details: Array<{
        email: string
        clerkId: string
        convexRole: string
        clerkRole: string | null
        action: 'synced' | 'skipped' | 'error'
        message: string
      }>
    } = {
      total: users.length,
      synced: 0,
      skipped: 0,
      errors: 0,
      details: [],
    }

    // Rate limiting configuration
    const BATCH_SIZE = 10 // Process 10 users before pausing
    const DELAY_MS = 1000 // 1 second delay between batches

    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      try {
        // Validate role before attempting sync to prevent propagating invalid data
        if (!isValidUserRole(user.role)) {
          results.errors++
          results.details.push({
            email: user.email,
            clerkId: user.clerkId,
            convexRole: user.role,
            clerkRole: null,
            action: 'error',
            message: `Invalid role in Convex: "${user.role}". Skipping sync to prevent data corruption.`,
          })
          console.error(`[SyncRolesToClerk] Invalid role for ${maskEmail(user.email)}: ${user.role}`)
          continue
        }

        // Skip users without valid Clerk ID (pending activation, empty, etc.)
        if (!user.clerkId || user.clerkId === '' || user.clerkId.startsWith('pending_')) {
          results.skipped++
          results.details.push({
            email: user.email,
            clerkId: user.clerkId,
            convexRole: user.role,
            clerkRole: null,
            action: 'skipped',
            message: user.clerkId?.startsWith('pending_')
              ? 'Pending activation'
              : 'No Clerk ID',
          })
          continue
        }

        // Get user from Clerk
        const clerkResponse = await fetch(
          `https://api.clerk.com/v1/users/${user.clerkId}`,
          {
            headers: {
              Authorization: `Bearer ${CLERK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!clerkResponse.ok) {
          results.errors++
          results.details.push({
            email: user.email,
            clerkId: user.clerkId,
            convexRole: user.role,
            clerkRole: null,
            action: 'error',
            message: `Clerk API error: ${clerkResponse.status}`,
          })
          continue
        }

        const clerkUser = await clerkResponse.json()
        const metadata = clerkUser.public_metadata as Record<string, unknown>
        const clerkRole = typeof metadata?.role === 'string' ? metadata.role : null

        // Check if sync needed
        if (clerkRole === user.role) {
          results.skipped++
          results.details.push({
            email: user.email,
            clerkId: user.clerkId,
            convexRole: user.role,
            clerkRole,
            action: 'skipped',
            message: 'Already in sync',
          })
          continue
        }

        // Dry run - don't actually update
        if (args.dryRun) {
          results.synced++
          results.details.push({
            email: user.email,
            clerkId: user.clerkId,
            convexRole: user.role,
            clerkRole,
            action: 'synced',
            message: `Would sync: ${clerkRole} → ${user.role} (DRY RUN)`,
          })
          continue
        }

        // Refetch user immediately before update to minimize race condition window
        // This ensures we use the latest metadata and don't overwrite concurrent changes
        const freshResponse = await fetch(
          `https://api.clerk.com/v1/users/${user.clerkId}`,
          {
            headers: {
              Authorization: `Bearer ${CLERK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!freshResponse.ok) {
          results.errors++
          results.details.push({
            email: user.email,
            clerkId: user.clerkId,
            convexRole: user.role,
            clerkRole,
            action: 'error',
            message: `Failed to refetch user before update: ${freshResponse.status}`,
          })
          continue
        }

        const freshClerkUser = await freshResponse.json()

        // Update Clerk publicMetadata with fresh data
        const updateResponse = await fetch(
          `https://api.clerk.com/v1/users/${user.clerkId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${CLERK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              public_metadata: {
                ...freshClerkUser.public_metadata,
                role: user.role,
              },
            }),
          }
        )

        if (!updateResponse.ok) {
          results.errors++
          results.details.push({
            email: user.email,
            clerkId: user.clerkId,
            convexRole: user.role,
            clerkRole,
            action: 'error',
            message: `Failed to update Clerk: ${updateResponse.status}`,
          })
          continue
        }

        results.synced++
        results.details.push({
          email: user.email,
          clerkId: user.clerkId,
          convexRole: user.role,
          clerkRole,
          action: 'synced',
          message: `Synced: ${clerkRole || 'null'} → ${user.role}`,
        })

        console.log(`[SyncRolesToClerk] Synced ${maskEmail(user.email)}: ${clerkRole} → ${user.role}`)
      } catch (error) {
        results.errors++
        results.details.push({
          email: user.email,
          clerkId: user.clerkId,
          convexRole: user.role,
          clerkRole: null,
          action: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      // Rate limiting: Add delay after each batch
      if ((i + 1) % BATCH_SIZE === 0 && i < users.length - 1) {
        const processed = i + 1
        const remaining = users.length - processed
        console.log(`[SyncRolesToClerk] Progress: ${processed}/${users.length} users processed (${results.synced} synced, ${results.skipped} skipped, ${results.errors} errors). ${remaining} remaining. Pausing for ${DELAY_MS}ms...`)
        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
      }
    }

    console.log(`[SyncRolesToClerk] Complete:`, results)

    return results
  },
})

/**
 * Internal query to get users with pagination
 * Prevents memory issues with large user bases
 * Uses Convex's built-in paginate() for reliable cursor-based pagination
 */
export const getAllUsersInternal = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pageSize = args.pageSize ?? 100

    // Use Convex's built-in pagination with proper cursor handling
    // This orders by _creationTime internally and handles cursor correctly
    const result = await ctx.db
      .query("users")
      .order("asc") // Consistent ordering for pagination
      .paginate({
        numItems: pageSize,
        cursor: args.cursor ?? null,
      })

    return {
      users: result.page.map(u => ({
        _id: u._id,
        clerkId: u.clerkId,
        email: u.email,
        name: u.name,
        role: u.role,
      })),
      cursor: result.isDone ? null : result.continueCursor,
    }
  },
})
