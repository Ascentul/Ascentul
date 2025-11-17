# Billable Role Architecture - Implementation Summary

**Date**: 2025-11-16
**Issue**: Staff accounts inflating investor metrics and MRR calculations
**Solution**: Role-based billable user filtering

---

## Problem Statement

Previously, all users (including staff, super admins, and university admins) were counted in:
- Active user metrics
- MRR/ARR calculations
- Growth rates
- Investor reporting

This resulted in **inaccurate investor metrics** because internal accounts were being counted as paying customers.

---

## Solution Overview

Implemented a **role-based billable user filter** that:
1. Defines which roles count as "billable" (real users)
2. Defines which roles are "internal" (staff/admin)
3. Automatically excludes internal roles from all metrics
4. Forces internal roles to `subscription_plan: 'free'`
5. Locks the plan dropdown in admin UI for internal roles

---

## Implementation Details

### 1. Constants Definition

**File**: [`convex/lib/constants.ts`](../convex/lib/constants.ts) (NEW)

```typescript
// Billable roles (count in metrics):
export const BILLABLE_ROLES = [
  'individual',  // Main end users (free → premium)
  'student',     // University students (count toward seats)
]

// Internal roles (full access, NOT counted):
export const INTERNAL_ROLES = [
  'super_admin',      // Platform administrators
  'staff',            // Ascentul staff members
  'university_admin', // University admins (manage students)
  'advisor',          // University advisors
]
```

### 2. Investor Metrics Update

**File**: [`convex/investor_metrics.ts`](../convex/investor_metrics.ts)

**Changes**:
- Line 33: Import `BILLABLE_ROLES`, `INTERNAL_ROLES`, helper functions
- Lines 54-69: Filter users by `isBillableRole()` - excludes test users AND internal roles
- Lines 151-161: Added separate `internal_users` tracking for admin visibility
- Lines 281-289: University metrics only count billable students (not admins/advisors)

**Result**: All investor metrics now only count billable users.

### 3. Analytics Queries Update

**File**: [`convex/analytics.ts`](../convex/analytics.ts)

**Changes**:
- Line 3: Import billable role constants
- Lines 122-127: `getSystemStatsOptimized` - filter by billable roles
- Lines 323-327: `getSubscriptionDistributionOptimized` - filter by billable roles
- Lines 400-404: `getOverviewAnalytics` - filter by billable roles

**Result**: All analytics dashboards show accurate counts.

### 4. Webhook Handler Update

**File**: [`src/app/api/clerk/webhook/route.ts`](../src/app/api/clerk/webhook/route.ts)

**Changes**:
- Line 6: Import `INTERNAL_ROLES`
- Lines 193-198: Force internal roles to `subscription_plan: 'free'`
- Lines 205-223: Only check Clerk Billing for billable roles

**Result**: New staff accounts automatically get 'free' plan, preventing future metric inflation.

### 5. Admin UI Update

**File**: [`src/app/(dashboard)/admin/users/page.tsx`](../src/app/(dashboard)/admin/users/page.tsx)

**Changes**:
- Line 9: Import `INTERNAL_ROLES`
- Lines 168-170: Force internal roles to 'free' when saving
- Lines 539-563: Conditional rendering - show "Internal (Not Billable)" label instead of plan dropdown

**UI Behavior**:
- When editing internal role user → Plan field shows: "Internal (Not Billable)"
- Explanation text displayed based on role
- Plan cannot be changed to premium/university

**Result**: Admins cannot accidentally assign premium plans to staff.

### 6. Documentation Update

**File**: [`CLAUDE.md`](../CLAUDE.md)

**Changes**:
- Lines 136-156: Added comprehensive billable role architecture section
- Documented billable vs internal roles
- Listed all affected files

---

## Migration

### Option 1: Convex Dashboard (Recommended)

**File**: [`convex/migrations/set_internal_roles_to_free.ts`](../convex/migrations/set_internal_roles_to_free.ts)

**Steps**:
1. Go to Convex Dashboard → Functions
2. Find `migrations:setInternalRolesToFree`
3. Click "Run" (no arguments needed)
4. Check logs for results

**What it does**:
- Finds all internal role users
- Sets `subscription_plan: 'free'` if not already
- Returns summary of changes

### Option 2: TypeScript Script

**File**: [`scripts/migrate-internal-roles-to-free.ts`](../scripts/migrate-internal-roles-to-free.ts)

**Steps**:
```bash
npx ts-node scripts/migrate-internal-roles-to-free.ts
```

**What it does**:
- Same as Option 1, but runs locally via Convex HTTP client
- More detailed console output

---

## Validation Checklist

After deploying, verify:

### Metrics Accuracy
- [ ] Run `investor_metrics.getUserMetrics()` - internal roles excluded from all counts
- [ ] Check MRR calculation - should only include billable premium users
- [ ] Verify growth rate - should only track billable user growth
- [ ] Test users still excluded (`is_test_user: true`)

### UI Behavior
- [ ] Edit super_admin user → Plan shows "Internal (Not Billable)"
- [ ] Edit individual user → Plan dropdown works normally
- [ ] Create new staff account → Automatically assigned 'free' plan
- [ ] Webhook creates internal role → Plan set to 'free'

### Data Integrity
- [ ] All existing internal roles have `subscription_plan: 'free'`
- [ ] Premium users still counted correctly
- [ ] University students counted in university seats
- [ ] Staff not counted in any billable metrics

---

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| `convex/lib/constants.ts` | NEW - Define billable/internal roles | All |
| `convex/investor_metrics.ts` | Filter by billable roles | 33, 54-69, 151-161, 281-289 |
| `convex/analytics.ts` | Filter by billable roles | 3, 122-127, 323-327, 400-404 |
| `src/app/api/clerk/webhook/route.ts` | Force internal roles to 'free' | 6, 193-198, 205-223 |
| `src/app/(dashboard)/admin/users/page.tsx` | Lock plan for internal roles | 9, 168-170, 539-563 |
| `CLAUDE.md` | Document architecture | 136-156 |
| `convex/migrations/set_internal_roles_to_free.ts` | NEW - Migration script | All |
| `scripts/migrate-internal-roles-to-free.ts` | NEW - Alt migration | All |

**Total**: 8 files (2 new, 6 modified)

---

## Before vs After

### Before
```typescript
// All users counted
const realUsers = allUsers.filter(u => !u.is_test_user)
// Includes: individual, student, staff, super_admin, university_admin, advisor
```

**Result**: Staff with premium plans inflated MRR by $23.50 each

### After
```typescript
// Only billable users counted
const realUsers = allUsers.filter(u =>
  !u.is_test_user &&
  isBillableRole(u.role)
)
// Includes: individual, student
// Excludes: staff, super_admin, university_admin, advisor
```

**Result**: Accurate investor metrics, staff excluded

---

## Testing Strategy

### Unit Tests (Future)
- Test `isBillableRole()` helper function
- Test `isInternalRole()` helper function
- Mock users with different roles
- Verify metrics calculations

### Manual Testing
1. **Create test staff account**
   - Verify plan auto-set to 'free'
   - Check not in metrics

2. **Edit existing staff**
   - Verify plan locked to "Not Billable"
   - Try to save with premium (should force to free)

3. **Run metrics query**
   - Verify staff not in active_users
   - Verify staff not in MRR
   - Verify internal_users tracked separately

---

## Future Enhancements

1. **Stripe Integration** (when premium users > 500)
   - Replace MRR estimates with actual Stripe data
   - Pull real billing amounts, discounts, prorations
   - Track actual churn, not estimates

2. **Role Migration**
   - Migrate legacy `user` role to `individual`
   - Update all references

3. **Metrics Dashboard**
   - Add investor-specific dashboard
   - Show billable vs internal breakdown
   - Export capabilities for due diligence

4. **Automated Tests**
   - Unit tests for role filtering
   - Integration tests for metrics accuracy
   - E2E tests for admin UI behavior

---

## Support

For questions or issues:
- Check Convex logs for migration results
- Review admin panel for staff account status
- Contact engineering team if metrics still appear inflated

---

## Rollback Plan

If issues occur:

1. **Restore Previous Constants**
   - Temporarily remove role filtering from metrics queries
   - Revert to `!is_test_user` only

2. **Manual Fix**
   - Manually set staff to `is_test_user: true` (quick workaround)
   - Run metrics to verify exclusion

3. **Database Restore**
   - Convex auto-snapshots - can restore if needed
   - Contact Convex support for point-in-time restore
