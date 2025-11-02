/**
 * Cover Letter Validation Schemas
 *
 * Zod schemas for cover letter creation, analysis, and manipulation
 */

import { z } from 'zod'

/**
 * Cover letter create input schema
 */
export const CoverLetterCreateInputSchema = z.object({
  resumeId: z.string().optional(),
  jdText: z.string().min(40, 'Job description must be at least 40 characters'),
  company: z.string().optional(),
  roleTitle: z.string().optional(),
  hiringManager: z.string().optional(),
  tone: z.enum(['professional', 'friendly', 'concise']).default('professional'),
})

export type CoverLetterCreateInput = z.infer<typeof CoverLetterCreateInputSchema>

/**
 * Cover letter upload input schema
 */
export const CoverLetterUploadInputSchema = z.object({
  fileId: z.string(), // Convex storage ID
  filename: z.string(),
  extractText: z.boolean().default(true),
})

export type CoverLetterUploadInput = z.infer<typeof CoverLetterUploadInputSchema>

/**
 * Cover letter analyze input schema
 */
export const CoverLetterAnalyzeInputSchema = z.object({
  coverLetterId: z.string(),
  jdText: z.string().min(40).optional(),
  targetRole: z.string().optional(),
})

export type CoverLetterAnalyzeInput = z.infer<typeof CoverLetterAnalyzeInputSchema>

/**
 * Cover letter analysis output schema
 */
export const CoverLetterAnalysisOutputSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).max(10),
  suggestions: z.array(
    z.object({
      section: z.enum(['opening', 'body', 'closing', 'overall']),
      issue: z.string(),
      recommendation: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
    })
  ),
  toneAnalysis: z.object({
    detected: z.string(),
    appropriate: z.boolean(),
    suggestion: z.string().optional(),
  }),
})

export type CoverLetterAnalysisOutput = z.infer<typeof CoverLetterAnalysisOutputSchema>

/**
 * Cover letter update input schema
 */
export const CoverLetterUpdateInputSchema = z.object({
  coverLetterId: z.string(),
  content: z.string().min(50).optional(),
  company: z.string().optional(),
  roleTitle: z.string().optional(),
})

export type CoverLetterUpdateInput = z.infer<typeof CoverLetterUpdateInputSchema>

/**
 * Cover letter delete input schema
 */
export const CoverLetterDeleteInputSchema = z.object({
  coverLetterId: z.string(),
})

export type CoverLetterDeleteInput = z.infer<typeof CoverLetterDeleteInputSchema>

/**
 * Cover letter generation output schema
 */
export const CoverLetterGenerationOutputSchema = z.object({
  content: z.string().min(100),
  sections: z.object({
    opening: z.string(),
    hook: z.string(),
    valueBullets: z.array(z.string()).length(3),
    closing: z.string(),
  }),
})

export type CoverLetterGenerationOutput = z.infer<typeof CoverLetterGenerationOutputSchema>
