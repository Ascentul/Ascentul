import { auth } from '@clerk/nextjs/server';

/**
 * Helper to fetch a Convex auth token from Clerk.
 * Throws if the user is unauthenticated or the token cannot be fetched.
 */
export async function requireConvexToken() {
  const { userId, getToken } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  const token = await getToken({ template: 'convex' });
  if (!token) {
    throw new Error('Failed to obtain auth token');
  }
  return { userId, token };
}
