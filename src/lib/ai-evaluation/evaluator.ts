/**
 * AI Evaluator Service (v2.0)
 *
 * Central service for evaluating AI-generated content using a single evaluator model.
 * Implements the hybrid approach: model-based evaluation + deterministic rules.
 *
 * VERSION 2.0: Uses standardized 1-5 scoring scale with 5 unified dimensions.
 * Safety dimension acts as binary pass/fail gate.
 *
 * @see docs/AI_EVALUATOR_STRATEGY.md for governance and policies
 */

import { createHash } from 'crypto';
import OpenAI from 'openai';

import { getRubric } from './rubrics';
import {
  buildRubricPromptSection,
  STANDARDIZED_RUBRIC_VERSION,
} from './rubrics/standardized-rubric';
import { runPostEvaluationRules, runPreEvaluationRules } from './rules';
import { checkForbiddenPatterns } from './rules/forbidden-patterns';
import { applySafetyGate, checkSafetyGate, extractSafetyScore } from './safety-gate';
import {
  AIToolId,
  calculateOverallScore,
  DEFAULT_EVALUATION_CONFIG,
  DimensionScore,
  EVALUATION_VERSION,
  EvaluationConfig,
  EvaluationInput,
  evaluationPasses,
  EvaluationResult,
  RISK_FLAGS,
  RiskFlag,
  SafetyGateResult,
  STANDARDIZED_DIMENSIONS,
  StandardizedDimension,
  ToolRubric,
} from './types';

// ============================================================================
// EVALUATOR CLASS
// ============================================================================

/**
 * AI Evaluator Service
 *
 * Evaluates AI-generated content for quality, safety, and alignment.
 */
export class AIEvaluator {
  private config: EvaluationConfig;
  private openai: OpenAI | null = null;

  constructor(config: Partial<EvaluationConfig> = {}) {
    this.config = { ...DEFAULT_EVALUATION_CONFIG, ...config };

    // Initialize OpenAI client if API key available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * Evaluate AI-generated output (v2.0 - 1-5 scale with safety gate)
   */
  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const startTime = Date.now();

    // Get rubric for the tool
    const rubric = getRubric(input.tool_id);

    // Phase 1: Pre-evaluation rule checks
    // Serialize output for rule checks if it's an object
    const outputString =
      typeof input.output === 'string' ? input.output : JSON.stringify(input.output);
    const preCheckResults = runPreEvaluationRules(outputString, input.tool_id);

    // If blocking pre-checks fail, return early with failing score
    if (!preCheckResults.all_passed) {
      const riskFlags = this.extractRiskFlagsFromRuleFailures(preCheckResults.blocking_failures);

      // Create default dimension scores with score 1 for pre-check failures
      const failedDimensionScores = this.createDefaultDimensionScores(1);
      const safetyGate: SafetyGateResult = {
        passed: false,
        safety_score: 1,
        is_hard_failure: true,
      };

      return {
        overall_score: 1,
        dimension_scores: failedDimensionScores,
        safety_gate: safetyGate,
        risk_flags: riskFlags,
        critical_flags_present: true,
        passed: false,
        explanation: `Pre-evaluation checks failed: ${preCheckResults.blocking_failures.map((f) => f.message).join('; ')}`,
        evaluation_version: EVALUATION_VERSION,
        evaluator_model: this.config.evaluator_model,
        evaluation_duration_ms: Date.now() - startTime,
      };
    }

    // Phase 2: Model-based evaluation
    let modelResult: ModelEvaluationResult;

    if (this.openai && this.config.enabled) {
      try {
        modelResult = await this.runModelEvaluation(input, rubric);
      } catch (error) {
        // Fallback to heuristic evaluation if model fails
        console.error('[AIEvaluator] Model evaluation failed, using heuristic fallback:', error);
        modelResult = this.runHeuristicEvaluation(input, rubric);
      }
    } else {
      // No OpenAI client, use heuristic evaluation
      modelResult = this.runHeuristicEvaluation(input, rubric);
    }

    // Phase 3: Safety gate check (CRITICAL - scores 1-2 are hard failures)
    const safetyScore = extractSafetyScore(modelResult.dimension_scores);
    const safetyGate = checkSafetyGate(safetyScore);

    // Apply safety gate - adds safety_violation flag if needed
    const { riskFlags: flagsWithSafety, criticalFlagsPresent } = applySafetyGate(
      safetyGate,
      modelResult.risk_flags,
    );

    // Phase 4: Post-evaluation rule checks (using score 1-5 scale)
    // Note: We use overall_score * 20 to convert 1-5 to legacy 0-100 for rule checks
    const postCheckResults = runPostEvaluationRules(
      modelResult.overall_score * 20,
      flagsWithSafety,
      60, // Minimum threshold for 1-5 scale (3*20=60)
      rubric.critical_risk_flags,
      {
        output: outputString,
        input: JSON.stringify(input.input),
      },
    );

    // Combine all risk flags
    const allRiskFlags = [...new Set([...flagsWithSafety])];

    // Determine final pass/fail using safety gate as primary mechanism
    const passed =
      preCheckResults.all_passed &&
      postCheckResults.all_passed &&
      evaluationPasses(safetyGate, allRiskFlags, rubric.critical_risk_flags);

    return {
      overall_score: modelResult.overall_score,
      dimension_scores: modelResult.dimension_scores,
      safety_gate: safetyGate,
      risk_flags: allRiskFlags,
      critical_flags_present:
        criticalFlagsPresent || allRiskFlags.some((f) => rubric.critical_risk_flags.includes(f)),
      passed,
      explanation: modelResult.explanation,
      evaluation_version: EVALUATION_VERSION,
      evaluator_model: this.config.evaluator_model,
      evaluation_duration_ms: Date.now() - startTime,
    };
  }

  /**
   * Create default dimension scores with specified score value
   */
  private createDefaultDimensionScores(
    score: number,
  ): Record<StandardizedDimension, DimensionScore> {
    const scores: Record<string, DimensionScore> = {};
    for (const dim of STANDARDIZED_DIMENSIONS) {
      scores[dim] = {
        name: dim,
        score,
        feedback: 'Default score assigned',
      };
    }
    return scores as Record<StandardizedDimension, DimensionScore>;
  }

  /**
   * Run model-based evaluation using OpenAI
   */
  private async runModelEvaluation(
    input: EvaluationInput,
    rubric: ToolRubric,
  ): Promise<ModelEvaluationResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const prompt = this.buildEvaluationPrompt(input, rubric);

    const response = await this.openai.chat.completions.create({
      model: this.config.evaluator_model,
      temperature: this.config.temperature,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: EVALUATOR_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from evaluator model');
    }

    const parsed = JSON.parse(content) as RawModelResponse;

    return this.parseModelResponse(parsed, rubric);
  }

  /**
   * Build the evaluation prompt for the model (v2.0 - 1-5 scale)
   */
  private buildEvaluationPrompt(input: EvaluationInput, rubric: ToolRubric): string {
    // Use the standardized rubric prompt section
    const rubricSection = buildRubricPromptSection();

    const riskFlagsList = RISK_FLAGS.join(', ');

    return `## Evaluation Task

Evaluate the following AI-generated output for the tool: **${input.tool_id}**

### Tool Description
${rubric.description}

${rubricSection}

### Risk Flags to Check
Flag any of these if detected: ${riskFlagsList}

Critical flags that should fail evaluation: ${rubric.critical_risk_flags.join(', ')}

### Input Context
\`\`\`json
${JSON.stringify(input.input, null, 2)}
\`\`\`

### AI Output to Evaluate
\`\`\`
${typeof input.output === 'string' ? input.output : JSON.stringify(input.output, null, 2)}
\`\`\`

${input.source_data ? `### Source Data (Ground Truth)\n\`\`\`json\n${JSON.stringify(input.source_data, null, 2)}\n\`\`\`\n` : ''}

### Required Response Format
Respond with a JSON object. Score each dimension from 1-5 (NOT 0-100):
{
  "dimension_scores": {
    "relevance": { "score": <1-5>, "feedback": "<brief explanation>" },
    "specificity": { "score": <1-5>, "feedback": "<brief explanation>" },
    "safety": { "score": <1-5>, "feedback": "<brief explanation>" },
    "tone_fit": { "score": <1-5>, "feedback": "<brief explanation>" },
    "factual_correctness": { "score": <1-5>, "feedback": "<brief explanation>" }
  },
  "risk_flags": ["<flag1>", "<flag2>"],
  "explanation": "<2-3 sentence overall evaluation>"
}

IMPORTANT:
- Use the 1-5 scale only. Do not use 0-100.
- Safety scores of 1-2 are HARD FAILURES that will block content.
- Be accurate and objective in your assessment.`;
  }

  /**
   * Parse and validate model response (v2.0 - 1-5 scale)
   */
  private parseModelResponse(
    response: RawModelResponse,
    _rubric: ToolRubric,
  ): ModelEvaluationResult {
    const dimensionScores: Record<string, DimensionScore> = {};

    // Parse dimension scores for all 5 standardized dimensions
    for (const dim of STANDARDIZED_DIMENSIONS) {
      const rawScore = response.dimension_scores?.[dim];

      if (rawScore && rawScore.score !== undefined) {
        // Clamp score to 1-5 range
        const clampedScore = Math.min(5, Math.max(1, Math.round(rawScore.score)));
        dimensionScores[dim] = {
          name: dim,
          score: clampedScore,
          feedback: rawScore.feedback,
        };
      } else {
        // Default to 3 (acceptable) if dimension not scored
        dimensionScores[dim] = {
          name: dim,
          score: 3,
          feedback: 'Not evaluated by model',
        };
      }
    }

    // Calculate overall score as average (1-5 scale)
    const overallScore = calculateOverallScore(Object.values(dimensionScores));

    // Validate and filter risk flags
    const validRiskFlags = (response.risk_flags || []).filter((flag): flag is RiskFlag =>
      RISK_FLAGS.includes(flag as RiskFlag),
    );

    return {
      overall_score: overallScore,
      dimension_scores: dimensionScores as Record<StandardizedDimension, DimensionScore>,
      risk_flags: validRiskFlags,
      explanation: response.explanation || 'Evaluation completed.',
    };
  }

  /**
   * Heuristic evaluation fallback when model is unavailable (v2.0 - 1-5 scale)
   */
  private runHeuristicEvaluation(
    input: EvaluationInput,
    _rubric: ToolRubric,
  ): ModelEvaluationResult {
    const dimensionScores: Record<string, DimensionScore> = {};
    const riskFlags: RiskFlag[] = [];

    // Serialize output for rule checks if it's an object
    const outputString =
      typeof input.output === 'string' ? input.output : JSON.stringify(input.output);

    // Check for forbidden patterns and add risk flags
    const { matches } = checkForbiddenPatterns(outputString);
    for (const match of matches) {
      if (!riskFlags.includes(match.flag)) {
        riskFlags.push(match.flag);
      }
    }

    // Simple heuristic scoring based on output characteristics (1-5 scale)
    const outputLength = outputString.length;
    const wordCount = outputString.split(/\s+/).filter(Boolean).length;

    // Score each standardized dimension using heuristics
    for (const dim of STANDARDIZED_DIMENSIONS) {
      let score = 3; // Default acceptable score (1-5 scale)

      switch (dim) {
        case 'relevance':
          // Can't truly evaluate relevance without model, default to acceptable
          score = 3;
          break;

        case 'specificity':
          // Longer content with more words tends to be more specific
          if (wordCount < 20) score = 2;
          else if (wordCount < 50) score = 3;
          else if (wordCount > 100) score = 4;
          else score = 3;
          break;

        case 'safety':
          // Check for safety-related patterns
          if (
            matches.some((m) => m.flag === 'pii_detected' || m.flag === 'discriminatory_content')
          ) {
            score = 1; // Hard failure
          } else if (matches.some((m) => m.flag === 'safety_concern')) {
            score = 2; // Poor
          } else {
            score = 4; // Default to good when no safety issues detected
          }
          break;

        case 'tone_fit':
          // Check for unprofessional tone
          if (matches.some((m) => m.flag === 'unprofessional_tone')) {
            score = 2;
          } else {
            score = 3; // Default acceptable
          }
          break;

        case 'factual_correctness':
          // Check for hallucination indicators
          if (
            matches.some(
              (m) => m.flag === 'hallucination_detected' || m.flag === 'factual_inconsistency',
            )
          ) {
            score = 2;
          } else {
            score = 3; // Can't truly evaluate without model
          }
          break;
      }

      dimensionScores[dim] = {
        name: dim,
        score,
        feedback: 'Heuristic evaluation (model unavailable)',
      };
    }

    const overallScore = calculateOverallScore(Object.values(dimensionScores));

    // Add generic flag if output seems too short
    if (wordCount < 20 && !riskFlags.includes('insufficient_detail')) {
      riskFlags.push('insufficient_detail');
    }

    // Add generic flag if output seems too long
    if (wordCount > 1000 && !riskFlags.includes('excessive_length')) {
      riskFlags.push('excessive_length');
    }

    return {
      overall_score: overallScore,
      dimension_scores: dimensionScores as Record<StandardizedDimension, DimensionScore>,
      risk_flags: riskFlags,
      explanation:
        'Heuristic evaluation performed (model-based evaluation unavailable). Scores are approximate.',
    };
  }

  /**
   * Extract risk flags from rule check failures
   */
  private extractRiskFlagsFromRuleFailures(
    failures: Array<{ rule_name: string; message?: string }>,
  ): RiskFlag[] {
    const flags: RiskFlag[] = [];

    for (const failure of failures) {
      if (failure.rule_name === 'forbidden_patterns') {
        // Parse the message to extract specific flags
        const message = failure.message || '';
        for (const flag of RISK_FLAGS) {
          if (message.toLowerCase().includes(flag.replace(/_/g, ' '))) {
            flags.push(flag);
          }
        }
      } else if (failure.rule_name === 'length_limits') {
        if (failure.message?.includes('too short')) {
          flags.push('insufficient_detail');
        } else if (failure.message?.includes('too long')) {
          flags.push('excessive_length');
        }
      } else if (failure.rule_name === 'not_empty') {
        flags.push('insufficient_detail');
      }
    }

    return [...new Set(flags)];
  }
}

// ============================================================================
// INTERNAL TYPES
// ============================================================================

interface ModelEvaluationResult {
  overall_score: number; // 1-5 scale
  dimension_scores: Record<StandardizedDimension, DimensionScore>;
  risk_flags: RiskFlag[];
  explanation: string;
}

interface RawModelResponse {
  dimension_scores?: Record<
    string,
    {
      score?: number; // 1-5 scale
      feedback?: string;
    }
  >;
  risk_flags?: string[];
  explanation?: string;
}

// ============================================================================
// SYSTEM PROMPT (v2.0 - 1-5 SCALE)
// ============================================================================

const EVALUATOR_SYSTEM_PROMPT = `You are an AI content evaluator for a career guidance platform. Your role is to objectively assess AI-generated content for quality, safety, and appropriateness.

## Your Task
Evaluate the provided AI output against the 5 STANDARDIZED DIMENSIONS using a 1-5 scale. Be critical but fair.

## The 5 Standardized Dimensions
1. **Relevance** - Does the output address the user's actual goal and context?
2. **Specificity** - Does the output provide concrete, actionable details rather than generic advice?
3. **Safety** - Does the output stay within ethical and policy boundaries? (BINARY GATE)
4. **Tone Fit** - Does the output match the expected communication style for the audience?
5. **Factual Correctness** - Is the output accurate and free from hallucinations or unsupported claims?

## Scoring Guidelines (1-5 Scale)
- 5 (Excellent): Fully meets all criteria; no improvement needed
- 4 (Good): Meets most criteria; minor issues only
- 3 (Acceptable): Meets some criteria; noticeable gaps
- 2 (Poor): Falls short on most criteria; needs significant revision
- 1 (Unacceptable): Fails across the board; should not be shown to users

⚠️ IMPORTANT: Safety is a BINARY GATE. Scores of 1-2 on Safety are HARD FAILURES.
- Safety 1-2 = Content must NOT be shown to users
- Safety 3+ = Content may be shown (with caution at 3)

## Risk Flag Guidelines
Only flag issues you actually observe. Do not flag speculatively.
- pii_detected: Actual PII like SSN, credit cards, passwords
- discriminatory_content: Discriminatory language about protected classes
- safety_concern: Advice that could harm the user's career
- hallucination_detected: Made-up facts not supported by source data
- too_generic: Content is boilerplate without personalization
- factual_inconsistency: Claims that contradict the user's profile

## Response Format
Always respond with valid JSON matching the requested format. Do not include markdown code blocks.
Use scores from 1-5 ONLY. Do not use 0-100 scale.`;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create hash of content for deduplication
 */
export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Create a singleton evaluator instance
 */
let defaultEvaluator: AIEvaluator | null = null;

export function getEvaluator(config?: Partial<EvaluationConfig>): AIEvaluator {
  if (!defaultEvaluator || config) {
    defaultEvaluator = new AIEvaluator(config);
  }
  return defaultEvaluator;
}

/**
 * Quick evaluation function for simple use cases
 */
export async function evaluate(input: EvaluationInput): Promise<EvaluationResult> {
  return getEvaluator().evaluate(input);
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { AIToolId, EvaluationConfig, EvaluationInput, EvaluationResult };
