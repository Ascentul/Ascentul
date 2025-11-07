/**
 * Migration: Consolidate followup_actions and advisor_follow_ups into follow_ups
 *
 * This migration:
 * 1. Migrates all data from followup_actions to follow_ups
 * 2. Migrates all data from advisor_follow_ups to follow_ups
 * 3. Maintains all relationships and data integrity
 *
 * Run with: npx convex run migrate_follow_ups:migrateFollowUps
 */

import { mutation } from './_generated/server';
import { v } from 'convex/values';

export const migrateFollowUps = mutation({
  args: {
    dryRun: v.optional(v.boolean()), // Set to true to preview changes without committing
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    const results = {
      followup_actions_migrated: 0,
      advisor_follow_ups_migrated: 0,
      errors: [] as string[],
    };

    console.log(`Starting migration (dry run: ${dryRun})...`);

    // PART 1: Migrate followup_actions
    console.log('\n[1/2] Migrating followup_actions...');
    const followupActions = await ctx.db.query('followup_actions').collect();
    console.log(`Found ${followupActions.length} followup_actions records`);

    for (const action of followupActions) {
      try {
        // Get user to extract university_id if available
        const user = await ctx.db.get(action.user_id);
        if (!user) {
          results.errors.push(
            `followup_actions ${action._id}: User ${action.user_id} not found`,
          );
          continue;
        }

        // Derive title from description (first 100 chars) or use type
        const title =
          action.description?.substring(0, 100) ||
          `${action.type || 'Follow-up'} task`;

        // Map completed boolean to status
        const status = action.completed ? 'done' : 'open';

        // Determine related_type from entity links
        let related_type: 'application' | 'contact' | 'general' | undefined;
        let related_id: string | undefined;

        if (action.application_id) {
          related_type = 'application';
          related_id = action.application_id;
        } else if (action.contact_id) {
          related_type = 'contact';
          related_id = action.contact_id;
        }

        if (!dryRun) {
          await ctx.db.insert('follow_ups', {
            // Core fields
            title,
            description: action.description,
            type: action.type,
            notes: action.notes,

            // Ownership - student-created, so all IDs point to user
            user_id: action.user_id,
            owner_id: action.user_id,
            created_by_id: action.user_id,
            created_by_type: 'student' as const,

            // Multi-tenancy
            university_id: user.university_id,

            // Relationships
            related_type,
            related_id,
            application_id: action.application_id,
            contact_id: action.contact_id,

            // Task management
            due_at: action.due_date,
            priority: undefined, // Old table didn't have priority
            status: status as 'open' | 'done',

            // Completion tracking
            completed_at: action.completed ? action.updated_at : undefined,
            completed_by: action.completed ? action.user_id : undefined,

            // Timestamps
            created_at: action.created_at,
            updated_at: action.updated_at,
          });
        }

        results.followup_actions_migrated++;
      } catch (error) {
        results.errors.push(
          `followup_actions ${action._id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // PART 2: Migrate advisor_follow_ups
    console.log('\n[2/2] Migrating advisor_follow_ups...');
    const advisorFollowUps = await ctx.db.query('advisor_follow_ups').collect();
    console.log(`Found ${advisorFollowUps.length} advisor_follow_ups records`);

    for (const followUp of advisorFollowUps) {
      try {
        if (!dryRun) {
          await ctx.db.insert('follow_ups', {
            // Core fields
            title: followUp.title,
            description: followUp.description,
            type: followUp.related_type || 'general',
            notes: undefined,

            // Ownership - advisor-created
            user_id: followUp.student_id,
            owner_id: followUp.owner_id,
            created_by_id: followUp.advisor_id,
            created_by_type: 'advisor' as const,

            // Multi-tenancy
            university_id: followUp.university_id,

            // Relationships
            related_type: followUp.related_type,
            related_id: followUp.related_id,
            application_id: undefined,
            contact_id: undefined,

            // Task management
            due_at: followUp.due_at,
            priority: followUp.priority,
            status: followUp.status,

            // Completion tracking
            completed_at: followUp.completed_at,
            completed_by: followUp.completed_by,

            // Timestamps
            created_at: followUp.created_at,
            updated_at: followUp.updated_at,
          });
        }

        results.advisor_follow_ups_migrated++;
      } catch (error) {
        results.errors.push(
          `advisor_follow_ups ${followUp._id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Dry run: ${dryRun}`);
    console.log(`followup_actions migrated: ${results.followup_actions_migrated}`);
    console.log(`advisor_follow_ups migrated: ${results.advisor_follow_ups_migrated}`);
    console.log(
      `Total migrated: ${results.followup_actions_migrated + results.advisor_follow_ups_migrated}`,
    );
    console.log(`Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\nErrors:');
      results.errors.forEach((err) => console.log(`  - ${err}`));
    }

    return results;
  },
});

/**
 * Verification query - compare counts before and after migration
 */
export const verifyMigration = mutation({
  args: {},
  handler: async (ctx) => {
    const followupActionsCount = (
      await ctx.db.query('followup_actions').collect()
    ).length;
    const advisorFollowUpsCount = (
      await ctx.db.query('advisor_follow_ups').collect()
    ).length;
    const followUpsCount = (await ctx.db.query('follow_ups').collect()).length;

    const expected = followupActionsCount + advisorFollowUpsCount;
    const actual = followUpsCount;
    const match = expected === actual;

    return {
      followup_actions_count: followupActionsCount,
      advisor_follow_ups_count: advisorFollowUpsCount,
      follow_ups_count: followUpsCount,
      expected_total: expected,
      actual_total: actual,
      match,
      status: match ? '✅ Migration verified' : '⚠️ Count mismatch',
    };
  },
});
