/**
 * AI Resume Generation Schemas
 *
 * This file re-exports types from the consolidated resume validators
 * to maintain backward compatibility with existing AI generation code.
 *
 * @deprecated Prefer importing directly from '@/lib/validators/resume'
 *
 * @example Migration example:
 * // Old (deprecated):
 * import { resumeOutputSchema, ResumeBlock } from '@/lib/ai/resumeSchemas';
 *
 * // New (preferred):
 * import { aiResumeResponseSchema, type ResumeBlockDiscriminated } from '@/lib/validators/resume';
 */

import {
  headerBlock,
  summaryBlock,
  experienceBlock,
  educationBlock,
  skillsBlock,
  projectsBlock,
  customBlock,
  resumeBlockDiscriminated,
  aiResumeResponseSchema,
  type ResumeBlockDiscriminated,
  type AIResumeResponse,
} from '@/lib/validators/resume';

// Re-export individual block schemas
export {
  headerBlock as headerBlockSchema,
  summaryBlock as summaryBlockSchema,
  experienceBlock as experienceBlockSchema,
  educationBlock as educationBlockSchema,
  skillsBlock as skillsBlockSchema,
  projectsBlock as projectsBlockSchema,
  customBlock as customBlockSchema,
};

// Re-export discriminated union for AI validation
/** @deprecated Use `resumeBlockDiscriminated` from '@/lib/validators/resume' instead */
export const blockSchema = resumeBlockDiscriminated;

// Re-export main output schema
/** @deprecated Use `aiResumeResponseSchema` from '@/lib/validators/resume' instead */
export const resumeOutputSchema = aiResumeResponseSchema;

// Re-export types
/** @deprecated Use `AIResumeResponse` from '@/lib/validators/resume' instead */
export type ResumeOutput = AIResumeResponse;
/** @deprecated Use `ResumeBlockDiscriminated` from '@/lib/validators/resume' instead */
export type ResumeBlock = ResumeBlockDiscriminated;

// Legacy exports for backward compatibility
/** @deprecated Use `aiResumeResponseSchema` from '@/lib/validators/resume' instead */
export const resumeGenerationSchema = aiResumeResponseSchema;
/** @deprecated Use `AIResumeResponse` from '@/lib/validators/resume' instead */
export type ResumeGeneration = AIResumeResponse;
/** @deprecated Use `ResumeBlockDiscriminated` from '@/lib/validators/resume' instead */
export type Block = ResumeBlockDiscriminated;
