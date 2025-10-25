'use client'

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs'
import { useMemo } from 'react'

export interface SubscriptionInfo {
  isPremium: boolean
  isActive: boolean
  isUniversity: boolean
  planType: 'free' | 'premium_monthly' | 'premium_annual' | 'university'
  planName: string
  isLoading: boolean
}

/**
 * Hook to check user's subscription status via Clerk Billing
 *
 * Clerk Billing uses the has() method server-side to check subscriptions.
 * For client components, we check the user's subscription metadata that
 * Clerk automatically syncs after payment.
 *
 * Note: In production, Clerk automatically updates user metadata when
 * subscriptions change. Plan slugs should match those in Clerk Dashboard.
 *
 * Usage:
 * ```tsx
 * const { isPremium, planType, isLoading } = useSubscription()
 * if (isPremium && !isLoading) {
 *   // Show premium features
 * }
 * ```
 */
export function useSubscription(): SubscriptionInfo {
  const { user, isLoaded } = useUser()
  const { has } = useClerkAuth()

  return useMemo(() => {
    if (!isLoaded || !user) {
      return {
        isPremium: false,
        isActive: false,
        isUniversity: false,
        planType: 'free',
        planName: 'Free',
        isLoading: !isLoaded,
      }
    }

    const metadata = user.publicMetadata as any

    // Check if user is part of a university (legacy/admin-assigned)
    const isUniversity = metadata?.role === 'student' || metadata?.university_id

    // Use Clerk's built-in has() method to check subscription plans
    // This is the official way to check Clerk Billing subscriptions
    // Note: "premium_monthly" plan includes both monthly AND annual billing options
    const hasPremium = has?.({ plan: 'premium_monthly' }) ?? false

    const isPremium = hasPremium || isUniversity

    // Determine specific plan type
    let planType: SubscriptionInfo['planType'] = 'free'
    let planName = 'Free'

    if (isUniversity) {
      planType = 'university'
      planName = 'University'
    } else if (hasPremium) {
      // We can't distinguish monthly vs annual from has() alone
      // Both are under the same plan key "premium_monthly"
      planType = 'premium_monthly'
      planName = 'Premium'
    }

    // DEBUG: Log subscription check results
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[useSubscription] Plan check:', {
        hasPremium,
        isPremium,
        planType,
        metadata
      })
    }

    return {
      isPremium,
      isActive: isPremium,
      isUniversity,
      planType,
      planName,
      isLoading: false,
    }
  }, [user, isLoaded, has])
}

/**
 * Server-side helpers moved to src/lib/subscription-server.ts
 *
 * Import server-side helpers like this:
 * ```tsx
 * import { checkPremiumAccess, checkPlan, checkFeature } from '@/lib/subscription-server'
 * ```
 */
