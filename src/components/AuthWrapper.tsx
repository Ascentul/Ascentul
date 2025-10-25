'use client'

import React, { useEffect, useState } from 'react'
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/ClerkAuthProvider'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { isLoaded: authLoaded } = useClerkAuth()
  const { user: userProfile } = useAuth() // Use context instead of separate query
  const router = useRouter()
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  useEffect(() => {
    // Wait for all auth states to be loaded
    if (!clerkLoaded || !authLoaded) return

    // If we have a user profile, determine the correct redirect
    if (clerkUser && userProfile) {
      const userRole = userProfile.role
      let targetPath = '/dashboard'

      // Determine the correct dashboard based on role
      if (userRole === 'super_admin') {
        targetPath = '/admin'
      } else if (userRole === 'university_admin' || userRole === 'advisor') {
        targetPath = '/university'
      }

      setRedirectPath(targetPath)
    }
  }, [clerkUser, userProfile, clerkLoaded, authLoaded])

  // If we need to redirect, do it now
  useEffect(() => {
    if (redirectPath && window.location.pathname !== redirectPath) {
      router.push(redirectPath)
    }
  }, [redirectPath, router])

  // Show loading while determining redirect
  if (!clerkLoaded || !authLoaded || (clerkUser && !userProfile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
