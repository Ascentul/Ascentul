import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedOut,
} from '@clerk/nextjs'
import ConvexClientProvider from '@/providers/ConvexClientProvider'
import { ClerkAuthProvider } from '@/contexts/ClerkAuthProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ascentul - Career Development Platform',
  description: 'AI-powered career development and job search platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        </head>
        <body className={inter.className}>
          <SignedOut>
            <header className="flex justify-end items-center p-4 gap-4 h-16">
              <SignInButton />
              <SignUpButton>
                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </header>
          </SignedOut>
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