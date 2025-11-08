/**
 * Server-side Convex client utility
 *
 * Provides a singleton ConvexHttpClient instance for API routes.
 * Uses server-only CONVEX_URL environment variable (not exposed to browser).
 */

import { ConvexHttpClient } from 'convex/browser';

// Validate environment variable at module load time
const CONVEX_URL = process.env.CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error('CONVEX_URL environment variable is required for server-side Convex operations');
}

/**
 * Singleton ConvexHttpClient instance for server-side use
 *
 * Use this in API routes instead of creating new clients:
 * @example
 * import { convexServer } from '@/lib/convex-server';
 *
 * const user = await convexServer.query(api.users.getUserByClerkId, { clerkId });
 */
export const convexServer = new ConvexHttpClient(CONVEX_URL);
