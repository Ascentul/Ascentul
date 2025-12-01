/**
 * Hook for managing filter state in applications views
 *
 * Handles:
 * - Text search (company, position, student)
 * - Stage filtering (multi-select)
 * - Cohort/graduation year filtering
 * - Need-action toggle
 * - Active-only toggle
 * - Date range filtering
 */

import { useCallback, useMemo, useState } from 'react';

import {
  ACTIVE_STAGES,
  ApplicationFilters,
  ApplicationStage,
  DEFAULT_FILTERS,
  EnrichedApplication,
  INBOX_MODE_FILTERS,
  NeedActionReason,
  TimeWindow,
} from '../types';

export interface UseApplicationFiltersResult {
  // State
  filters: ApplicationFilters;

  // Setters
  setSearch: (search: string) => void;
  toggleStage: (stage: ApplicationStage) => void;
  setStages: (stages: ApplicationStage[]) => void;
  toggleCohort: (cohort: string) => void;
  setCohorts: (cohorts: string[]) => void;
  setNeedsAction: (needsAction: boolean) => void;
  setNeedActionReason: (reason: NeedActionReason | undefined) => void;
  setActiveOnly: (activeOnly: boolean) => void;
  setTimeWindow: (timeWindow: TimeWindow) => void;
  setAppliedDateRange: (range: { from: number; to: number } | undefined) => void;
  setFilters: (filters: ApplicationFilters) => void;

  // Actions
  clearFilters: () => void;
  hasActiveFilters: boolean;

  // Filter function
  applyFilters: (applications: EnrichedApplication[]) => EnrichedApplication[];
}

/**
 * Hook for managing application filters
 *
 * Note: Initial state uses INBOX_MODE_FILTERS (needsAction=true) for focused triage.
 * clearFilters() resets to DEFAULT_FILTERS (all filters off) to show all applications.
 * This is intentional: clearing filters should reveal everything, not return to inbox mode.
 */
export function useApplicationFilters(): UseApplicationFiltersResult {
  const [filters, setFilters] = useState<ApplicationFilters>(INBOX_MODE_FILTERS);

  /**
   * Update search text
   */
  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  /**
   * Toggle a single stage in the filter
   */
  const toggleStage = useCallback((stage: ApplicationStage) => {
    setFilters((prev) => {
      const newStages = prev.stages.includes(stage)
        ? prev.stages.filter((s) => s !== stage)
        : [...prev.stages, stage];
      return { ...prev, stages: newStages };
    });
  }, []);

  /**
   * Set all stages at once
   */
  const setStages = useCallback((stages: ApplicationStage[]) => {
    setFilters((prev) => ({ ...prev, stages }));
  }, []);

  /**
   * Toggle a single cohort in the filter
   */
  const toggleCohort = useCallback((cohort: string) => {
    setFilters((prev) => {
      const newCohorts = prev.cohorts.includes(cohort)
        ? prev.cohorts.filter((c) => c !== cohort)
        : [...prev.cohorts, cohort];
      return { ...prev, cohorts: newCohorts };
    });
  }, []);

  /**
   * Set all cohorts at once
   */
  const setCohorts = useCallback((cohorts: string[]) => {
    setFilters((prev) => ({ ...prev, cohorts }));
  }, []);

  /**
   * Toggle need-action filter
   */
  const setNeedsAction = useCallback((needsAction: boolean) => {
    setFilters((prev) => ({
      ...prev,
      needsAction,
      needActionReason: needsAction ? prev.needActionReason : undefined,
    }));
  }, []);

  /**
   * Set specific need-action reason filter
   */
  const setNeedActionReason = useCallback((reason: NeedActionReason | undefined) => {
    setFilters((prev) => ({
      ...prev,
      needActionReason: reason,
      needsAction: reason !== undefined ? true : prev.needsAction,
    }));
  }, []);

  /**
   * Toggle active-only filter
   */
  const setActiveOnly = useCallback((activeOnly: boolean) => {
    setFilters((prev) => ({ ...prev, activeOnly }));
  }, []);

  /**
   * Set time window filter
   */
  const setTimeWindow = useCallback((timeWindow: TimeWindow) => {
    setFilters((prev) => ({ ...prev, timeWindow }));
  }, []);

  /**
   * Set applied date range
   */
  const setAppliedDateRange = useCallback((range: { from: number; to: number } | undefined) => {
    setFilters((prev) => ({ ...prev, appliedDateRange: range }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.stages.length > 0 ||
      filters.cohorts.length > 0 ||
      filters.needsAction ||
      filters.needActionReason !== undefined ||
      filters.activeOnly ||
      filters.timeWindow !== 'all' ||
      filters.appliedDateRange !== undefined
    );
  }, [filters]);

  /**
   * Apply filters to a list of applications
   */
  const applyFilters = useCallback(
    (applications: EnrichedApplication[]): EnrichedApplication[] => {
      const now = Date.now();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const oneMonth = 30 * 24 * 60 * 60 * 1000;

      return applications.filter((app) => {
        // Search filter (company, position, student name)
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch =
            app.company_name.toLowerCase().includes(searchLower) ||
            app.position_title.toLowerCase().includes(searchLower) ||
            app.student_name.toLowerCase().includes(searchLower);

          if (!matchesSearch) return false;
        }

        // Stage filter
        if (filters.stages.length > 0) {
          if (!filters.stages.includes(app.stage)) return false;
        }

        // Cohort filter
        if (filters.cohorts.length > 0) {
          if (!app.student_graduation_year) return false;
          if (!filters.cohorts.includes(app.student_graduation_year)) return false;
        }

        // Need-action filter
        if (filters.needsAction) {
          if (!app.needsAction) return false;
        }

        // Specific need-action reason filter
        if (filters.needActionReason) {
          if (!app.needActionReasons.includes(filters.needActionReason)) return false;
        }

        // Active-only filter
        if (filters.activeOnly) {
          if (!ACTIVE_STAGES.includes(app.stage)) return false;
        }

        // Time window filter (affects due dates and last updated)
        if (filters.timeWindow !== 'all') {
          const timeLimit = filters.timeWindow === 'this_week' ? oneWeek : oneMonth;
          const withinTimeWindow =
            (app.next_step_date && app.next_step_date <= now + timeLimit) ||
            app.updated_at >= now - timeLimit;

          if (!withinTimeWindow) return false;
        }

        // Applied date range filter
        if (filters.appliedDateRange) {
          if (!app.applied_date) return false;
          if (
            app.applied_date < filters.appliedDateRange.from ||
            app.applied_date > filters.appliedDateRange.to
          ) {
            return false;
          }
        }

        return true;
      });
    },
    [filters],
  );

  return {
    filters,
    setSearch,
    toggleStage,
    setStages,
    toggleCohort,
    setCohorts,
    setNeedsAction,
    setNeedActionReason,
    setActiveOnly,
    setTimeWindow,
    setAppliedDateRange,
    setFilters,
    clearFilters,
    hasActiveFilters,
    applyFilters,
  };
}

/**
 * Hook to compute available cohorts from applications
 */
export function useAvailableCohorts(applications: EnrichedApplication[]): string[] {
  return useMemo(() => {
    const cohorts = new Set<string>();
    applications.forEach((app) => {
      if (app.student_graduation_year) {
        cohorts.add(app.student_graduation_year);
      }
    });
    return Array.from(cohorts).sort();
  }, [applications]);
}
