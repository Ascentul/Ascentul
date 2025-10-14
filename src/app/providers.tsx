'use client';

import { useEffect, useState } from 'react';
import ConvexClientProvider from '@/providers/ConvexClientProvider';
import { ClerkAuthProvider } from '@/contexts/ClerkAuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthWrapper } from '@/components/AuthWrapper';
import { Toaster } from '@/components/ui/toaster';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    const message =
      'Clerk publishable key is missing. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env.local file.';
    if (process.env.NODE_ENV !== 'production') {
      console.error(message);
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-yellow-50 px-6 text-center text-yellow-900">
          <div className="max-w-md space-y-3 rounded-lg border border-yellow-300 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold">Clerk configuration missing</p>
            <p className="text-sm">
              {message} Restart the dev server after updating the environment variable.
            </p>
          </div>
        </div>
      );
    }
    throw new Error(message);
  }

  return (
    <ConvexClientProvider>
      <ClerkAuthProvider>
        <QueryProvider>
          <AuthWrapper>{children}</AuthWrapper>
          <Toaster />
        </QueryProvider>
      </ClerkAuthProvider>
    </ConvexClientProvider>
  );
}

export function ClerkLoadingFallback() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background/95 text-foreground">
      {!timedOut ? (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading your account…</p>
        </>
      ) : (
        <div className="max-w-sm rounded-lg border bg-background p-6 shadow-lg text-center">
          <p className="text-sm font-medium">Still waiting for Clerk to respond.</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Please refresh the page, confirm your internet connection, and verify
            that <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> is set correctly in <code>.env.local</code>.
          </p>
        </div>
      )}
    </div>
  );
}
