'use client'

import React from 'react'
import { Bot, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAgent } from '@/contexts/AgentContext'
import type { AgentContext } from '@/lib/agent/types'

interface LaunchChipProps {
  source: string
  recordId?: string
  action?: string
  metadata?: Record<string, unknown>
  label?: string
  variant?: 'default' | 'outline' | 'ghost' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  icon?: 'bot' | 'sparkles'
  className?: string
}

/**
 * LaunchChip - Trigger button to open Agent with page context
 *
 * Usage:
 * <LaunchChip
 *   source="dashboard"
 *   action="review_recommendations"
 *   label="Ask Agent"
 * />
 */
export function LaunchChip({
  source,
  recordId,
  action,
  metadata,
  label = 'Ask Agent',
  variant = 'outline',
  size = 'sm',
  icon = 'bot',
  className = '',
}: LaunchChipProps) {
  const { openAgent } = useAgent()

  const handleClick = () => {
    const context: AgentContext = {
      source,
      recordId,
      action,
      metadata,
    }

    openAgent(context)
  }

  const Icon = icon === 'sparkles' ? Sparkles : Bot

  const buttonSize = size === 'md' ? 'default' : size

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-9 text-sm',
    lg: 'h-10 text-base',
  }

  return (
    <Button
      onClick={handleClick}
      variant={variant === 'minimal' ? 'ghost' : variant}
      size={buttonSize}
      className={`${sizeClasses[size]} ${
        variant === 'minimal' ? 'h-auto p-0' : ''
      } gap-1.5 ${className}`}
      title={`Open AI Agent for ${source}${action ? ` - ${action}` : ''}`}
    >
      <Icon className={`${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
      <span className="font-medium">{label}</span>
    </Button>
  )
}
