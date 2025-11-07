/**
 * Database migrations for schema changes
 */

import { internalMutation } from "./_generated/server"

/**
 * Migrate users with role "admin" to "super_admin"
 * This is needed after removing "admin" role from the schema
 */
export const migrateAdminToSuperAdmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Get all users
    const allUsers = await ctx.db.query("users").collect()

    let migratedCount = 0

    for (const user of allUsers) {
      // @ts-ignore - temporarily ignore type error for old "admin" role
      if (user.role === "admin") {
        await ctx.db.patch(user._id, {
          role: "super_admin",
          updated_at: Date.now(),
        })
        migratedCount++
        console.log(`Migrated user ${user._id} from admin to super_admin`)
      }
    }

    console.log(`Migration complete: ${migratedCount} users updated`)

    return {
      success: true,
      migratedCount,
      message: `Successfully migrated ${migratedCount} users from 'admin' to 'super_admin'`,
    }
  },
})
