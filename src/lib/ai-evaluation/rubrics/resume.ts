/**
 * Resume Tool Rubrics (v2.0)
 *
 * Configuration for resume-related AI tool evaluations.
 *
 * NOTE: v2.0 uses 5 standardized dimensions (relevance, specificity, safety, tone_fit, factual_correctness)
 * defined in standardized-rubric.ts. Tool rubrics now only specify metadata and critical flags.
 */

import { ToolRubric } from '../types';

/**
 * Resume Generation Rubric
 *
 * Evaluates AI-generated resumes for job applications.
 */
export const RESUME_GENERATION_RUBRIC: ToolRubric = {
  tool_id: 'resume-generation',
  version: '2.0.0',
  description:
    'Evaluates AI-generated resume content for job applications. Output should be tailored to the job, specific with metrics and achievements, professional in tone, and factually accurate.',
  category: 'student-facing',
  critical_risk_flags: [
    'factual_inconsistency',
    'pii_detected',
    'hallucination_detected',
    'safety_violation',
  ],
};

/**
 * Resume Analysis Rubric
 *
 * Evaluates the quality of AI analysis comparing resume to job description.
 */
export const RESUME_ANALYSIS_RUBRIC: ToolRubric = {
  tool_id: 'resume-analysis',
  version: '2.0.0',
  description:
    'Evaluates AI analysis of resume vs job description match. Analysis should be accurate, specific with actionable suggestions, and professionally presented.',
  category: 'student-facing',
  critical_risk_flags: ['hallucination_detected', 'factual_inconsistency', 'safety_violation'],
};

/**
 * Resume Optimization Rubric
 *
 * Evaluates AI-optimized resume content for improvement while maintaining accuracy.
 */
export const RESUME_OPTIMIZATION_RUBRIC: ToolRubric = {
  tool_id: 'resume-optimization',
  version: '2.0.0',
  description:
    'Evaluates AI optimization of existing resume content. Optimized content should improve job alignment while preserving factual accuracy.',
  category: 'student-facing',
  critical_risk_flags: ['factual_inconsistency', 'hallucination_detected', 'safety_violation'],
};

/**
 * Resume Suggestions Rubric
 *
 * Evaluates quick improvement suggestions for resumes.
 */
export const RESUME_SUGGESTIONS_RUBRIC: ToolRubric = {
  tool_id: 'resume-suggestions',
  version: '2.0.0',
  description:
    'Evaluates quick resume improvement suggestions. Suggestions should be specific, actionable, and relevant to the target job.',
  category: 'student-facing',
  critical_risk_flags: ['hallucination_detected', 'safety_violation'],
};

/**
 * Resume Parse Rubric
 *
 * Evaluates extraction of structured data from resume text.
 */
export const RESUME_PARSE_RUBRIC: ToolRubric = {
  tool_id: 'resume-parse',
  version: '2.0.0',
  description:
    'Evaluates extraction accuracy from resume documents. Extracted data should be complete and accurate.',
  category: 'student-facing',
  critical_risk_flags: ['hallucination_detected', 'safety_violation'],
};
