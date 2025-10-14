'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/**
 * Hook to check if Clerk authentication state has been determined.
 *
 * Timeout Duration: 6 seconds was chosen as a reasonable threshold for network requests.
 * This accounts for slow connections while avoiding indefinite waiting. Most auth checks
 * complete within 1-2 seconds on average connections.
 *
 * Handling timedOut State:
 * When timedOut is true, consuming code should:
 * 1. Display an error message to the user (e.g., "Authentication service is unavailable")
 * 2. Provide a retry mechanism (e.g., refresh button or "Try again" action)
 * 3. Consider allowing offline/degraded functionality if applicable
 * 4. Log the timeout for monitoring/debugging purposes
 *
 * @returns {Object} - Object containing:
 *   - ready: true when Clerk has loaded and determined authentication state
 *   - timedOut: true if Clerk takes longer than 6 seconds to load
 *   - isLoaded: true when Clerk's auth state is loaded
 *   - isSignedIn: true when user is authenticated (only valid when isLoaded is true)
 *
 * @example
 * const { ready, timedOut, isSignedIn } = useClerkReady();
 *
 * if (timedOut) {
 *   return <ErrorMessage message="Auth timeout" onRetry={() => window.location.reload()} />;
 * }
 * if (!ready) {
 *   return <LoadingSpinner />;
 * }
 * if (!isSignedIn) {
 *   return <SignInPrompt />;
 * }
 * return <AuthenticatedContent />;
 */
export function useClerkReady() {
  const { isLoaded, isSignedIn } = useAuth();
  // ready indicates Clerk has loaded and determined auth state (signed in OR out)
  const ready = isLoaded;
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (ready) {
      setTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(timer);
  }, [ready]);

  return { ready, timedOut, isLoaded, isSignedIn };
}
