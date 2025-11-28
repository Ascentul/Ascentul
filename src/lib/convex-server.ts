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
import type { FunctionReference, FunctionReturnType, FunctionArgs } from 'convex/server';

/**
 * Backward-compatible convexServer shim.
 * @deprecated Prefer direct use of fetchQuery/fetchMutation/fetchAction from 'convex/nextjs'.
 */
export const convexServer = {
  query: <Query extends FunctionReference<'query'>>(
    fn: Query,
    args: FunctionArgs<Query>
  ): Promise<FunctionReturnType<Query>> => fetchQuery(fn, args) as Promise<FunctionReturnType<Query>>,

  mutation: <Mutation extends FunctionReference<'mutation'>>(
    fn: Mutation,
    args: FunctionArgs<Mutation>
  ): Promise<FunctionReturnType<Mutation>> => fetchMutation(fn, args) as Promise<FunctionReturnType<Mutation>>,

  action: <Action extends FunctionReference<'action'>>(
    fn: Action,
    args: FunctionArgs<Action>
  ): Promise<FunctionReturnType<Action>> => fetchAction(fn, args) as Promise<FunctionReturnType<Action>>,

  // setAuth is a no-op with fetch* helpers (auth handled by convex/nextjs + cookies/JWT)
  setAuth: () => {
    console.warn('convexServer.setAuth is deprecated; auth is handled by convex/nextjs helpers.');
  },
};
