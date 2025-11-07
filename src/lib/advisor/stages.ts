/**
 * Application Stage Logic for Advisor Features
 *
 * Defines which stages are "active" (requiring advisor attention)
 * vs final states that don't need ongoing tracking
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
 * Active stages require ongoing advisor attention
 * - Prospect: Researching/considering application
 * - Applied: Submitted, waiting for response
 * - Interview: Active interview process
 */
export const ACTIVE_STAGES: ApplicationStage[] = [
  "Prospect",
  "Applied",
  "Interview",
];

/**
 * Final stages represent completed outcomes
 * - Offer: Received offer (decision pending)
 * - Accepted: Accepted offer (final positive outcome)
 * - Rejected: Application rejected (final negative outcome)
 * - Withdrawn: Student withdrew (final neutral outcome)
 * - Archived: Manually archived (final inactive outcome)
 */
export const FINAL_STAGES: ApplicationStage[] = [
  "Offer",
  "Accepted",
  "Rejected",
  "Withdrawn",
  "Archived",
];

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
  return ACTIVE_STAGES.includes(stage as ApplicationStage);
}

/**
 * Check if a stage is a final state (no longer requires tracking)
 */
export function isFinalStage(stage: string | undefined | null): boolean {
  if (!stage) return false;
  return FINAL_STAGES.includes(stage as ApplicationStage);
}

/**
 * Get user-friendly label for stage
 */
export function getStageLab(stage: ApplicationStage): string {
  const labels: Record<ApplicationStage, string> = {
    Prospect: "Researching",
    Applied: "Application Submitted",
    Interview: "Interviewing",
    Offer: "Offer Received",
    Accepted: "Offer Accepted",
    Rejected: "Not Selected",
    Withdrawn: "Withdrawn",
    Archived: "Archived",
  };
  return labels[stage] || stage;
}

/**
 * Get color class for stage badge (Tailwind)
 */
export function getStageColor(stage: ApplicationStage): string {
  const colors: Record<ApplicationStage, string> = {
    Prospect: "bg-blue-100 text-blue-800 border-blue-200",
    Applied: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Interview: "bg-purple-100 text-purple-800 border-purple-200",
    Offer: "bg-green-100 text-green-800 border-green-200",
    Accepted: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Rejected: "bg-red-100 text-red-800 border-red-200",
    Withdrawn: "bg-gray-100 text-gray-800 border-gray-200",
    Archived: "bg-slate-100 text-slate-800 border-slate-200",
  };
  return colors[stage] || "bg-gray-100 text-gray-800 border-gray-200";
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
  const transitions: Record<ApplicationStage, ApplicationStage[]> = {
    Prospect: ["Applied", "Withdrawn", "Archived"],
    Applied: ["Interview", "Rejected", "Withdrawn", "Archived"],
    Interview: ["Offer", "Rejected", "Withdrawn", "Archived"],
    Offer: ["Accepted", "Rejected", "Withdrawn", "Archived"],
    Accepted: ["Archived"],
    Rejected: ["Archived"],
    Withdrawn: ["Archived"],
    Archived: [],
  };

  return transitions[fromStage]?.includes(toStage) || false;
}

/**
 * Get next possible stages from current stage
 */
export function getNextStages(currentStage: ApplicationStage): ApplicationStage[] {
  const transitions: Record<ApplicationStage, ApplicationStage[]> = {
    Prospect: ["Applied", "Withdrawn", "Archived"],
    Applied: ["Interview", "Rejected", "Withdrawn", "Archived"],
    Interview: ["Offer", "Rejected", "Withdrawn", "Archived"],
    Offer: ["Accepted", "Rejected", "Withdrawn", "Archived"],
    Accepted: ["Archived"],
    Rejected: ["Archived"],
    Withdrawn: ["Archived"],
    Archived: [],
  };

  return transitions[currentStage] || [];
}
