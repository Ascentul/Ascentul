"use client"

import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

type StatCardVariant = 'interview' | 'applications' | 'followups' | 'goals'

interface StatCardProps {
  label: string
  metric: ReactNode
  /** Accessible text for metric when metric is a ReactNode (e.g., "5 applications") */
  metricLabel?: string
  helper: string
  icon: ReactNode
  variant: StatCardVariant
  href?: string
  onClick?: () => void
  className?: string
}

const variantStyles: Record<StatCardVariant, {
  iconBg: string
  iconColor: string
  hoverBorder: string
  focusRing: string
}> = {
  interview: {
    iconBg: 'bg-[#EEF1FF]',
    iconColor: 'text-[#5371FF]',
    hoverBorder: 'hover:border-[#5371FF]/30',
    focusRing: 'focus-visible:ring-[#5371FF]/30',
  },
  applications: {
    iconBg: 'bg-[#EEF1FF]',
    iconColor: 'text-[#5371FF]',
    hoverBorder: 'hover:border-[#5371FF]/30',
    focusRing: 'focus-visible:ring-[#5371FF]/30',
  },
  followups: {
    iconBg: 'bg-[#EEF1FF]',
    iconColor: 'text-[#5371FF]',
    hoverBorder: 'hover:border-[#5371FF]/30',
    focusRing: 'focus-visible:ring-[#5371FF]/30',
  },
  goals: {
    iconBg: 'bg-[#EEF1FF]',
    iconColor: 'text-[#5371FF]',
    hoverBorder: 'hover:border-[#5371FF]/30',
    focusRing: 'focus-visible:ring-[#5371FF]/30',
  },
}

export default function StatCard({
  label,
  metric,
  metricLabel,
  helper,
  icon,
  variant,
  href,
  onClick,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant]
  const isClickable = !!href || !!onClick

  // Build accessible label - prefer explicit metricLabel, fall back to string/number metric
  const accessibleMetric = metricLabel
    || (typeof metric === 'string' || typeof metric === 'number' ? String(metric) : '')

  const cardContent = (
    <>
      {/* Top row: Icon pill + Label + View hint */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-full",
              styles.iconBg,
              styles.iconColor
            )}
          >
            {icon}
          </span>
          <span className="text-xs font-medium text-slate-500">{label}</span>
        </div>
        {isClickable && (
          <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-400" />
        )}
      </div>

      {/* Main metric */}
      <div className="mt-3">
        <p className="text-2xl font-semibold text-slate-900 md:text-3xl">
          {metric}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 md:text-sm">{helper}</p>
      </div>
    </>
  )

  const cardClasses = cn(
    "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white px-5 py-4 transition-all duration-150 md:px-6 md:py-5",
    isClickable && [
      "cursor-pointer",
      styles.hoverBorder,
      "hover:shadow-md",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      styles.focusRing,
    ],
    className
  )

  if (href) {
    return (
      <Link href={href} className={cardClasses} aria-label={`${label}: ${accessibleMetric}`}>
        {cardContent}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(cardClasses, "text-left")}
        aria-label={`${label}: ${accessibleMetric}`}
      >
        {cardContent}
      </button>
    )
  }

  return (
    <div className={cardClasses}>
      {cardContent}
    </div>
  )
}
