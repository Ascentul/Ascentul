/**
 * Migration Script: Set Internal Roles to Free Plan
 *
 * This script backfills existing internal role accounts (super_admin, staff,
 * university_admin, advisor) to have subscription_plan: 'free'.
 *
 * This ensures they don't inflate investor metrics or MRR calculations.
 *
 * Run this ONCE after deploying the billable role architecture changes.
 *
 * Usage:
 *   npx ts-node scripts/migrate-internal-roles-to-free.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { INTERNAL_ROLES } from "../convex/lib/constants";

// Load environment variables
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL not set in environment");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function migrateInternalRoles() {
  console.log("🚀 Starting migration: Set internal roles to 'free' plan");
  console.log(`📋 Internal roles: ${INTERNAL_ROLES.join(", ")}`);
  console.log("");

  try {
    // Fetch all users (note: this is a migration script, not production code)
    // In production, we'd use pagination for large datasets
    console.log("📥 Fetching all users...");
    const allUsers = await client.query(api.users.getAllUsers, {});
    console.log(`✅ Fetched ${allUsers.length} total users`);
    console.log("");

    // Filter for internal roles
    const internalUsers = allUsers.filter((u: any) =>
      INTERNAL_ROLES.includes(u.role as any)
    );

    console.log(`🔍 Found ${internalUsers.length} internal role users:`);
    console.log("");

    // Group by role and plan
    const roleStats: Record<string, { total: number; alreadyFree: number; needsUpdate: number }> = {};

    INTERNAL_ROLES.forEach(role => {
      const usersWithRole = internalUsers.filter((u: any) => u.role === role);
      const alreadyFree = usersWithRole.filter((u: any) => u.subscription_plan === 'free').length;
      const needsUpdate = usersWithRole.filter((u: any) => u.subscription_plan !== 'free').length;

      roleStats[role] = {
        total: usersWithRole.length,
        alreadyFree,
        needsUpdate,
      };
    });

    // Display stats
    console.log("📊 Current state:");
    console.log("┌─────────────────────┬───────┬──────────────┬──────────────┐");
    console.log("│ Role                │ Total │ Already Free │ Needs Update │");
    console.log("├─────────────────────┼───────┼──────────────┼──────────────┤");

    INTERNAL_ROLES.forEach(role => {
      const stats = roleStats[role];
      console.log(
        `│ ${role.padEnd(19)} │ ${String(stats.total).padStart(5)} │ ${String(stats.alreadyFree).padStart(12)} │ ${String(stats.needsUpdate).padStart(12)} │`
      );
    });

    console.log("└─────────────────────┴───────┴──────────────┴──────────────┘");
    console.log("");

    // Find users that need updating
    const usersToUpdate = internalUsers.filter((u: any) => u.subscription_plan !== 'free');

    if (usersToUpdate.length === 0) {
      console.log("✅ All internal role users already have 'free' plan. No migration needed!");
      console.log("");
      return;
    }

    console.log(`🔄 Updating ${usersToUpdate.length} users to 'free' plan...`);
    console.log("");

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersToUpdate) {
      try {
        console.log(`  ⏳ Updating ${user.name} (${user.email}) - Role: ${user.role}, Current plan: ${user.subscription_plan}`);

        await client.mutation(api.admin_users.updateUserByAdmin, {
          clerkId: user.clerkId,
          updates: {
            subscription_plan: 'free',
          },
        });

        successCount++;
        console.log(`  ✅ Updated successfully`);
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error updating user: ${error}`);
      }
    }

    console.log("");
    console.log("═══════════════════════════════════════════════════");
    console.log("📊 Migration Summary:");
    console.log(`  ✅ Successfully updated: ${successCount} users`);
    console.log(`  ❌ Failed: ${errorCount} users`);
    console.log(`  📈 Total processed: ${usersToUpdate.length} users`);
    console.log("═══════════════════════════════════════════════════");
    console.log("");

    if (errorCount === 0) {
      console.log("🎉 Migration completed successfully!");
    } else {
      console.log("⚠️  Migration completed with errors. Please review the failed updates above.");
    }

  } catch (error) {
    console.error("❌ Fatal error during migration:");
    console.error(error);
    process.exit(1);
  }
}

// Run migration
migrateInternalRoles()
  .then(() => {
    console.log("");
    console.log("✅ Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration script failed:");
    console.error(error);
    process.exit(1);
  });
