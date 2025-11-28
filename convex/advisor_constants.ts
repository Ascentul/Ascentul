/**
 * Advisor Application Constants
 *
 * Single source of truth for advisor application stage definitions.
 * Imported by frontend code in src/lib/advisor/stages.ts
 */

export type ApplicationStage =
  | 'Prospect'
  | 'Applied'
  | 'Interview'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn'
  | 'Archived';

/**
 * All application stages in workflow order
 */
export const ALL_STAGES: readonly ApplicationStage[] = [
  'Prospect',
  'Applied',
  'Interview',
  'Offer',
  'Accepted',
  'Rejected',
  'Withdrawn',
  'Archived',
] as const;

/**
 * Active stages require ongoing advisor attention
 * - Prospect: Researching/considering application
 * - Applied: Submitted, waiting for response
 * - Interview: Active interview process
 * - Offer: Received offer, decision pending
 */
export const ACTIVE_STAGES: readonly ApplicationStage[] = [
  'Prospect',
  'Applied',
  'Interview',
  'Offer',
] as const;

/**
 * Final stages represent completed outcomes
 * - Accepted: Accepted offer (final positive outcome)
 * - Rejected: Application rejected (final negative outcome)
 * - Withdrawn: Student withdrew (final neutral outcome)
 * - Archived: Manually archived (final inactive outcome)
 */
export const FINAL_STAGES: readonly ApplicationStage[] = [
  'Accepted',
  'Rejected',
  'Withdrawn',
  'Archived',
] as const;

/**
 * Terminal stages require notes when transitioning to them
 * These represent final negative or neutral outcomes where context is important
 * - Rejected: Application rejected (reason should be documented)
 * - Withdrawn: Student withdrew (reason should be documented)
 * - Archived: Manually archived (reason should be documented)
 */
export const TERMINAL_STAGES: readonly ApplicationStage[] = [
  'Rejected',
  'Withdrawn',
  'Archived',
] as const;

/**
 * Type guard to check if a stage is terminal
 * Returns true and narrows type if stage is a valid terminal stage
 */
type TerminalStage = 'Rejected' | 'Withdrawn' | 'Archived';

export function isTerminalStage(stage: unknown): stage is TerminalStage {
  if (typeof stage !== 'string') return false;
  return (TERMINAL_STAGES as readonly string[]).includes(stage);
}

/**
 * Type guard to check if a stage is active
 * Returns true and narrows type if stage is a valid active stage
 */
export function isActiveStage(stage: unknown): stage is ApplicationStage {
  if (typeof stage !== 'string') return false;
  return (ACTIVE_STAGES as readonly string[]).includes(stage);
}

/**
 * Type guard to check if a stage is final
 * Returns true and narrows type if stage is a valid final stage
 */
export function isFinalStage(stage: unknown): stage is ApplicationStage {
  if (typeof stage !== 'string') return false;
  return (FINAL_STAGES as readonly string[]).includes(stage);
}

/**
 * Valid stage transitions (enforces workflow rules)
 *
 * Allowed transitions:
 * - Prospect -> Applied, Withdrawn, Archived
 * - Applied -> Interview, Rejected, Withdrawn, Archived
 * - Interview -> Offer, Rejected, Withdrawn, Archived
 * - Offer -> Accepted, Rejected, Withdrawn, Archived
 * - Final states -> Archived only
 */
export const STAGE_TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  Prospect: ['Applied', 'Withdrawn', 'Archived'],
  Applied: ['Interview', 'Rejected', 'Withdrawn', 'Archived'],
  Interview: ['Offer', 'Rejected', 'Withdrawn', 'Archived'],
  Offer: ['Accepted', 'Rejected', 'Withdrawn', 'Archived'],
  Accepted: ['Archived'],
  Rejected: ['Archived'],
  Withdrawn: ['Archived'],
  Archived: [],
};
