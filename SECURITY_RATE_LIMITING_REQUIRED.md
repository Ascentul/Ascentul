# 🚨 CRITICAL SECURITY ISSUE: Rate Limiting Required

## Issue Summary

**Severity:** 🔴 **CRITICAL** - Production Blocker
**Status:** ⚠️ **OPEN - MUST FIX BEFORE PRODUCTION**
**File:** `src/app/api/ai/stream-suggestions/route.ts`
**Date Identified:** 2025-01-21

---

## The Problem

The `/api/ai/stream-suggestions` endpoint **has NO rate limiting**, allowing:

### Attack Scenarios

1. **Cost Abuse Attack**
   ```
   Malicious user writes simple script:

   while true; do
     curl -X POST /api/ai/stream-suggestions \
       -H "Authorization: Bearer $TOKEN" \
       -d '{"resumeId":"abc","blockIds":["x"]}'
   done
   ```

   **Result:** Hundreds of OpenAI API calls per minute → **$100s-$1000s in unbounded costs**

2. **Resource Exhaustion**
   - Each request = 1-2 seconds of GPT-4 inference time
   - 10 concurrent requests = 10x API cost multiplier
   - Can overwhelm OpenAI quota limits

3. **Legitimate User Spam**
   - User clicking "Generate Suggestions" repeatedly
   - UI bug causing retry loops
   - No protection against accidental abuse

---

## Current Protection (Insufficient)

✅ **What exists:**
- Authentication via Clerk (line 102-106)
- V2 flag gate (line 86-91)
- OpenAI API key check (line 94-99)

❌ **What's missing:**
- **No per-user rate limiting**
- **No per-IP rate limiting**
- **No cost controls**
- **No quota tracking**

---

## Required Solution

### Minimum Viable Protection (MVP)

**Recommendation:** 5 requests/minute per user, 20/hour max

#### Option 1: Vercel Edge Middleware + KV (RECOMMENDED)

**Pros:**
- Built-in Vercel integration
- Edge execution (fast)
- Simple token bucket implementation

**Implementation:**
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 per minute
});

export async function middleware(request: NextRequest) {
  if (request.url.includes('/api/ai/stream-suggestions')) {
    const userId = await getUserId(request); // From Clerk

    const { success, limit, remaining } = await ratelimit.limit(userId);

    if (!success) {
      return new Response('Too many requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        },
      });
    }
  }

  return NextResponse.next();
}
```

**Cost:** ~$0.20/100k requests (Upstash Redis)

---

#### Option 2: Convex-based Rate Limiting

**Pros:**
- No additional infrastructure
- Uses existing Convex database
- Flexible custom logic

**Implementation:**
```typescript
// convex/rateLimiting.ts
import { mutation, query } from './_generated/server';

export const checkRateLimit = query({
  args: { userId: v.string(), endpoint: v.string() },
  handler: async (ctx, { userId, endpoint }) => {
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;

    const recentRequests = await ctx.db
      .query('rate_limits')
      .withIndex('by_user_endpoint', (q) =>
        q.eq('userId', userId).eq('endpoint', endpoint)
      )
      .filter((q) => q.gt(q.field('timestamp'), oneMinuteAgo))
      .collect();

    if (recentRequests.length >= 5) {
      return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: 5 - recentRequests.length };
  },
});

export const recordRequest = mutation({
  args: { userId: v.string(), endpoint: v.string() },
  handler: async (ctx, { userId, endpoint }) => {
    await ctx.db.insert('rate_limits', {
      userId,
      endpoint,
      timestamp: Date.now(),
    });
  },
});
```

**Use in API route:**
```typescript
// In POST handler
const rateCheck = await convex.query(api.rateLimiting.checkRateLimit, {
  userId,
  endpoint: 'stream-suggestions',
});

if (!rateCheck.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded. Try again in 1 minute.' },
    { status: 429 }
  );
}

await convex.mutation(api.rateLimiting.recordRequest, {
  userId,
  endpoint: 'stream-suggestions',
});
```

**Cost:** Free (within Convex limits)

---

#### Option 3: In-Memory Token Bucket (Development Only)

**⚠️ WARNING:** Not suitable for production (resets on server restart, doesn't work with serverless)

```typescript
// Simple in-memory rate limiter
const userRequests = new Map<string, number[]>();

function checkRateLimit(userId: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const requests = userRequests.get(userId) || [];

  // Remove old requests
  const recentRequests = requests.filter(time => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false;
  }

  recentRequests.push(now);
  userRequests.set(userId, recentRequests);
  return true;
}

// In POST handler
if (!checkRateLimit(userId, 5, 60_000)) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

---

## Recommended Thresholds

| Limit Type | Threshold | Window | Reasoning |
|------------|-----------|--------|-----------|
| **Per User** | 5 requests | 1 minute | Prevents spam, allows retries |
| **Per User** | 20 requests | 1 hour | Daily quota protection |
| **Per IP** | 10 requests | 1 minute | Prevents anonymous abuse |
| **Global** | 1000 requests | 1 minute | Protects infrastructure |

---

## Additional Recommendations

### 1. **Cost Monitoring Dashboard**
```typescript
// Log AI costs per request
logEvent('ai_request', {
  userId,
  model: getModel(),
  estimatedCost: 0.02, // GPT-4 estimate
  tokensUsed: completion.usage?.total_tokens,
});
```

### 2. **User Quota System**
- Free tier: 10 AI requests/day
- Pro tier: 100 AI requests/day
- Enterprise: Unlimited

### 3. **Request Timeout**
- Already implemented: `maxDuration = 60` (line 28)
- Consider reducing to 30s for faster failure

### 4. **Circuit Breaker Pattern**
```typescript
// If OpenAI is down, fail fast
let openaiHealthy = true;

if (!openaiHealthy) {
  return NextResponse.json(
    { error: 'AI service temporarily unavailable' },
    { status: 503 }
  );
}
```

---

## Action Items

- [ ] **BLOCKER:** Implement rate limiting (Option 1 or 2)
- [ ] Add rate limit headers to responses
- [ ] Add cost monitoring/alerting
- [ ] Document rate limits in API docs
- [ ] Add client-side retry logic with exponential backoff
- [ ] Test with load testing tool (k6, Artillery)
- [ ] Set up OpenAI spend alerts ($100/day threshold)

---

## Testing Plan

1. **Unit Test:** Verify rate limit logic
2. **Integration Test:** Hit endpoint 6 times in 1 minute → expect 429
3. **Load Test:** Simulate 100 concurrent users
4. **Cost Test:** Monitor actual OpenAI API costs

---

## References

- [Vercel Rate Limiting](https://vercel.com/docs/edge-network/rate-limiting)
- [Upstash Redis Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

**This is not optional. Rate limiting MUST be implemented before production deployment.**
