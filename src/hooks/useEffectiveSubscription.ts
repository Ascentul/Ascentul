'use client'

import { useMemo } from 'react'
import { useSubscription, type SubscriptionInfo } from './useSubscription'
import { useImpersonation } from '@/contexts/ImpersonationContext'

/**
 * Extended subscription info that includes impersonation state
 */
export interface EffectiveSubscriptionInfo extends SubscriptionInfo {
  isImpersonated: boolean
  actualSubscription: SubscriptionInfo
}

/**
 * Hook that returns effective subscription status, respecting impersonation mode.
 *
 * When a super_admin is impersonating a role:
 * - Returns the impersonated plan (free, premium, or university)
 * - Sets isImpersonated to true
 * - Provides actualSubscription for reference
 *
 * When not impersonating:
 * - Returns the real subscription from Clerk
 * - Sets isImpersonated to false
 *
 * Usage:
 * ```tsx
 * const { isPremium, isImpersonated, planType } = useEffectiveSubscription()
 * if (isPremium && !isLoading) {
 *   // Show premium features (works for both real and impersonated subscriptions)
 * }
 * ```
 */
export function useEffectiveSubscription(): EffectiveSubscriptionInfo {
  const realSubscription = useSubscription()
  const impersonationContext = useImpersonation()

  return useMemo(() => {
    // If not impersonating, return real subscription
    if (!impersonationContext.impersonation.isImpersonating) {
      return {
        ...realSubscription,
        isImpersonated: false,
        actualSubscription: realSubscription,
      }
    }

    const impersonatedPlan = impersonationContext.impersonation.plan

    // Map impersonated plan to subscription info
    let planType: SubscriptionInfo['planType'] = 'free'
    let planName = 'Free'
    let isPremium = false
    let isUniversity = false

    switch (impersonatedPlan) {
      case 'university':
        planType = 'university'
        planName = 'University'
        isPremium = true
        isUniversity = true
        break
      case 'premium':
        planType = 'premium_monthly'
        planName = 'Premium'
        isPremium = true
        break
      case 'free':
      default:
        planType = 'free'
        planName = 'Free'
        isPremium = false
        break
    }

    return {
      isPremium,
      isActive: isPremium,
      isUniversity,
      planType,
      planName,
      isLoading: false,
      isImpersonated: true,
      actualSubscription: realSubscription,
    }
  }, [realSubscription, impersonationContext])
}
