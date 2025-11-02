/**
 * Career Path Validation Schemas
 *
 * Zod schemas for career path search and planning
 */

import { z } from 'zod'

/**
 * Career path search input schema
 *
 * Note: Uses camelCase for client-side validation.
 * Backend mutations transform to snake_case for database storage.
 */
export const CareerPathSearchInputSchema = z.object({
  targetRole: z.string().min(2).optional(),
  major: z.string().optional(),
  currentSkills: z.array(z.string()).optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  industry: z.string().optional(),
})

export type CareerPathSearchInput = z.infer<typeof CareerPathSearchInputSchema>

/**
 * Career path step schema
 *
 * Note: Uses camelCase for client-side validation.
 * Backend mutations transform to snake_case for database storage.
 */
export const CareerPathStepSchema = z.object({
  step: z.number().int().positive(),
  title: z.string().min(2),
  description: z.string().min(10),
  durationMonths: z.number().int().positive(),
  requiredSkills: z.array(z.string()),
})

export type CareerPathStep = z.infer<typeof CareerPathStepSchema>

/**
 * Career path resource schema
 */
export const CareerPathResourceSchema = z.object({
  title: z.string().min(2),
  url: z.string().url(),
  type: z.enum(['course', 'article', 'book', 'video', 'certification', 'other']),
})

export type CareerPathResource = z.infer<typeof CareerPathResourceSchema>

/**
 * Career path output schema
 */
export const CareerPathOutputSchema = z.object({
  targetRole: z.string(),
  pathSteps: z.array(CareerPathStepSchema).min(1).max(10),
  suggestedGoals: z.array(z.string()).max(10),
  certifications: z.array(z.string()).max(10),
  resources: z.array(CareerPathResourceSchema).max(20),
  estimatedTimelineMonths: z.number().int().positive(),
})

export type CareerPathOutput = z.infer<typeof CareerPathOutputSchema>

/**
 * Career gap analysis input schema
 */
export const CareerGapAnalysisInputSchema = z.object({
  targetRole: z.string().min(2),
  currentSkills: z.array(z.string()),
  currentExperience: z.string().optional(),
})

export type CareerGapAnalysisInput = z.infer<typeof CareerGapAnalysisInputSchema>

/**
 * Career gap analysis output schema
 */
export const CareerGapAnalysisOutputSchema = z.object({
  skillGaps: z.array(
    z.object({
      skill: z.string(),
      importance: z.enum(['critical', 'important', 'nice-to-have']),
      learningPath: z.string(),
    })
  ),
  experienceGaps: z.array(z.string()),
  recommendations: z.array(
    z.object({
      action: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      timeline: z.string(),
    })
  ),
})

export type CareerGapAnalysisOutput = z.infer<typeof CareerGapAnalysisOutputSchema>
