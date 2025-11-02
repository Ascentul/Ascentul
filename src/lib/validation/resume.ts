/**
 * Resume Validation Schemas
 *
 * Zod schemas for resume creation, analysis, and manipulation
 */

import { z } from 'zod'

/**
 * Resume block schema
 *
 * Represents a single section/block in a resume (e.g., experience, education, skills)
 */
export const ResumeBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string(), // e.g., 'experience', 'education', 'skills', 'summary'
  content: z.record(z.unknown()), // Flexible content object for different block types
  order: z.number().optional(),
})

export type ResumeBlock = z.infer<typeof ResumeBlockSchema>

/**
 * Resume create input schema
 */
export const ResumeCreateInputSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  blocks: z.array(ResumeBlockSchema).default([]),
  theme: z.string().optional(),
  template: z.string().optional(),
})

export type ResumeCreateInput = z.infer<typeof ResumeCreateInputSchema>

/**
 * Resume from job description input schema
 */
export const ResumeFromJDInputSchema = z.object({
  jdText: z.string().min(40, 'Job description must be at least 40 characters'),
  baseResumeId: z.string().optional(),
  targetRole: z.string().optional(),
  company: z.string().optional(),
})

export type ResumeFromJDInput = z.infer<typeof ResumeFromJDInputSchema>

/**
 * Resume upload input schema
 */
export const ResumeUploadInputSchema = z.object({
  fileId: z.string(), // Convex storage ID
  filename: z.string(),
  extractText: z.boolean().default(true),
})

export type ResumeUploadInput = z.infer<typeof ResumeUploadInputSchema>

/**
 * Resume analyze input schema
 */
export const ResumeAnalyzeInputSchema = z.object({
  resumeId: z.string(),
  jdText: z.string().min(40).optional(),
  targetRole: z.string().optional(),
})

export type ResumeAnalyzeInput = z.infer<typeof ResumeAnalyzeInputSchema>

/**
 * Resume analysis output schema
 */
export const ResumeAnalysisOutputSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).max(10),
  gaps: z.array(z.string()).max(10),
  suggestions: z.array(
    z.object({
      section: z.string(),
      issue: z.string(),
      recommendation: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
    })
  ),
})

export type ResumeAnalysisOutput = z.infer<typeof ResumeAnalysisOutputSchema>

/**
 * Resume update input schema
 */
export const ResumeUpdateInputSchema = z.object({
  resumeId: z.string(),
  title: z.string().min(2).optional(),
  blocks: z.array(ResumeBlockSchema).optional(),
  theme: z.string().optional(),
})

export type ResumeUpdateInput = z.infer<typeof ResumeUpdateInputSchema>

/**
 * Resume delete input schema
 */
export const ResumeDeleteInputSchema = z.object({
  resumeId: z.string(),
})

export type ResumeDeleteInput = z.infer<typeof ResumeDeleteInputSchema>

/**
 * Resume block diff schema (for AI-generated changes)
 */
export const ResumeBlockDiffSchema = z.object({
  action: z.enum(['add', 'update', 'remove']),
  blockId: z.string().optional(),
  blockType: z.string().optional(),
  content: z.record(z.unknown()).optional(), // Flexible content matching ResumeBlockSchema
  reason: z.string(),
})

export type ResumeBlockDiff = z.infer<typeof ResumeBlockDiffSchema>
