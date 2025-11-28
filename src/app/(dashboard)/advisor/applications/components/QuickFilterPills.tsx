'use client';

/**
 * Quick Filter Pills Component
 *
 * One-click filter pills for common need-action reasons.
 * Provides fast access to triage work without opening advanced filters.
 *
 * Features:
 * - Pills for each need-action reason with count
 * - Visual indicators (emojis/icons) for each reason
 * - One-click to toggle filter by specific reason
 * - Active state when filter applied
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  NeedActionReason,
  NEED_ACTION_LABELS,
  NEED_ACTION_ICONS,
  ApplicationStats,
} from '../types';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface QuickFilterPillsProps {
  stats: ApplicationStats | undefined;
  activeReason: NeedActionReason | undefined;
  onFilterByReason: (reason: NeedActionReason) => void;
  className?: string;
}

// ============================================================================
// Main Component
// ============================================================================

export function QuickFilterPills({
  stats,
  activeReason,
  onFilterByReason,
  className,
}: QuickFilterPillsProps) {
  if (!stats || stats.needingAction === 0) {
    return null;
  }

  const breakdown = stats.needActionBreakdown;

  // Define pill configurations
  const pills: Array<{
    reason: NeedActionReason;
    count: number;
    variant: 'critical' | 'warning' | 'info';
  }> = [
    { reason: 'overdue', count: breakdown.overdue, variant: 'critical' },
    { reason: 'due_soon', count: breakdown.due_soon, variant: 'warning' },
    { reason: 'no_next_step', count: breakdown.no_next_step, variant: 'info' },
    { reason: 'stale', count: breakdown.stale, variant: 'info' },
  ];

  // Filter out pills with zero count
  const activePills = pills.filter((pill) => pill.count > 0);

  if (activePills.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="text-sm text-muted-foreground mr-1">Quick filters:</span>

      {activePills.map((pill) => (
        <QuickFilterPill
          key={pill.reason}
          reason={pill.reason}
          count={pill.count}
          variant={pill.variant}
          isActive={activeReason === pill.reason}
          onClick={() => onFilterByReason(pill.reason)}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Quick Filter Pill Sub-component
// ============================================================================

interface QuickFilterPillProps {
  reason: NeedActionReason;
  count: number;
  variant: 'critical' | 'warning' | 'info';
  isActive: boolean;
  onClick: () => void;
}

function QuickFilterPill({
  reason,
  count,
  variant,
  isActive,
  onClick,
}: QuickFilterPillProps) {
  const variantStyles = {
    critical: {
      button: isActive
        ? 'bg-red-100 border-red-500 text-red-900 hover:bg-red-200'
        : 'border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100',
      badge: 'bg-red-500 text-white',
    },
    warning: {
      button: isActive
        ? 'bg-orange-100 border-orange-500 text-orange-900 hover:bg-orange-200'
        : 'border-orange-200 bg-orange-50/50 text-orange-700 hover:bg-orange-100',
      badge: 'bg-orange-500 text-white',
    },
    info: {
      button: isActive
        ? 'bg-blue-100 border-blue-500 text-blue-900 hover:bg-blue-200'
        : 'border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100',
      badge: 'bg-blue-500 text-white',
    },
  };

  const icon = NEED_ACTION_ICONS[reason];
  const label = NEED_ACTION_LABELS[reason];

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        'gap-2 h-8 transition-all',
        variantStyles[variant].button,
        isActive && 'ring-2 ring-offset-1'
      )}
      aria-pressed={isActive}
      aria-label={`Filter by ${label} (${count} applications)`}
    >
      <span className="text-base" aria-hidden="true">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
      <Badge
        variant="secondary"
        className={cn('h-5 px-1.5 text-xs', variantStyles[variant].badge)}
      >
        {count}
      </Badge>
    </Button>
  );
}
