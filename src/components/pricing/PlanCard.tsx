import Link from 'next/link'
import { Check, BadgeCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type PlanCardProps = {
  title: string
  price: string
  cadence: 'month' | 'year'
  subline?: string
  savings?: string
  features: string[]
  ctaLabel: string
  ctaHref?: string
  onCtaClick?: () => void | Promise<void>
  highlighted?: boolean
  totalPrice?: string
  interval?: 'month' | 'year'
  hasTrial?: boolean
  disabled?: boolean
}

const ctaButtonClasses = "mt-8 w-full h-11 rounded-xl bg-black text-white hover:bg-black/90 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200"

export function PlanCard({
  title,
  price,
  cadence,
  subline,
  savings,
  features,
  ctaLabel,
  ctaHref,
  onCtaClick,
  highlighted = false,
  totalPrice,
  interval,
  hasTrial = false,
  disabled = false,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border p-8 md:p-10 transition-all duration-300 ease-out will-change-transform',
        highlighted
          ? 'border-neutral-200/80 bg-white shadow-sm ring-1 ring-brand-blue/30 hover:ring-brand-blue/40 hover:shadow-md hover:-translate-y-1'
          : 'border-neutral-200/80 bg-white shadow-sm hover:shadow-md hover:-translate-y-1'
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 left-6 rounded-full bg-brand-blue text-white px-2 py-0.5 text-[11px] font-medium shadow-sm" aria-label="Best value plan">
          Best Value
        </span>
      )}

      <h3 className="text-lg font-semibold text-zinc-900 truncate" title={title}>
        {title}
      </h3>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-5xl font-extrabold tracking-tight text-black">
          {price}
        </span>
        <span className="text-sm text-neutral-500 ml-1">/{cadence}</span>
      </div>

      {subline && (
        <p className="mt-1 text-xs text-neutral-500">
          {subline}
          {savings && (
            <span className="ml-2 text-brand-blue font-medium">{savings}</span>
          )}
        </p>
      )}

      {hasTrial && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-brand-blue/25 bg-brand-blue/8 px-2 py-0.5 text-xs font-medium text-brand-blue" aria-label="7 day free trial included">
          <BadgeCheck className="h-3 w-3" aria-hidden="true" />
          7 day free trial
        </div>
      )}

      <ul className="mt-6 space-y-3" role="list">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-black">
            <Check className="h-5 w-5 text-brand-blue flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div>
        {onCtaClick ? (
          <Button
            onClick={onCtaClick}
            className={ctaButtonClasses}
            aria-label={`${ctaLabel} - ${title}`}
            disabled={disabled}
          >
            {ctaLabel}
          </Button>
        ) : (
          <Button
            asChild
            className={ctaButtonClasses}
            aria-label={`${ctaLabel} - ${title}`}
            disabled={disabled}
          >
            <Link href={ctaHref || '#'}>{ctaLabel}</Link>
          </Button>
        )}
        <p className="mt-2 text-xs text-neutral-500 text-center">
          {hasTrial ? 'No charges today. Cancel anytime.' : 'Cancel anytime.'}
        </p>
      </div>
    </div>
  )
}
