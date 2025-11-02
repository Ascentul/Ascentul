/**
 * Application Tracking Validation Schemas
 *
 * Zod schemas for job applications, interview stages, and follow-ups
 */

import { z } from 'zod'

/**
 * Application status enum used across multiple schemas
 */
const APPLICATION_STATUS = ['saved', 'applied', 'interview', 'offer', 'rejected', 'inactive'] as const

/**
 * Application upsert input schema
 */
export const ApplicationUpsertInputSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  title: z.string().min(2, 'Job title must be at least 2 characters'),
  sourceJobId: z.string().optional(), // e.g., "adzuna:123456"
  status: z.enum(APPLICATION_STATUS).default('saved'),
  location: z.string().optional(),
  salary: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
})

export type ApplicationUpsertInput = z.infer<typeof ApplicationUpsertInputSchema>

/**
 * Application update status input schema
 */
export const ApplicationUpdateStatusInputSchema = z.object({
  applicationId: z.string(),
  status: z.enum(APPLICATION_STATUS),
  notes: z.string().optional(),
})

export type ApplicationUpdateStatusInput = z.infer<typeof ApplicationUpdateStatusInputSchema>

/**
 * Application delete input schema
 */
export const ApplicationDeleteInputSchema = z.object({
  applicationId: z.string(),
})

export type ApplicationDeleteInput = z.infer<typeof ApplicationDeleteInputSchema>

/**
 * Interview stage input schema
 */
export const InterviewStageInputSchema = z.object({
  applicationId: z.string(),
  stage: z.string().min(2, 'Stage name must be at least 2 characters'),
  at: z.number().int().positive(),
  location: z.string().optional(),
  interviewer: z.string().optional(),
  notes: z.string().optional(),
})

export type InterviewStageInput = z.infer<typeof InterviewStageInputSchema>

/**
 * Interview stage complete input schema
 */
export const InterviewStageCompleteInputSchema = z.object({
  stageId: z.string(),
  notes: z.string().optional(),
})

export type InterviewStageCompleteInput = z.infer<typeof InterviewStageCompleteInputSchema>

/**
 * Application follow-up input schema
 */
export const AppFollowUpInputSchema = z.object({
  applicationId: z.string(),
  dueAt: z.number().int().positive(),
  note: z.string().min(2, 'Note must be at least 2 characters'),
})

export type AppFollowUpInput = z.infer<typeof AppFollowUpInputSchema>

/**
 * Application follow-up complete input schema
 */
export const AppFollowUpCompleteInputSchema = z.object({
  followUpId: z.string(),
})

export type AppFollowUpCompleteInput = z.infer<typeof AppFollowUpCompleteInputSchema>

/**
 * Application filter input schema
 */
export const ApplicationFilterInputSchema = z.object({
  status: z.enum(APPLICATION_STATUS).optional(),
  company: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
})

export type ApplicationFilterInput = z.infer<typeof ApplicationFilterInputSchema>
