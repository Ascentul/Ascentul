/**
 * Cover Letter Tool Rubrics (v2.0)
 *
 * Configuration for cover letter generation and analysis tool evaluations.
 *
 * NOTE: v2.0 uses 5 standardized dimensions (relevance, specificity, safety, tone_fit, factual_correctness)
 * defined in standardized-rubric.ts. Tool rubrics now only specify metadata and critical flags.
 */

import { ToolRubric } from '../types';

/**
 * Cover Letter Generation Rubric
 *
 * Evaluates AI-generated cover letters for quality, personalization, and effectiveness.
 */
export const COVER_LETTER_GENERATION_RUBRIC: ToolRubric = {
  tool_id: 'cover-letter-generation',
  version: '2.0.0',
  description:
    'Evaluates AI-generated cover letter content. Output should be personalized to the company and role, specific with relevant examples, professional in tone, and factually accurate.',
  category: 'student-facing',
  critical_risk_flags: [
    'too_generic',
    'factual_inconsistency',
    'hallucination_detected',
    'safety_violation',
  ],
};

/**
 * Cover Letter Analysis Rubric
 *
 * Evaluates AI analysis of cover letter effectiveness.
 */
export const COVER_LETTER_ANALYSIS_RUBRIC: ToolRubric = {
  tool_id: 'cover-letter-analysis',
  version: '2.0.0',
  description:
    'Evaluates AI analysis of cover letter quality. Analysis should be accurate, specific with actionable feedback, and professionally presented.',
  category: 'student-facing',
  critical_risk_flags: ['hallucination_detected', 'factual_inconsistency', 'safety_violation'],
};
