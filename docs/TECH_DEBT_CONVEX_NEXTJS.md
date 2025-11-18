# Technical Debt: Migrate from ConvexHttpClient to Next.js Utilities

## Issue

**Priority**: Medium
**Effort**: Medium (33 files affected)
**Risk**: Low (backward compatible)

## Problem

Current implementation uses `ConvexHttpClient` from `convex/browser` in server-side API routes:

```typescript
// src/lib/convex-server.ts
import { ConvexHttpClient } from 'convex/browser'; // ❌ Browser client in server context

export const convexServer = new ConvexHttpClient(CONVEX_URL);
```

This pattern is **not recommended** for Next.js server-side operations. Convex provides dedicated Next.js utilities that are better optimized for Server Components, Server Actions, and Route Handlers.

## Recommended Solution

Use Next.js-specific utilities from `convex/nextjs`:

```typescript
// Instead of:
import { convexServer } from '@/lib/convex-server';
const user = await convexServer.query(api.users.getUserByClerkId, { clerkId });

// Use:
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
const user = await fetchQuery(api.users.getUserByClerkId, { clerkId });
```

## Benefits

1. **Next.js Optimized**: Built specifically for Next.js 13+ App Router
2. **Better Performance**: Designed for server-side rendering and caching
3. **Type Safety**: Better TypeScript integration with Next.js patterns
4. **Official Pattern**: Matches Convex documentation and best practices
5. **Token Support**: Built-in support for passing auth tokens

## Affected Files (33 API Routes)

All files currently importing `convexServer`:

```
src/app/api/clerk/webhook/route.ts
src/app/api/stripe/checkout/route.ts
src/app/api/university/export-reports/route.ts
src/app/api/university/sync-clerk-metadata/route.ts
src/app/api/university/assign-student/route.ts
src/app/api/university/export-data/route.ts
src/app/api/debug/grant-pro/route.ts
src/app/api/ai-coach/conversations/[id]/messages/route.ts
src/app/api/achievements/route.ts
src/app/api/users/me/route.ts
src/app/api/university/send-invitations/route.ts
src/app/api/support/tickets/route.ts
src/app/api/stripe/portal/route.ts
src/app/api/recommendations/daily/route.ts
src/app/api/goals/[id]/route.ts
src/app/api/goals/route.ts
src/app/api/projects/route.ts
src/app/api/cover-letters/route.ts
src/app/api/cover-letters/analyze/route.ts
src/app/api/cover-letters/generate/route.ts
src/app/api/contacts/[id]/route.ts
src/app/api/contacts/route.ts
src/app/api/career-paths/generate/route.ts
src/app/api/career-paths/route.ts
src/app/api/career-paths/[id]/name/route.ts
src/app/api/career-paths/[id]/route.ts
src/app/api/career-path/generate-from-job/route.ts
src/app/api/career-path/generate/route.ts
src/app/api/ai-coach/generate-response/route.ts
src/app/api/career-data/profile/route.ts
src/app/api/ai-coach/conversations/route.ts
src/app/api/achievements/user/route.ts
src/app/api/achievements/award/route.ts
```

## Migration Steps

### 1. Update Imports (Each File)

```diff
- import { convexServer } from '@/lib/convex-server';
+ import { fetchQuery, fetchMutation, fetchAction } from 'convex/nextjs';
```

### 2. Update Query Calls

```diff
- const result = await convexServer.query(api.users.getUserByClerkId, { clerkId });
+ const result = await fetchQuery(api.users.getUserByClerkId, { clerkId });
```

### 3. Update Mutation Calls

```diff
- const result = await convexServer.mutation(api.users.updateUser, { ... });
+ const result = await fetchMutation(api.users.updateUser, { ... });
```

### 4. Pass Auth Tokens (If Needed)

```typescript
// With authentication
const result = await fetchQuery(
  api.users.getUserByClerkId,
  { clerkId },
  { token: authToken }  // Optional JWT token
);
```

### 5. Environment Variables

Ensure `NEXT_PUBLIC_CONVEX_URL` is set (already required):
```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### 6. Remove Deprecated File

After migration complete:
```bash
rm src/lib/convex-server.ts
```

## Testing Strategy

1. **Unit Tests**: Ensure no breaking changes in API responses
2. **Integration Tests**: Test auth token passing
3. **Incremental Migration**: Migrate one route at a time
4. **Rollback Plan**: Keep `convex-server.ts` until all routes migrated

## Timeline

- **Week 1**: Migrate 10 routes (prioritize high-traffic routes)
- **Week 2**: Migrate remaining 23 routes
- **Week 3**: Testing and cleanup

## Breaking Changes

**None** - This is a drop-in replacement with identical behavior.

## References

- [Convex Next.js Documentation](https://docs.convex.dev/client/react/nextjs/server-rendering)
- [Type Definitions](node_modules/convex/dist/cjs-types/nextjs/index.d.ts)
- Original Issue: Identified during code review (2024-11-18)

## Example Migration

### Before:
```typescript
// src/app/api/users/me/route.ts
import { convexServer } from '@/lib/convex-server';
import { api } from '@/convex/_generated/api';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const user = await convexServer.query(api.users.getUserByClerkId, {
    clerkId: userId,
  });
  return NextResponse.json(user);
}
```

### After:
```typescript
// src/app/api/users/me/route.ts
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const user = await fetchQuery(api.users.getUserByClerkId, {
    clerkId: userId,
  });
  return NextResponse.json(user);
}
```

## Notes

- Current implementation works but is not the recommended pattern
- No security issues, just architectural improvement
- Can be done gradually without disrupting existing functionality
