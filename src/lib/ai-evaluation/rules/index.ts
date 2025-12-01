/**
 * AI Evaluation Rule Engine
 *
 * Deterministic rule checks that run before and after model-based evaluation.
 * These catch issues that shouldn't rely on an LLM to detect.
 */

import { z, ZodSchema } from 'zod';

import { RiskFlag, RuleCheckResult, RuleCheckResults } from '../types';
import { checkForbiddenPatterns, ForbiddenPattern } from './forbidden-patterns';

// ============================================================================
// LENGTH LIMITS CONFIGURATION
// ============================================================================

export interface LengthLimits {
  minLength?: number;
  maxLength?: number;
  minWords?: number;
  maxWords?: number;
}

/**
 * Default length limits by tool type
 */
export const DEFAULT_LENGTH_LIMITS: Record<string, LengthLimits> = {
  'resume-generation': { minLength: 200, maxLength: 10000, minWords: 50 },
  'resume-analysis': { minLength: 100, maxLength: 5000, minWords: 30 },
  'resume-optimization': { minLength: 200, maxLength: 10000, minWords: 50 },
  'resume-suggestions': { minLength: 50, maxLength: 2000, minWords: 10 },
  'resume-parse': { minLength: 50, maxLength: 15000 },
  'cover-letter-generation': { minLength: 300, maxLength: 3000, minWords: 100, maxWords: 600 },
  'cover-letter-analysis': { minLength: 100, maxLength: 5000, minWords: 30 },
  'ai-coach-response': { minLength: 50, maxLength: 4000, minWords: 20, maxWords: 800 },
  'ai-coach-message': { minLength: 20, maxLength: 4000, minWords: 5 },
  'career-path-generation': { minLength: 500, maxLength: 20000 },
  'career-path-from-job': { minLength: 500, maxLength: 20000 },
  'career-paths-generation': { minLength: 500, maxLength: 30000 },
  'career-certifications': { minLength: 200, maxLength: 5000 },
};

// ============================================================================
// PRE-EVALUATION RULES
// ============================================================================

/**
 * Validate output against a Zod schema
 */
export function validateSchema(
  output: unknown,
  schema: ZodSchema,
  ruleName = 'schema_validation',
): RuleCheckResult {
  const result = schema.safeParse(output);

  if (result.success) {
    return {
      passed: true,
      rule_name: ruleName,
      severity: 'info',
    };
  }

  return {
    passed: false,
    rule_name: ruleName,
    message: `Schema validation failed: ${result.error.message}`,
    severity: 'error',
  };
}

/**
 * Check string length limits
 */
export function checkLengthLimits(
  output: string,
  limits: LengthLimits,
  ruleName = 'length_limits',
): RuleCheckResult {
  const length = output.length;
  const wordCount = output.split(/\s+/).filter(Boolean).length;

  if (limits.minLength && length < limits.minLength) {
    return {
      passed: false,
      rule_name: ruleName,
      message: `Output too short: ${length} chars (minimum: ${limits.minLength})`,
      severity: 'error',
    };
  }

  if (limits.maxLength && length > limits.maxLength) {
    return {
      passed: false,
      rule_name: ruleName,
      message: `Output too long: ${length} chars (maximum: ${limits.maxLength})`,
      severity: 'warning',
    };
  }

  if (limits.minWords && wordCount < limits.minWords) {
    return {
      passed: false,
      rule_name: ruleName,
      message: `Output too short: ${wordCount} words (minimum: ${limits.minWords})`,
      severity: 'error',
    };
  }

  if (limits.maxWords && wordCount > limits.maxWords) {
    return {
      passed: false,
      rule_name: ruleName,
      message: `Output too long: ${wordCount} words (maximum: ${limits.maxWords})`,
      severity: 'warning',
    };
  }

  return {
    passed: true,
    rule_name: ruleName,
    severity: 'info',
  };
}

/**
 * Check for forbidden patterns in output
 */
export function checkForbiddenPatternsRule(
  output: string,
  ruleName = 'forbidden_patterns',
): { result: RuleCheckResult; matchedPatterns: ForbiddenPattern[] } {
  const { matches, hasBlocking } = checkForbiddenPatterns(output);

  if (matches.length === 0) {
    return {
      result: {
        passed: true,
        rule_name: ruleName,
        severity: 'info',
      },
      matchedPatterns: [],
    };
  }

  const descriptions = matches.map((m) => m.description).join('; ');

  return {
    result: {
      passed: !hasBlocking,
      rule_name: ruleName,
      message: `Forbidden patterns detected: ${descriptions}`,
      severity: hasBlocking ? 'error' : 'warning',
    },
    matchedPatterns: matches,
  };
}

/**
 * Validate required fields are present in object output
 */
export function validateRequiredFields(
  output: Record<string, unknown>,
  requiredFields: string[],
  ruleName = 'required_fields',
): RuleCheckResult {
  const missingFields = requiredFields.filter((field) => {
    const value = output[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length === 0) {
    return {
      passed: true,
      rule_name: ruleName,
      severity: 'info',
    };
  }

  return {
    passed: false,
    rule_name: ruleName,
    message: `Missing required fields: ${missingFields.join(', ')}`,
    severity: 'error',
  };
}

/**
 * Check if output is empty or only whitespace
 */
export function checkNotEmpty(output: string, ruleName = 'not_empty'): RuleCheckResult {
  if (!output || output.trim().length === 0) {
    return {
      passed: false,
      rule_name: ruleName,
      message: 'Output is empty',
      severity: 'error',
    };
  }

  return {
    passed: true,
    rule_name: ruleName,
    severity: 'info',
  };
}

// ============================================================================
// POST-EVALUATION RULES
// ============================================================================

/**
 * Enforce minimum score threshold
 */
export function enforceThreshold(
  score: number,
  threshold: number,
  ruleName = 'threshold',
): RuleCheckResult {
  if (score >= threshold) {
    return {
      passed: true,
      rule_name: ruleName,
      severity: 'info',
    };
  }

  return {
    passed: false,
    rule_name: ruleName,
    message: `Score ${score} below threshold ${threshold}`,
    severity: 'error',
  };
}

/**
 * Block if critical risk flags are present
 */
export function blockCriticalRiskFlags(
  flags: RiskFlag[],
  criticalFlags: RiskFlag[],
  ruleName = 'critical_flags',
): RuleCheckResult {
  const presentCritical = flags.filter((f) => criticalFlags.includes(f));

  if (presentCritical.length === 0) {
    return {
      passed: true,
      rule_name: ruleName,
      severity: 'info',
    };
  }

  return {
    passed: false,
    rule_name: ruleName,
    message: `Critical risk flags present: ${presentCritical.join(', ')}`,
    severity: 'error',
  };
}

/**
 * Check for copy-paste from input (basic version)
 *
 * Detects if output contains long segments identical to input.
 */
export function checkCopyPaste(
  output: string,
  input: string,
  maxIdenticalChars = 100,
  ruleName = 'copy_paste',
): RuleCheckResult {
  // Normalize both strings
  const normalizedOutput = output.toLowerCase().replace(/\s+/g, ' ');
  const normalizedInput = input.toLowerCase().replace(/\s+/g, ' ');

  // Check for identical segments
  let maxFound = 0;
  for (let i = 0; i < normalizedInput.length - maxIdenticalChars; i++) {
    const segment = normalizedInput.slice(i, i + maxIdenticalChars);
    if (normalizedOutput.includes(segment)) {
      // Found a match, try to extend it
      let j = maxIdenticalChars;
      while (
        i + j < normalizedInput.length &&
        normalizedOutput.includes(normalizedInput.slice(i, i + j + 1))
      ) {
        j++;
      }
      maxFound = Math.max(maxFound, j);
    }
  }

  if (maxFound > maxIdenticalChars) {
    return {
      passed: false,
      rule_name: ruleName,
      message: `Found ${maxFound} characters copied from input (max allowed: ${maxIdenticalChars})`,
      severity: 'warning',
    };
  }

  return {
    passed: true,
    rule_name: ruleName,
    severity: 'info',
  };
}

// ============================================================================
// COMBINED RULE RUNNERS
// ============================================================================

/**
 * Run all pre-evaluation rules
 */
export function runPreEvaluationRules(
  output: string,
  toolId: string,
  options?: {
    schema?: ZodSchema;
    requiredFields?: string[];
    lengthLimits?: LengthLimits;
  },
): RuleCheckResults {
  const results: RuleCheckResult[] = [];

  // Check not empty
  results.push(checkNotEmpty(output));

  // Check length limits
  const limits = options?.lengthLimits || DEFAULT_LENGTH_LIMITS[toolId];
  if (limits) {
    results.push(checkLengthLimits(output, limits));
  }

  // Check forbidden patterns
  const { result: patternResult } = checkForbiddenPatternsRule(output);
  results.push(patternResult);

  // Check schema if provided
  if (options?.schema) {
    try {
      const parsed = JSON.parse(output);
      results.push(validateSchema(parsed, options.schema));
    } catch {
      results.push({
        passed: false,
        rule_name: 'json_parse',
        message: 'Output is not valid JSON',
        severity: 'error',
      });
    }
  }

  // Check required fields if provided
  if (options?.requiredFields) {
    try {
      const parsed = JSON.parse(output);
      results.push(validateRequiredFields(parsed, options.requiredFields));
    } catch {
      // Skip if not JSON
    }
  }

  const blockingFailures = results.filter((r) => !r.passed && r.severity === 'error');

  return {
    all_passed: blockingFailures.length === 0,
    results,
    blocking_failures: blockingFailures,
  };
}

/**
 * Run all post-evaluation rules
 */
export function runPostEvaluationRules(
  score: number,
  riskFlags: RiskFlag[],
  threshold: number,
  criticalFlags: RiskFlag[],
  options?: {
    output?: string;
    input?: string;
  },
): RuleCheckResults {
  const results: RuleCheckResult[] = [];

  // Check threshold
  results.push(enforceThreshold(score, threshold));

  // Check critical flags
  results.push(blockCriticalRiskFlags(riskFlags, criticalFlags));

  // Check copy-paste if both output and input provided
  if (options?.output && options?.input) {
    results.push(checkCopyPaste(options.output, options.input));
  }

  const blockingFailures = results.filter((r) => !r.passed && r.severity === 'error');

  return {
    all_passed: blockingFailures.length === 0,
    results,
    blocking_failures: blockingFailures,
  };
}

// Re-export forbidden patterns for direct use
export * from './forbidden-patterns';
