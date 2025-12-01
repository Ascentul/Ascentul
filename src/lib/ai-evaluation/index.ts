/**
 * AI Evaluation Module (v2.0)
 *
 * Centralized AI content evaluation framework for Ascentful.
 * Provides quality assessment, safety guardrails, and audit capabilities.
 *
 * VERSION 2.0: Uses standardized 1-5 scoring scale with 5 unified dimensions.
 * Safety dimension acts as binary pass/fail gate.
 *
 * @example
 * ```typescript
 * import { evaluate, AIToolId } from '@/lib/ai-evaluation';
 *
 * const result = await evaluate({
 *   tool_id: 'resume-generation',
 *   output: generatedResume,
 *   input_context: { jobDescription, userProfile },
 * });
 *
 * if (!result.passed) {
 *   // Handle failed evaluation
 *   console.log('Evaluation failed:', result.explanation);
 * }
 *
 * // Check safety gate specifically
 * if (result.safety_gate.is_hard_failure) {
 *   console.log('SAFETY FAILURE - content blocked');
 * }
 * ```
 *
 * @see docs/AI_EVALUATOR_STRATEGY.md for governance and policies
 */

// Core evaluator
export { AIEvaluator, evaluate, getEvaluator, hashContent } from './evaluator';

// Types
export type {
  AIToolId,
  DimensionScore,
  EvaluationConfig,
  EvaluationInput,
  EvaluationResult,
  EvaluationTelemetryEvent,
  RiskFlag,
  RuleCheckResult,
  RuleCheckResults,
  SafetyGateResult,
  Score1to5,
  ScoreLevel,
  ScoringCriteria5Point,
  StandardizedDimension,
  StandardizedDimensionDef,
  StoredEvaluation,
  ThresholdTargets,
  ToolCategory,
  ToolEvaluationContext,
  ToolRubric,
  ToolRubricConfig,
} from './types';

// Type utilities and constants
export {
  AI_TOOL_IDS,
  calculateOverallScore,
  checkSafetyGate,
  DEFAULT_EVALUATION_CONFIG,
  DEFAULT_THRESHOLD_TARGETS,
  EVALUATION_VERSION,
  evaluationPasses,
  EvaluationResultSchema,
  getScoreLevel,
  getScoreLevelFromInt,
  isCriticalFlag,
  RISK_FLAGS,
  SCORE_LEVELS,
  STANDARDIZED_DIMENSIONS,
  TOOL_CATEGORIES,
  ToolEvaluationContextSchema,
  ToolRubricConfigSchema,
  ToolRubricSchema,
} from './types';

// Rubrics
export { getAllRubrics, getRubric, hasRubric, RUBRICS } from './rubrics';

// Standardized rubric utilities
export {
  buildRubricPromptSection,
  getAllDimensions,
  getDimensionDef,
  getScoringCriteria,
  isSafetyGateDimension,
  STANDARDIZED_RUBRIC,
  STANDARDIZED_RUBRIC_VERSION,
} from './rubrics/standardized-rubric';

// Safety gate utilities
export type { SafetySeverity } from './safety-gate';
export {
  applySafetyGate,
  checkSafetyGate as checkSafetyGateUtil,
  extractSafetyScore,
  getSafetySeverity,
  getSafetySeverityColor,
  getSafetyStatusMessage,
  SAFETY_HARD_FAILURE_THRESHOLD,
  SAFETY_PASS_THRESHOLD,
  shouldBlockContent,
} from './safety-gate';

// Rules
export {
  blockCriticalRiskFlags,
  checkCopyPaste,
  checkForbiddenPatterns,
  checkForbiddenPatternsRule,
  checkLengthLimits,
  checkNotEmpty,
  DEFAULT_LENGTH_LIMITS,
  enforceThreshold,
  runPostEvaluationRules,
  runPreEvaluationRules,
  validateRequiredFields,
  validateSchema,
} from './rules';
