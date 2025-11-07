/**
 * Advisor Application Constants
 *
 * Shared constants for advisor application features.
 * Keep in sync with src/lib/advisor/stages.ts
 */

export type ApplicationStage =
  | "Prospect"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Accepted"
  | "Rejected"
  | "Withdrawn"
  | "Archived";

/**
 * All application stages in workflow order
 */
export const ALL_STAGES: readonly ApplicationStage[] = [
  "Prospect",
  "Applied",
  "Interview",
  "Offer",
  "Accepted",
  "Rejected",
  "Withdrawn",
  "Archived",
] as const;

/**
 * Active stages require ongoing advisor attention
 */
export const ACTIVE_STAGES: readonly ApplicationStage[] = [
  "Prospect",
  "Applied",
  "Interview",
] as const;

/**
 * Valid stage transitions
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
