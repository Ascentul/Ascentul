"use client"

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: ReactNode
  iconBgColor: string
  iconColor: string
  label: string
  value: ReactNode
  fallbackOnOverflow?: ReactNode
  valueClassName?: string
  variant?: 'default' | 'priority'
  change?: {
    type: 'increase' | 'decrease' | 'no-change'
    text: string
  }
}

export default function StatCard({
  icon,
  iconBgColor,
  iconColor,
  label,
  value,
  fallbackOnOverflow,
  valueClassName = 'text-xl',
  variant = 'default',
  change
}: StatCardProps) {
  const containerRef = useRef<HTMLParagraphElement>(null)
  const ghostRef = useRef<HTMLSpanElement>(null)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    if (!fallbackOnOverflow) {
      setShowFallback(false)
      return
    }
    const container = containerRef.current
    const ghost = ghostRef.current
    if (!container || !ghost) return

    const update = () => {
      const containerWidth = container.clientWidth
      const contentWidth = ghost.offsetWidth
      setShowFallback(contentWidth > containerWidth)
    }

    update()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => update())
    observer.observe(container)
    observer.observe(ghost)

    return () => observer.disconnect()
  }, [value, fallbackOnOverflow])

  return (
    <div className="h-full">
      <div className={cn(
        "flex h-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3",
        variant === 'priority'
          ? "bg-white shadow-sm"
          : "bg-white shadow-sm"
      )}>
        <div className="flex items-center gap-3">
          <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full", iconBgColor, iconColor)}>
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-medium text-slate-500">{label}</h3>
            <p
              ref={containerRef}
              className={cn(
                "relative whitespace-nowrap text-xl font-semibold leading-tight text-slate-900",
                valueClassName
              )}
            >
              <span className={showFallback && fallbackOnOverflow ? 'hidden' : 'inline'}>{value}</span>
              {fallbackOnOverflow && (
                <span className={showFallback ? 'inline' : 'hidden'}>{fallbackOnOverflow}</span>
              )}
              {fallbackOnOverflow && (
                <span
                  ref={ghostRef}
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-0 invisible whitespace-nowrap"
                >
                  {value}
                </span>
              )}
            </p>
            {change?.text && (
              <p className="mt-1 text-xs text-slate-400">{change.text}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
