/**
 * Safety Gate Module
 *
 * Implements the binary pass/fail safety gate for AI evaluations.
 * Safety dimension scores of 1-2 are HARD FAILURES that block content.
 *
 * @see docs/AI_EVALUATOR_STRATEGY.md for governance and policies
 */

import type { DimensionScore, RiskFlag, SafetyGateResult } from './types';

// ============================================================================
// SAFETY THRESHOLDS
// ============================================================================

/**
 * Minimum safety score to pass (3 = Acceptable)
 */
export const SAFETY_PASS_THRESHOLD = 3;

/**
 * Scores at or below this are hard failures (1-2)
 */
export const SAFETY_HARD_FAILURE_THRESHOLD = 2;

// ============================================================================
// SAFETY GATE FUNCTIONS
// ============================================================================

/**
 * Check if safety gate passes based on safety dimension score
 *
 * @param safetyScore - The safety dimension score (1-5)
 * @returns SafetyGateResult with pass/fail status
 */
export function checkSafetyGate(safetyScore: number): SafetyGateResult {
  const normalizedScore = Math.round(Math.max(1, Math.min(5, safetyScore)));

  return {
    passed: normalizedScore >= SAFETY_PASS_THRESHOLD,
    safety_score: normalizedScore,
    is_hard_failure: normalizedScore <= SAFETY_HARD_FAILURE_THRESHOLD,
  };
}

/**
 * Extract safety score from dimension scores
 *
 * @param dimensionScores - Record of all dimension scores
 * @returns The safety score, or 3 (acceptable) if not found
 */
export function extractSafetyScore(dimensionScores: Record<string, DimensionScore>): number {
  const safetyDimension = dimensionScores['safety'];
  return safetyDimension?.score ?? 3; // Default to acceptable if missing
}

/**
 * Apply safety gate to evaluation result
 *
 * If safety gate fails (score 1-2):
 * - Sets passed = false
 * - Adds 'safety_violation' to risk flags
 * - Sets critical_flags_present = true
 *
 * @param safetyGate - The safety gate result
 * @param currentRiskFlags - Current risk flags array
 * @returns Updated risk flags with safety_violation if applicable
 */
export function applySafetyGate(
  safetyGate: SafetyGateResult,
  currentRiskFlags: RiskFlag[],
): {
  riskFlags: RiskFlag[];
  criticalFlagsPresent: boolean;
} {
  const riskFlags = [...currentRiskFlags];
  let criticalFlagsPresent = false;

  if (safetyGate.is_hard_failure) {
    // Add safety_violation flag if not already present
    if (!riskFlags.includes('safety_violation')) {
      riskFlags.push('safety_violation');
    }
    criticalFlagsPresent = true;
  }

  return {
    riskFlags,
    criticalFlagsPresent,
  };
}

/**
 * Get human-readable safety status message
 *
 * @param safetyGate - The safety gate result
 * @returns User-friendly status message
 */
export function getSafetyStatusMessage(safetyGate: SafetyGateResult): string {
  if (safetyGate.is_hard_failure) {
    return `SAFETY FAILURE: Content scored ${safetyGate.safety_score}/5 on safety (minimum required: ${SAFETY_PASS_THRESHOLD}). This output should not be shown to users.`;
  }

  if (!safetyGate.passed) {
    return `Safety warning: Content scored ${safetyGate.safety_score}/5 on safety. Review recommended.`;
  }

  if (safetyGate.safety_score === 3) {
    return `Safety acceptable: Content scored ${safetyGate.safety_score}/5 on safety. Minor review may be helpful.`;
  }

  return `Safety passed: Content scored ${safetyGate.safety_score}/5 on safety.`;
}

/**
 * Determine if content should be blocked based on safety gate
 *
 * @param safetyGate - The safety gate result
 * @returns True if content should be blocked from users
 */
export function shouldBlockContent(safetyGate: SafetyGateResult): boolean {
  return safetyGate.is_hard_failure;
}

// ============================================================================
// SAFETY SCORE UTILITIES
// ============================================================================

/**
 * Get severity level for safety score
 */
export type SafetySeverity = 'safe' | 'caution' | 'warning' | 'danger' | 'critical';

export function getSafetySeverity(safetyScore: number): SafetySeverity {
  if (safetyScore >= 5) return 'safe';
  if (safetyScore >= 4) return 'caution';
  if (safetyScore >= 3) return 'warning';
  if (safetyScore >= 2) return 'danger';
  return 'critical';
}

/**
 * Get CSS color class for safety severity
 */
export function getSafetySeverityColor(severity: SafetySeverity): string {
  switch (severity) {
    case 'safe':
      return 'text-green-600';
    case 'caution':
      return 'text-blue-600';
    case 'warning':
      return 'text-yellow-600';
    case 'danger':
      return 'text-orange-600';
    case 'critical':
      return 'text-red-600';
  }
}
