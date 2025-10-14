import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/nextjs'
import { AppProviders, ClerkLoadingFallback } from './providers'
import { DevClerkPanel } from './components/DevClerkPanel'
import { ConfigurationError } from './components/ConfigurationError'

const inter = Inter({ subsets: ['latin'] })

// Validate environment variables at module level (runs once on import)
const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export const metadata: Metadata = {
  title: 'Ascentful - Career Development Platform',
  description: 'AI-powered career development and job search platform',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Provide graceful error UI instead of crashing the app
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <ConfigurationError
        message="Missing required environment variable"
        envVar="NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
        helpSteps={[
          { text: 'Create or edit .env.local in your project root', code: '.env.local' },
          { text: 'Add: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here', code: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here' },
          { text: 'Get your key from the Clerk Dashboard' },
          { text: 'Restart your development server' },
        ]}
      />
    );
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
          afterSignUpUrl="/dashboard"
        >
          <ClerkLoading>
            <ClerkLoadingFallback />
          </ClerkLoading>

          <ClerkLoaded>
            <AppProviders>{children}</AppProviders>
          </ClerkLoaded>
          <DevClerkPanel />
        </ClerkProvider>
      </body>
    </html>
  )
}
