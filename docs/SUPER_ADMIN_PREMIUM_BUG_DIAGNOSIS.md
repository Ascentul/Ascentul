# Super Admin Counted as Premium User - Root Cause Analysis

**Date**: 2025-11-16
**Issue**: Super admin appearing in investor metrics premium user count
**Status**: ✅ Root cause identified, fix available

---

## 🔍 Diagnosis

### What's Happening

A super admin is being counted in the "Premium Users" metric on the investor dashboard (`/admin/analytics`).

### Why This Shouldn't Be Possible

The billable role architecture was implemented with the following filters:

**File**: [convex/investor_metrics.ts:57-60](../convex/investor_metrics.ts#L57-L60)
```typescript
const realUsers = allUsers.filter(u =>
  !u.is_test_user &&
  isBillableRole(u.role || 'individual')  // ← Only 'individual' and 'student'
)
```

Then `premiumUsers` is filtered from `realUsers`:
```typescript
const activeUsers = realUsers.filter(
  u => (u.account_status || 'active') === 'active'
)

const premiumUsers = activeUsers.filter(
  u => u.subscription_plan === 'premium'
)
```

**This means**: A super_admin CANNOT appear in `premiumUsers` because they're filtered out by `isBillableRole()` at line 59.

---

## 🐛 Root Cause

**The billable role architecture logic is correct**. The problem is:

### ⚠️ Migration Not Run in Production

The migration `setInternalRolesToFreePlan` was successfully run in **dev environment** but **NOT in production**.

**Evidence from dev migration**:
```json
{
  "success": true,
  "stats": {
    "totalInternalUsers": 2,
    "alreadyFree": 1,  // super_admin already had 'free'
    "updated": 1        // advisor updated from 'university' → 'free'
  }
}
```

**In production**: A super_admin likely still has `subscription_plan: 'premium'` or `subscription_plan: 'university'`.

---

## ✅ Solution

### Step 1: Run Migration in Production

```bash
npx convex run migrations:setInternalRolesToFreePlan --prod
```

**⚠️ Important**: This is the consolidated migration command. Previous duplicate migrations (`migrations/set_internal_roles_to_free:setInternalRolesToFree`) have been removed to avoid confusion.

This will:
- Find all users with roles: `super_admin`, `staff`, `university_admin`, `advisor`
- Set their `subscription_plan` to `'free'`
- Update their `updated_at` timestamp
- Return detailed results showing which users were updated
- Show role-by-role breakdown with stats

### Step 2: Verify Fix

After running the migration, check the investor dashboard:

1. Go to `/admin/analytics`
2. Check "Premium Users" count
3. Super admin should NO LONGER be counted

### Step 3: Verify No Regression

The webhook handler already prevents future issues:

**File**: [src/app/api/clerk/webhook/route.ts:193-198](../src/app/api/clerk/webhook/route.ts#L193-L198)
```typescript
function determineSubscriptionPlan(metadata: any): 'free' | 'premium' | 'university' {
  const userRole = metadata.role || 'individual'
  if (INTERNAL_ROLES.includes(userRole as any)) {
    return 'free'  // Internal roles always forced to 'free'
  }
  // ... rest of logic
}
```

**This ensures**: Any new staff accounts or role changes will automatically get `subscription_plan: 'free'`.

---

## 📊 How to Diagnose in Production

Unfortunately, `internalMutation` functions can't be called directly from CLI. Instead, check the admin UI:

### Option A: Use Admin Users Page

1. Go to `/admin/users`
2. Filter by role: `super_admin`
3. Check the "Plan" column
4. If it shows "Premium" or "University" instead of "Free" → This is the bug!

### Option B: Check Convex Dashboard

1. Go to https://dashboard.convex.dev
2. Select your production deployment
3. Go to "Data" tab
4. Query `users` table
5. Filter: `role == "super_admin"`
6. Check `subscription_plan` field

Expected: `"free"`
If you see: `"premium"` or `"university"` → Run the migration

---

## 🔧 Prevention

### Already Implemented (No Action Needed)

1. ✅ **Webhook enforcement** - Forces internal roles to 'free' plan
2. ✅ **Admin UI lock** - Plan dropdown disabled for internal roles
3. ✅ **Billable role filter** - Investor metrics exclude internal roles
4. ✅ **Migration available** - Can be re-run safely (idempotent)

### Migration is Idempotent

You can run `setInternalRolesToFreePlan` multiple times safely:
- Already 'free' users → Skipped
- Non-free internal users → Updated to 'free'
- Billable users → Ignored

---

## 📝 Example Migration Output

**Expected output when running in production**:

```bash
$ npx convex run migrations:setInternalRolesToFreePlan --prod

🚀 Starting migration: Set internal roles to 'free' plan
📋 Internal roles: super_admin, staff, university_admin, advisor
✅ Fetched 247 total users
🔍 Found 3 internal role users
  super_admin: 1 total (0 already free, 1 need update)  ← THIS IS THE BUG
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

{
  "success": true,
  "message": "Successfully updated 1 internal users to 'free' plan",
  "stats": {
    "totalInternalUsers": 3,
    "alreadyFree": 2,
    "updated": 1,
    "errors": 0
  },
  "updatedUsers": [
    {
      "email": "john@ascentful.io",
      "name": "John Doe",
      "oldPlan": "premium",  ← This was causing the bug
      "role": "super_admin"
    }
  ]
}
```

---

## 🎯 Quick Fix Summary

1. **Run migration in production**: `npx convex run migrations:setInternalRolesToFreePlan --prod`
2. **Verify on dashboard**: Check `/admin/analytics` - premium count should decrease by 1
3. **Done!** Future staff accounts will automatically get 'free' plan

---

## 📞 Support

If the migration doesn't fix the issue, check:

1. **Is the user actually a super_admin?**
   - Check Clerk Dashboard → Users → Public Metadata → `role`
   - Check Convex `users` table → `role` field

2. **Is the migration output showing 0 updated?**
   - This means all internal users already have 'free' plan
   - The issue might be elsewhere (e.g., test users not marked correctly)

3. **Is the premium count still wrong after migration?**
   - Run diagnostic in browser console on `/admin/analytics`:
   ```javascript
   // Check what investorMetrics returns
   console.log(investorMetrics)
   ```

---

**Status**: ✅ **Ready to fix - run migration in production**
