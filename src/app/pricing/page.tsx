'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Sparkles, TrendingUp, Users, Zap, Crown, Loader2, AlertCircle, ExternalLink } from 'lucide-react'

export default function PricingPage() {
  const { user, isSignedIn } = useAuth()
  const [prices, setPrices] = useState<{ monthly?: { unit_amount: number; currency: string }; annual?: { unit_amount: number; currency: string } }>({})
  const [loadingPrices, setLoadingPrices] = useState(true)
  const [processingPayment, setProcessingPayment] = useState<'monthly' | 'annual' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch dynamic pricing from Stripe via API route
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoadingPrices(true)
        const res = await fetch('/api/stripe/prices', { method: 'GET' })
        if (!res.ok) {
          console.warn('Failed to fetch prices')
          return
        }
        const data = await res.json()
        setPrices(data || {})
      } catch (e) {
        console.warn('Error fetching prices:', e)
        // Silently fail; we can still show upgrade without amount
      } finally {
        setLoadingPrices(false)
      }
    }
    fetchPrices()
  }, [])

  const formatAmount = (cents?: number, currency?: string) => {
    if (typeof cents !== 'number' || !currency) return ''
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100)
    } catch {
      return `$${(cents / 100).toFixed(2)}`
    }
  }

  const openPaymentLink = async (interval: 'monthly' | 'annual') => {
    if (processingPayment) return

    try {
      setProcessingPayment(interval)
      setError(null)

      const monthlyUrl = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY
      const annualUrl = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_ANNUAL
      const base = interval === 'monthly' ? monthlyUrl : annualUrl

      if (!base) {
        throw new Error('Payment link not configured')
      }

      const url = new URL(base)
      // Help Stripe link the session to the current user for webhook reconciliation
      if (user?.email) url.searchParams.set('prefilled_email', user.email)
      if (user?.clerkId) url.searchParams.set('client_reference_id', user.clerkId)

      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500))

      window.location.href = url.toString()
    } catch (e) {
      console.error('Payment link error:', e)
      setError('Unable to process payment. Please try again or contact support.')
      setProcessingPayment(null)
    }
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

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 max-w-2xl mx-auto">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Payment Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 mb-16">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Free</CardTitle>
              </div>
              <CardDescription>Perfect for exploring your career</CardDescription>
              <div className="text-3xl font-bold mt-4">$0</div>
              <div className="text-sm text-muted-foreground">Forever free</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Basic career goal tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Job application tracker</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Basic resume templates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Community access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Limited AI suggestions</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                  {isSignedIn ? "Go to Dashboard" : "Get Started Free"}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Premium Monthly Plan */}
          <Card className={`relative hover:shadow-lg transition-all duration-200 ${processingPayment === 'monthly' ? 'ring-2 ring-primary shadow-lg' : ''}`}>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Premium Monthly</CardTitle>
              </div>
              <CardDescription>Accelerate your career growth</CardDescription>
              <div className="text-3xl font-bold mt-4">
                {loadingPrices ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-lg">Loading...</span>
                  </div>
                ) : (
                  prices.monthly ? formatAmount(prices.monthly.unit_amount, prices.monthly.currency) : '$9.99'
                )}
              </div>
              <div className="text-sm text-muted-foreground">per month</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Everything in Free</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Unlimited AI-powered resume reviews</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Advanced career goal tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Premium cover letter templates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Interview preparation tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Priority customer support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Advanced network management</span>
                </li>
              </ul>
              <Button
                className="w-full"
                onClick={() => isSignedIn ? openPaymentLink('monthly') : window.location.href = '/sign-up'}
                disabled={processingPayment === 'monthly'}
              >
                {processingPayment === 'monthly' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isSignedIn ? (
                  <>
                    Choose Monthly Plan
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "Start Free Trial"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Annual Plan (Best Value) */}
          <Card className={`relative hover:shadow-lg transition-all duration-200 border-primary ${processingPayment === 'annual' ? 'ring-2 ring-primary shadow-lg' : ''}`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                BEST VALUE
              </span>
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Premium Annual</CardTitle>
              </div>
              <CardDescription>Maximum savings and exclusive perks</CardDescription>
              <div className="text-3xl font-bold mt-4">
                {loadingPrices ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-lg">Loading...</span>
                  </div>
                ) : (
                  prices.annual ? formatAmount(prices.annual.unit_amount, prices.annual.currency) : '$99'
                )}
              </div>
              <div className="text-sm text-muted-foreground">per year</div>
              <div className="text-xs text-green-600 font-medium">Save 17% vs monthly</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Everything in Premium Monthly</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">2 months free (17% savings)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Exclusive career coaching sessions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Annual progress reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Early access to new features</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">VIP support channel</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Priority feature requests</span>
                </li>
              </ul>
              <Button
                className="w-full"
                onClick={() => isSignedIn ? openPaymentLink('annual') : window.location.href = '/sign-up'}
                disabled={processingPayment === 'annual'}
              >
                {processingPayment === 'annual' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : isSignedIn ? (
                  <>
                    Choose Annual Plan
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "Start Free Trial"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

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