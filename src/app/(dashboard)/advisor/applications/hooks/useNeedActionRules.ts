/**
 * Hook for computing need-action indicators
 *
 * Centralizes the triage logic for determining which applications need advisor attention.
 * This ensures consistent rules across Kanban, Table, and Stats components.
 */

import { useMemo, useState, useEffect } from 'react';
import { NeedActionReason, UrgencyLevel } from '../types';
import { ACTIVE_STAGES } from 'convex/advisor_constants';

/**
 * Interval for time-based cache invalidation (1 minute)
 * This ensures urgency calculations stay reasonably fresh without excessive re-renders
 */
const TIME_BUCKET_INTERVAL_MS = 60 * 1000;

/**
 * Time constants for triage rules (in milliseconds)
 */
const ONE_DAY = 24 * 60 * 60 * 1000;
const THREE_DAYS = 3 * ONE_DAY;
const FOURTEEN_DAYS = 14 * ONE_DAY;

/**
 * Application data needed for triage calculation
 */
interface ApplicationForTriage {
  next_step?: string;
  next_step_date?: number;  // Due date
  updated_at: number;
  stage: string;
}

/**
 * Result of triage calculation
 */
export interface NeedActionResult {
  needsAction: boolean;
  reasons: NeedActionReason[];
  isOverdue: boolean;
  isDueSoon: boolean;
  isStale: boolean;
  daysSinceUpdate: number;
  urgencyLevel: UrgencyLevel;
}

// ============================================================================
// Core Triage Logic (Shared)
// ============================================================================

/**
 * Core triage logic (shared between hook and batch function)
 * Extracted to eliminate duplication and ensure consistency
 */
function calculateNeedAction(
  application: ApplicationForTriage,
  now: number
): NeedActionResult {
  const reasons: NeedActionReason[] = [];

  // Only apply triage rules to active stages
  // Cast needed because ACTIVE_STAGES is typed as readonly ApplicationStage[]
  const isActiveStage = (ACTIVE_STAGES as readonly string[]).includes(application.stage);

  const daysSinceUpdate = Math.floor((now - application.updated_at) / ONE_DAY);

  if (!isActiveStage) {
    return {
      needsAction: false,
      reasons: [],
      isOverdue: false,
      isDueSoon: false,
      isStale: false,
      daysSinceUpdate,
      urgencyLevel: 'none',
    };
  }

  // Rule 1: No next step defined
  const hasNoNextStep = !application.next_step;
  if (hasNoNextStep) {
    reasons.push('no_next_step');
  }

  // Rule 2: Overdue (due date in the past)
  const isOverdue =
    application.next_step_date !== undefined &&
    application.next_step_date < now;
  if (isOverdue) {
    reasons.push('overdue');
  }

  // Rule 3: Due soon (within 3 days)
  const isDueSoon =
    application.next_step_date !== undefined &&
    application.next_step_date >= now &&
    application.next_step_date <= now + THREE_DAYS;
  if (isDueSoon) {
    reasons.push('due_soon');
  }

  // Rule 4: Stale (no activity in 14+ days)
  const isStale = application.updated_at < now - FOURTEEN_DAYS;
  if (isStale) {
    reasons.push('stale');
  }

  // Calculate urgency level for prioritization
  let urgencyLevel: UrgencyLevel = 'none';
  if (isOverdue) {
    urgencyLevel = 'critical';
  } else if (application.next_step_date && application.next_step_date < now + ONE_DAY) {
    // Due today
    urgencyLevel = 'high';
  } else if (isDueSoon) {
    urgencyLevel = 'medium';
  } else if (isStale) {
    urgencyLevel = 'low';
  }

  return {
    needsAction: reasons.length > 0,
    reasons,
    isOverdue,
    isDueSoon,
    isStale,
    daysSinceUpdate,
    urgencyLevel,
  };
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook that returns current time, updating at regular intervals
 * Used to invalidate time-sensitive memoizations
 */
function useCurrentTimeBucket(): number {
  const [timeBucket, setTimeBucket] = useState(() =>
    Math.floor(Date.now() / TIME_BUCKET_INTERVAL_MS)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeBucket(Math.floor(Date.now() / TIME_BUCKET_INTERVAL_MS));
    }, TIME_BUCKET_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return timeBucket;
}

/**
 * Hook for single application triage
 * Uses memoization with time-based invalidation to ensure fresh urgency calculations
 */
export function useNeedActionRules(application: ApplicationForTriage): NeedActionResult {
  const timeBucket = useCurrentTimeBucket();

  return useMemo(
    () => calculateNeedAction(application, Date.now()),
    // timeBucket changes every minute, ensuring time-sensitive calculations stay fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [application.next_step, application.next_step_date, application.updated_at, application.stage, timeBucket]
  );
}

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Pure function for computing need-action (for batch processing)
 * More efficient than calling the hook in a loop
 */
export function computeNeedAction(application: ApplicationForTriage): NeedActionResult {
  return calculateNeedAction(application, Date.now());
}

/**
 * Enrich multiple applications with need-action data
 */
export function enrichApplicationsWithNeedAction<T extends ApplicationForTriage>(
  applications: T[]
): Array<T & NeedActionResult> {
  return applications.map((app) => ({
    ...app,
    ...computeNeedAction(app),
  }));
}
