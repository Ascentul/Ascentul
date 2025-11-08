/**
 * Application Stage Logic for Advisor Features
 *
 * Helper functions for working with application stages.
 * Constants are imported from convex/advisor_constants.ts (single source of truth).
 */

// Re-export constants from Convex (single source of truth)
import type {
  ApplicationStage as AppStage,
} from 'convex/advisor_constants';

import {
  ALL_STAGES,
  ACTIVE_STAGES,
  FINAL_STAGES,
  TERMINAL_STAGES,
  STAGE_TRANSITIONS,
} from 'convex/advisor_constants';

// Re-export type
export type ApplicationStage = AppStage;

// Re-export constants
export {
  ALL_STAGES,
  ACTIVE_STAGES,
  FINAL_STAGES,
  TERMINAL_STAGES,
  STAGE_TRANSITIONS,
};

/**
 * Check if a stage is "active" (requires advisor tracking)
 *
 * Active logic:
 * - Prospect, Applied, Interview = ACTIVE (ongoing work)
 * - Offer, Accepted, Rejected, Withdrawn, Archived = NOT ACTIVE (final states)
 *
 * @param stage - Application stage to check
 * @returns true if stage is active, false otherwise
 */
export function isActiveStage(stage: string | undefined | null): boolean {
  if (!stage) return false;
  // Safe cast: includes() returns false for invalid strings at runtime
  return ACTIVE_STAGES.includes(stage as ApplicationStage);
}

/**
 * Check if a stage is a final state (no longer requires tracking)
 */
export function isFinalStage(stage: string | undefined | null): boolean {
  if (!stage) return false;
  // Safe cast: includes() returns false for invalid strings at runtime
  return FINAL_STAGES.includes(stage as ApplicationStage);
}

/**
 * Check if a stage is terminal (requires notes when transitioning to it)
 * Terminal stages represent final negative or neutral outcomes where context is important
 */
export function isTerminalStage(stage: string | undefined | null): boolean {
  if (!stage) return false;
  // Safe cast: includes() returns false for invalid strings at runtime
  return TERMINAL_STAGES.includes(stage as ApplicationStage);
}

/**
 * Get user-friendly label for stage
 */
export function getStageLabel(stage: ApplicationStage): string {
  const labels: Record<ApplicationStage, string> = {
    Prospect: 'Researching',
    Applied: 'Application Submitted',
    Interview: 'Interviewing',
    Offer: 'Offer Received',
    Accepted: 'Offer Accepted',
    Rejected: 'Not Selected',
    Withdrawn: 'Withdrawn',
    Archived: 'Archived',
  };
  return labels[stage] || stage;
}

/**
 * Get color class for stage badge (Tailwind)
 */
export function getStageColor(stage: ApplicationStage): string {
  const colors: Record<ApplicationStage, string> = {
    Prospect: 'bg-blue-100 text-blue-800 border-blue-200',
    Applied: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Interview: 'bg-purple-100 text-purple-800 border-purple-200',
    Offer: 'bg-green-100 text-green-800 border-green-200',
    Accepted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Rejected: 'bg-red-100 text-red-800 border-red-200',
    Withdrawn: 'bg-gray-100 text-gray-800 border-gray-200',
    Archived: 'bg-slate-100 text-slate-800 border-slate-200',
  };
  return colors[stage] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Validate stage transition (enforces workflow rules)
 *
 * Allowed transitions:
 * - Prospect -> Applied, Withdrawn, Archived
 * - Applied -> Interview, Rejected, Withdrawn, Archived
 * - Interview -> Offer, Rejected, Withdrawn, Archived
 * - Offer -> Accepted, Rejected, Withdrawn, Archived
 * - Final states -> Archived only
 */
export function isValidTransition(
  fromStage: ApplicationStage,
  toStage: ApplicationStage,
): boolean {
  return STAGE_TRANSITIONS[fromStage]?.includes(toStage) || false;
}

/**
 * Get next possible stages from current stage
 */
export function getNextStages(currentStage: ApplicationStage): ApplicationStage[] {
  return STAGE_TRANSITIONS[currentStage] || [];
}
