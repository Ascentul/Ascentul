'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';

interface DebugResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

async function fetchDebug(url: string): Promise<DebugResponse> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const contentType = res.headers.get('content-type') ?? '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await res.json() : await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (error: unknown) {
    return {
      ok: false,
      status: 0,
      body: { error: error instanceof Error ? error.message : 'Unknown error' },
    };
  }
}

export default function DebugAuthPage() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  const [tokenResult, setTokenResult] = useState<DebugResponse | null>(null);
  const [profileResult, setProfileResult] = useState<DebugResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [token, profile] = await Promise.all([
        fetchDebug('/api/debug/token'),
        fetchDebug('/api/debug/profile'),
      ]);

      if (!cancelled) {
        setTokenResult(token);
        setProfileResult(profile);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Auth Debug Panel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inspect client-side Clerk state and server API responses for debugging authentication issues.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-foreground">Client (Clerk Hooks)</h2>
        <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-foreground">auth.isLoaded</dt>
            <dd>{String(authLoaded)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-foreground">auth.isSignedIn</dt>
            <dd>{String(isSignedIn)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-foreground">user.isLoaded</dt>
            <dd>{String(userLoaded)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-foreground">user.id</dt>
            <dd>{user?.id ?? '—'}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="font-medium text-foreground">user.primaryEmail</dt>
            <dd>{user?.primaryEmailAddress?.emailAddress ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-foreground">Server (Debug APIs)</h2>
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">/api/debug/token</h3>
            <DebugBlock response={tokenResult} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">/api/debug/profile</h3>
            <DebugBlock response={profileResult} />
          </div>
        </div>
      </section>
    </main>
  );
}

function DebugBlock({ response }: { response: DebugResponse | null }) {
  if (!response) {
    return (
      <div className="mt-1 rounded-md border border-dashed border-muted bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!response.ok) {
    return (
      <div className="mt-1 space-y-1 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
        <p className="font-medium">
          Request failed (status {response.status || 'network error'})
        </p>
        <pre className="whitespace-pre-wrap break-words text-[11px]">
          {typeof response.body === 'string'
            ? response.body
            : JSON.stringify(response.body, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <pre className="mt-1 max-h-64 overflow-auto rounded-md border bg-muted/50 px-3 py-2 text-xs text-foreground">
      {JSON.stringify(response.body, null, 2)}
    </pre>
  );
}
