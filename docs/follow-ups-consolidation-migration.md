# Follow-Ups Table Consolidation Migration

## Overview

This document describes the consolidation of `followup_actions` and `advisor_follow_ups` into a single unified `follow_ups` table.

## Problem Statement

The codebase had two separate tables for follow-up tasks:

1. **`followup_actions`** - Student self-created tasks
2. **`advisor_follow_ups`** - Advisor-assigned tasks (partially implemented)

This created several issues:
- Data fragmentation across two tables
- Incomplete advisor feature (no mutations implemented)
- Missing multi-tenancy support in `followup_actions`
- Inconsistent semantics (completed boolean vs status enum)
- Code duplication risk

## Solution

Created a unified `follow_ups` table that:
- ✅ Supports both student-created and advisor-created tasks
- ✅ Includes proper multi-tenancy with `university_id`
- ✅ Tracks creation context (`created_by_id`, `created_by_type`)
- ✅ Flexible relationship tracking (`related_type`, `related_id`)
- ✅ Comprehensive audit trail (`completed_at`, `completed_by`)
- ✅ Priority levels for task management

## Schema Changes

### New `follow_ups` Table

```typescript
follow_ups: defineTable({
  // Core fields
  title: v.string(),
  description: v.optional(v.string()),
  type: v.optional(v.string()),
  notes: v.optional(v.string()),

  // Ownership tracking
  user_id: v.id('users'),           // Primary user (student)
  owner_id: v.id('users'),          // Who is responsible
  created_by_id: v.id('users'),     // Who created it
  created_by_type: v.union(
    v.literal('student'),
    v.literal('advisor'),
    v.literal('system')
  ),

  // Multi-tenancy
  university_id: v.optional(v.id('universities')),

  // Relationships
  related_type: v.optional(v.union(
    v.literal('application'),
    v.literal('contact'),
    v.literal('session'),
    v.literal('review'),
    v.literal('general')
  )),
  related_id: v.optional(v.string()),
  application_id: v.optional(v.id('applications')),
  contact_id: v.optional(v.id('networking_contacts')),

  // Task management
  due_at: v.optional(v.number()),
  priority: v.optional(v.union(
    v.literal('low'),
    v.literal('medium'),
    v.literal('high')
  )),
  status: v.union(v.literal('open'), v.literal('done')),

  // Audit trail
  completed_at: v.optional(v.number()),
  completed_by: v.optional(v.id('users')),
  created_at: v.number(),
  updated_at: v.number(),
})
```

### Deprecated Tables

Both `followup_actions` and `advisor_follow_ups` are now marked as DEPRECATED with comments in [schema.ts](../convex/schema.ts).

## Migration

### Running the Migration

```bash
# Dry run first (preview changes without committing)
npx convex run migrate_follow_ups:migrateFollowUps '{"dryRun": true}'

# Execute actual migration
npx convex run migrate_follow_ups:migrateFollowUps '{"dryRun": false}'

# Verify migration counts
npx convex run migrate_follow_ups:verifyMigration
```

### Migration Script

Location: [convex/migrate_follow_ups.ts](../convex/migrate_follow_ups.ts)

The script:
1. Migrates all `followup_actions` records
   - Derives `title` from description (first 100 chars)
   - Maps `completed` boolean → `status` enum
   - Backfills `university_id` from user records
   - Sets `created_by_type: 'student'`
2. Migrates all `advisor_follow_ups` records
   - Preserves all fields with proper mapping
   - Sets `created_by_type: 'advisor'`
3. Provides verification query to compare counts

## Code Changes

### Files Updated

1. **[convex/schema.ts](../convex/schema.ts)**
   - Added new `follow_ups` table
   - Marked old tables as DEPRECATED

2. **[convex/followups.ts](../convex/followups.ts)**
   - Updated all queries to use `follow_ups`
   - Updated mutations with new field structure
   - Added automatic title generation
   - Added completion audit trail logic

3. **[convex/advisor_students.ts](../convex/advisor_students.ts)**
   - Updated caseload query to use `follow_ups`
   - Updated student profile query to use `follow_ups`

4. **[convex/analytics.ts](../convex/analytics.ts)**
   - Updated analytics queries
   - Changed `completed` → `status === 'open'`
   - Changed `completed` && `updated_at` → `status === 'done'` && `completed_at`

5. **[convex/contact_interactions.ts](../convex/contact_interactions.ts)**
   - Updated all contact follow-up queries
   - Updated mutations with new field structure
   - Added completion tracking logic

### API Changes

#### Query Changes

All queries now return follow-ups with the new schema:

```typescript
// Old field: completed (boolean)
// New field: status ('open' | 'done')

// Old field: due_date
// New field: due_at

// New fields available:
- title
- priority
- created_by_id
- created_by_type
- completed_at
- completed_by
```

#### Mutation Changes

**`createFollowup`**:
- Automatically generates `title` from description
- Sets `created_by_type: 'student'`
- Backfills `university_id` from user

**`updateFollowup`**:
- Now accepts `status` instead of `completed`
- Automatically sets `completed_at` and `completed_by` when status changes to 'done'
- Supports new optional fields: `title`, `priority`

## Testing Checklist

After migration, verify:

- [ ] Student-created follow-ups appear in dashboard
- [ ] Application-related follow-ups display correctly
- [ ] Contact follow-ups work as expected
- [ ] Analytics dashboard shows correct pending task counts
- [ ] Completion tracking works (marking tasks as done)
- [ ] Advisor queries return correct follow-up data
- [ ] Multi-tenancy isolation works (university users only see their data)

## Future Work

After successful migration and testing:

1. Remove legacy table references from codebase
2. Drop deprecated tables (`followup_actions`, `advisor_follow_ups`)
3. Implement advisor-created follow-up mutations (now that table exists)
4. Add frontend UI for priority levels
5. Consider adding notifications for due follow-ups

## Rollback Plan

If issues arise:

1. The old tables still exist with all original data
2. Temporarily revert code changes to use old tables
3. Debug issues with new schema
4. Re-run migration after fixes

**Note**: Do NOT drop old tables until migration is fully verified in production.

## Performance Considerations

The new table has additional indexes for efficient queries:

- `by_user` - For student dashboard
- `by_owner_status` - For task management
- `by_university` - For tenant isolation
- `by_application` - For application-related follow-ups
- `by_contact` - For contact follow-ups
- `by_due_at` - For deadline-based queries
- `by_created_by` - For advisor-created task tracking
- `by_user_university` - For combined user + tenant queries
- `by_related_entity` - For flexible relationship queries

## Questions?

Contact the development team or refer to:
- Schema: [convex/schema.ts](../convex/schema.ts)
- Migration script: [convex/migrate_follow_ups.ts](../convex/migrate_follow_ups.ts)
- Updated queries: [convex/followups.ts](../convex/followups.ts)
