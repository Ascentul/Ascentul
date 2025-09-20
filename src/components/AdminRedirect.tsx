// This component is deprecated in favor of AuthWrapper and middleware-based redirects
// Keeping for backward compatibility but no longer used

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/ClerkAuthProvider'

interface AdminRedirectProps {
  children: React.ReactNode
  fallbackPath?: string
}

export function AdminRedirect({ children, fallbackPath = '/dashboard' }: AdminRedirectProps) {
  const { user, isLoading, isSignedIn } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Don't redirect if we're already loading or not signed in
    if (isLoading || !isSignedIn || hasRedirected) return

    // Only redirect if we have a user and we're on the dashboard
    if (user && pathname.startsWith('/dashboard')) {
      const userRole = user.role
      let targetPath = fallbackPath

      // Determine the correct dashboard based on role
      if (userRole === 'super_admin' || userRole === 'admin') {
        targetPath = '/admin'
      } else if (userRole === 'university_admin') {
        targetPath = '/university'
      }

      // Only redirect if we're not already on the target path
      if (pathname !== targetPath) {
        setHasRedirected(true)
        router.push(targetPath)
        return
      }
    }

    // If we're not on dashboard or don't need redirect, mark as complete
    setHasRedirected(true)
  }, [user, isLoading, isSignedIn, pathname, router, fallbackPath, hasRedirected])

  // Show loading state while determining redirect
  if (isLoading || !isSignedIn || !hasRedirected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Render children once redirect logic is complete
  return <>{children}</>
}
