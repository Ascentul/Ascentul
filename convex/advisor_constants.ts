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
 */
export const ACTIVE_STAGES: readonly ApplicationStage[] = [
  'Prospect',
  'Applied',
  'Interview',
] as const;

/**
 * Final stages represent completed outcomes
 * - Offer: Received offer (decision pending)
 * - Accepted: Accepted offer (final positive outcome)
 * - Rejected: Application rejected (final negative outcome)
 * - Withdrawn: Student withdrew (final neutral outcome)
 * - Archived: Manually archived (final inactive outcome)
 */
export const FINAL_STAGES: readonly ApplicationStage[] = [
  'Offer',
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
