'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TrendingUp, Users, Zap } from 'lucide-react'

export default function PricingPage() {
  const { isSignedIn, subscription, hasPremium } = useAuth()
  const { user: clerkUser } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Accelerate Your Career Journey
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Choose the plan that fits your career goals and unlock powerful tools to build, track, and advance your professional life.
          </p>
        </div>

        {/* Pricing Table */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-black">
              Choose Your Plan
            </h2>
            <p className="mt-3 text-base text-neutral-600">
              Select the plan that fits your career goals. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly */}
            <div className="rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur-sm shadow-sm p-6 md:p-8">
              <h3 className="text-xl font-semibold text-black">Premium Monthly</h3>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-5xl font-extrabold text-black">$30</span>
                <span className="mb-2 text-neutral-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">Billed monthly</p>

              <ul className="mt-6 space-y-3 text-sm">
                {[
                  'Unlimited AI resume reviews',
                  'AI career coaching & interview prep',
                  'Advanced application tracking',
                  'Priority support',
                  'All future features included',
                ].map((i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 text-[#5271FF]">✓</span>
                    <span className="text-neutral-800">{i}</span>
                  </li>
                ))}
              </ul>

              <button className="mt-8 w-full rounded-xl bg-black px-5 py-3 text-white font-semibold hover:opacity-90 transition">
                Subscribe Monthly
              </button>
            </div>

            {/* Annual */}
            <div className="rounded-2xl border-2 border-[#5271FF] bg-white shadow-md p-6 md:p-8 relative">
              <span className="absolute -top-3 left-6 rounded-full bg-[#5271FF] px-3 py-1 text-xs font-semibold text-white">
                Best Value
              </span>

              <h3 className="text-xl font-semibold text-black">Premium Annual</h3>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-5xl font-extrabold text-black">$20</span>
                <span className="mb-2 text-neutral-500">/month</span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                $240 billed annually <span className="text-[#5271FF] font-semibold">Save $120/year</span>
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                {[
                  'Unlimited AI resume reviews',
                  'AI career coaching & interview prep',
                  'Advanced application tracking',
                  'Priority support',
                  'All future features included',
                ].map((i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 text-[#5271FF]">✓</span>
                    <span className="text-neutral-800">{i}</span>
                  </li>
                ))}
              </ul>

              <button className="mt-8 w-full rounded-xl bg-black px-5 py-3 text-white font-semibold hover:opacity-90 transition">
                Subscribe Annually
              </button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-500 mb-3">Not ready to subscribe?</p>
            <Button variant="outline" asChild className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">
              <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                {isSignedIn ? "Continue with Free Plan" : "Get Started Free"}
              </Link>
            </Button>
          </div>
        </section>

        {/* Features Comparison */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Ascentful?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of professionals accelerating their careers with our comprehensive platform
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mb-16">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Career Growth</h3>
            <p className="text-muted-foreground">
              Track your progress, set meaningful goals, and accelerate your professional development with AI-powered insights.
            </p>
          </div>
          <div className="text-center">
            <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI-Powered Tools</h3>
            <p className="text-muted-foreground">
              Leverage cutting-edge AI to optimize your resume, practice interviews, and get personalized career advice.
            </p>
          </div>
          <div className="text-center">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Professional Network</h3>
            <p className="text-muted-foreground">
              Connect with like-minded professionals, mentors, and industry experts to expand your career opportunities.
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            🔒 Secure payment powered by Stripe
          </p>
          <p className="text-xs text-muted-foreground">
            Cancel anytime • 30-day money-back guarantee • Used by 10,000+ professionals
          </p>
          {!isSignedIn && (
            <div className="pt-4">
              <Button asChild size="lg">
                <Link href="/sign-up">Start Your Career Journey Today</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}