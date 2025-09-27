import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/providers/ConvexClientProvider'
import { ClerkAuthProvider } from '@/contexts/ClerkAuthProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { AuthWrapper } from '@/components/AuthWrapper'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ascentful - Career Development Platform',
  description: 'AI-powered career development and job search platform',
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Handle missing Clerk key during build
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  return (
    <html lang="en">
        <head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body className={inter.className}>
          {/* Header removed: SignIn/SignUp bar for signed-out users */}
          {publishableKey ? (
            <ClerkProvider
              publishableKey={publishableKey}
              signInFallbackRedirectUrl="/dashboard"
              signUpFallbackRedirectUrl="/dashboard"
            >
              <ConvexClientProvider>
                <ClerkAuthProvider>
                  <QueryProvider>
                    <AuthWrapper>
                      {children}
                    </AuthWrapper>
                    <Toaster />
                  </QueryProvider>
                </ClerkAuthProvider>
              </ConvexClientProvider>
            </ClerkProvider>
          ) : (
            <ConvexClientProvider>
              <ClerkAuthProvider>
                <QueryProvider>
                  <AuthWrapper>
                    {children}
                  </AuthWrapper>
                  <Toaster />
                </QueryProvider>
              </ClerkAuthProvider>
            </ConvexClientProvider>
          )}
        </body>
      </html>
  )
}