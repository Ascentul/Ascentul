/**
 * Server-side Convex utilities for Next.js
 *
 * DEPRECATED: This file uses the legacy ConvexHttpClient pattern.
 *
 * RECOMMENDED MIGRATION:
 * Import fetchQuery, fetchMutation, fetchAction directly from 'convex/nextjs' instead:
 *
 * @example Before (deprecated):
 * import { convexServer } from '@/lib/convex-server';
 * const user = await convexServer.query(api.users.getUserByClerkId, { clerkId });
 *
 * @example After (recommended):
 * import { fetchQuery } from 'convex/nextjs';
 * const user = await fetchQuery(api.users.getUserByClerkId, { clerkId });
 *
 * See: https://docs.convex.dev/client/react/nextjs/server-rendering
 *
 * MIGRATION STATUS: 36 files still using this legacy pattern (tracked in docs/TECH_DEBT_CONVEX_NEXTJS.md)
 */

import { ConvexHttpClient } from 'convex/browser';

const CONVEX_URL = process.env.CONVEX_URL;

function getConvexClient() {
  if (!CONVEX_URL) {
    throw new Error('CONVEX_URL environment variable is required for server-side Convex operations');
  }
  return new ConvexHttpClient(CONVEX_URL);
}

// Lazy singleton to avoid crashing at import time when env vars are missing in build/cold start
let _client: ConvexHttpClient | null = null;

function getClient() {
  if (!_client) {
    _client = getConvexClient();
  }
  return _client;
}

/**
 * @deprecated Use fetchQuery, fetchMutation, fetchAction from 'convex/nextjs' instead
 *
 * Lazy proxy around ConvexHttpClient for server-side use (LEGACY PATTERN)
 * This works but is not the recommended approach for Next.js App Router.
 */
export const convexServer = {
  query: <T>(...args: Parameters<ConvexHttpClient['query']>) => getClient().query<T>(...args),
  mutation: <T>(...args: Parameters<ConvexHttpClient['mutation']>) => getClient().mutation<T>(...args),
  action: <T>(...args: Parameters<ConvexHttpClient['action']>) => getClient().action<T>(...args),
  setAuth: (...args: Parameters<ConvexHttpClient['setAuth']>) => getClient().setAuth(...args),
};
