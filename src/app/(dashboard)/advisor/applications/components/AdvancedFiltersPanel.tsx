'use client';

/**
 * Advanced Filters Panel Component
 *
 * Collapsible panel for advanced filtering options:
 * - Stage multi-select
 * - Cohort/graduation year multi-select
 * - Applied date range picker
 * - Active-only toggle
 * - Quick filter presets
 *
 * Design principles:
 * - Clear visual grouping
 * - Keyboard accessible
 * - Show active filter count
 * - Easy to reset
 */

import React from 'react';
import { X, Calendar, GraduationCap, Layers, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ApplicationStage,
  ApplicationFilters,
  ACTIVE_STAGES,
  TERMINAL_STAGES,
} from '../types';

// ============================================================================
// Types
// ============================================================================

export interface AdvancedFiltersPanelProps {
  filters: ApplicationFilters;
  availableCohorts: string[];

  // Filter setters
  onToggleStage: (stage: ApplicationStage) => void;
  onSetStages: (stages: ApplicationStage[]) => void;
  onToggleCohort: (cohort: string) => void;
  onSetActiveOnly: (activeOnly: boolean) => void;
  onClearFilters: () => void;

  // Optional date range (can implement later)
  onSetDateRange?: (range: { from: number; to: number } | undefined) => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function AdvancedFiltersPanel({
  filters,
  availableCohorts,
  onToggleStage,
  onSetStages,
  onToggleCohort,
  onSetActiveOnly,
  onClearFilters,
  onSetDateRange,
}: AdvancedFiltersPanelProps) {
  // Quick filter presets
  const handleQuickFilterActive = () => {
    onSetStages([...ACTIVE_STAGES]);
    onSetActiveOnly(false); // Don't use activeOnly when manually selecting active stages
  };

  const handleQuickFilterTerminal = () => {
    onSetStages([...TERMINAL_STAGES]);
    onSetActiveOnly(false);
  };

  const handleQuickFilterAll = () => {
    onSetStages([]);
    onSetActiveOnly(false);
  };

  return (
    <Card className="p-6 space-y-6 border-t-0 rounded-t-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Advanced Filters</h3>
          <p className="text-sm text-muted-foreground">
            Refine your application view
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="gap-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Clear All
        </Button>
      </div>

      <Separator />

      {/* Quick Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-600" aria-hidden="true" />
          <Label className="text-sm font-medium">Quick Filters</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickFilterActive}
            className={filters.stages.length === ACTIVE_STAGES.length &&
              ACTIVE_STAGES.every(s => filters.stages.includes(s)) ? 'bg-primary/10' : ''}
          >
            Active Only
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickFilterTerminal}
            className={filters.stages.length === TERMINAL_STAGES.length &&
              TERMINAL_STAGES.every(s => filters.stages.includes(s)) ? 'bg-primary/10' : ''}
          >
            Terminal Only
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleQuickFilterAll}
            className={filters.stages.length === 0 ? 'bg-primary/10' : ''}
          >
            All Stages
          </Button>
        </div>
      </div>

      <Separator />

      {/* Stage Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <Label className="text-sm font-medium">Application Stage</Label>
          {filters.stages.length > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {filters.stages.length} selected
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* Active Stages */}
          {ACTIVE_STAGES.filter(s => s !== 'Offer').map((stage) => (
            <StageCheckbox
              key={stage}
              stage={stage}
              checked={filters.stages.includes(stage)}
              onToggle={onToggleStage}
              variant="active"
            />
          ))}

          {/* Terminal Stages */}
          {TERMINAL_STAGES.filter(s => s !== 'Archived').map((stage) => (
            <StageCheckbox
              key={stage}
              stage={stage}
              checked={filters.stages.includes(stage)}
              onToggle={onToggleStage}
              variant="terminal"
            />
          ))}

          {/* Offer stage */}
          <StageCheckbox
            stage="Offer"
            checked={filters.stages.includes('Offer')}
            onToggle={onToggleStage}
            variant="success"
          />

          {/* Archived stage */}
          <StageCheckbox
            stage="Archived"
            checked={filters.stages.includes('Archived')}
            onToggle={onToggleStage}
            variant="terminal"
          />
        </div>
      </div>

      <Separator />

      {/* Cohort Filter */}
      {availableCohorts.length > 0 && (
        <>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-purple-600" aria-hidden="true" />
              <Label className="text-sm font-medium">Graduation Year</Label>
              {filters.cohorts.length > 0 && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                  {filters.cohorts.length} selected
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {availableCohorts.map((cohort) => (
                <CohortCheckbox
                  key={cohort}
                  cohort={cohort}
                  checked={filters.cohorts.includes(cohort)}
                  onToggle={onToggleCohort}
                />
              ))}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Date Range (Placeholder for future implementation) */}
      {onSetDateRange && (
        <>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" aria-hidden="true" />
              <Label className="text-sm font-medium">Applied Date Range</Label>
            </div>
            <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Date range picker coming soon
              </p>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Active-Only Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="active-only"
            checked={filters.activeOnly}
            onCheckedChange={(checked) => onSetActiveOnly(!!checked)}
          />
          <Label
            htmlFor="active-only"
            className="cursor-pointer text-sm font-medium"
          >
            Show only active applications
          </Label>
        </div>
        {filters.activeOnly && (
          <span className="text-xs text-muted-foreground">
            {ACTIVE_STAGES.join(', ')}
          </span>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// Stage Checkbox Component
// ============================================================================

interface StageCheckboxProps {
  stage: ApplicationStage;
  checked: boolean;
  onToggle: (stage: ApplicationStage) => void;
  variant: 'active' | 'terminal' | 'success';
}

function StageCheckbox({ stage, checked, onToggle, variant }: StageCheckboxProps) {
  const variantStyles = {
    active: 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/50',
    terminal: 'border-gray-200 bg-gray-50/50 hover:bg-gray-100/50',
    success: 'border-green-200 bg-green-50/50 hover:bg-green-100/50',
  };

  const checkedStyles = {
    active: 'border-blue-500 bg-blue-100',
    terminal: 'border-gray-500 bg-gray-100',
    success: 'border-green-500 bg-green-100',
  };

  return (
    <button
      type="button"
      onClick={() => onToggle(stage)}
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-all pl-3",
        checked ? checkedStyles[variant] : variantStyles[variant]
      )}
      aria-pressed={checked}
    >
      <span className={checked ? 'font-semibold' : ''}>{stage}</span>
    </button>
  );
}

// ============================================================================
// Cohort Checkbox Component
// ============================================================================

interface CohortCheckboxProps {
  cohort: string;
  checked: boolean;
  onToggle: (cohort: string) => void;
}

function CohortCheckbox({ cohort, checked, onToggle }: CohortCheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(cohort)}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all",
        checked
          ? 'border-purple-500 bg-purple-100'
          : 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/50'
      )}
      aria-pressed={checked}
    >
      <span className={checked ? 'font-semibold' : ''}>Class of {cohort}</span>
    </button>
  );
}
