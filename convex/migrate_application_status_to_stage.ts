/**
 * Migration: Application status to stage field
 *
 * Migrates legacy status field to new stage field for data consistency.
 * See docs/TECH_DEBT_APPLICATION_STATUS_STAGE.md for full context.
 */

import { v } from 'convex/values';

import { internalMutation, internalQuery } from './_generated/server';

/**
 * Application stage type matching the schema definition
 */
export type ApplicationStage =
  | 'Prospect'
  | 'Applied'
  | 'Interview'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn'
  | 'Archived';

/**
 * Map legacy status values to new stage values
 */
export function mapStatusToStage(status: string): ApplicationStage {
  const map: Record<string, ApplicationStage> = {
    saved: 'Prospect',
    applied: 'Applied',
    interview: 'Interview',
    offer: 'Offer',
    rejected: 'Rejected',
    accepted: 'Accepted',
  };
  return map[status] || 'Prospect';
}

/**
 * Map new stage values back to legacy status (for transition period)
 *
 * WARNING: This mapping is lossy and NOT round-trip safe:
 * - Accepted & Offer both map to "offer"
 * - Withdrawn & Rejected both map to "rejected"
 * - Archived & Prospect both map to "saved"
 *
 * Use with caution - converting status → stage → status may not preserve
 * the original value. This function exists only for backward compatibility
 * with legacy code during the transition period.
 */
export function mapStageToStatus(stage: string): string {
  const map: Record<string, string> = {
    Prospect: 'saved',
    Applied: 'applied',
    Interview: 'interview',
    Offer: 'offer',
    Accepted: 'offer', // Lossy: maps to same as Offer
    Rejected: 'rejected',
    Withdrawn: 'rejected', // Lossy: maps to same as Rejected
    Archived: 'saved', // Lossy: maps to same as Prospect
  };
  return map[stage] || 'saved';
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
    // Paginate through applications to avoid loading all records into memory
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const page = await ctx.db
        .query('applications')
        .order('asc')
        .paginate({ cursor, numItems: 100 });

      for (const app of page.page) {
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

      cursor = page.continueCursor;
      isDone = page.isDone;
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

    console.log('\n✅ Migration complete!');
    console.log(JSON.stringify(summary, null, 2));

    return summary;
  },
});

/**
 * Verify migration completeness
 *
 * Run via: npx convex run migrate_application_status_to_stage:verifyMigration
 */
export const verifyMigration = internalQuery({
  args: {},
  handler: async (ctx) => {
    console.log('🔍 Verifying application status→stage migration...');

    // Streaming aggregation - don't accumulate all apps in memory
    let total = 0;
    let withStageCount = 0;
    let withoutStageCount = 0;
    let mismatchCount = 0;
    const mismatchSamples: Array<{
      id: string;
      status: string;
      stage: string | undefined;
      expected: string;
    }> = [];
    const MAX_MISMATCH_SAMPLES = 10;

    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result = await ctx.db.query('applications').paginate({ cursor, numItems: 1000 });

      for (const app of result.page) {
        total++;

        if (app.stage) {
          withStageCount++;

          // Check for mismatches only if has both status and stage
          if (app.status) {
            const expectedStage = mapStatusToStage(app.status);
            if (app.stage !== expectedStage) {
              mismatchCount++;
              // Only keep first N samples
              if (mismatchSamples.length < MAX_MISMATCH_SAMPLES) {
                mismatchSamples.push({
                  id: app._id,
                  status: app.status,
                  stage: app.stage,
                  expected: expectedStage,
                });
              }
            }
          }
        } else {
          withoutStageCount++;
        }
      }

      cursor = result.continueCursor;
      isDone = result.isDone;
    }

    const verifyResult = {
      total,
      withStage: withStageCount,
      withoutStage: withoutStageCount,
      mismatches: mismatchCount,
      mismatchDetails: mismatchSamples,
      complete: withoutStageCount === 0 && mismatchCount === 0,
    };

    if (verifyResult.complete) {
      console.log('✅ Migration complete and verified!');
      console.log(JSON.stringify(verifyResult, null, 2));
      return verifyResult;
    }

    if (withoutStageCount > 0) {
      console.error(`❌ ${withoutStageCount} applications missing stage field`);
    }
    if (mismatchCount > 0) {
      console.error(`⚠️  ${mismatchCount} applications have mismatched status/stage`);
    }

    console.log(JSON.stringify(verifyResult, null, 2));
    throw new Error(
      `Migration verification failed: ${withoutStageCount} missing stage, ${mismatchCount} mismatches`,
    );
  },
});

/**
 * Get migration statistics
 */
export const getMigrationStats = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Streaming aggregation - don't accumulate all apps in memory
    let total = 0;
    const statusCounts: Record<string, number> = {};
    const stageCounts: Record<string, number> = {};

    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result = await ctx.db
        .query('applications')
        .order('asc')
        .paginate({ cursor, numItems: 1000 });

      for (const app of result.page) {
        total++;

        // Count by status
        const status = app.status || 'undefined';
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        // Count by stage
        const stage = app.stage || 'undefined';
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      }

      cursor = result.continueCursor;
      isDone = result.isDone;
    }

    return {
      total,
      byStatus: statusCounts,
      byStage: stageCounts,
      migrationNeeded: stageCounts['undefined'] || 0,
    };
  },
});
