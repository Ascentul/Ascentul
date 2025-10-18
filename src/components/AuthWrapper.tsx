'use client'

import React, { useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { isLoaded: authLoaded } = useAuth()
  const router = useRouter()
  const [redirectPath, setRedirectPath] = useState<string | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [creationStartTime, setCreationStartTime] = useState<number | null>(null)
  const createUser = useMutation(api.users.createUser)

  // Get user profile from Convex
  const userProfile = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  )


  // Auto-create user profile if authenticated but profile doesn't exist
  useEffect(() => {
    if (!clerkLoaded || !authLoaded || !clerkUser) return

    // userProfile is undefined while loading, null when not found, or an object when found
    // Only create if we know the user doesn't exist (null) and we're not already creating
    if (userProfile === null && !isCreatingUser) {
      // Immediately set flag to prevent race condition
      setIsCreatingUser(true)
      setCreationStartTime(Date.now())

      console.log('[AuthWrapper] Creating user profile for:', clerkUser.id)
      createUser({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.username || 'User',
        username: clerkUser.username || undefined,
      })
        .then(() => {
          console.log('[AuthWrapper] User profile created successfully')
          // Don't reset isCreatingUser - let the query refresh handle the state transition
          // The userProfile will update to an object, which will end the loading state
        })
        .catch((error) => {
          console.error('[AuthWrapper] Failed to create user profile:', error)
          setIsCreatingUser(false)
          setCreationStartTime(null)
        })
    }
  }, [clerkUser, userProfile, clerkLoaded, authLoaded, isCreatingUser])

  // Timeout mechanism: reset creating state if query doesn't refresh within 10 seconds
  useEffect(() => {
    if (!isCreatingUser || !creationStartTime) return

    const CREATION_TIMEOUT_MS = 10000 // 10 seconds
    const elapsed = Date.now() - creationStartTime

    if (elapsed >= CREATION_TIMEOUT_MS) {
      console.warn('[AuthWrapper] User creation timed out - resetting state')
      setIsCreatingUser(false)
      setCreationStartTime(null)
      return
    }

    const remainingTime = CREATION_TIMEOUT_MS - elapsed
    const timer = setTimeout(() => {
      console.warn('[AuthWrapper] User creation timed out - resetting state')
      setIsCreatingUser(false)
      setCreationStartTime(null)
    }, remainingTime)

    return () => clearTimeout(timer)
  }, [isCreatingUser, creationStartTime])

  // Reset creation state when userProfile successfully loads
  useEffect(() => {
    if (userProfile && isCreatingUser) {
      console.log('[AuthWrapper] User profile loaded successfully')
      setIsCreatingUser(false)
      setCreationStartTime(null)
    }
  }, [userProfile, isCreatingUser])

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
  // userProfile is undefined while loading, null when user doesn't exist, or object when found
  const isQueryLoading = clerkUser && userProfile === undefined
  const shouldShowLoading = !clerkLoaded || !authLoaded || isQueryLoading || isCreatingUser

  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isCreatingUser ? 'Setting up your account...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
