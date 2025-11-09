'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useUser } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { PlanSelectionStep } from './PlanSelectionStep'
import { EducationStep } from './EducationStep'
import { DreamJobStep } from './DreamJobStep'

interface OnboardingData {
  major: string
  graduationYear: string
  dreamJob: string
}

const defaultOnboardingData: OnboardingData = {
  major: '',
  graduationYear: '',
  dreamJob: '',
}

const PLAN_FEATURES = [
  'Advanced application tracking',
  'Smart career path insights',
  'Resume & Cover Letter Studios',
  'AI Career Coach',
  'Priority Support',
]

export function OnboardingFlow() {
  const { user, subscription, hasPremium, isSignedIn } = useAuth()
  const { user: clerkUser } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null)

  // Force reload user session after returning from Clerk checkout
  useEffect(() => {
    const sessionRefreshed = searchParams?.get('session_refreshed')

    if (!sessionRefreshed && clerkUser) {
      // Reload the user to get fresh subscription data from Clerk
      clerkUser.reload().then(() => {
        // Add URL param to prevent repeated reloads
        const url = new URL(window.location.href)
        url.searchParams.set('session_refreshed', 'true')
        window.history.replaceState({}, '', url)
      }).catch((err) => {
        console.error('[OnboardingFlow] Error refreshing session:', err)
      })
    }
  }, [clerkUser, searchParams])

  // Convex mutations
  const updateUser = useMutation(api.users.updateUser)

  // Check if user should skip plan selection
  // University users and users who already subscribed skip plan selection
  const isUniversityUser = user?.university_id !== null && user?.university_id !== undefined
  const shouldSkipPlanSelection = isUniversityUser || hasPremium

  // Dynamically calculate steps
  const totalSteps = shouldSkipPlanSelection ? 2 : 3
  const planSelectionStep = 1
  const educationStep = shouldSkipPlanSelection ? 1 : 2
  const dreamJobStep = shouldSkipPlanSelection ? 2 : 3

  const [step, setStep] = useState<number>(shouldSkipPlanSelection ? educationStep : planSelectionStep)
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData)
  const [progress, setProgress] = useState<number>(0)
  const [isSavingOnboarding, setIsSavingOnboarding] = useState<boolean>(false)

  // Update progress bar based on current step
  useEffect(() => {
    setProgress(Math.floor((step / totalSteps) * 100))
  }, [step, totalSteps])

  // If user subscribes during onboarding, auto-advance to next step
  useEffect(() => {
    if (step === planSelectionStep && hasPremium && !subscription.isLoading) {
      toast({
        title: 'Subscription activated!',
        description: `Welcome to ${subscription.planName}!`,
        variant: 'success',
      })
      setStep(educationStep)
    }
  }, [hasPremium, subscription, step, planSelectionStep, educationStep, toast])

  const handleDataChange = (key: keyof OnboardingData, value: string) => {
    setData((prevData) => ({
      ...prevData,
      [key]: value,
    }))
  }

  const handleNext = async () => {
    if (step === dreamJobStep) {
      // Final step - save onboarding data
      const success = await saveOnboardingData()
      if (!success) {
        toast({
          title: 'Error saving onboarding data',
          description:
            'There was an error saving your profile information. Please try again.',
          variant: 'destructive',
        })
      }
    } else if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    const minStep = shouldSkipPlanSelection ? educationStep : planSelectionStep
    if (step > minStep) {
      setStep(step - 1)
    }
  }

  const handleSkipPlanSelection = () => {
    // User chooses free plan - move to next step
    setStep(educationStep)
  }

  // Handle checkout
  const handleCheckout = async (interval: 'monthly' | 'annual') => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/onboarding')
      return
    }

    setIsCheckingOut(interval)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

      try {
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: 'premium', interval, returnUrl: '/onboarding' }),
          signal: controller.signal,
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to create checkout session')
        }

        if (data?.url) {
          window.location.href = data.url
        } else {
          throw new Error('No checkout URL returned')
        }
      } finally {
        clearTimeout(timeoutId)
      }
    } catch (error) {
      console.error('[OnboardingFlow] Checkout error:', error)
      toast({
        variant: 'destructive',
        title: 'Checkout Failed',
        description: error instanceof Error && error.name === 'AbortError'
          ? 'Request timed out. Please try again.'
          : 'Failed to start checkout. Please try again.',
      })
      setIsCheckingOut(null)
    }
  }

  const saveOnboardingData = async () => {
    if (!user) return false

    try {
      setIsSavingOnboarding(true)

      await updateUser({
        clerkId: user.clerkId,
        updates: {
          major: data.major,
          graduation_year: data.graduationYear,
          dream_job: data.dreamJob,
          onboarding_completed: true,
        },
      })

      toast({
        title: 'Welcome to Ascentful!',
        description: 'Your profile has been set up successfully.',
        variant: 'success',
      })

      // Use client-side navigation - dashboard will handle data fetching
      router.push('/dashboard')
      return true
    } catch (error) {
      console.error('Error saving onboarding data:', error)
      return false
    } finally {
      setIsSavingOnboarding(false)
    }
  }

  const renderStep = () => {
    // Plan Selection Step
    if (!shouldSkipPlanSelection && step === planSelectionStep) {
      return (
        <PlanSelectionStep
          isCheckingOut={isCheckingOut}
          onCheckout={handleCheckout}
          onSkip={handleSkipPlanSelection}
          planFeatures={PLAN_FEATURES}
        />
      )
    }

    // Education Step
    if (step === educationStep) {
      return (
        <EducationStep
          major={data.major}
          graduationYear={data.graduationYear}
          onMajorChange={(value) => handleDataChange('major', value)}
          onGraduationYearChange={(value) => handleDataChange('graduationYear', value)}
          onNext={handleNext}
          onBack={!shouldSkipPlanSelection ? handleBack : undefined}
        />
      )
    }

    // Dream Job Step
    if (step === dreamJobStep) {
      return (
        <DreamJobStep
          dreamJob={data.dreamJob}
          onDreamJobChange={(value) => handleDataChange('dreamJob', value)}
          onComplete={handleNext}
          onBack={handleBack}
          isSaving={isSavingOnboarding}
        />
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Progress value={progress} className="w-full [&>div]:bg-brand-blue" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Step {step} of {totalSteps}
            </p>
          </div>

          <Card className="w-full">{renderStep()}</Card>
        </div>
      </div>
    </div>
  );
}
