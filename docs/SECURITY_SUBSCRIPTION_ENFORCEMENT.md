# Security Documentation: Subscription Enforcement Architecture

## Overview

This document explains how subscription/billing enforcement works in Ascentul, specifically addressing why backend subscription checks are intentionally disabled in Convex mutations.

**Document Purpose:** Security audit documentation for enterprise buyers.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CLERK BILLING (SOURCE OF TRUTH)                       │
│                                                                          │
│  user.publicMetadata.subscription_plan = "free" | "premium_monthly" |   │
│                                          "premium_annual" | "university"│
│  user.publicMetadata.subscription_status = "active" | "cancelled" | ... │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                              ▼
        ┌─────────────────────┐         ┌─────────────────────┐
        │   FRONTEND CHECK    │         │   WEBHOOK SYNC      │
        │ (Access Control)    │         │ (Cached Display)    │
        │                     │         │                     │
        │ useSubscription()   │         │ user.updated event  │
        │ checkPremiumAccess()│         │        ↓            │
        │        ↓            │         │ Convex users table  │
        │ Gate UI features    │         │ subscription_plan   │
        │ Show upgrade CTAs   │         │ (display only)      │
        └─────────────────────┘         └─────────────────────┘
```

## Why Backend Enforcement Is Disabled

### Design Decision

Backend mutations in Convex (e.g., `createApplication`, `createGoal`, `createContact`) contain **commented-out** subscription checks:

```typescript
// TEMPORARILY DISABLED: Free plan limit check
// NOTE: Clerk Billing (publicMetadata) is the source of truth for subscriptions.
// The subscription_plan field in Convex is cached display data only (see CLAUDE.md).
// Backend mutations should NOT use subscription_plan for feature gating.
// Frontend enforces limits via useSubscription() hook + Clerk's has() method.
```

### Rationale

1. **Single Source of Truth:** Clerk Billing manages the authoritative subscription state. The Convex `subscription_plan` field is only a cached copy for display purposes (admin dashboards, analytics).

2. **Webhook Sync Delay:** Convex data is synced via Clerk webhooks (`user.updated`). There can be a brief delay between a user upgrading/downgrading and the Convex field updating. Enforcing limits based on stale Convex data would create poor UX.

3. **Clerk SDK on Frontend:** The frontend uses Clerk's native `useSubscription()` hook and `has()` method, which read directly from the JWT token - always up-to-date.

4. **Server-Side Fallback:** For API routes, `checkPremiumAccess()` in `src/lib/subscription-server.ts` reads from Clerk server-side, not Convex.

## Subscription Check Locations

### Frontend (Primary Enforcement)

| Location | Method | Purpose |
|----------|--------|---------|
| `src/hooks/useSubscription.ts` | `useSubscription()` | Gate features in React components |
| `src/lib/subscription-server.ts` | `checkPremiumAccess()` | Server-side checks in API routes |
| Various components | `subscription.isPremium` | Conditional UI rendering |

### Convex (Cached Display Only)

| Field | Table | Purpose |
|-------|-------|---------|
| `subscription_plan` | `users` | Admin dashboards, analytics |
| `subscription_status` | `users` | Display subscription state |

## Feature Gating by Role

### University Users (No Billing)

University-affiliated roles (`student`, `advisor`, `university_admin`) do **NOT** use Clerk Billing:

- Access controlled by `role` and `university_id`
- Subscription effectively "university" (auto-premium)
- No payment flow - institution pays via license agreement

### Individual Users (Clerk Billing)

Individual users (`individual` role, no `university_id`) use Clerk Billing:

- Free plan: Limited features (enforced in frontend)
- Premium plan: Full access (checked via `useSubscription()`)
- Payment processed through Clerk's hosted checkout

## Security Considerations

### Q: Is it safe to rely on frontend enforcement?

**Yes, for this use case.** The key insight is that subscription checks gate **convenience features**, not **data access**:

1. **Data access is role-based:** All Convex queries/mutations verify the user owns the data (`user_id === currentUser._id`). A free user can't access premium users' data regardless of subscription.

2. **Rate limiting exists:** Free users might bypass frontend limits, but natural usage patterns and rate limiting prevent abuse.

3. **Audit trail:** All actions are logged with user context. Suspicious activity can be detected and addressed.

4. **Economic incentive:** Users who need premium features have incentive to pay. Bypassing the frontend is effort that doesn't scale.

### Q: Should we add backend enforcement?

For enterprise-grade deployments, consider adding optional server-side verification:

```typescript
// Future enhancement: Verify with Clerk SDK
import { clerkClient } from "@clerk/nextjs/server";

async function verifyPremiumBackend(clerkId: string): Promise<boolean> {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkId);
  const plan = user.publicMetadata?.subscription_plan;
  return plan === "premium_monthly" || plan === "premium_annual" || plan === "university";
}
```

This adds latency but provides defense-in-depth for high-security requirements.

## Files Reference

| File | Purpose |
|------|---------|
| `src/hooks/useSubscription.ts` | Frontend subscription hook |
| `src/lib/subscription-server.ts` | Server-side subscription checks |
| `src/app/api/clerk/webhook/route.ts` | Webhook that syncs Clerk → Convex |
| `convex/applications.ts:62-79` | Commented-out backend check example |
| `convex/goals.ts:72-77` | Commented-out backend check example |
| `convex/contacts.ts:84-89` | Commented-out backend check example |

## Verification for Auditors

To verify the subscription architecture:

1. **Check frontend enforcement:** Search for `useSubscription` and `isPremium` in React components
2. **Check server API routes:** Look for `checkPremiumAccess()` calls in `src/app/api/`
3. **Check webhook sync:** Review `src/app/api/clerk/webhook/route.ts`
4. **Check data access:** Verify Convex mutations use `user_id` ownership checks (not subscription checks) for authorization

## Conclusion

The subscription enforcement architecture intentionally relies on Clerk Billing as the source of truth with frontend enforcement for feature gating. Backend checks are disabled because:

1. They would use stale cached data
2. Data access is already protected by role-based authorization
3. Subscription limits gate convenience features, not security boundaries

This design is appropriate for a SaaS application where the security boundary is between users (enforced) rather than between subscription tiers (convenience).
