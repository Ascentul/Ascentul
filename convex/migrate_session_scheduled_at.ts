/**
 * Migration: Backfill scheduled_at field in advisor_sessions
 *
 * Problem: scheduled_at is optional but used in date-range index queries.
 * Sessions without scheduled_at are excluded from date-filtered results.
 * See convex/advisor_sessions.ts lines 107-137 for the inconsistency.
 *
 * SCALABILITY NOTE:
 * These migrations use ctx.db.query("advisor_sessions").collect() which loads
 * all sessions into memory. As internalMutation/internalQuery, they have a
 * 5-minute timeout (vs 1 second for regular queries), making this acceptable
 * for moderate datasets (~10k sessions).
 *
 * For very large datasets (50k+ sessions), consider refactoring to:
 * 1. Cursor-based pagination with .paginate({ numItems: 500, cursor })
 * 2. Process in batches, storing progress in migration_state table
 * 3. Use scheduled functions for resumable migrations
 *
 * Current approach is sufficient for expected advisor session volumes.
 */

import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Backfill scheduled_at from start_at for sessions missing scheduled_at
 *
 * Run via: npx convex run migrate_session_scheduled_at:backfillScheduledAt
 */
export const backfillScheduledAt = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;

    console.log(`🚀 Starting advisor_sessions scheduled_at backfill (dryRun: ${dryRun})...`);

    let totalProcessed = 0;
    let migrated = 0;
    let alreadySet = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Get all sessions at once
    const sessions = await ctx.db.query("advisor_sessions").collect();

    for (const session of sessions) {
      totalProcessed++;
      const sessionLabel = `session:${session._id}`;

      try {
        // Skip if scheduled_at is already set
        if (session.scheduled_at !== undefined) {
          alreadySet++;
          if (totalProcessed % 100 === 0) {
            console.log(`  ✓ ${sessionLabel} already has scheduled_at: ${new Date(session.scheduled_at).toISOString()}`);
          }
          continue;
        }

        // Validate start_at exists (required field, should always be present)
        if (!session.start_at) {
          const errorMsg = `${sessionLabel} has no start_at field - cannot backfill`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
          skipped++;
          continue;
        }

        // Backfill scheduled_at from start_at
        console.log(`📝 ${sessionLabel}: backfilling scheduled_at from start_at (${new Date(session.start_at).toISOString()})`);

        if (!dryRun) {
          await ctx.db.patch(session._id, {
            scheduled_at: session.start_at,
          });
        }

        migrated++;

        if (totalProcessed % 50 === 0) {
          console.log(`Progress: ${totalProcessed} processed, ${migrated} migrated`);
        }
      } catch (error) {
        const errorMsg = `Error migrating ${sessionLabel}: ${error}`;
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
      alreadySet,
      skipped,
      errors,
      message: dryRun
        ? `DRY RUN: Would backfill ${migrated} sessions`
        : `Successfully backfilled ${migrated} sessions (${alreadySet} already had scheduled_at, ${skipped} skipped)`,
    };

    console.log("\n✅ Migration complete!");
    console.log(JSON.stringify(summary, null, 2));

    return summary;
  },
});

/**
 * Verify migration completeness
 *
 * Run via: npx convex run migrate_session_scheduled_at:verifyMigration
 */
export const verifyMigration = internalQuery({
  args: {},
  handler: async (ctx) => {
    console.log("🔍 Verifying advisor_sessions scheduled_at migration...");

    const allSessions = await ctx.db.query("advisor_sessions").collect();
    const withoutScheduledAt = allSessions.filter(session => session.scheduled_at === undefined);
    const withScheduledAt = allSessions.filter(session => session.scheduled_at !== undefined);

    // Check for mismatches (where scheduled_at !== start_at after migration)
    const mismatches: Array<{
      id: string;
      scheduled_at: number | undefined;
      start_at: number;
      diff_minutes: number;
    }> = [];

    for (const session of withScheduledAt) {
      if (session.scheduled_at !== session.start_at) {
        const diffMs = Math.abs(session.scheduled_at! - session.start_at);
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        mismatches.push({
          id: session._id,
          scheduled_at: session.scheduled_at,
          start_at: session.start_at,
          diff_minutes: diffMinutes,
        });
      }
    }

    const result = {
      total: allSessions.length,
      withScheduledAt: withScheduledAt.length,
      withoutScheduledAt: withoutScheduledAt.length,
      mismatches: mismatches.length,
      mismatchDetails: mismatches.slice(0, 10), // Show first 10
      complete: withoutScheduledAt.length === 0,
      note: mismatches.length > 0
        ? "Some sessions have scheduled_at !== start_at, which is expected if they were rescheduled"
        : "All sessions have scheduled_at set",
    };

    if (result.complete) {
      console.log("✅ Migration complete and verified!");
      if (mismatches.length > 0) {
        console.log(`ℹ️  ${mismatches.length} sessions have different scheduled_at vs start_at (expected for rescheduled sessions)`);
      }
    } else {
      console.error(`❌ ${withoutScheduledAt.length} sessions missing scheduled_at field`);
    }

    console.log(JSON.stringify(result, null, 2));
    return result;
  },
});

/**
 * Get migration statistics
 *
 * Run via: npx convex run migrate_session_scheduled_at:getMigrationStats
 */
export const getMigrationStats = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allSessions = await ctx.db.query("advisor_sessions").collect();

    const stats = {
      total: allSessions.length,
      withScheduledAt: allSessions.filter(s => s.scheduled_at !== undefined).length,
      withoutScheduledAt: allSessions.filter(s => s.scheduled_at === undefined).length,
      matching: allSessions.filter(s => s.scheduled_at === s.start_at).length,
      different: allSessions.filter(s => s.scheduled_at !== undefined && s.scheduled_at !== s.start_at).length,
    };

    return stats;
  },
});
