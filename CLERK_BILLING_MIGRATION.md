# Clerk Billing Migration Guide

## Overview
This document tracks the migration from Stripe Payment Links + Convex subscriptions to Clerk Billing.

## Completed ✅

### Phase 1: Core Infrastructure
- ✅ Created `useSubscription()` hook (`src/hooks/useSubscription.ts`)
- ✅ Created server-side helpers (`src/lib/subscription-server.ts`)
- ✅ Updated `ClerkAuthProvider` to:
  - Remove `subscription_plan` and `subscription_status` from UserProfile
  - Add `subscription` and `hasPremium` to context
  - Use `useSubscription()` hook
- ✅ Rewrote `OnboardingFlow` to use Clerk's `<PricingTable />` component
  - Removed custom plan selection UI
  - Removed payment verification polling
  - Auto-advances when subscription detected

### Phase 2: Feature Gating (80% Complete)
- ✅ Updated `/applications/page.tsx`
- ✅ Updated `/goals/page.tsx`
- ✅ Updated `/projects/page.tsx`
- ✅ Updated `/contacts/page.tsx`
- ✅ Updated `/career-path/page.tsx`
- ✅ Updated `/career-profile/page.tsx` (also updated subscription display)
- ✅ Updated `/dashboard/page.tsx`
- ✅ Updated `/university/analytics/page.tsx`
- ✅ Updated `/university/courses/[id]/page.tsx`

## Remaining Work 🔄

### University Admin Pages (7 files)

**Pattern for university pages:**
```typescript
// OLD:
const { user, isAdmin } = useAuth()
const canAccess = !!user && (isAdmin || user.subscription_plan === 'university' || user.role === 'university_admin')

// NEW:
const { user, isAdmin, subscription } = useAuth()
const canAccess = !!user && (isAdmin || subscription.isUniversity || user.role === 'university_admin')
```

**Files needing updates:**
- `src/app/(dashboard)/university/courses/page.tsx`
- `src/app/(dashboard)/university/departments/page.tsx`
- `src/app/(dashboard)/university/invite/page.tsx`
- `src/app/(dashboard)/university/page.tsx`
- `src/app/(dashboard)/university/progress/page.tsx`
- `src/app/(dashboard)/university/settings/page.tsx`
- `src/app/(dashboard)/university/students/page.tsx`

### Admin Pages

**Files:**
- `src/app/(dashboard)/admin/page.tsx`
- `src/app/(dashboard)/admin/users/page.tsx`
- `src/app/(dashboard)/admin/universities/[id]/page.tsx`

### Components

**Files:**
- `src/components/Header.tsx`
- `src/components/Sidebar.tsx`

### Convex Functions Update

**Files to update:**
- `convex/goals.ts`
- `convex/projects.ts`
- `convex/contacts.ts`
- `convex/applications.ts`
- `convex/career_paths.ts`

**Pattern for Convex:**
```typescript
// Instead of checking user.subscription_plan in Convex,
// pass hasPremium from client or use Clerk's API in actions
```

### API Routes Update

**Files:**
- `src/app/api/career-path/generate-from-job/route.ts`
- `src/app/api/career-paths/generate/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/university/export-data/route.ts`

**Pattern for API Routes:**
```typescript
import { checkPremiumAccess } from '@/lib/subscription-server'

export async function POST(request: Request) {
  const hasPremium = await checkPremiumAccess()
  if (!hasPremium) {
    return new Response('Premium required', { status: 403 })
  }
  // ...
}
```

### Stripe Webhook Cleanup

File: `src/app/api/stripe/webhook/route.ts`

**Changes needed:**
1. Remove `checkout.session.completed` handler (Clerk handles this)
2. Remove `customer.subscription.created/updated/deleted` handlers
3. Keep only payment tracking for analytics (optional)
4. Or remove the entire webhook if not needed for analytics

### Convex Schema Update

File: `convex/schema.ts`

**Changes needed:**
```typescript
// Mark as deprecated but don't remove (for historical data)
subscription_plan: v.optional(v.union(...)), // DEPRECATED - use Clerk Billing
subscription_status: v.optional(v.union(...)), // DEPRECATED - use Clerk Billing

// Keep these for Stripe linkage:
stripe_customer_id: v.optional(v.string()),
stripe_subscription_id: v.optional(v.string()),
```

### Environment Variables Cleanup

**Remove from .env.local:**
```
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY
NEXT_PUBLIC_STRIPE_PAYMENT_LINK_ANNUAL
STRIPE_WEBHOOK_SECRET (if removing webhook)
```

**Keep:**
```
STRIPE_SECRET_KEY (Clerk uses this)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
```

## Clerk Dashboard Setup Required

### Before Deploying:

1. **Enable Billing**
   - Go to Clerk Dashboard → Billing Settings
   - Click "Finish setup"
   - Connect your Stripe account

2. **Create Plans**
   - Go to Plans page → "Plans for Users"
   - Create plan: `premium_monthly`
     - Name: Premium Monthly
     - Price: $9.99/month
   - Create plan: `premium_annual`
     - Name: Premium Annual
     - Price: $99/year

3. **Test with Development Gateway**
   - Use Clerk's test Stripe account for development
   - Test payment flow with test credit cards

4. **Migrate Existing Customers**
   - Existing Stripe customers should automatically link
   - Verify in Clerk Dashboard under Users → Billing

## Testing Checklist

- [ ] New user signup → see pricing table
- [ ] Subscribe to monthly → redirected back → premium features unlocked
- [ ] Subscribe to annual → redirected back → premium features unlocked
- [ ] Free plan → upgrade prompts show correctly
- [ ] Existing premium user → features still work
- [ ] University users → skip plan selection
- [ ] Server-side feature gating works
- [ ] API routes check premium correctly

## Rollback Plan

If needed, revert these commits and:
1. Re-enable Stripe Payment Links in .env
2. Restore old OnboardingFlow component
3. Restore subscription checks in ClerkAuthProvider
4. Disable Clerk Billing in dashboard

## Notes

- Clerk Billing is in Beta - APIs may change
- Clerk adds 0.7% transaction fee + Stripe fees
- All payment data stays in Stripe
- User auth data stays in Clerk
- Convex keeps profile/app data only
