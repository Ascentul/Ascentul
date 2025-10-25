'use client'

import { useUser, useAuth } from '@clerk/nextjs'
import { useMemo, useEffect, useState } from 'react'

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

    // Clerk Billing syncs subscription data to user metadata
    // When a user subscribes via <PricingTable />, Clerk automatically
    // updates their metadata with subscription details
    const metadata = user.publicMetadata as any

    // Check if user is part of a university (legacy/admin-assigned)
    const isUniversity = metadata?.role === 'student' || metadata?.university_id

    // Clerk Billing sets subscription info after successful payment
    // The exact field names may vary - common patterns include:
    // - subscriptions array with active plans
    // - billing.plan with current plan slug
    // - activeSubscriptions with plan details

    // Check for active subscription via common Clerk Billing patterns
    const subscriptions = metadata?.subscriptions || []
    const currentPlan = metadata?.billing?.plan || metadata?.plan

    // Check if user has premium_monthly or premium_annual plan
    const hasPremiumMonthly = currentPlan === 'premium_monthly' ||
                             subscriptions.some((s: any) => s.plan === 'premium_monthly' && s.status === 'active')
    const hasPremiumAnnual = currentPlan === 'premium_annual' ||
                            subscriptions.some((s: any) => s.plan === 'premium_annual' && s.status === 'active')

    const hasActivePremium = hasPremiumMonthly || hasPremiumAnnual
    const isPremium = hasActivePremium || isUniversity

    // Determine specific plan type
    let planType: SubscriptionInfo['planType'] = 'free'
    let planName = 'Free'

    if (isUniversity) {
      planType = 'university'
      planName = 'University'
    } else if (hasPremiumMonthly) {
      planType = 'premium_monthly'
      planName = 'Premium Monthly'
    } else if (hasPremiumAnnual) {
      planType = 'premium_annual'
      planName = 'Premium Annual'
    }

    return {
      isPremium,
      isActive: isPremium, // If they have premium, subscription is active
      isUniversity,
      planType,
      planName,
      isLoading: false,
    }
  }, [user, isLoaded])
}

/**
 * Server-side helpers moved to src/lib/subscription-server.ts
 *
 * Import server-side helpers like this:
 * ```tsx
 * import { checkPremiumAccess, checkPlan, checkFeature } from '@/lib/subscription-server'
 * ```
 */
