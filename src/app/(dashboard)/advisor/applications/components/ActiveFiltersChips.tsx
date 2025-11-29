'use client';

/**
 * Active Filters Chips Component
 *
 * Displays removable chips for each active filter.
 * Provides quick visual feedback and one-click removal.
 *
 * Features:
 * - Shows each active filter as a removable chip
 * - Click X to remove individual filter
 * - "Clear all" link if 2+ filters active
 * - Compact, wrapping layout
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  ApplicationFilters,
  ApplicationStage,
  TIME_WINDOW_LABELS,
  NEED_ACTION_LABELS,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface ActiveFiltersChipsProps {
  filters: ApplicationFilters;
  onRemoveStage: (stage: ApplicationStage) => void;
  onRemoveCohort: (cohort: string) => void;
  onRemoveNeedsAction: () => void;
  onRemoveNeedActionReason: () => void;
  onRemoveActiveOnly: () => void;
  onRemoveTimeWindow: () => void;
  onClearAll: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function ActiveFiltersChips({
  filters,
  onRemoveStage,
  onRemoveCohort,
  onRemoveNeedsAction,
  onRemoveNeedActionReason,
  onRemoveActiveOnly,
  onRemoveTimeWindow,
  onClearAll,
}: ActiveFiltersChipsProps) {
  // Count active filters (excluding search which is handled separately)
  const activeFilterCount =
    filters.stages.length +
    filters.cohorts.length +
    (filters.needsAction ? 1 : 0) +
    (filters.needActionReason ? 1 : 0) +
    (filters.activeOnly ? 1 : 0) +
    (filters.timeWindow !== 'all' ? 1 : 0);

  // Don't render if no filters active
  if (activeFilterCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>

      {/* Stages */}
      {filters.stages.map((stage) => (
        <FilterChip
          key={`stage-${stage}`}
          label={stage}
          onRemove={() => onRemoveStage(stage)}
        />
      ))}

      {/* Cohorts */}
      {filters.cohorts.map((cohort) => (
        <FilterChip
          key={`cohort-${cohort}`}
          label={`Class of ${cohort}`}
          onRemove={() => onRemoveCohort(cohort)}
        />
      ))}

      {/* Need Action */}
      {filters.needsAction && (
        <FilterChip
          label="Need Action"
          onRemove={onRemoveNeedsAction}
          variant="warning"
        />
      )}

      {/* Specific Need Action Reason */}
      {filters.needActionReason && (
        <FilterChip
          label={NEED_ACTION_LABELS[filters.needActionReason] ?? filters.needActionReason}
          onRemove={onRemoveNeedActionReason}
          variant="warning"
        />
      )}

      {/* Active Only */}
      {filters.activeOnly && (
        <FilterChip
          label="Active Stages Only"
          onRemove={onRemoveActiveOnly}
        />
      )}

      {/* Time Window */}
      {filters.timeWindow !== 'all' && (
        <FilterChip
          label={TIME_WINDOW_LABELS[filters.timeWindow] ?? filters.timeWindow}
          onRemove={onRemoveTimeWindow}
        />
      )}

      {/* Clear All */}
      {activeFilterCount >= 2 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Filter Chip Sub-component
// ============================================================================

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  variant?: 'default' | 'warning';
}

function FilterChip({ label, onRemove, variant = 'default' }: FilterChipProps) {
  return (
    <Badge
      variant={variant === 'warning' ? 'destructive' : 'secondary'}
      className="gap-1.5 pl-2.5 pr-1.5 py-1 cursor-pointer hover:opacity-80 transition-opacity"
    >
      <span className="text-xs">{label}</span>
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-black/10 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}
