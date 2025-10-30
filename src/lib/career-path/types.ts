/**
 * Career Path Types
 *
 * Strict type definitions for Career Path Explorer feature.
 * Discriminated union pattern prevents mixing profile prep tasks with real job roles.
 */

import { z } from 'zod'

// ============================================================================
// CAREER PATH ROLE TYPES (Real job progression)
// ============================================================================

export const SkillLevelSchema = z.enum(['basic', 'intermediate', 'advanced'])
export type SkillLevel = z.infer<typeof SkillLevelSchema>

export const StageLevelSchema = z.enum(['entry', 'mid', 'senior', 'lead', 'executive'])
export type StageLevel = z.infer<typeof StageLevelSchema>

export const GrowthPotentialSchema = z.enum(['low', 'medium', 'high'])
export type GrowthPotential = z.infer<typeof GrowthPotentialSchema>

export const CareerSkillSchema = z.object({
  name: z.string().min(1),
  level: SkillLevelSchema,
})
export type CareerSkill = z.infer<typeof CareerSkillSchema>

export const CertificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  url: z.string().url(),
})
export type Certification = z.infer<typeof CertificationSchema>

// Salary pattern: "$X,XXX - $Y,YYY" or "$XXX,XXX+"
const salaryPattern = /^\$[\d,]+(\s*-\s*\$[\d,]+|\+)$/

// Years pattern: "X-Y years" or "X+ years"
const yearsPattern = /^\d+(-\d+)?\+?\s+years?$/i

export const CareerPathRoleSchema = z.object({
  id: z.string(),
  role_title: z.string().min(1),
  seniority_level: StageLevelSchema,
  years_experience_required: z.number().int().min(0).max(50), // Numeric years only
  median_us_base_salary_usd: z.number().int().positive().nullable(), // Numeric salary or null
  role_description: z.string().min(15), // Align with QUALITY_THRESHOLDS.MIN_DESCRIPTION_LENGTH in route.ts
  top_skills: z.array(z.string().min(1)).min(1).max(10),
  recommended_certifications: z.array(CertificationSchema).max(10),
  growth_outlook: z.string().nullable(), // Free-form growth description
  role_category: z.string().min(3).max(50), // Short category like "Marketing and Communications"
  icon: z.string().optional(), // Icon identifier for UI
})

export type CareerPathRole = z.infer<typeof CareerPathRoleSchema>

// Legacy format for backward compatibility with existing UI
export const LegacyCareerNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  level: StageLevelSchema,
  salaryRange: z.string().regex(salaryPattern, 'Invalid salary format'),
  yearsExperience: z.string().regex(yearsPattern, 'Invalid years format'),
  skills: z.array(CareerSkillSchema),
  description: z.string().min(20),
  growthPotential: GrowthPotentialSchema,
  icon: z.string(),
})

export type LegacyCareerNode = z.infer<typeof LegacyCareerNodeSchema>

export const CareerPathResponseSchema = z.object({
  type: z.literal('career_path'),
  id: z.string(),
  name: z.string(),
  target_role: z.string(),
  nodes: z.array(LegacyCareerNodeSchema).min(4).max(8), // 4-8 stages
})

export type CareerPathResponse = z.infer<typeof CareerPathResponseSchema>

// ============================================================================
// PROFILE PREP TASK TYPES (Fallback guidance)
// ============================================================================

export const ProfileTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  category: z.string(), // e.g., "Profile update", "Skill enhancement"
  priority: z.enum(['low', 'medium', 'high']),
  estimated_duration_minutes: z.number().int().positive(), // Duration in minutes
  description: z.string().min(20),
  icon: z.string().optional(),
  action_url: z.string().optional(), // Optional deep link to action
})

export type ProfileTask = z.infer<typeof ProfileTaskSchema>

export const ProfileGuidanceResponseSchema = z.object({
  type: z.literal('profile_guidance'),
  id: z.string(),
  name: z.string(),
  target_role: z.string(),
  message: z.string(), // Explanation of why guidance was provided
  tasks: z.array(ProfileTaskSchema).min(1).max(10),
})

export type ProfileGuidanceResponse = z.infer<typeof ProfileGuidanceResponseSchema>

// ============================================================================
// DISCRIMINATED UNION
// ============================================================================

export const CareerPathApiResponseSchema = z.discriminatedUnion('type', [
  CareerPathResponseSchema,
  ProfileGuidanceResponseSchema,
])

export type CareerPathApiResponse = z.infer<typeof CareerPathApiResponseSchema>

// ============================================================================
// OPENAI OUTPUT VALIDATION
// ============================================================================

export const OpenAICareerPathOutputSchema = z.object({
  paths: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      nodes: z.array(
        z.object({
          id: z.string().optional(),
          title: z.string(),
          level: StageLevelSchema,
          salaryRange: z.string(),
          yearsExperience: z.string(),
          skills: z.array(
            z.object({
              name: z.string(),
              level: SkillLevelSchema,
            })
          ),
          description: z.string(),
          growthPotential: GrowthPotentialSchema,
          icon: z.string().optional(),
        })
      ).min(4),
    })
  ).min(1),
})

export type OpenAICareerPathOutput = z.infer<typeof OpenAICareerPathOutputSchema>

// ============================================================================
// INPUT VALIDATION
// ============================================================================

export const GenerateCareerPathInputSchema = z.object({
  jobTitle: z.string().min(1).max(200).trim(),
  region: z.string().optional().default('United States'),
})

export type GenerateCareerPathInput = z.infer<typeof GenerateCareerPathInputSchema>

// ============================================================================
// TELEMETRY & LOGGING TYPES
// ============================================================================

export type QualityFailureReason =
  | 'missing_nodes_array'
  | 'insufficient_stages'
  | 'titles_not_distinct'
  | 'insufficient_unique_feeder_roles'
  | 'too_many_modifier_based_titles'
  | 'descriptions_missing_or_short'
  | 'invalid_level_values'
  | 'skills_missing_or_malformed'
  | 'insufficient_domain_specificity'
  | 'unknown' // Used when fallback reason cannot be determined

export interface QualityCheckResult {
  valid: boolean
  reason?: QualityFailureReason
  details?: string
}

export interface TelemetryEvent {
  event: 'career_path_generation_attempt' | 'career_path_generation_success' | 'career_path_generation_fallback' | 'career_path_quality_failure'
  userId: string
  jobTitle: string
  timestamp: number
  model?: string
  promptVariant?: 'base' | 'refine'
  failureReason?: QualityFailureReason
  failureDetails?: string
  attemptNumber?: number
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Type guard to check if response is a career path
 */
export function isCareerPathResponse(response: CareerPathApiResponse): response is CareerPathResponse {
  return response.type === 'career_path'
}

/**
 * Type guard to check if response is profile guidance
 */
export function isProfileGuidanceResponse(response: CareerPathApiResponse): response is ProfileGuidanceResponse {
  return response.type === 'profile_guidance'
}

/**
 * Reject role titles that contain action verbs (likely profile tasks)
 */
const ACTION_VERBS = [
  'review', 'add', 'update', 'link', 'prepare', 'create', 'build', 'set',
  'polish', 'specify', 'showcase', 'expand', 'highlight', 'refresh',
  'complete', 'submit', 'upload', 'configure', 'verify', 'confirm', 'document', 'organize'
]

export function isSuspiciousRoleTitle(title: string): boolean {
  const lower = title.toLowerCase()
  return ACTION_VERBS.some(verb => lower.includes(verb))
}

/**
 * Normalize years experience string to numeric value
 */
export function parseYearsExperience(value: string | number): number | null {
  if (typeof value === 'number') {
    if (value < 0 || value > 50) return null
    return value
  }

  // Reject strings containing time units other than years (catches "15 minutes", "30 days", etc.)
  const invalidUnits = /\b(minute|min|hour|hr|day|week|month|second|sec)\b/i
  if (invalidUnits.test(value)) return null

  const match = value.match(/(\d+)/)
  if (!match) return null

  const years = parseInt(match[1], 10)
  if (isNaN(years) || years < 0 || years > 50) return null
  return years
}

/**
 * Normalize salary string to numeric value (base)
 */
export function parseSalary(value: string | number | null): number | null {
  if (value === null) return null
  if (typeof value === 'number') return value

  // Extract first number from "$X,XXX - $Y,YYY" format
  const match = value.match(/\$?([\d,]+)/)
  if (!match) return null

  const numStr = match[1].replace(/,/g, '')
  const num = parseInt(numStr, 10)
  return isNaN(num) ? null : num
}
