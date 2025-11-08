import Link from 'next/link'
import { Check } from 'lucide-react'
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
}

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
}: PlanCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-white/80 backdrop-blur-sm p-8 md:p-10 transition hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)]',
        highlighted
          ? 'border-[#5271FF] bg-[#5271FF0D] shadow-md'
          : 'border-zinc-200 shadow-sm'
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 left-4 rounded-full bg-[#5271FF] px-3 py-1 text-xs font-medium text-white">
          Best Value
        </span>
      )}

      <h3 className="text-lg font-semibold text-zinc-900 truncate" title={title}>
        {title}
      </h3>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900">
          {price}
        </span>
        <span className="text-base text-zinc-500">/{cadence}</span>
      </div>

      {subline && (
        <p className="mt-1 text-sm text-zinc-500">
          {subline}
          {savings && (
            <span className="ml-2 text-[#5271FF] font-semibold">{savings}</span>
          )}
        </p>
      )}

      <ul className="mt-6 space-y-3" role="list">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3 text-sm text-zinc-700">
            <Check className="h-5 w-5 text-[#5271FF] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {onCtaClick ? (
        <Button
          onClick={onCtaClick}
          className="mt-8 w-full bg-black text-white hover:bg-black/90"
          aria-label={`${ctaLabel} - ${title}`}
        >
          {ctaLabel}
        </Button>
      ) : (
        <Button
          asChild
          className="mt-8 w-full bg-black text-white hover:bg-black/90"
          aria-label={`${ctaLabel} - ${title}`}
        >
          <Link href={ctaHref || '#'}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  )
}
