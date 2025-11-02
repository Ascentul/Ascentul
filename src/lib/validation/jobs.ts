/**
 * Job Search Validation Schemas
 *
 * Zod schemas for job search, saved jobs, and job applications
 */

import { z } from 'zod'

/**
 * Job search input schema
 *
 * Note: Uses camelCase for client-side TypeScript conventions.
 * query/location are user-facing input fields.
 * what/where are Adzuna API fields (included for direct API compatibility).
 * Backend transforms camelCase to snake_case for Adzuna API calls.
 */
export const JobSearchInputSchema = z.object({
  // User-facing search fields
  query: z.string().min(2, 'Search query must be at least 2 characters').optional(),
  location: z.string().optional(),

  // Adzuna supports these countries (as of 2024)
  // See: https://developer.adzuna.com/docs/search
  country: z
    .enum(['us', 'gb', 'ca', 'au', 'de', 'fr', 'nl', 'nz', 'pl', 'br', 'in', 'sg', 'za', 'at', 'ch', 'it'])
    .default('us'),

  resultsPerPage: z.number().min(1).max(50).default(20),
  page: z.number().min(1).default(1),

  // Adzuna API fields (for direct API compatibility)
  what: z.string().optional(),
  where: z.string().optional(),

  // Filter options (camelCase for TypeScript, backend transforms to snake_case)
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  fullTime: z.boolean().optional(),
  partTime: z.boolean().optional(),
  contract: z.boolean().optional(),
  permanent: z.boolean().optional(),
  maxDaysOld: z.number().min(1).max(30).optional(),
})

export type JobSearchInput = z.infer<typeof JobSearchInputSchema>

/**
 * Job card schema (from Adzuna API)
 */
export const JobCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.object({
    display_name: z.string(),
  }),
  location: z.object({
    display_name: z.string(),
    area: z.array(z.string()).optional(),
  }),
  description: z.string(),
  created: z.string(),
  salary_min: z.number().optional(),
  salary_max: z.number().optional(),
  salary_is_predicted: z.number().optional(),
  contract_type: z.string().optional(),
  category: z.object({
    label: z.string(),
    tag: z.string(),
  }),
  redirect_url: z.string().url(),
})

export type JobCard = z.infer<typeof JobCardSchema>

/**
 * Job search response payload
 */
export const JobSearchPayloadSchema = z.object({
  results: z.array(JobCardSchema),
  count: z.number(),
  mean: z.number().optional(),
})

export type JobSearchPayload = z.infer<typeof JobSearchPayloadSchema>

/**
 * Save job input schema
 */
export const SaveJobInputSchema = z.object({
  jobId: z.string(),
  title: z.string().min(2),
  company: z.string().min(2),
  location: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  source: z.string().default('adzuna'),
})

export type SaveJobInput = z.infer<typeof SaveJobInputSchema>

/**
 * Hide job input schema
 */
export const HideJobInputSchema = z.object({
  jobId: z.string(),
  reason: z.enum(['not_interested', 'already_applied', 'inappropriate', 'other']).optional(),
})

export type HideJobInput = z.infer<typeof HideJobInputSchema>

/**
 * Log job click schema
 */
export const LogJobClickSchema = z.object({
  jobId: z.string(),
  source: z.string().default('adzuna'),
  redirectUrl: z.string().url(),
})

export type LogJobClick = z.infer<typeof LogJobClickSchema>
