/**
 * Compact Filter Bar Component
 *
 * Slim, actionable filter bar that replaces the always-visible AdvancedFiltersPanel.
 * Designed for the inbox experience with quick access to common filters.
 *
 * Features:
 * - Need Action toggle (default ON for inbox mode)
 * - Stage dropdown (multi-select)
 * - Time window selector
 * - Scope selector (My Students / All Students)
 * - "More filters" button to open advanced panel
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Filter, ChevronDown } from 'lucide-react';
import {
  ApplicationStage,
  TimeWindow,
  TIME_WINDOW_LABELS,
  ACTIVE_STAGES,
  TERMINAL_STAGES,
  ApplicationScope,
} from '../types';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface CompactFilterBarProps {
  // Filter state
  needsAction: boolean;
  selectedStages: ApplicationStage[];
  timeWindow: TimeWindow;
  scope: ApplicationScope;

  // Callbacks
  onNeedsActionChange: (value: boolean) => void;
  onStagesChange: (stages: ApplicationStage[]) => void;
  onTimeWindowChange: (window: TimeWindow) => void;
  onScopeChange: (scope: ApplicationScope) => void;
  onOpenAdvancedFilters: () => void;

  // UI state
  canViewAllStudents?: boolean;
  hasActiveFilters: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function CompactFilterBar({
  needsAction,
  selectedStages,
  timeWindow,
  scope,
  onNeedsActionChange,
  onStagesChange,
  onTimeWindowChange,
  onScopeChange,
  onOpenAdvancedFilters,
  canViewAllStudents = false,
  hasActiveFilters,
}: CompactFilterBarProps) {
  // Toggle a single stage
  const handleToggleStage = (stage: ApplicationStage) => {
    const newStages = selectedStages.includes(stage)
      ? selectedStages.filter((s) => s !== stage)
      : [...selectedStages, stage];
    onStagesChange(newStages);
  };

  // Quick filter presets
  const handleSelectAllStages = () => onStagesChange([]);
  const handleSelectActiveStages = () => onStagesChange(ACTIVE_STAGES);
  const handleSelectTerminalStages = () => onStagesChange(TERMINAL_STAGES);

  const stageFilterLabel =
    selectedStages.length === 0
      ? 'All Stages'
      : selectedStages.length === 1
      ? selectedStages[0]
      : `${selectedStages.length} Stages`;

  return (
    <div className="flex flex-wrap items-center gap-3 pb-4 border-b">
      {/* Inbox Mode Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={needsAction ? 'default' : 'outline'}
          size="sm"
          onClick={() => onNeedsActionChange(!needsAction)}
          className={cn(
            'gap-2',
            needsAction && 'bg-orange-500 hover:bg-orange-600'
          )}
          aria-label={needsAction ? 'Show all applications' : 'Show inbox (need action only)'}
        >
          {needsAction ? '📥 Inbox' : 'All Apps'}
        </Button>
      </div>

      {/* Stage Filter Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {stageFilterLabel}
            {selectedStages.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {selectedStages.length}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Filter by Stage</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Quick presets */}
          <div className="px-2 py-1 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={handleSelectAllStages}
            >
              All Stages
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={handleSelectActiveStages}
            >
              Active Only
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={handleSelectTerminalStages}
            >
              Terminal Only
            </Button>
          </div>

          <DropdownMenuSeparator />

          {/* Individual stages */}
          {ACTIVE_STAGES.map((stage) => (
            <DropdownMenuCheckboxItem
              key={stage}
              checked={selectedStages.includes(stage)}
              onCheckedChange={() => handleToggleStage(stage)}
            >
              {stage}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          {TERMINAL_STAGES.filter((s) => s !== 'Archived').map((stage) => (
            <DropdownMenuCheckboxItem
              key={stage}
              checked={selectedStages.includes(stage)}
              onCheckedChange={() => handleToggleStage(stage)}
            >
              {stage}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Time Window Filter */}
      <Select value={timeWindow} onValueChange={(value) => onTimeWindowChange(value as TimeWindow)}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{TIME_WINDOW_LABELS.all}</SelectItem>
          <SelectItem value="this_week">{TIME_WINDOW_LABELS.this_week}</SelectItem>
          <SelectItem value="this_month">{TIME_WINDOW_LABELS.this_month}</SelectItem>
        </SelectContent>
      </Select>

      {/* Scope Selector (for university admins) */}
      {canViewAllStudents && (
        <Select value={scope} onValueChange={(value) => onScopeChange(value as ApplicationScope)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="my-students">My Students</SelectItem>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="assigned-to-me">Assigned to Me</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* More Filters Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenAdvancedFilters}
        className="gap-2"
      >
        <Filter className="h-4 w-4" aria-hidden="true" />
        More Filters
        {hasActiveFilters && (
          <Badge variant="default" className="ml-1 px-1.5 py-0.5 text-xs">
            Active
          </Badge>
        )}
      </Button>
    </div>
  );
}
