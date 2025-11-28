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

/**
 * Reason codes for Rejected stage
 * These provide structured data for analytics and reporting
 */
export const REJECTED_REASON_CODES = {
  not_qualified: 'Not Qualified',
  experience_mismatch: 'Experience Mismatch',
  skills_gap: 'Skills Gap',
  culture_fit: 'Culture Fit',
  compensation: 'Compensation Mismatch',
  position_filled: 'Position Filled',
  no_response: 'No Response from Employer',
  other: 'Other',
} as const;

export type RejectedReasonCode = keyof typeof REJECTED_REASON_CODES;

/**
 * Reason codes for Withdrawn stage
 * These provide structured data for analytics and reporting
 */
export const WITHDRAWN_REASON_CODES = {
  accepted_other: 'Accepted Another Offer',
  lost_interest: 'Lost Interest in Role',
  compensation: 'Compensation Not Competitive',
  location: 'Location Concerns',
  company_culture: 'Company Culture Concerns',
  timeline: 'Timeline Issues',
  personal: 'Personal Reasons',
  other: 'Other',
} as const;

export type WithdrawnReasonCode = keyof typeof WITHDRAWN_REASON_CODES;

/**
 * Get reason codes for a given stage
 * Returns null if the stage doesn't require reason codes
 */
export function getReasonCodesForStage(stage: string): Record<string, string> | null {
  if (stage === 'Rejected') return REJECTED_REASON_CODES;
  if (stage === 'Withdrawn') return WITHDRAWN_REASON_CODES;
  return null;
}

/**
 * Check if a stage requires a reason code
 */
export function requiresReasonCode(stage: string): boolean {
  return stage === 'Rejected' || stage === 'Withdrawn';
}
