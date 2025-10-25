'use client'

import React from 'react'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, TrendingUp, Users, Zap } from 'lucide-react'
import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
  const { isSignedIn, subscription, hasPremium } = useAuth()
  const router = useRouter()

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

        {/* Clerk Billing Pricing Table */}
        <div className="mb-16">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
              <CardDescription>
                Select the plan that best fits your career goals. You can upgrade or downgrade at any time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Clerk PricingTable Component handles plan display, checkout, and payment */}
              <div className="clerk-pricing-table-wrapper">
                <PricingTable />
              </div>

              {/* Free plan option */}
              <div className="border-t pt-6 mt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Not ready to subscribe?
                  </p>
                  <Button variant="outline" asChild>
                    <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                      {isSignedIn ? "Continue with Free Plan" : "Get Started Free"}
                    </Link>
                  </Button>
                </div>
              </div>
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