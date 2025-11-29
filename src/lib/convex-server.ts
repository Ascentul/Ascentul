/**
 * Server-side Convex utilities for Next.js
 *
 * Migration shim: wraps convex/nextjs helpers in the legacy convexServer shape.
 *
 * Preferred usage (recommended):
 *   import { fetchQuery, fetchMutation, fetchAction } from 'convex/nextjs';
 *   import { auth } from '@clerk/nextjs/server';
 *
 *   const { getToken } = await auth();
 *   const token = await getToken({ template: 'convex' });
 *   const result = await fetchQuery(api.myQuery, { args }, { token });
 *
 * Temporary shim (backward compatibility):
 *   convexServer.query/mutation/action will call the fetch* helpers.
 *   Pass an optional token parameter for authenticated calls.
 *
 * IMPORTANT: For authenticated Convex calls with Clerk JWT, you MUST:
 * 1. Get the token: const { getToken } = await auth(); const token = await getToken({ template: 'convex' });
 * 2. Pass it to the call: convexServer.query(api.myQuery, { args }, token);
 *
 * Without a token, calls are unauthenticated and will fail if the Convex function requires auth.
 */

import { fetchQuery, fetchMutation, fetchAction } from 'convex/nextjs';
import type { FunctionReference, FunctionReturnType, FunctionArgs } from 'convex/server';

/**
 * Backward-compatible convexServer shim.
 * @deprecated Prefer direct use of fetchQuery/fetchMutation/fetchAction from 'convex/nextjs'.
 */
export const convexServer = {
  /**
   * Execute a Convex query
   * @param fn - The query function reference
   * @param args - Arguments for the query
   * @param token - Optional Clerk JWT token for authenticated calls
   */
  query: <Query extends FunctionReference<'query'>>(
    fn: Query,
    args: FunctionArgs<Query>,
    token?: string | null
  ): Promise<FunctionReturnType<Query>> =>
    fetchQuery(fn, args, token ? { token } : undefined),

  /**
   * Execute a Convex mutation
   * @param fn - The mutation function reference
   * @param args - Arguments for the mutation
   * @param token - Optional Clerk JWT token for authenticated calls
   */
  mutation: <Mutation extends FunctionReference<'mutation'>>(
    fn: Mutation,
    args: FunctionArgs<Mutation>,
    token?: string | null
  ): Promise<FunctionReturnType<Mutation>> =>
    fetchMutation(fn, args, token ? { token } : undefined) as Promise<FunctionReturnType<Mutation>>,

  /**
   * Execute a Convex action
   * @param fn - The action function reference
   * @param args - Arguments for the action
   * @param token - Optional Clerk JWT token for authenticated calls
   */
  action: <Action extends FunctionReference<'action'>>(
    fn: Action,
    args: FunctionArgs<Action>,
    token?: string | null
  ): Promise<FunctionReturnType<Action>> =>
    fetchAction(fn, args, token ? { token } : undefined) as Promise<FunctionReturnType<Action>>,

  /**
   * @deprecated setAuth is no longer used. Pass token directly to query/mutation/action calls.
   */
  setAuth: () => {
    console.warn('convexServer.setAuth is deprecated. Pass token directly to query/mutation/action calls instead.');
  },
};
