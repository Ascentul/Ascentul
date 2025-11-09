'use client'

import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanCard } from '@/components/pricing/PlanCard'
import { PRICING } from '@/constants/pricing'

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
          Save {PRICING.annual.savingsPercentage} with annual billing
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Custom Pricing Cards */}
        <div className="grid gap-6 md:gap-6 md:grid-cols-2 max-w-5xl mx-auto">
          <PlanCard
            title={PRICING.monthly.title}
            price={PRICING.monthly.price}
            cadence="month"
            features={planFeatures}
            ctaLabel={isCheckingOut === 'monthly' ? 'Processing...' : 'Subscribe Monthly'}
            onCtaClick={() => onCheckout('monthly')}
            disabled={isCheckingOut !== null}
            hasTrial
          />
          <PlanCard
            title={PRICING.annual.title}
            price={PRICING.annual.price}
            cadence="month"
            savings={PRICING.annual.savings}
            features={planFeatures}
            ctaLabel={isCheckingOut === 'annual' ? 'Processing...' : 'Subscribe Annually'}
            onCtaClick={() => onCheckout('annual')}
            disabled={isCheckingOut !== null}
            highlighted
            hasTrial
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
