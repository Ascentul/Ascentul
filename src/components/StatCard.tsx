"use client"

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  icon: ReactNode
  iconBgColor: string
  iconColor: string
  label: string
  value: ReactNode
  fallbackOnOverflow?: ReactNode
  valueClassName?: string
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
  valueClassName = 'text-2xl',
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
    <Card className="h-full">
      <CardContent className="p-4 h-full">
        <div className="flex items-center h-full">
          <div className={cn("flex-shrink-0 p-3 rounded-full", iconBgColor, iconColor)}>
            {icon}
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <h3 className="text-neutral-500 text-sm">{label}</h3>
            <p
              ref={containerRef}
              className={cn("relative font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis", valueClassName)}
            >
              <span className={showFallback && fallbackOnOverflow ? 'hidden' : 'inline'}>{value}</span>
              {fallbackOnOverflow && (
                <span className={showFallback ? 'inline' : 'hidden'}>{fallbackOnOverflow}</span>
              )}
              {fallbackOnOverflow && (
                <span
                  ref={ghostRef}
                  aria-hidden
                  className="absolute left-0 top-0 invisible pointer-events-none whitespace-nowrap"
                >
                  {value}
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
