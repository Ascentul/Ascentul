/**
 * Migration: Application status to stage field
 *
 * Migrates legacy status field to new stage field for data consistency.
 * See docs/TECH_DEBT_APPLICATION_STATUS_STAGE.md for full context.
 */

import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Map legacy status values to new stage values
 */
export function mapStatusToStage(status: string): string {
  const map: Record<string, string> = {
    saved: "Prospect",
    applied: "Applied",
    interview: "Interview",
    offer: "Offer",
    rejected: "Rejected",
  };
  return map[status] || "Prospect";
}

/**
 * Map new stage values back to legacy status (for transition period)
 */
export function mapStageToStatus(stage: string): string {
  const map: Record<string, string> = {
    Prospect: "saved",
    Applied: "applied",
    Interview: "interview",
    Offer: "offer",
    Accepted: "offer", // Map to closest legacy value
    Rejected: "rejected",
    Withdrawn: "rejected",
    Archived: "saved",
  };
  return map[stage] || "saved";
}

/**
 * Migrate all applications from status to stage field
 *
 * Run via: npx convex run migrate_application_status_to_stage:migrateStatusToStage
 */
export const migrateStatusToStage = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    const now = Date.now();

    console.log(`🚀 Starting application status→stage migration (dryRun: ${dryRun})...`);

    let totalProcessed = 0;
    let migrated = 0;
    let alreadyMigrated = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Get all applications - for large datasets (>10k), consider running in batches with pagination
    const applications = await ctx.db.query("applications").collect();

    if (applications.length > 10000) {
      console.warn(`⚠️ Processing ${applications.length} applications - this may be slow or memory intensive`);
    }

    for (const app of applications) {
        totalProcessed++;
        const appLabel = `app:${app._id}`;

        try {
          // Skip if stage is already set
          if (app.stage) {
            alreadyMigrated++;
            if (totalProcessed % 100 === 0) {
              console.log(`  ✓ ${appLabel} already has stage: ${app.stage}`);
            }
            continue;
          }

          // Validate status exists
          if (!app.status) {
            const errorMsg = `${appLabel} has no status field - cannot migrate`;
            console.error(`❌ ${errorMsg}`);
            errors.push(errorMsg);
            skipped++;
            continue;
          }

          // Map status to stage
          const newStage = mapStatusToStage(app.status);
          console.log(`📝 ${appLabel}: ${app.status} → ${newStage}`);

          if (!dryRun) {
            await ctx.db.patch(app._id, {
              stage: newStage as any, // Type assertion for migration
              stage_set_at: app.updated_at || app.created_at || now,
              updated_at: now,
            });
          }

          migrated++;

          if (totalProcessed % 50 === 0) {
            console.log(`Progress: ${totalProcessed} processed, ${migrated} migrated`);
          }
      } catch (error) {
        const errorMsg = `Error migrating ${appLabel}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        skipped++;
      }
    }

    const summary = {
      success: errors.length === 0,
      dryRun,
      totalProcessed,
      migrated,
      alreadyMigrated,
      skipped,
      errors,
      message: dryRun
        ? `DRY RUN: Would migrate ${migrated} applications`
        : `Successfully migrated ${migrated} applications (${alreadyMigrated} already had stage, ${skipped} skipped)`,
    };

    console.log("\n✅ Migration complete!");
    console.log(JSON.stringify(summary, null, 2));

    return summary;
  },
});

/**
 * Verify migration completeness
 *
 * Run via: npx convex run migrate_application_status_to_stage:verifyMigration
 */
export const verifyMigration = query({
  args: {},
  handler: async (ctx) => {
    console.log("🔍 Verifying application status→stage migration...");

    const allApps = await ctx.db.query("applications").collect();
    const withoutStage = allApps.filter(app => !app.stage);
    const withStage = allApps.filter(app => app.stage);

    // Check for mismatches
    const mismatches: Array<{
      id: string;
      status: string;
      stage: string | undefined;
      expected: string;
    }> = [];

    for (const app of withStage) {
      if (!app.status) continue; // Skip apps with no original status
      const expectedStage = mapStatusToStage(app.status);
      if (app.stage !== expectedStage) {
        mismatches.push({
          id: app._id,
          status: app.status,
          stage: app.stage,
          expected: expectedStage,
        });
      }
    }

    const result = {
      total: allApps.length,
      withStage: withStage.length,
      withoutStage: withoutStage.length,
      mismatches: mismatches.length,
      mismatchDetails: mismatches.slice(0, 10), // Show first 10
      complete: withoutStage.length === 0 && mismatches.length === 0,
    };

    if (result.complete) {
      console.log("✅ Migration complete and verified!");
    } else {
      if (withoutStage.length > 0) {
        console.error(`❌ ${withoutStage.length} applications missing stage field`);
      }
      if (mismatches.length > 0) {
        console.error(`⚠️  ${mismatches.length} applications have mismatched status/stage`);
      }
    }

    console.log(JSON.stringify(result, null, 2));
    return result;
  },
});

/**
 * Get migration statistics
 *
 * Run via: npx convex run migrate_application_status_to_stage:getMigrationStats
 */
export const getMigrationStats = query({
  args: {},
  handler: async (ctx) => {
    const allApps = await ctx.db.query("applications").collect();

    // Count by status
    const statusCounts: Record<string, number> = {};
    allApps.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });

    // Count by stage
    const stageCounts: Record<string, number> = { undefined: 0 };
    allApps.forEach(app => {
      const stage = app.stage || "undefined";
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });

    return {
      total: allApps.length,
      byStatus: statusCounts,
      byStage: stageCounts,
      migrationNeeded: stageCounts.undefined || 0,
    };
  },
});
