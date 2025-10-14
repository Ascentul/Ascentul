'use client';

import { useAuth, useUser } from '@clerk/nextjs';

export function DevClerkPanel() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  // Use explicit opt-in flag instead of NODE_ENV to prevent accidental production exposure
  // NEXT_PUBLIC_SHOW_DEV_PANEL must be explicitly set to "true" to show the panel
  if (process.env.NEXT_PUBLIC_SHOW_DEV_PANEL !== 'true') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-xs rounded-md border border-blue-200 bg-white p-4 text-xs text-blue-900 shadow-lg">
      <p className="font-semibold text-blue-800">Clerk Dev State</p>
      <dl className="mt-2 space-y-1">
        <div className="flex justify-between gap-2">
          <dt>auth.isLoaded</dt>
          <dd>
            <span className={authLoaded ? "text-green-600" : "text-gray-400"}>
              {authLoaded ? "✓" : "○"}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>user.isLoaded</dt>
          <dd>
            <span className={userLoaded ? "text-green-600" : "text-gray-400"}>
              {userLoaded ? "✓" : "○"}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>isSignedIn</dt>
          <dd>
            <span className={isSignedIn ? "text-green-600" : "text-gray-400"}>
              {isSignedIn ? "✓" : "○"}
            </span>
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>User ID</dt>
          <dd className="truncate">{user?.id ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Email</dt>
          <dd className="truncate">
            {user?.primaryEmailAddress?.emailAddress ?? '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
