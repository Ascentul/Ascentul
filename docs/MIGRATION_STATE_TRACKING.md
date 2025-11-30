# Migration State Tracking System

**Date**: 2025-11-16
**Issue**: Weak idempotency check could miss partial migrations
**Status**: ✅ Implemented

---

## 🎯 Problem Statement

### Original Idempotency Check (Weak)

```typescript
// ❌ WEAK - Only checks if table is empty
if (!dryRun && !force) {
  const existingFollowUps = await ctx.db.query('follow_ups').first();
  if (existingFollowUps) {
    throw new Error('Migration may have already been run');
  }
}
```

**Problems**:
1. **Partial migrations undetected**: If migration fails halfway, table isn't empty but migration is incomplete
2. **No state tracking**: Can't tell if migration is running, completed, or failed
3. **No metadata**: Don't know when migration ran, who ran it, or what was migrated
4. **Race conditions**: Multiple migrations could run simultaneously
5. **No recovery path**: If migration fails, no record of what went wrong

### Example Failure Scenario

```
1. Migration starts
2. Migrates 50% of followup_actions successfully
3. Database connection drops
4. Migration fails and exits
5. Table has 50% of records (not empty!)
6. Idempotency check passes (table not empty)
7. Re-run migration → silently skipped
8. Data is incomplete but no one knows!
```

---

## ✅ Solution: Migration State Table

### Schema

```typescript
migration_state: defineTable({
  migration_name: v.string(), // Unique identifier (e.g., "migrate_follow_ups_v1")
  status: v.union(
    v.literal("pending"),      // Migration queued but not started
    v.literal("in_progress"),  // Currently running
    v.literal("completed"),    // Successfully completed
    v.literal("failed"),       // Failed with errors
    v.literal("rolled_back")   // Rolled back due to errors
  ),
  started_at: v.number(),
  completed_at: v.optional(v.number()),
  error_message: v.optional(v.string()),
  metadata: v.optional(v.any()), // Migration-specific data
  executed_by: v.optional(v.string()), // Who/what triggered the migration
})
  .index("by_name", ["migration_name"])
  .index("by_status", ["status"])
  .index("by_started_at", ["started_at"])
```

---

## 🔧 Enhanced Idempotency Check

### Multi-Layer Validation

```typescript
// 1. Check migration_state table
const existingMigration = await ctx.db
  .query('migration_state')
  .withIndex('by_name', (q) => q.eq('migration_name', MIGRATION_NAME))
  .first();

if (existingMigration) {
  // Already completed
  if (existingMigration.status === 'completed') {
    throw new Error('Migration already completed');
  }

  // Currently running (prevent concurrent runs)
  if (existingMigration.status === 'in_progress') {
    throw new Error('Migration is currently in progress');
  }

  // Previous failure (require manual intervention)
  if (existingMigration.status === 'failed') {
    throw new Error('Migration previously failed - fix and retry with force=true');
  }
}

// 2. Count records to detect partial migrations
const followUpsCount = await countWithPagination(ctx, 'follow_ups');
const followupActionsCount = await countWithPagination(ctx, 'followup_actions');
const advisorFollowUpsCount = await countWithPagination(ctx, 'advisor_follow_ups');
const expectedCount = followupActionsCount + advisorFollowUpsCount;

// Detect partial migration
if (followUpsCount > 0 && followUpsCount !== expectedCount) {
  throw new Error(
    `Partial migration detected! follow_ups has ${followUpsCount} records ` +
    `but expected ${expectedCount}. Verify data integrity before using force=true.`
  );
}
```

---

## 📊 Migration Lifecycle

### State Transitions

```
┌─────────┐
│ (queue) │ ◄── Migration registered/scheduled
└────┬────┘
     │
     ▼
┌─────────┐
│ pending │ ◄── Waiting to run (optional: for queued/scheduled migrations)
└────┬────┘
     │
     ▼
┌────────────────┐
│  in_progress   │ ◄── Migration actively running
└────┬───────┬───┘
     │       │
     │       ├──► [error] ──► ┌─────────┐
     │       │                │ failed  │
     │       │                └─────────┘
     │       │
     │       └──► [rollback] ─► ┌──────────────┐
     │                          │ rolled_back  │
     │                          └──────────────┘
     │
     ▼
┌───────────┐
│ completed │ ◄── Success!
└───────────┘
```

**When to use "pending":**
- Queued migrations waiting for a scheduled time
- Migrations waiting for dependencies to complete
- Batch migrations where multiple are registered but run sequentially

**Immediate execution (skip "pending"):**
For simple migrations that run immediately, you can skip the "pending" state and start directly with "in_progress".

### Record Creation (Start)

**Option 1: Immediate execution (skip pending)**
```typescript
const migrationStateId = await ctx.db.insert('migration_state', {
  migration_name: 'migrate_follow_ups_v1',
  status: 'in_progress',
  started_at: Date.now(),
  executed_by: 'manual', // or get from auth context
});
```

**Option 2: Queued execution (use pending first)**
```typescript
// Step 1: Queue the migration
const migrationStateId = await ctx.db.insert('migration_state', {
  migration_name: 'migrate_follow_ups_v1',
  status: 'pending',
  started_at: Date.now(),
  executed_by: 'scheduler',
});

// Step 2: When ready to execute, transition to in_progress
await ctx.db.patch(migrationStateId, {
  status: 'in_progress',
});
```

### Record Update (Completion)

```typescript
// Success
await ctx.db.patch(migrationStateId, {
  status: 'completed',
  completed_at: Date.now(),
  metadata: {
    followup_actions_migrated: 150,
    advisor_follow_ups_migrated: 75,
    total_migrated: 225,
  },
});

// Failure
await ctx.db.patch(migrationStateId, {
  status: 'failed',
  completed_at: Date.now(),
  error_message: 'Migration completed with 3 errors',
  metadata: {
    followup_actions_migrated: 150,
    advisor_follow_ups_migrated: 72, // Incomplete!
    errors: ['Error 1', 'Error 2', 'Error 3'],
  },
});
```

---

## 🛡️ Safety Features

### 1. Concurrent Run Prevention

```typescript
if (existingMigration.status === 'in_progress') {
  const elapsed = Date.now() - existingMigration.started_at;
  const elapsedMinutes = Math.floor(elapsed / 60000);
  throw new Error(
    `Migration is currently in progress (started ${elapsedMinutes} minutes ago). ` +
    'If it is stuck, use force=true to override.'
  );
}
```

### 2. Partial Migration Detection

```typescript
if (followUpsCount > 0 && followUpsCount !== expectedCount) {
  throw new Error(
    `Partial migration detected! ` +
    `follow_ups has ${followUpsCount} records but expected ${expectedCount}. ` +
    'This indicates a previous migration may have partially completed.'
  );
}
```

### 3. Detailed Error Context

```typescript
// Migration state includes full context
{
  status: 'failed',
  error_message: 'Database timeout after 150 records',
  metadata: {
    records_processed: 150,
    records_expected: 225,
    last_processed_id: 'abc123',
    errors: ['Timeout on batch 3', 'Connection lost']
  }
}
```

---

## 📝 Usage Examples

### Check Migration Status

```typescript
// Query migration history
const migrations = await ctx.db
  .query('migration_state')
  .withIndex('by_started_at')
  .order('desc')
  .take(10);

migrations.forEach(m => {
  console.log(`${m.migration_name}: ${m.status}`);
  if (m.metadata) {
    console.log(`  Migrated: ${JSON.stringify(m.metadata)}`);
  }
});
```

### Retry Failed Migration

```bash
# 1. Check what failed
npx convex run migrations:getMigrationStatus '{"migrationName": "migrate_follow_ups_v1"}'

# 2. Fix the issue in code

# 3. Retry with force
npx convex run migrate_follow_ups:migrateFollowUps '{"force": true}'
```

### Rollback (if needed)

```typescript
// Mark as rolled back (manual cleanup required)
await ctx.db.patch(migrationStateId, {
  status: 'rolled_back',
  completed_at: Date.now(),
  error_message: 'Manually rolled back due to data issues',
});
```

---

## 🎯 Benefits

| Feature | Before (Empty Check) | After (State Tracking) |
|---------|---------------------|------------------------|
| Detects partial migrations | ❌ No | ✅ Yes (count comparison) |
| Prevents concurrent runs | ❌ No | ✅ Yes (in_progress status) |
| Tracks failure reason | ❌ No | ✅ Yes (error_message field) |
| Records migration metadata | ❌ No | ✅ Yes (metadata field) |
| Audit trail | ❌ No | ✅ Yes (full history) |
| Recovery guidance | ❌ Generic error | ✅ Specific instructions |

---

## 🔍 Monitoring & Debugging

### Query All Migrations

```typescript
export const getAllMigrations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('migration_state')
      .withIndex('by_started_at')
      .order('desc')
      .collect();
  },
});
```

### Check Specific Migration

```typescript
export const getMigrationStatus = query({
  args: { migrationName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('migration_state')
      .withIndex('by_name', (q) => q.eq('migration_name', args.migrationName))
      .first();
  },
});
```

### Find Failed Migrations

```typescript
export const getFailedMigrations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('migration_state')
      .withIndex('by_status', (q) => q.eq('status', 'failed'))
      .collect();
  },
});
```

---

## 📦 Files Changed

- ✅ `convex/schema.ts`:
  - Added `migration_state` table with indexes
  - Fixed duplicate `user_agent` field in `audit_logs`
- ✅ `convex/migrate_follow_ups.ts`:
  - Enhanced idempotency check with state tracking
  - Added partial migration detection
  - Record migration start/completion states
  - Store metadata for audit trail

---

## 🚀 Future Enhancements

### 1. Migration Manager

```typescript
// Centralized migration management
export const runMigration = mutation({
  args: {
    migrationName: v.string(),
    migrationFn: v.any(), // Function reference
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Generic migration wrapper with state tracking
    // All migrations use same idempotency logic
  },
});
```

### 2. Automatic Rollback

```typescript
// Transaction-like migration support
try {
  await runMigration();
} catch (error) {
  await rollbackMigration(); // Undo changes
  await recordFailure(error);
}
```

### 3. Migration Dependencies

```typescript
migration_state: defineTable({
  // ...
  depends_on: v.optional(v.array(v.string())), // Required migrations
  blocks: v.optional(v.array(v.string())),     // Blocked migrations
})
```

---

## ⚠️ Best Practices

### 1. Always Use Unique Migration Names

```typescript
// ✅ GOOD - Versioned
const MIGRATION_NAME = 'migrate_follow_ups_v1';

// ❌ BAD - Not unique
const MIGRATION_NAME = 'migrate_follow_ups';
```

### 2. Include Metadata

```typescript
// ✅ GOOD - Rich metadata
metadata: {
  source_tables: ['followup_actions', 'advisor_follow_ups'],
  target_table: 'follow_ups',
  records_migrated: 225,
  started_at_count: { followup_actions: 150, advisor_follow_ups: 75 },
  ended_at_count: { follow_ups: 225 },
}

// ❌ BAD - No context
metadata: { count: 225 }
```

### 3. Handle Errors Gracefully

```typescript
// ✅ GOOD - Detailed error tracking
try {
  await migrateBatch();
} catch (error) {
  results.errors.push(`Batch failed: ${error.message}`);
  // Continue with next batch
}

// ❌ BAD - Fail entirely
await migrateBatch(); // Throws and stops everything
```

---

**Status**: ✅ **Production-ready migration state tracking system**
