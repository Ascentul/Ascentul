/**
 * Career Certifications Tool Rubric (v2.0)
 *
 * Configuration for certification recommendation evaluations.
 *
 * NOTE: v2.0 uses 5 standardized dimensions (relevance, specificity, safety, tone_fit, factual_correctness)
 * defined in standardized-rubric.ts. Tool rubrics now only specify metadata and critical flags.
 */

import { ToolRubric } from '../types';

/**
 * Career Certifications Rubric
 *
 * Evaluates AI-recommended certifications for relevance and credibility.
 */
export const CAREER_CERTIFICATIONS_RUBRIC: ToolRubric = {
  tool_id: 'career-certifications',
  version: '2.0.0',
  description:
    'Evaluates AI-recommended career certifications. Recommendations should be relevant to the target role, from reputable providers, achievable within reasonable time/cost, and factually accurate about certification details.',
  category: 'student-facing',
  critical_risk_flags: ['hallucination_detected', 'low_relevance', 'safety_violation'],
};
