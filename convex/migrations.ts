/**
 * Database migrations for schema changes
 */

import { internalMutation } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

/**
 * Migrate users with role "admin" to "super_admin"
 * This is needed after removing "admin" role from the schema
 */
export const migrateAdminToSuperAdmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    let migratedCount = 0
    let failedCount = 0
    const failedUsers: Array<Id<"users">> = []

    // Use pagination to handle large user tables
    const BATCH_SIZE = 100
    let cursor = null
    let totalProcessed = 0

    do {
      const page = await ctx.db.query('users')
        .paginate({ cursor, numItems: BATCH_SIZE })

      for (const user of page.page) {
        totalProcessed++
        // @ts-ignore - temporarily ignore type error for old "admin" role
        if (user.role === 'admin') {
          try {
            await ctx.db.patch(user._id, {
              role: 'super_admin',
              updated_at: Date.now(),
            })
            migratedCount++
            console.log(`✓ Migrated user ${user._id} from admin to super_admin`)
          } catch (error) {
            failedCount++
            failedUsers.push(user._id)
            console.error(`✗ Failed to migrate user ${user._id}:`, error)
          }
        }
      }

      cursor = page.continueCursor
      console.log(`Processed batch: ${totalProcessed} users checked, ${migratedCount} migrated so far`)
    } while (cursor !== null)

    console.log(`\nMigration complete: ${totalProcessed} users checked, ${migratedCount} users updated, ${failedCount} failed`)
    if (failedUsers.length > 0) {
      console.log(`Failed user IDs: ${failedUsers.join(', ')}`)
    }

    return {
      success: failedCount === 0,
      migratedCount,
      failedCount,
      failedUsers,
      totalProcessed,
      message: `Migrated ${migratedCount} users from 'admin' to 'super_admin' (checked ${totalProcessed} total users)${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
    }
  },
})
