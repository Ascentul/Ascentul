# Stripe API Integration Plan for Real MRR Data

**Current Status**: Using weighted average estimates ($23.50/user)
**Recommended Implementation**: When premium users > 500
**Priority**: Medium (implement before Series A fundraising)

---

## Current Limitations

### Estimated MRR Calculation
[`convex/investor_metrics.ts`](../convex/investor_metrics.ts) lines 103-123:

```typescript
// Current approach: Weighted average estimate
const monthlyRate = 30    // $30/month
const annualRate = 20     // $240/year = $20/month effective
const annualBillingPercentage = 0.65  // Assumption: 65% choose annual

const weightedAvgRate = (annualRate * annualBillingPercentage) +
                         (monthlyRate * (1 - annualBillingPercentage))
// Result: $23.50/user

const mrr = Math.round(premiumUsers.length * weightedAvgRate)
```

### What's Missing
1. **Actual billing amounts** - Some users may have discounts, promotions
2. **Billing cycle accuracy** - Don't know who's actually monthly vs annual
3. **Failed payments** - Users with `subscription_status: 'active'` may have failed payments
4. **Prorations** - Mid-cycle upgrades/downgrades
5. **Taxes and fees** - Net revenue vs gross revenue
6. **Churn accuracy** - Estimated based on status changes, not actual cancellations

---

## Recommended Approach

### Phase 1: Stripe Data Warehouse (Recommended)

**Use Stripe's existing tables in Convex**:
- `stripe_payments` (schema.ts lines 519-545)
- `stripe_subscription_events` (schema.ts lines 547-582)

**Benefits**:
- Data already flowing via webhooks
- No additional Stripe API calls needed
- Real-time updates
- Indexed for fast queries

**Implementation Steps**:

#### 1. Update MRR Query to Use Real Stripe Data

**File**: `convex/investor_metrics.ts`

Replace lines 103-123 with:

```typescript
/**
 * Calculate real MRR from Stripe subscription data
 */
async function calculateRealMRR(ctx: any, premiumUsers: any[]) {
  // Get active subscriptions from Stripe events
  const activeSubscriptions = await ctx.db
    .query("stripe_subscription_events")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("event_type"), "customer.subscription.updated"),
        q.eq(q.field("status"), "active")
      )
    )
    .collect();

  // Map user IDs to subscription amounts
  const userSubscriptions = new Map();

  for (const sub of activeSubscriptions) {
    const userId = sub.user_id;
    const amount = sub.amount_cents / 100; // Convert cents to dollars
    const billingInterval = sub.billing_interval; // 'month' or 'year'

    // Normalize to monthly amount
    const monthlyAmount = billingInterval === 'year' ? amount / 12 : amount;

    userSubscriptions.set(userId, {
      amount: monthlyAmount,
      billingInterval,
      subscriptionId: sub.subscription_id,
    });
  }

  // Calculate total MRR for billable premium users
  let totalMRR = 0;
  let monthlyBillingCount = 0;
  let annualBillingCount = 0;

  for (const user of premiumUsers) {
    const subscription = userSubscriptions.get(user._id);
    if (subscription) {
      totalMRR += subscription.amount;

      if (subscription.billingInterval === 'year') {
        annualBillingCount++;
      } else {
        monthlyBillingCount++;
      }
    }
  }

  return {
    mrr: Math.round(totalMRR),
    arr: Math.round(totalMRR * 12),
    billing_breakdown: {
      monthly: monthlyBillingCount,
      annual: annualBillingCount,
      monthly_percentage: ((monthlyBillingCount / premiumUsers.length) * 100).toFixed(1),
      annual_percentage: ((annualBillingCount / premiumUsers.length) * 100).toFixed(1),
    },
    mrr_is_estimate: false, // Now using real data!
    mrr_calculation: 'Calculated from Stripe subscription data',
    avg_mrr_per_user: (totalMRR / premiumUsers.length).toFixed(2),
  };
}

// Then use in getUserMetrics:
const revenueMetrics = await calculateRealMRR(ctx, premiumUsers);
```

#### 2. Update Stripe Webhook to Populate stripe_subscription_events

**File**: `src/app/api/stripe/webhook/route.ts`

Ensure these events are captured:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Store in `stripe_subscription_events`:
```typescript
await convex.mutation(api.stripe.upsertSubscriptionEvent, {
  subscription_id: subscription.id,
  user_id: userId,
  event_type: event.type,
  status: subscription.status,
  amount_cents: subscription.items.data[0].price.unit_amount,
  billing_interval: subscription.items.data[0].price.recurring.interval,
  current_period_start: subscription.current_period_start * 1000,
  current_period_end: subscription.current_period_end * 1000,
  created_at: Date.now(),
});
```

#### 3. Create Revenue Analytics Dashboard

**New File**: `convex/revenue_analytics.ts`

```typescript
export const getRevenueMetrics = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    // Real MRR from Stripe
    const mrr = await calculateRealMRR(ctx);

    // Churn rate from Stripe cancellations
    const churnRate = await calculateChurnRate(ctx);

    // ARPU (Average Revenue Per User)
    const arpu = mrr.total / premiumUsers.length;

    // LTV (Lifetime Value) estimate
    const ltv = arpu / (churnRate / 100);

    return {
      mrr: mrr.total,
      arr: mrr.total * 12,
      arpu,
      churn_rate: churnRate,
      ltv,
      billing_mix: mrr.billing_breakdown,
      // ... more metrics
    };
  },
});
```

---

### Phase 2: Direct Stripe API Integration (If Needed)

**When to use**: If webhook data is incomplete or you need historical data

#### Setup Stripe SDK

```bash
npm install stripe
```

#### Create Stripe Service

**New File**: `src/lib/stripe-service.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function getActiveSubscriptions() {
  const subscriptions = await stripe.subscriptions.list({
    status: 'active',
    limit: 100, // Adjust as needed
    expand: ['data.customer'],
  });

  return subscriptions.data.map(sub => ({
    id: sub.id,
    customer: sub.customer,
    status: sub.status,
    amount: (sub.items.data?.[0]?.price?.unit_amount ?? 0) / 100,
    interval: sub.items.data?.[0]?.price?.recurring?.interval ?? 'month',
    current_period_start: sub.current_period_start * 1000,
    current_period_end: sub.current_period_end * 1000,
  }));
}

export async function calculateRealMRR() {
  const subscriptions = await getActiveSubscriptions();

  let totalMRR = 0;

  for (const sub of subscriptions) {
    const monthlyAmount = sub.interval === 'year' ? sub.amount / 12 : sub.amount;
    totalMRR += monthlyAmount;
  }

  return {
    mrr: Math.round(totalMRR),
    arr: Math.round(totalMRR * 12),
    subscription_count: subscriptions.length,
  };
}
```

#### API Route for MRR

**New File**: `src/app/api/metrics/mrr/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { calculateRealMRR } from '@/lib/stripe-service';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify super admin (check Clerk metadata or Convex)
  // ...

  const mrrData = await calculateRealMRR();

  return NextResponse.json(mrrData);
}
```

---

## Implementation Timeline

### Immediate (Can do now)
- [ ] Verify `stripe_subscription_events` table is being populated
- [ ] Add logging to Stripe webhook to confirm all events captured
- [ ] Test with 1-2 real subscriptions

### Short-term (When premium users > 100)
- [ ] Implement Phase 1 (use existing Stripe tables)
- [ ] Add Convex mutation to upsert subscription events
- [ ] Create `calculateRealMRR()` function
- [ ] Update investor metrics query

### Mid-term (When premium users > 500)
- [ ] Implement Phase 2 if needed (direct Stripe API)
- [ ] Add revenue analytics dashboard
- [ ] Create LTV calculator
- [ ] Add cohort analysis

### Before Series A
- [ ] **Must have**: Real MRR from Stripe (not estimates)
- [ ] **Must have**: Real churn rate
- [ ] **Must have**: ARPU tracking
- [ ] **Nice to have**: LTV by cohort
- [ ] **Nice to have**: Revenue projections

---

## Data Architecture

### Current State (Using Estimates)

```
Premium Users (Convex)
  ↓
Estimated MRR = premiumUsers.length × $23.50
  ↓
Investor Metrics
```

### Phase 1 (Using Convex Stripe Tables)

```
Stripe Webhook Events
  ↓ webhook
stripe_subscription_events (Convex)
  ↓ query
Real MRR Calculation
  ↓
Investor Metrics
```

### Phase 2 (Direct Stripe API)

```
Stripe API (source of truth)
  ↓ API call
Real MRR Calculation
  ↓ cache in Convex
Investor Metrics
```

---

## Metrics to Track

### Revenue Metrics
- **MRR** (Monthly Recurring Revenue) - Total monthly revenue
- **ARR** (Annual Recurring Revenue) - MRR × 12
- **ARPU** (Average Revenue Per User) - MRR / active premium users
- **ARPPU** (Average Revenue Per Paying User) - MRR / paying users

### Growth Metrics
- **Net New MRR** - MRR growth month-over-month
- **MRR Growth Rate** - (Net New MRR / Previous MRR) × 100
- **Quick Ratio** - (New MRR + Expansion MRR) / (Churned MRR + Contraction MRR)

### Retention Metrics
- **MRR Churn Rate** - Lost MRR / Total MRR
- **Logo Churn Rate** - Lost customers / Total customers
- **Net Revenue Retention** - (Start MRR + Expansion - Churn) / Start MRR

### Cohort Analysis
- **LTV** (Lifetime Value) - ARPU / churn rate
- **LTV:CAC Ratio** - LTV / Customer Acquisition Cost
- **Payback Period** - CAC / ARPU

---

## Testing Strategy

### Unit Tests

**File**: `src/__tests__/stripe-mrr.test.ts`

```typescript
describe('Real MRR Calculation', () => {
  test('Calculates MRR correctly with monthly subscriptions', () => {
    const subscriptions = [
      { amount: 30, interval: 'month' },
      { amount: 30, interval: 'month' },
    ];

    const mrr = calculateMRRFromSubscriptions(subscriptions);
    expect(mrr).toBe(60); // 2 × $30
  });

  test('Calculates MRR correctly with annual subscriptions', () => {
    const subscriptions = [
      { amount: 240, interval: 'year' }, // $20/month effective
      { amount: 30, interval: 'month' },
    ];

    const mrr = calculateMRRFromSubscriptions(subscriptions);
    expect(mrr).toBe(50); // $20 + $30
  });

  test('Excludes internal role users even with subscriptions', () => {
    const users = [
      { role: 'individual', subscription_id: 'sub_123' },
      { role: 'super_admin', subscription_id: 'sub_456' }, // Should exclude
    ];

    const billableUsers = users.filter(u => isBillableRole(u.role));
    expect(billableUsers).toHaveLength(1);
  });
});
```

### Integration Tests

1. Create test subscription in Stripe test mode
2. Verify webhook populates `stripe_subscription_events`
3. Verify MRR calculation matches Stripe dashboard
4. Test cancellation flow
5. Test upgrade/downgrade

---

## Monitoring & Alerts

### Key Alerts to Set Up

1. **MRR Drop > 5%** - Alert if MRR drops significantly
2. **Failed Payments** - Alert on payment failures
3. **High Churn** - Alert if churn rate > 5% in a month
4. **Webhook Failures** - Alert if Stripe webhooks fail

### Dashboard Metrics

Create admin dashboard showing:
- Current MRR with trend chart
- MRR breakdown (monthly vs annual)
- Top 10 customers by revenue
- Churn rate with 3-month moving average
- Revenue projections (next 3 months)

---

## Migration Checklist

When switching from estimates to real data:

- [ ] Verify Stripe webhook is working
- [ ] Confirm `stripe_subscription_events` has data for all active subscriptions
- [ ] Deploy new `calculateRealMRR()` function
- [ ] Test with small subset of users
- [ ] Compare estimate vs real MRR (should be within 10%)
- [ ] Update investor metrics query
- [ ] Update analytics dashboard
- [ ] Document any discrepancies
- [ ] Archive old estimation code (don't delete)

---

## Cost Analysis

### Stripe API Costs
- **Free**: Webhooks (no cost)
- **Free**: API calls (generous free tier)
- **Paid**: Only if you exceed API limits (unlikely)

### Development Time
- **Phase 1**: 2-4 hours (use existing tables)
- **Phase 2**: 8-12 hours (direct API integration)
- **Testing**: 4 hours
- **Dashboard**: 8 hours

**Total**: ~20-30 hours of development

---

## Success Criteria

### Before Launch
- ✅ MRR calculation matches Stripe dashboard within 1%
- ✅ All active subscriptions tracked
- ✅ Webhook handles all events correctly
- ✅ Tests pass with 100% coverage

### After Launch
- ✅ MRR trends match Stripe charts
- ✅ Churn rate accurate
- ✅ ARPU calculated correctly
- ✅ Investor metrics show real data (not estimates)

---

## Support & Resources

- **Stripe API Docs**: https://stripe.com/docs/api
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Convex Stripe Integration**: https://docs.convex.dev/integrations
- **MRR Best Practices**: https://www.chargebee.com/resources/glossaries/monthly-recurring-revenue/

---

## Contact

For questions or issues:
- Engineering Team: Review this document and `convex/investor_metrics.ts`
- Stripe Support: stripe.com/support
- Convex Support: docs.convex.dev/support
