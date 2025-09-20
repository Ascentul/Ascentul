import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import ConvexClientProvider from '@/providers/ConvexClientProvider'
import { ClerkAuthProvider } from '@/contexts/ClerkAuthProvider'
import { QueryProvider } from '@/providers/QueryProvider'
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
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body className={inter.className}>
          {/* Header removed: SignIn/SignUp bar for signed-out users */}
          <ConvexClientProvider>
            <ClerkAuthProvider>
              <QueryProvider>
                {children}
                <Toaster />
              </QueryProvider>
            </ClerkAuthProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}