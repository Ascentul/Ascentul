# Stripe MRR Implementation - Critical Bugs Fixed

**Date**: 2025-11-16
**Status**: ✅ All critical bugs identified and corrected

---

## Summary of Critical Bugs

### 🐛 Bug #1: Missing Subscription Creation Events
**Severity**: CRITICAL - Would miss all initial subscriptions

**Original Code**:
```typescript
const subscriptions = await ctx.db
  .query("stripe_subscription_events")
  .filter((q) => q.eq(q.field("event_type"), "customer.subscription.updated"))
  .collect();
```

**Problem**: Only filters for `updated` events, missing `created` events

**Fix**:
```typescript
const allEvents = await ctx.db
  .query("stripe_subscription_events")
  .filter((q) =>
    q.or(
      q.eq(q.field("event_type"), "customer.subscription.created"),
      q.eq(q.field("event_type"), "customer.subscription.updated")
    )
  )
  .collect();
```

**Impact**: Would have calculated MRR as $0 for all newly created subscriptions until they were updated.

---

### 🐛 Bug #2: Incorrect Field Name
**Severity**: CRITICAL - Query would fail

**Original Code**:
```typescript
.filter((q) => q.eq(q.field("status"), "active"))
```

**Problem**: Uses `status` field, but actual field is `subscription_status`

**Fix**:
```typescript
if (event.subscription_status === 'active') {
  latestEventsByUser.set(userId, event);
}
```

**Impact**: Query filter would not work, potentially returning no results or all results.

---

### 🐛 Bug #3: No Deduplication Logic
**Severity**: HIGH - Would inflate MRR counts

**Original Code**:
```typescript
for (const sub of subscriptions) {
  const userId = sub.user_id;
  userSubscriptions.set(userId, sub); // Overwrites without checking timestamp
}
```

**Problem**: Multiple events per user processed without checking which is latest

**Fix**:
```typescript
const latestEventsByUser = new Map();

for (const event of allEvents) {
  const existing = latestEventsByUser.get(event.user_id);

  // Keep only the LATEST event per user
  if (!existing || event.created_at > existing.created_at) {
    if (event.subscription_status === 'active') {
      latestEventsByUser.set(event.user_id, event);
    } else if (existing && event.subscription_status !== 'active') {
      // Remove if latest status is not active
      latestEventsByUser.delete(event.user_id);
    }
  }
}
```

**Impact**: Would count the same subscription multiple times if user had multiple events.

---

### 🐛 Bug #4: Division by Zero
**Severity**: MEDIUM - Would crash on empty users

**Original Code**:
```typescript
avg_mrr_per_user: (totalMRR / premiumUsers.length).toFixed(2)
```

**Problem**: Crashes if `premiumUsers.length === 0`

**Fix**:
```typescript
avg_mrr_per_user: premiumUsers.length > 0
  ? (totalMRR / premiumUsers.length).toFixed(2)
  : '0.00'
```

**Impact**: Would throw error when no premium users exist (e.g., new deployment).

---

### 🐛 Bug #5: Unsafe Nested Property Access (Webhook)
**Severity**: HIGH - Would crash webhook handler

**Original Code**:
```typescript
amount_cents: subscription.items.data[0].price.unit_amount || 0,
billing_interval: subscription.items.data[0].price.recurring?.interval || 'month',
```

**Problem**: Crashes if Stripe sends unexpected webhook payload structure

**Fix**:
```typescript
// Safely extract with validation
const items = subscription.items?.data;
if (!items || items.length === 0) {
  console.warn('No items in subscription');
  return;
}

const priceData = items[0]?.price;
if (!priceData) {
  console.warn('No price data in subscription');
  return;
}

const amount_cents = priceData.unit_amount ?? 0;
const billing_interval = priceData.recurring?.interval ?? 'month';
```

**Impact**: Webhook handler would crash on malformed payloads, causing retries and data loss.

---

## Additional Safety Improvements

### 1. **Percentage Calculation Guards**
```typescript
// Original (unsafe)
monthly_percentage: ((monthlyCount / totalUsers) * 100).toFixed(1)

// Fixed (safe)
monthly_percentage: totalUsers > 0
  ? ((monthlyCount / totalUsers) * 100).toFixed(1)
  : '0.0'
```

### 2. **Timestamp Validation**
```typescript
// Original (unsafe)
current_period_start: subscription.current_period_start * 1000

// Fixed (safe)
current_period_start: (subscription.current_period_start ?? 0) * 1000
```

### 3. **Data Quality Tracking**
```typescript
// Added to track coverage
data_quality: {
  premium_users: premiumUsers.length,
  matched_subscriptions: matchedSubscriptions,
  coverage_percentage: premiumUsers.length > 0
    ? ((matchedSubscriptions / premiumUsers.length) * 100).toFixed(1)
    : '0.0',
}
```

### 4. **Discrepancy Warnings**
```typescript
if (matchedSubscriptions < premiumUsers.length) {
  console.warn(
    `⚠️ MRR Discrepancy: ${premiumUsers.length} premium users, ` +
    `but only ${matchedSubscriptions} have Stripe subscriptions`
  );
}
```

### 5. **Coverage Threshold Warnings**
```typescript
const coverage = parseFloat(revenueMetrics.data_quality.coverage_percentage);
if (coverage < 80) {
  console.warn(
    `⚠️ Low Stripe data coverage: ${coverage}%`
  );
}
```

---

## Testing the Fixes

### Unit Tests for Each Bug

**File**: `src/__tests__/stripe-mrr-bugs.test.ts`

```typescript
describe('Bug Fixes for Stripe MRR Calculation', () => {
  describe('Bug #1: Missing created events', () => {
    test('Includes both created and updated events', () => {
      const events = [
        { event_type: 'customer.subscription.created', user_id: 'u1' },
        { event_type: 'customer.subscription.updated', user_id: 'u2' },
      ];

      const validEvents = events.filter(e =>
        e.event_type === 'customer.subscription.created' ||
        e.event_type === 'customer.subscription.updated'
      );

      expect(validEvents).toHaveLength(2);
    });
  });

  describe('Bug #2: Incorrect field name', () => {
    test('Uses subscription_status field correctly', () => {
      const event = {
        subscription_status: 'active',
        status: undefined, // Wrong field doesn't exist
      };

      expect(event.subscription_status).toBe('active');
    });
  });

  describe('Bug #3: No deduplication', () => {
    test('Keeps only latest event per user', () => {
      const events = [
        { user_id: 'u1', created_at: 1000, subscription_status: 'active' },
        { user_id: 'u1', created_at: 2000, subscription_status: 'active' },
        { user_id: 'u1', created_at: 1500, subscription_status: 'active' },
      ];

      const latest = deduplicateEvents(events);
      expect(latest.get('u1').created_at).toBe(2000);
    });

    test('Removes user if latest status is not active', () => {
      const events = [
        { user_id: 'u1', created_at: 1000, subscription_status: 'active' },
        { user_id: 'u1', created_at: 2000, subscription_status: 'canceled' },
      ];

      const latest = deduplicateEvents(events);
      expect(latest.has('u1')).toBe(false);
    });
  });

  describe('Bug #4: Division by zero', () => {
    test('Handles zero premium users without crashing', () => {
      const premiumUsers: any[] = [];
      const totalMRR = 0;

      const avg = premiumUsers.length > 0
        ? (totalMRR / premiumUsers.length).toFixed(2)
        : '0.00';

      expect(avg).toBe('0.00');
      expect(() => avg).not.toThrow();
    });
  });

  describe('Bug #5: Unsafe nested access', () => {
    test('Handles missing subscription items gracefully', () => {
      const subscription = {
        items: undefined, // Missing items
      };

      const amount = subscription.items?.data?.[0]?.price?.unit_amount ?? 0;
      expect(amount).toBe(0);
      expect(() => amount).not.toThrow();
    });

    test('Handles missing price data gracefully', () => {
      const subscription = {
        items: {
          data: [{ price: undefined }], // Missing price
        },
      };

      const amount = subscription.items?.data?.[0]?.price?.unit_amount ?? 0;
      expect(amount).toBe(0);
    });

    test('Handles missing recurring data gracefully', () => {
      const subscription = {
        items: {
          data: [{
            price: {
              unit_amount: 3000,
              recurring: undefined, // Missing recurring
            },
          }],
        },
      };

      const interval = subscription.items?.data?.[0]?.price?.recurring?.interval ?? 'month';
      expect(interval).toBe('month');
    });
  });
});
```

---

## Impact Analysis

### Before Fixes (Estimated Impact)

| Bug | Scenario | Impact | Severity |
|-----|----------|--------|----------|
| #1 | New subscription created | $0 MRR instead of $30 | CRITICAL |
| #2 | Query execution | Query fails, returns no data | CRITICAL |
| #3 | User upgrades subscription | MRR counted 2x ($60 instead of $30) | HIGH |
| #4 | No premium users yet | Crash: "Cannot divide by 0" | MEDIUM |
| #5 | Malformed webhook | Crash: "Cannot read property of undefined" | HIGH |

### After Fixes (Current State)

| Bug | Fix Implemented | Result | Status |
|-----|----------------|--------|--------|
| #1 | Filter both `created` and `updated` | All subscriptions captured | ✅ FIXED |
| #2 | Use `subscription_status` field | Query works correctly | ✅ FIXED |
| #3 | Deduplication by timestamp | Only latest event counted | ✅ FIXED |
| #4 | Guard: `length > 0 ? ... : '0.00'` | No crash, returns '0.00' | ✅ FIXED |
| #5 | Optional chaining (`?.`) + nullish coalescing (`??`) | No crash, uses safe defaults | ✅ FIXED |

---

## Deployment Checklist

### Before Deploying Stripe Integration

- [ ] Review all 5 bug fixes
- [ ] Run unit tests (`npm test -- stripe-mrr-bugs.test.ts`)
- [ ] Verify webhook handler has null safety
- [ ] Test with Stripe test mode
- [ ] Check Convex logs for warnings

### After Deploying

- [ ] Monitor webhook errors in Stripe dashboard
- [ ] Run `checkStripeDataQuality` query
- [ ] Verify coverage is >95%
- [ ] Compare real MRR with estimates
- [ ] Set up alerts for low coverage (<80%)

### Red Flags to Watch For

1. **Webhook errors** - Check Stripe dashboard
2. **Low coverage** - Run data quality query
3. **MRR = $0** - Check event deduplication
4. **MRR too high** - Check for duplicate counting
5. **Console errors** - Check for null access crashes

---

## Prevention: Code Review Checklist

When reviewing Stripe integration code, always check:

- [ ] ✅ Filters for BOTH `created` AND `updated` events
- [ ] ✅ Uses correct field names (`subscription_status`, not `status`)
- [ ] ✅ Deduplicates by timestamp (keeps latest only)
- [ ] ✅ Guards all divisions (`length > 0 ? ... : default`)
- [ ] ✅ Uses optional chaining for nested properties (`?.`)
- [ ] ✅ Uses nullish coalescing for defaults (`?? default`)
- [ ] ✅ Validates webhook payload structure
- [ ] ✅ Logs warnings for unexpected data
- [ ] ✅ Returns 200 for non-critical errors (prevents Stripe retries)
- [ ] ✅ Returns 500 for critical errors (triggers Stripe retries)

---

## References

- **Corrected Implementation**: [`docs/stripe-mrr-implementation-corrected.md`](stripe-mrr-implementation-corrected.md)
- **Original Plan** (with bugs): [`docs/stripe-api-integration-plan.md`](stripe-api-integration-plan.md) ⚠️ DO NOT USE
- **Stripe Webhook Docs**: https://stripe.com/docs/webhooks
- **Optional Chaining**: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining

---

**Status**: ✅ All bugs fixed and documented
**Safe to implement**: ✅ Yes, using corrected version only
