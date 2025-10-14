/**
 * AI Resume Generation Schemas
 *
 * This file re-exports types from the consolidated resume validators
 * to maintain backward compatibility with existing AI generation code.
 *
 * @deprecated Prefer importing directly from '@/lib/validators/resume'
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
export const blockSchema = resumeBlockDiscriminated;

// Re-export main output schema
export const resumeOutputSchema = aiResumeResponseSchema;

// Re-export types
export type ResumeOutput = AIResumeResponse;
export type ResumeBlock = ResumeBlockDiscriminated;

// Legacy exports for backward compatibility
export const resumeGenerationSchema = aiResumeResponseSchema;
export type ResumeGeneration = AIResumeResponse;
export type Block = ResumeBlockDiscriminated;
