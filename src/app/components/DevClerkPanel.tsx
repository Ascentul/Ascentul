'use client';

import { useAuth, useUser } from '@clerk/nextjs';

export function DevClerkPanel() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-xs rounded-md border border-blue-200 bg-white p-4 text-xs text-blue-900 shadow-lg">
      <p className="font-semibold text-blue-800">Clerk Dev State</p>
      <dl className="mt-2 space-y-1">
        <div className="flex justify-between gap-2">
          <dt>auth.isLoaded</dt>
          <dd>{String(authLoaded)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>user.isLoaded</dt>
          <dd>{String(userLoaded)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>isSignedIn</dt>
          <dd>{String(isSignedIn)}</dd>
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
