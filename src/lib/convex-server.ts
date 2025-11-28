/**
 * Server-side Convex utilities for Next.js
 *
 * Migration shim: wraps convex/nextjs helpers in the legacy convexServer shape.
 *
 * Preferred usage (recommended):
 *   import { fetchQuery, fetchMutation, fetchAction } from 'convex/nextjs';
 *
 * Temporary shim (backward compatibility):
 *   convexServer.query/api.mutation/action will call the fetch* helpers.
 */

import { fetchQuery, fetchMutation, fetchAction } from 'convex/nextjs';

/**
 * Backward-compatible convexServer shim.
 * @deprecated Prefer direct use of fetchQuery/fetchMutation/fetchAction from 'convex/nextjs'.
 */
export const convexServer = {
  query: <Result, Args extends Record<string, any>>(fn: any, args: Args) =>
    fetchQuery<Result>(fn, args),
  mutation: <Result, Args extends Record<string, any>>(fn: any, args: Args) =>
    fetchMutation<Result>(fn, args),
  action: <Result, Args extends Record<string, any>>(fn: any, args: Args) =>
    fetchAction<Result>(fn, args),
  // setAuth is a no-op with fetch* helpers (auth handled by convex/nextjs + cookies/JWT)
  setAuth: () => {
    console.warn('convexServer.setAuth is deprecated; auth is handled by convex/nextjs helpers.');
  },
};
