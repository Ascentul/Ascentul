# Migration Consolidation - Internal Roles to Free Plan

**Date**: 2025-11-16
**Status**: ✅ Completed
**Issue**: Duplicate migration functions causing confusion

---

## 🔄 What Changed

### Before (3 duplicate functions)

1. **`convex/migrations.ts`** → `setInternalRolesToFreePlan`
   - CLI callable: `npx convex run migrations:setInternalRolesToFreePlan`
   - Most comprehensive (role breakdown, detailed stats)

2. **`convex/migrations/set_internal_roles_to_free.ts`** → `setInternalRolesToFree` ❌ **REMOVED**
   - Dashboard callable: `migrations/set_internal_roles_to_free:setInternalRolesToFree`
   - Simpler version, less detailed output
   - **Duplicate logic - removed to avoid confusion**

3. **`convex/migrations.ts`** → `findMisconfiguredInternalUsers`
   - Diagnostic tool (doesn't modify data)
   - Kept for troubleshooting

### After (2 functions with clear purposes)

1. **`migrations:setInternalRolesToFreePlan`** ← **Use this for migration**
   - Comprehensive migration with detailed reporting
   - Role-by-role breakdown
   - Error tracking
   - Safe to run multiple times (idempotent)

2. **`migrations:findMisconfiguredInternalUsers`** ← **Use this for diagnosis**
   - Read-only diagnostic
   - Shows role/plan breakdown
   - Identifies misconfigured users
   - Doesn't modify data

---

## ✅ Benefits of Consolidation

### 1. Single Source of Truth
- One migration command to remember
- No confusion about which version to use
- Consistent behavior across dev and prod

### 2. Better Reporting
The consolidated version includes:
- Role-by-role statistics
- Detailed error tracking
- Updated user list with old/new plans
- Clear success/failure messaging

### 3. Safer Operations
- Idempotent (safe to run multiple times)
- Updates `updated_at` timestamp for audit trail
- Comprehensive logging
- Graceful error handling

---

## 🚀 How to Use

### Running the Migration

**Dev environment:**
```bash
npx convex run migrations:setInternalRolesToFreePlan
```

**Production environment:**
```bash
npx convex run migrations:setInternalRolesToFreePlan --prod
```

### Diagnostic Check (Optional)

To see current state without making changes:
```bash
npx convex run migrations:findMisconfiguredInternalUsers
```

**Note**: This is an `internalMutation` so it won't appear in the available functions list, but it will still run and log output to the console.

---

## 📊 Expected Output

```bash
🚀 Starting migration: Set internal roles to 'free' plan
📋 Internal roles: super_admin, staff, university_admin, advisor
✅ Fetched 247 total users
🔍 Found 3 internal role users
  super_admin: 1 total (0 already free, 1 need update)
  staff: 0 total (0 already free, 0 need update)
  university_admin: 1 total (1 already free, 0 need update)
  advisor: 1 total (1 already free, 0 need update)
🔄 Updating 1 users to 'free' plan...
  ⏳ Updating John Doe (john@ascentful.io) - Role: super_admin, Current plan: premium
  ✅ Updated successfully
═══════════════════════════════════════════════════
📊 Migration Summary:
  ✅ Successfully updated: 1 users
  ❌ Failed: 0 users
  📈 Total processed: 1 users
═══════════════════════════════════════════════════
```

---

## 🔒 Safety Features

### Idempotent Operation
- Running multiple times is safe
- Already-free users are skipped
- Only updates users that need it

### Audit Trail
- Updates `updated_at` field
- Logs all changes to console
- Returns detailed list of updated users

### Error Handling
- Individual user failures don't stop migration
- Errors collected and reported separately
- Migration continues even if one user fails

---

## 📝 Files Modified

### Deleted
- ❌ `convex/migrations/set_internal_roles_to_free.ts` (duplicate removed)

### Updated
- ✅ `convex/migrations.ts` (kept comprehensive version)
- ✅ `docs/SUPER_ADMIN_PREMIUM_BUG_DIAGNOSIS.md` (updated command reference)
- ✅ `docs/MIGRATION_CONSOLIDATION.md` (this document)

---

## 🎯 Related Documentation

- **Bug Diagnosis**: [SUPER_ADMIN_PREMIUM_BUG_DIAGNOSIS.md](SUPER_ADMIN_PREMIUM_BUG_DIAGNOSIS.md)
- **Implementation Summary**: [IMPLEMENTATION_COMPLETE.md](../IMPLEMENTATION_COMPLETE.md)
- **Billable Role Architecture**: [billable-role-architecture.md](billable-role-architecture.md)

---

## ⚠️ Important Notes

1. **Only one migration needed**: Don't look for `migrations/set_internal_roles_to_free:setInternalRolesToFree` - it's been removed

2. **Use the correct command**:
   ```bash
   npx convex run migrations:setInternalRolesToFreePlan --prod
   ```

3. **Diagnostic is separate**: `findMisconfiguredInternalUsers` is for checking state, not for migration

4. **Safe to re-run**: The migration is idempotent and won't cause issues if run multiple times

---

**Status**: ✅ **Consolidation complete - ready for production use**
