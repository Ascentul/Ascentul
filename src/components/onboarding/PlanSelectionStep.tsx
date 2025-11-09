'use client'

import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanCard } from '@/components/pricing/PlanCard'

interface PlanSelectionStepProps {
  isCheckingOut: string | null
  onCheckout: (interval: 'monthly' | 'annual') => void
  onSkip: () => void
  planFeatures: string[],
}

export function PlanSelectionStep({
  isCheckingOut,
  onCheckout,
  onSkip,
  planFeatures,
}: PlanSelectionStepProps) {
  return (
    <div className="space-y-6">
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl font-bold text-center">Choose Your Plan</CardTitle>
        <CardDescription className="text-center">
          Select the plan that best fits your career goals. You can upgrade or downgrade at any time.
        </CardDescription>
        <p className="mt-6 text-lg md:text-xl font-bold text-brand-blue text-center">
          Save 33% with annual billing
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Custom Pricing Cards */}
        <div className="grid gap-6 md:gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          <PlanCard
            title="Pro Monthly"
            price="$30"
            cadence="month"
            features={planFeatures}
            ctaLabel={isCheckingOut === 'monthly' ? 'Processing...' : 'Subscribe Monthly'}
            onCtaClick={() => onCheckout('monthly')}
            disabled={isCheckingOut !== null}
            totalPrice="$30"
            interval="month"
            hasTrial={true}
          />
          <PlanCard
            title="Pro Annual"
            price="$20"
            cadence="month"
            savings="Save $120/year"
            features={planFeatures}
            ctaLabel={isCheckingOut === 'annual' ? 'Processing...' : 'Subscribe Annually'}
            onCtaClick={() => onCheckout('annual')}
            disabled={isCheckingOut !== null}
            highlighted
            totalPrice="$240"
            interval="year"
            hasTrial={true}
          />
        </div>

        {/* Free plan option */}
        <div className="border-t pt-6 mt-8">
          <div className="text-center">
            <p className="text-sm text-zinc-600 mb-4">
              Not ready to subscribe?
            </p>
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
            >
              Continue with Free Plan
            </Button>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
