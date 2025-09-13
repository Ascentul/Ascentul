'use client'

import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface OnboardingGuardProps {
  children: React.ReactNode
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, isLoading, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isSignedIn && user) {
      // If user is signed in but hasn't completed onboarding, redirect to onboarding
      if (!user.onboarding_completed) {
        router.push('/onboarding')
      }
    }
  }, [user, isLoading, isSignedIn, router])

  // Show loading state while checking authentication and user data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If user is signed in but hasn't completed onboarding, show loading while redirecting
  if (isSignedIn && user && !user.onboarding_completed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up your profile...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
