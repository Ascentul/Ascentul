/**
 * Admin utility to sync roles from Convex to Clerk in bulk
 * Use this to fix role mismatches across multiple users
 */

import { v } from "convex/values"
import { action, internalQuery } from "../_generated/server"
import { internal } from "../_generated/api"

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
    const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
    if (!CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY environment variable is required')
    }

    // Verify caller is super_admin by checking their Clerk role
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
    const callerRole = (caller.public_metadata as any)?.role

    if (callerRole !== 'super_admin') {
      throw new Error('Unauthorized: Only super_admin can run this operation')
    }

    console.log(`[SyncRolesToClerk] Authorized: ${caller.email_addresses?.[0]?.email_address || args.clerkId} (super_admin)`)

    // Get all users from Convex
    const users: Array<{
      _id: string
      clerkId: string
      email: string
      name: string
      role: string
    }> = await ctx.runQuery(internal.admin.syncRolesToClerk.getAllUsersInternal, {})

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
        // Skip users without Clerk ID (pending activation, etc.)
        if (!user.clerkId || user.clerkId.startsWith('pending_')) {
          results.skipped++
          results.details.push({
            email: user.email,
            clerkId: user.clerkId,
            convexRole: user.role,
            clerkRole: null,
            action: 'skipped',
            message: 'No Clerk ID (pending activation)',
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
        const clerkRole = (clerkUser.public_metadata as any)?.role || null

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

        // Update Clerk publicMetadata
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
                ...clerkUser.public_metadata,
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

        console.log(`[SyncRolesToClerk] Synced ${user.email}: ${clerkRole} → ${user.role}`)
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
 * Internal query to get all users
 * Used by action above
 */
export const getAllUsersInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect()
    return users.map(u => ({
      _id: u._id,
      clerkId: u.clerkId,
      email: u.email,
      name: u.name,
      role: u.role,
    }))
  },
})
