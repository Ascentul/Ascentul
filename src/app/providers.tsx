'use client';

import { useEffect, useState } from 'react';
import ConvexClientProvider from '@/providers/ConvexClientProvider';
import { ClerkAuthProvider } from '@/contexts/ClerkAuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthWrapper } from '@/components/AuthWrapper';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const CLERK_LOADING_TIMEOUT_MS = 6000;

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    const message =
      'Clerk publishable key is missing. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env.local file.';
    console.error(message);

    // In development, show detailed error with instructions
    if (process.env.NODE_ENV !== 'production') {
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

    // In production, show user-friendly error without exposing technical details
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center text-gray-900">
        <div className="max-w-md space-y-3 rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold">Configuration Error</p>
          <p className="text-sm">
            Unable to load the application. Please contact support if this issue persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ConvexClientProvider>
      <ClerkAuthProvider>
        <QueryProvider>
          <TooltipProvider delayDuration={200}>
            <AuthWrapper>{children}</AuthWrapper>
            <Toaster />
          </TooltipProvider>
        </QueryProvider>
      </ClerkAuthProvider>
    </ConvexClientProvider>
  );
}

export function ClerkLoadingFallback() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), CLERK_LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
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
