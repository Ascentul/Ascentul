/**
 * Migration: Consolidate followup_actions and advisor_follow_ups into follow_ups
 *
 * This migration:
 * 1. Migrates all data from followup_actions to follow_ups
 * 2. Migrates all data from advisor_follow_ups to follow_ups
 * 3. Maintains all relationships and data integrity
 * 4. Includes idempotency check to prevent duplicate migrations
 * 5. Batches user lookups to avoid N+1 query performance issues
 * 6. Stores migrated_from_id for duplicate detection on re-runs
 *
 * IMPORTANT: Run this migration BEFORE enabling new follow-up creation in the
 * unified follow_ups table. The partial migration detection assumes follow_ups
 * contains only migrated records. If new records are created directly in
 * follow_ups before migration completes, the count check will produce false
 * positives.
 *
 * Usage:
 * - Dry run (preview): npx convex run migrate_follow_ups:migrateFollowUps '{"dryRun": true}'
 * - Actual migration: npx convex run migrate_follow_ups:migrateFollowUps
 * - Force re-run: npx convex run migrate_follow_ups:migrateFollowUps '{"force": true}' (safe - skips already migrated)
 * - Verify (default 100 samples): npx convex run migrate_follow_ups:verifyMigration
 * - Verify (custom sample): npx convex run migrate_follow_ups:verifyMigration '{"sampleSize": 500}'
 */

import { internalMutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

async function countWithPagination(ctx: any, tableName: string): Promise<number> {
  let count = 0;
  let cursor: string | null = null;
  let isDone = false;

  while (!isDone) {
    const page: any = await ctx.db
      .query(tableName)
      .order('asc')
      .paginate({ cursor, numItems: 1000 });

    count += page.page.length;
    cursor = page.continueCursor;
    isDone = page.isDone;
  }

  return count;
}

export const migrateFollowUps = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()), // Set to true to preview changes without committing
    force: v.optional(v.boolean()), // Set to true to bypass idempotency check (dangerous!)
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    const force = args.force ?? false;
    const MIGRATION_NAME = 'migrate_follow_ups_v1';

    // Enhanced idempotency check using migration_state table
    if (!dryRun && !force) {
      const existingMigration = await ctx.db
        .query('migration_state')
        .withIndex('by_name', (q) => q.eq('migration_name', MIGRATION_NAME))
        .first();

      if (existingMigration) {
        if (existingMigration.status === 'completed') {
          const completedDate = existingMigration.completed_at
            ? new Date(existingMigration.completed_at).toISOString()
            : 'unknown time';
          throw new Error(
            `Migration '${MIGRATION_NAME}' has already completed successfully at ${completedDate}. ` +
            `Migrated: ${JSON.stringify(existingMigration.metadata)}. ` +
            'To re-run anyway, use: npx convex run migrate_follow_ups:migrateFollowUps \'{"force": true}\' ' +
            '(safe - already-migrated records will be skipped via migrated_from_id check)'
          );
        } else if (existingMigration.status === 'in_progress') {
          const elapsed = Date.now() - existingMigration.started_at;
          const elapsedMinutes = Math.floor(elapsed / 60000);
          throw new Error(
            `Migration '${MIGRATION_NAME}' is currently in progress (started ${elapsedMinutes} minutes ago). ` +
            'If it is stuck, use force=true to override.'
          );
        } else if (existingMigration.status === 'failed') {
          throw new Error(
            `Migration '${MIGRATION_NAME}' previously failed: ${existingMigration.error_message}. ` +
            'Fix the issue and use force=true to retry.'
          );
        }
      }

      // Additional check: count records to detect partial migrations
      //
      // ⚠️ MEMORY CONCERN: collect() loads entire result sets into memory.
      // Convex best practices discourage this for large datasets. Alternatives:
      // - Denormalized counters: Maintain counts in mutations for O(1) reads
      // - Aggregate component: O(log n) counts with filtering support
      // - Cursor pagination: Stream results in pages (100-1000 rows)
      //
      // RETAINED HERE because: This is a one-time migration check expected to run
      // on bounded legacy tables before the unified table is in active use.
      // If tables exceed ~5,000 records, consider using the Aggregate component.
      const [followUps, followupActions, advisorFollowUps] = await Promise.all([
        ctx.db.query('follow_ups').collect(),
        ctx.db.query('followup_actions').collect(),
        ctx.db.query('advisor_follow_ups').collect(),
      ]);

      const followUpsCount = followUps.length;
      const followupActionsCount = followupActions.length;
      const advisorFollowUpsCount = advisorFollowUps.length;
      const expectedCount = followupActionsCount + advisorFollowUpsCount;

      if (followUpsCount > 0 && followUpsCount !== expectedCount) {
        throw new Error(
          `Partial migration detected! follow_ups has ${followUpsCount} records but expected ${expectedCount} ` +
          `(${followupActionsCount} from followup_actions + ${advisorFollowUpsCount} from advisor_follow_ups). ` +
          'This indicates a previous migration may have partially completed. ' +
          'Please verify the data integrity before proceeding with force=true.'
        );
      }
    }

    // Record migration start
    let migrationStateId;
    if (!dryRun) {
      migrationStateId = await ctx.db.insert('migration_state', {
        migration_name: MIGRATION_NAME,
        status: 'in_progress',
        started_at: Date.now(),
        executed_by: 'manual', // Could be enhanced to track actual user
      });
    }

    const results = {
      followup_actions_migrated: 0,
      advisor_follow_ups_migrated: 0,
      errors: [] as string[],
    };

    console.log(`Starting migration (dry run: ${dryRun}, force: ${force})...`);

    // PART 1: Migrate followup_actions (using pagination to avoid memory issues)
    console.log('\n[1/2] Migrating followup_actions...');
    let followupActionsCursor: string | null = null;
    let hasMoreFollowupActions = true;
    const BATCH_SIZE = 100;

    while (hasMoreFollowupActions) {
      const page = await ctx.db
        .query('followup_actions')
        .order('asc')
        .paginate({ cursor: followupActionsCursor, numItems: BATCH_SIZE });

      console.log(`Processing batch of ${page.page.length} followup_actions...`);

      // Batch user lookups to avoid N+1 queries
      const userIds = [...new Set(page.page.map(a => a.user_id))];
      const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
      const userMap = new Map(
        users
          .filter((u): u is NonNullable<typeof u> => u !== null)
          .map(u => [u._id, u] as const)
      );

      // Batch application lookups to validate foreign keys
      const faApplicationIds = [...new Set(
        page.page
          .filter(a => a.application_id)
          .map(a => a.application_id as Id<'applications'>)
      )];
      const faApplications = await Promise.all(faApplicationIds.map(id => ctx.db.get(id)));
      const faApplicationMap = new Map(
        faApplications
          .filter((a): a is NonNullable<typeof a> => a !== null)
          .map(a => [a._id, a] as const)
      );

      // Batch contact lookups to validate foreign keys
      const faContactIds = [...new Set(
        page.page
          .filter(a => a.contact_id)
          .map(a => a.contact_id as Id<'networking_contacts'>)
      )];
      const faContacts = await Promise.all(faContactIds.map(id => ctx.db.get(id)));
      const faContactMap = new Map(
        faContacts
          .filter((c): c is NonNullable<typeof c> => c !== null)
          .map(c => [c._id, c] as const)
      );

      // Skip batch lookup if no items to check
      if (page.page.length === 0) {
        followupActionsCursor = page.continueCursor;
        hasMoreFollowupActions = !page.isDone;
        continue;
      }

      // Pre-fetch already migrated IDs for this batch to avoid N+1 queries
      let migratedSet = new Set<string>();
      const migratedFromThisBatch = await ctx.db
        .query('follow_ups')
        .withIndex('by_migrated_from')
        .filter((q) => q.or(...page.page.map(a => q.eq(q.field('migrated_from_id'), a._id))))
        .collect();
      migratedSet = new Set(migratedFromThisBatch.map(m => m.migrated_from_id));

      for (const action of page.page) {
        try {
        // Skip if already migrated (idempotent re-run support for force=true)
        if (migratedSet.has(action._id)) {
          console.log(`Skipping followup_actions ${action._id} - already migrated`);
          continue;
        }

        // Get user from batched lookup
        const user = userMap.get(action.user_id);
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
          // Validate that the application exists
          if (!faApplicationMap.has(action.application_id)) {
            results.errors.push(
              `followup_actions ${action._id}: Application ${action.application_id} not found (orphaned reference)`,
            );
            continue;
          }
          related_type = 'application';
          related_id = action.application_id;
        } else if (action.contact_id) {
          // Validate that the contact exists
          if (!faContactMap.has(action.contact_id)) {
            results.errors.push(
              `followup_actions ${action._id}: Contact ${action.contact_id} not found (orphaned reference)`,
            );
            continue;
          }
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
            status: status as 'open' | 'done',

            // Completion tracking
            completed_at: action.completed ? (action.updated_at || action.created_at) : undefined,
            completed_by: action.completed ? action.user_id : undefined,

            // Migration tracking for idempotent re-runs
            migrated_from_id: action._id,

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

      followupActionsCursor = page.continueCursor;
      hasMoreFollowupActions = !page.isDone;
    }

    console.log(`Total followup_actions migrated: ${results.followup_actions_migrated}`);

    // PART 2: Migrate advisor_follow_ups (using pagination to avoid memory issues)
    console.log('\n[2/2] Migrating advisor_follow_ups...');
    let advisorFollowUpsCursor: string | null = null;
    let hasMoreAdvisorFollowUps = true;

    while (hasMoreAdvisorFollowUps) {
      const page = await ctx.db
        .query('advisor_follow_ups')
        .order('asc')
        .paginate({ cursor: advisorFollowUpsCursor, numItems: BATCH_SIZE });

      console.log(`Processing batch of ${page.page.length} advisor_follow_ups...`);

      // Batch user lookups to avoid N+1 queries (validate student_id, owner_id, advisor_id)
      const allUserIds = new Set<Id<'users'>>();
      page.page.forEach(f => {
        allUserIds.add(f.student_id);
        allUserIds.add(f.owner_id);
        allUserIds.add(f.advisor_id);
      });
      const users = await Promise.all([...allUserIds].map(id => ctx.db.get(id)));
      const userMap = new Map(
        users
          .filter((u): u is NonNullable<typeof u> => u !== null)
          .map(u => [u._id, u] as const)
      );

      // Batch application lookups to validate foreign keys
      const applicationIds = page.page
        .filter(f => f.related_type === 'application' && f.related_id)
        .map(f => f.related_id as Id<'applications'>);
      const applications = await Promise.all(applicationIds.map(id => ctx.db.get(id)));
      const applicationMap = new Map(
        applications
          .filter((a): a is NonNullable<typeof a> => a !== null)
          .map(a => [a._id, a] as const)
      );

      // Batch session lookups to validate foreign keys
      const sessionIds = page.page
        .filter(f => f.related_type === 'session' && f.related_id)
        .map(f => f.related_id as Id<'advisor_sessions'>);
      const sessions = await Promise.all(sessionIds.map(id => ctx.db.get(id)));
      const sessionMap = new Map(
        sessions
          .filter((s): s is NonNullable<typeof s> => s !== null)
          .map(s => [s._id, s] as const)
      );

      // Batch review lookups to validate foreign keys
      const reviewIds = page.page
        .filter(f => f.related_type === 'review' && f.related_id)
        .map(f => f.related_id as Id<'advisor_reviews'>);
      const reviews = await Promise.all(reviewIds.map(id => ctx.db.get(id)));
      const reviewMap = new Map(
        reviews
          .filter((r): r is NonNullable<typeof r> => r !== null)
          .map(r => [r._id, r] as const)
      );

      // Pre-fetch already migrated IDs for this batch (same approach as followup_actions)
      const migratedFromThisBatch = await ctx.db
        .query('follow_ups')
        .withIndex('by_migrated_from')
        .filter((q) => q.or(...page.page.map(f => q.eq(q.field('migrated_from_id'), f._id))))
        .collect();
      const alreadyMigratedIds = new Set(migratedFromThisBatch.map(m => m.migrated_from_id));

      for (const followUp of page.page) {
        try {
        // Skip if already migrated (idempotent re-run support for force=true)
        if (alreadyMigratedIds.has(followUp._id)) {
          console.log(`Skipping advisor_follow_ups ${followUp._id} - already migrated`);
          continue;
        }

        // Validate users from batched lookup
        if (!userMap.has(followUp.student_id)) {
          results.errors.push(
            `advisor_follow_ups ${followUp._id}: Student ${followUp.student_id} not found`,
          );
          continue;
        }
        if (!userMap.has(followUp.owner_id)) {
          results.errors.push(
            `advisor_follow_ups ${followUp._id}: Owner ${followUp.owner_id} not found`,
          );
          continue;
        }
        if (!userMap.has(followUp.advisor_id)) {
          results.errors.push(
            `advisor_follow_ups ${followUp._id}: Advisor ${followUp.advisor_id} not found`,
          );
          continue;
        }

        // Map related entities to specific fields with validation
        let application_id: Id<'applications'> | undefined;

        if (followUp.related_type === 'application' && followUp.related_id) {
          const appId = followUp.related_id as Id<'applications'>;
          if (applicationMap.has(appId)) {
            application_id = appId;
          } else {
            results.errors.push(
              `advisor_follow_ups ${followUp._id}: Application ${followUp.related_id} not found`,
            );
            continue;
          }
        }

        // Validate session references
        if (followUp.related_type === 'session' && followUp.related_id) {
          const sessionId = followUp.related_id as Id<'advisor_sessions'>;
          if (!sessionMap.has(sessionId)) {
            results.errors.push(
              `advisor_follow_ups ${followUp._id}: Session ${followUp.related_id} not found`,
            );
            continue;
          }
        }

        // Validate review references
        if (followUp.related_type === 'review' && followUp.related_id) {
          const reviewId = followUp.related_id as Id<'advisor_reviews'>;
          if (!reviewMap.has(reviewId)) {
            results.errors.push(
              `advisor_follow_ups ${followUp._id}: Review ${followUp.related_id} not found`,
            );
            continue;
          }
        }

        // Note: advisor_follow_ups.related_type doesn't include 'contact' type
        // Only 'application', 'session', 'review', 'general'

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
            application_id,
            // Note: contact_id is not used since advisor_follow_ups.related_type doesn't include 'contact'

            // Task management
            due_at: followUp.due_at,
            priority: followUp.priority,
            status: followUp.status,

            // Completion tracking
            completed_at: followUp.completed_at,
            completed_by: followUp.completed_by,

            // Migration tracking for idempotent re-runs
            migrated_from_id: followUp._id,

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

      advisorFollowUpsCursor = page.continueCursor;
      hasMoreAdvisorFollowUps = !page.isDone;
    }

    console.log(`Total advisor_follow_ups migrated: ${results.advisor_follow_ups_migrated}`);

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

    // Update migration state on completion
    if (!dryRun && migrationStateId) {
      if (results.errors.length > 0) {
        await ctx.db.patch(migrationStateId, {
          status: 'failed',
          completed_at: Date.now(),
          error_message: `Migration completed with ${results.errors.length} errors`,
          metadata: {
            followup_actions_migrated: results.followup_actions_migrated,
            advisor_follow_ups_migrated: results.advisor_follow_ups_migrated,
            errors: results.errors,
          },
        });
      } else {
        await ctx.db.patch(migrationStateId, {
          status: 'completed',
          completed_at: Date.now(),
          metadata: {
            followup_actions_migrated: results.followup_actions_migrated,
            advisor_follow_ups_migrated: results.advisor_follow_ups_migrated,
            total_migrated: results.followup_actions_migrated + results.advisor_follow_ups_migrated,
          },
        });
      }
    }

    return results;
  },
});

/**
 * Verification query - comprehensive data integrity checks
 *
 * Validates:
 * - Record counts match expected totals
 * - Sample validation of required fields
 * - Relationship integrity (user_id, university_id references exist)
 * - Dual-field pattern correctness (related_id matches typed IDs)
 * - Status and enum values are valid
 */
export const verifyMigration = internalQuery({
  args: {
    sampleSize: v.optional(v.number()), // Number of records to validate (default: 100)
  },
  handler: async (ctx, args) => {
    const sampleSize = args.sampleSize ?? 100;

    // Count checks using pagination to avoid loading full tables into memory
    const [
      followupActionsCount,
      advisorFollowUpsCount,
      followUpsCount,
    ] = await Promise.all([
      countWithPagination(ctx, 'followup_actions'),
      countWithPagination(ctx, 'advisor_follow_ups'),
      countWithPagination(ctx, 'follow_ups'),
    ]);

    const expected = followupActionsCount + advisorFollowUpsCount;
    const actual = followUpsCount;
    const countMatch = expected === actual;

    // Sample validation
    const sampleFollowUps = await ctx.db.query('follow_ups').take(sampleSize);
    const validationErrors: string[] = [];
    const warnings: string[] = [];

    // Batch fetch all referenced users for relationship validation
    const userIds = [...new Set(sampleFollowUps.map(f => f.user_id))];
    const users = await Promise.all(userIds.map(id => ctx.db.get(id)));
    const userMap = new Map(
      users
        .filter((u): u is NonNullable<typeof u> => u !== null)
        .map(u => [u._id, u] as const)
    );

    // Batch fetch sessions for foreign key validation
    const sessionIds = sampleFollowUps
      .filter(f => f.related_type === 'session' && f.related_id)
      .map(f => f.related_id as Id<'advisor_sessions'>);
    const sessions = await Promise.all(sessionIds.map(id => ctx.db.get(id)));
    const sessionMap = new Map(
      sessions
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .map(s => [s._id, s] as const)
    );

    // Batch fetch reviews for foreign key validation
    const reviewIds = sampleFollowUps
      .filter(f => f.related_type === 'review' && f.related_id)
      .map(f => f.related_id as Id<'advisor_reviews'>);
    const reviews = await Promise.all(reviewIds.map(id => ctx.db.get(id)));
    const reviewMap = new Map(
      reviews
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map(r => [r._id, r] as const)
    );

    // Batch fetch applications for foreign key validation
    const applicationIds = sampleFollowUps
      .filter(f => f.related_type === 'application' && f.related_id)
      .map(f => f.related_id as Id<'applications'>);
    const applications = await Promise.all(applicationIds.map(id => ctx.db.get(id)));
    const applicationMap = new Map(
      applications
        .filter((a): a is NonNullable<typeof a> => a !== null)
        .map(a => [a._id, a] as const)
    );

    // Batch fetch contacts for foreign key validation
    const contactIds = sampleFollowUps
      .filter(f => f.related_type === 'contact' && f.contact_id)
      .map(f => f.contact_id as Id<'networking_contacts'>);
    const contacts = await Promise.all(contactIds.map(id => ctx.db.get(id)));
    const contactMap = new Map(
      contacts
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .map(c => [c._id, c] as const)
    );

    for (const followUp of sampleFollowUps) {
      const id = followUp._id;

      // Required field validation
      if (!followUp.title || followUp.title.trim().length === 0) {
        validationErrors.push(`${id}: Missing or empty title`);
      }
      if (!followUp.user_id) {
        validationErrors.push(`${id}: Missing user_id`);
      }
      if (!followUp.owner_id) {
        validationErrors.push(`${id}: Missing owner_id`);
      }
      if (!followUp.created_by_id) {
        validationErrors.push(`${id}: Missing created_by_id`);
      }
      if (!followUp.created_by_type) {
        validationErrors.push(`${id}: Missing created_by_type`);
      }

      // Enum validation
      if (!['student', 'advisor', 'system'].includes(followUp.created_by_type)) {
        validationErrors.push(`${id}: Invalid created_by_type: ${followUp.created_by_type}`);
      }
      if (!['open', 'done'].includes(followUp.status)) {
        validationErrors.push(`${id}: Invalid status: ${followUp.status}`);
      }
      if (followUp.priority && !['low', 'medium', 'high', 'urgent'].includes(followUp.priority)) {
        validationErrors.push(`${id}: Invalid priority: ${followUp.priority}`);
      }
      if (followUp.related_type && !['application', 'contact', 'session', 'review', 'general'].includes(followUp.related_type)) {
        validationErrors.push(`${id}: Invalid related_type: ${followUp.related_type}`);
      }

      // Relationship integrity
      if (followUp.user_id && !userMap.has(followUp.user_id)) {
        validationErrors.push(`${id}: user_id ${followUp.user_id} does not exist`);
      }

      // University ID validation (advisor-created tasks should have university_id)
      if (followUp.created_by_type === 'advisor' && !followUp.university_id) {
        warnings.push(`${id}: Advisor-created task missing university_id`);
      }

      // Dual-field pattern validation
      if (followUp.related_type === 'application') {
        if (!followUp.application_id) {
          validationErrors.push(`${id}: related_type is 'application' but application_id is missing`);
        }
        if (followUp.related_id !== followUp.application_id) {
          validationErrors.push(`${id}: related_id (${followUp.related_id}) doesn't match application_id (${followUp.application_id})`);
        }
        // Validate foreign key exists
        if (followUp.application_id && !applicationMap.has(followUp.application_id)) {
          validationErrors.push(`${id}: Application ${followUp.application_id} does not exist`);
        }
      }
      if (followUp.related_type === 'contact') {
        if (!followUp.contact_id) {
          validationErrors.push(`${id}: related_type is 'contact' but contact_id is missing`);
        }
        if (followUp.related_id !== followUp.contact_id) {
          validationErrors.push(`${id}: related_id (${followUp.related_id}) doesn't match contact_id (${followUp.contact_id})`);
        }
        // Validate foreign key exists
        if (followUp.contact_id && !contactMap.has(followUp.contact_id)) {
          validationErrors.push(`${id}: Contact ${followUp.contact_id} does not exist`);
        }
      }
      if (followUp.related_type === 'session') {
        if (!followUp.related_id) {
          validationErrors.push(`${id}: related_type is 'session' but related_id is missing`);
        } else if (!sessionMap.has(followUp.related_id as Id<'advisor_sessions'>)) {
          validationErrors.push(`${id}: Session ${followUp.related_id} does not exist`);
        }
      }
      if (followUp.related_type === 'review') {
        if (!followUp.related_id) {
          validationErrors.push(`${id}: related_type is 'review' but related_id is missing`);
        } else if (!reviewMap.has(followUp.related_id as Id<'advisor_reviews'>)) {
          validationErrors.push(`${id}: Review ${followUp.related_id} does not exist`);
        }
      }

      // Completion field consistency
      if (followUp.status === 'done') {
        if (!followUp.completed_by) {
          warnings.push(`${id}: Status is 'done' but completed_by is missing`);
        }
        // Note: completed_at may be missing for records migrated from old table
      }
      if (followUp.status === 'open') {
        if (followUp.completed_at) {
          validationErrors.push(`${id}: Status is 'open' but completed_at is set`);
        }
        if (followUp.completed_by) {
          validationErrors.push(`${id}: Status is 'open' but completed_by is set`);
        }
      }

      // Timestamp validation
      if (!followUp.created_at || followUp.created_at <= 0) {
        validationErrors.push(`${id}: Invalid created_at timestamp`);
      }
      if (!followUp.updated_at || followUp.updated_at <= 0) {
        validationErrors.push(`${id}: Invalid updated_at timestamp`);
      }
    }

    const allValid = countMatch && validationErrors.length === 0;

    return {
      // Count verification
      followup_actions_count: followupActionsCount,
      advisor_follow_ups_count: advisorFollowUpsCount,
      follow_ups_count: followUpsCount,
      expected_total: expected,
      actual_total: actual,
      count_match: countMatch,

      // Sample validation
      sample_size: sampleFollowUps.length,
      validation_errors: validationErrors,
      validation_error_count: validationErrors.length,
      warnings,
      warning_count: warnings.length,

      // Overall status
      status: allValid
        ? '✅ Migration verified - all checks passed'
        : validationErrors.length > 0
          ? '❌ Validation failed - see validation_errors'
          : '⚠️ Count mismatch',
      all_valid: allValid,
    };
  },
});
