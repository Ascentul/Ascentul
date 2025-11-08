'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlanCard } from '@/components/pricing/PlanCard'
import { TrustRow } from '@/components/pricing/TrustRow'
import { PricingFAQ } from '@/components/pricing/PricingFAQ'
import { Lock } from 'lucide-react'

const PLAN_FEATURES = [
  'Unlimited AI resume reviews',
  'AI career coaching & interview prep',
  'Advanced application tracking',
  'Priority support',
  'All future features included',
]

export default function PricingPage() {
  const { isSignedIn, subscription, hasPremium } = useAuth()
  const { user: clerkUser } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null)

  // Force reload user session after returning from Clerk checkout
  useEffect(() => {
    const sessionRefreshed = searchParams?.get('session_refreshed');

    if (!sessionRefreshed && clerkUser) {
      // Reload the user to get fresh subscription data from Clerk
      clerkUser.reload().then(() => {
        console.log('[PricingPage] User session refreshed after payment');
        // Add URL param to prevent repeated reloads
        const url = new URL(window.location.href);
        url.searchParams.set('session_refreshed', 'true');
        window.history.replaceState({}, '', url);
      }).catch((err) => {
        console.error('[PricingPage] Error refreshing session:', err);
      });
    }
  }, [clerkUser, searchParams]);

  // If user already has premium, redirect to dashboard
  if (hasPremium && !subscription.isLoading) {
    router.push('/dashboard')
    return null
  }

  // Handle checkout
  const handleCheckout = async (interval: 'monthly' | 'annual') => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/pricing')
      return
    }

    setIsCheckingOut(interval)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'premium', interval }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
      setIsCheckingOut(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100/50">
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#5371ff] mb-4 md:mb-6">
            Accelerate Your Career Journey
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto">
            Choose the plan that fits your goals. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <section className="mb-16 md:mb-24">
          <div className="grid gap-6 md:gap-6 md:grid-cols-2 max-w-5xl mx-auto">
            <PlanCard
              title="Premium Monthly"
              price="$30"
              cadence="month"
              subline="Billed monthly"
              features={PLAN_FEATURES}
              ctaLabel={isCheckingOut === 'monthly' ? 'Processing...' : 'Subscribe Monthly'}
              onCtaClick={() => handleCheckout('monthly')}
            />
            <PlanCard
              title="Premium Annual"
              price="$20"
              cadence="month"
              subline="$240 billed annually"
              savings="Save $120/year"
              features={PLAN_FEATURES}
              ctaLabel={isCheckingOut === 'annual' ? 'Processing...' : 'Subscribe Annually'}
              onCtaClick={() => handleCheckout('annual')}
              highlighted
            />
          </div>

          {/* Free Plan CTA */}
          <div className="mt-10 text-center">
            <p className="text-sm text-zinc-600 mb-4">Not ready to subscribe?</p>
            <Button
              variant="ghost"
              asChild
              className="text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
            >
              <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                {isSignedIn ? "Continue with Free Plan" : "Get Started Free"}
              </Link>
            </Button>
          </div>
        </section>

        {/* Trust Row */}
        <section className="mb-16 md:mb-24">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              Why Choose Ascentful?
            </h2>
            <p className="text-base text-zinc-600 max-w-2xl mx-auto">
              Join thousands of professionals accelerating their careers with our comprehensive platform
            </p>
          </div>
          <TrustRow />
        </section>

        {/* FAQ Section */}
        <section className="mb-16 md:mb-24">
          <PricingFAQ />
        </section>

        {/* Fine Print / Trust Indicators */}
        <section className="border-t border-zinc-200 pt-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-600">
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>Secure payment powered by Stripe</span>
            </div>
            <p className="text-xs text-zinc-500">
              Cancel anytime • 30-day money-back guarantee • Used by 10,000+ professionals
            </p>
            {!isSignedIn && (
              <div className="pt-6">
                <Button asChild size="lg" className="px-8">
                  <Link href="/sign-up">Start Your Career Journey Today</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
