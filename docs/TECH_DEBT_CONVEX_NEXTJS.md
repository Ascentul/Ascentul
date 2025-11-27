# Technical Debt: Migrate from ConvexHttpClient to convex/nextjs Utilities

## Issue

**Priority**: MEDIUM
**Effort**: Medium (36 files affected)
**Risk**: LOW - Current implementation works but not following best practices
**Impact**: Performance, Authentication, Best Practices

## Problem

The application currently uses `ConvexHttpClient` from `convex/browser` for server-side Convex operations. This is a legacy pattern that works but is not the recommended approach for Next.js App Router applications.

### Current Pattern (Legacy)

> **Status**: The `convexServer` wrapper in `src/lib/convex-server.ts` is marked as `@deprecated`.
> All 36 files currently use this pattern. This is **not** an intermediate abstraction to keep—it
> should be fully replaced with `fetchQuery`/`fetchMutation`/`fetchAction` from `convex/nextjs`.

```typescript
// src/lib/convex-server.ts
import { ConvexHttpClient } from 'convex/browser';
// Uses manual URL management (CONVEX_URL)
export const convexServer = new ConvexHttpClient(process.env.CONVEX_URL!);

// Usage in API routes (current state - to be migrated)
import { convexServer } from '@/lib/convex-server';
const user = await convexServer.query(api.users.getUserByClerkId, { clerkId });
```

### Issues with Current Approach

1. **Wrong Import Source**: Uses `convex/browser` which is intended for client-side usage
2. **Not Next.js Optimized**: Doesn't leverage Next.js-specific optimizations
3. **Manual URL Management**: Requires manual CONVEX_URL environment variable handling
4. **Authentication Complexity**: Doesn't automatically integrate with Next.js auth context
5. **Deviation from Docs**: Official Convex docs recommend `convex/nextjs` for server-side operations

## Recommended Solution

Use the Next.js-specific utilities from `convex/nextjs`:

### For API Routes and Server Actions

```typescript
import { fetchQuery, fetchMutation, fetchAction } from 'convex/nextjs';

// Queries
const user = await fetchQuery(api.users.getUserByClerkId, { clerkId });

// Mutations
const result = await fetchMutation(api.users.updateUser, { clerkId, updates });

// Actions
const data = await fetchAction(api.external.processData, { input });
```

### For Server Components with Preloading

```typescript
// Server Component
import { preloadQuery } from 'convex/nextjs';
import { api } from 'convex/_generated/api';

export default async function MyServerComponent() {
  const preloadedData = await preloadQuery(api.myQuery, { args });

  return <MyClientComponent preloadedData={preloadedData} />;
}

// Client Component
"use client";
import { usePreloadedQuery, Preloaded } from 'convex/react';

interface Props {
  preloadedData: Preloaded<typeof api.myQuery>;
}

export function MyClientComponent({ preloadedData }: Props) {
  const data = usePreloadedQuery(preloadedData);
  // Use data...
}
```

## Benefits of Migration

1. **Official Best Practice**: Follows Convex's recommended pattern for Next.js
2. **Better Integration**: Automatically handles deployment URL configuration
3. **Auth Integration**: Better integration with Next.js authentication context
4. **Performance**: Optimized for Next.js server rendering patterns
5. **Type Safety**: Better TypeScript support for preloaded queries
6. **Future-Proof**: Aligned with modern Next.js App Router patterns

## Files Requiring Migration

### API Routes (36 files)
All files currently importing from `@/lib/convex-server`:

- `src/app/api/ai-coach/conversations/[id]/messages/route.ts`
- `src/app/api/ai-coach/conversations/route.ts`
- `src/app/api/ai-coach/generate-response/route.ts`
- `src/app/api/debug/grant-pro/route.ts`
- `src/app/api/clerk/webhook/route.ts`
- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/api/university/export-reports/route.ts`
- `src/app/api/university/sync-clerk-metadata/route.ts`
- `src/app/api/university/assign-student/route.ts`
- `src/app/api/university/export-data/route.ts`
- `src/app/api/university/send-invitations/route.ts`
- `src/app/api/admin/clerk-sync/route.ts`
- `src/app/api/achievements/route.ts`
- `src/app/api/achievements/user/route.ts`
- `src/app/api/achievements/award/route.ts`
- `src/app/api/users/me/route.ts`
- `src/app/api/support/tickets/route.ts`
- `src/app/api/recommendations/daily/route.ts`
- `src/app/api/goals/[id]/route.ts`
- `src/app/api/goals/route.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/cover-letters/route.ts`
- `src/app/api/cover-letters/analyze/route.ts`
- `src/app/api/cover-letters/generate/route.ts`
- `src/app/api/contacts/[id]/route.ts`
- `src/app/api/contacts/route.ts`
- `src/app/api/career-paths/generate/route.ts`
- `src/app/api/career-paths/route.ts`
- `src/app/api/career-paths/[id]/name/route.ts`
- `src/app/api/career-paths/[id]/route.ts`
- `src/app/api/career-path/generate-from-job/route.ts`
- `src/app/api/career-path/generate/route.ts`
- `src/app/api/career-data/profile/route.ts`
- `src/lib/convex-server.ts` (delete after migration)
- `src/__tests__/ai-coach-api.test.ts`

## Migration Steps

### Phase 1: Update Individual Route (Example)

**Before:**
```typescript
import { convexServer } from '@/lib/convex-server';

export async function GET(request: Request) {
  const user = await convexServer.query(api.users.getUserByClerkId, { clerkId });
  return Response.json(user);
}
```

**After:**
```typescript
import { fetchQuery } from 'convex/nextjs';

export async function GET(request: Request) {
  const user = await fetchQuery(api.users.getUserByClerkId, { clerkId });
  return Response.json(user);
}
```

### Phase 2: Batch Migration

1. **Find and Replace Pattern**:
   ```bash
   # Find usage
   grep -r "convexServer.query" src/app/api/
   grep -r "convexServer.mutation" src/app/api/

   # Replace pattern (manual verification required)
   convexServer.query(api.X, ...) -> fetchQuery(api.X, ...)
   convexServer.mutation(api.X, ...) -> fetchMutation(api.X, ...)
   convexServer.action(api.X, ...) -> fetchAction(api.X, ...)
   ```

2. **Update Imports**:
   ```typescript
   // Remove
   - import { convexServer } from '@/lib/convex-server';

   // Add
   + import { fetchQuery, fetchMutation } from 'convex/nextjs';
   ```

3. **Test Each Route**: Verify functionality after migration

### Phase 3: Cleanup

1. Add deprecation warning to `src/lib/convex-server.ts`
2. Migrate all 36 files
3. Delete `src/lib/convex-server.ts`
4. Update documentation

## Testing Strategy

For each migrated route:

1. **Functional Test**: Verify the route still works correctly
2. **Auth Test**: Confirm authentication still works
3. **Error Handling**: Ensure errors are handled properly
4. **Performance**: Compare response times (should be same or better)

## Breaking Changes

**None** - This is an internal refactoring. The API contracts remain the same.

## Rollback Plan

If issues arise:
1. Git revert the changes
2. Keep `src/lib/convex-server.ts` in place
3. No data loss or schema changes involved

## References

- **Official Documentation**: https://docs.convex.dev/client/react/nextjs/server-rendering
- **Next.js Integration Guide**: https://docs.convex.dev/client/react/nextjs/
- **API Reference**: https://docs.convex.dev/api/modules/nextjs
- **Demo Repository**: https://github.com/get-convex/convex-nextjs-app-router-demo

## Priority Justification

**Medium Priority** because:
- ✅ Current implementation works (no broken functionality)
- ✅ Low risk (internal refactoring only)
- ❌ Deviates from official best practices
- ❌ May cause confusion for developers following Convex docs
- ❌ Could impact future features that rely on Next.js-specific optimizations

**Should be addressed**: During next refactoring sprint or when touching related code.

**Not urgent**: No immediate functional issues or security concerns.
