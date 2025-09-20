'use client'

import React, { useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { isLoaded: authLoaded } = useAuth()
  const router = useRouter()
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  // Get user profile from Convex
  const userProfile = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  )

  useEffect(() => {
    // Wait for all auth states to be loaded
    if (!clerkLoaded || !authLoaded) return

    // If we have a user profile, determine the correct redirect
    if (clerkUser && userProfile) {
      const userRole = userProfile.role
      let targetPath = '/dashboard'

      // Determine the correct dashboard based on role
      if (userRole === 'super_admin' || userRole === 'admin') {
        targetPath = '/admin'
      } else if (userRole === 'university_admin') {
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
