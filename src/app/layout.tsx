import '../styles/globals.css';

import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';

import { AuthWrapper } from '@/components/AuthWrapper';
import { Toaster } from '@/components/ui/toaster';
import { ClerkAuthProvider } from '@/contexts/ClerkAuthProvider';
import { ImpersonationProvider } from '@/contexts/ImpersonationContext';
import ConvexClientProvider from '@/providers/ConvexClientProvider';
import { QueryProvider } from '@/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Ascentful - Career Development Platform',
  description: 'AI-powered career development and job search platform',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Handle missing Clerk key during build
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="min-h-screen bg-[#F1F3F9] font-sans">
        {/* Header removed: SignIn/SignUp bar for signed-out users */}
        {publishableKey ? (
          <ClerkProvider
            publishableKey={publishableKey}
            signInFallbackRedirectUrl={
              process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || '/dashboard'
            }
            signUpFallbackRedirectUrl={
              process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || '/dashboard'
            }
          >
            <ConvexClientProvider>
              <ClerkAuthProvider>
                <ImpersonationProvider>
                  <QueryProvider>
                    <AuthWrapper>{children}</AuthWrapper>
                    <Toaster />
                  </QueryProvider>
                </ImpersonationProvider>
              </ClerkAuthProvider>
            </ConvexClientProvider>
          </ClerkProvider>
        ) : (
          <ConvexClientProvider>
            <ClerkAuthProvider>
              <ImpersonationProvider>
                <QueryProvider>
                  <AuthWrapper>{children}</AuthWrapper>
                  <Toaster />
                </QueryProvider>
              </ImpersonationProvider>
            </ClerkAuthProvider>
          </ConvexClientProvider>
        )}
      </body>
    </html>
  );
}
