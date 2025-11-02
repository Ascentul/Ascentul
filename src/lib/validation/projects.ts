/**
 * Project and Goals Validation Schemas
 *
 * Zod schemas for portfolio projects and career goals
 */

import { z } from 'zod'

/**
 * Common link schema
 */
const LinkSchema = z.object({
  label: z.string(),
  url: z.string().url(),
})

/**
 * Project create input schema
 */
export const ProjectCreateInputSchema = z
  .object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    tags: z.array(z.string()).default([]),
    technologies: z.array(z.string()).default([]),
    links: z.array(LinkSchema).default([]),
    startDate: z.number().optional(),
    endDate: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate
      }
      return true
    },
    { message: 'End date must be on or after start date' }
  )

export type ProjectCreateInput = z.infer<typeof ProjectCreateInputSchema>

/**
 * Project update input schema
 */
export const ProjectUpdateInputSchema = z
  .object({
    projectId: z.string().min(1, 'Project ID cannot be empty'),
    title: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    tags: z.array(z.string()).optional(),
    technologies: z.array(z.string()).optional(),
    links: z.array(LinkSchema).optional(),
    startDate: z.number().optional(),
    endDate: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate
      }
      return true
    },
    { message: 'End date must be on or after start date' }
  )

export type ProjectUpdateInput = z.infer<typeof ProjectUpdateInputSchema>

/**
 * Project delete input schema
 */
export const ProjectDeleteInputSchema = z.object({
  projectId: z.string(),
})

export type ProjectDeleteInput = z.infer<typeof ProjectDeleteInputSchema>

/**
 * Goal create input schema
 */
export const GoalCreateInputSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  category: z
    .enum(['career', 'skill', 'networking', 'education', 'other'])
    .default('career'),
  status: z.enum(['not_started', 'in_progress', 'completed', 'abandoned']).default('not_started'),
  progress: z.number().min(0).max(100).default(0),
  targetDate: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

export type GoalCreateInput = z.infer<typeof GoalCreateInputSchema>

/**
 * Goal update input schema
 */
export const GoalUpdateInputSchema = z.object({
  goalId: z.string().min(1, 'Goal ID cannot be empty'),
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  category: z.enum(['career', 'skill', 'networking', 'education', 'other']).optional(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'abandoned']).optional(),
  progress: z.number().min(0).max(100).optional(),
  targetDate: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
})

export type GoalUpdateInput = z.infer<typeof GoalUpdateInputSchema>

/**
 * Goal delete input schema
 */
export const GoalDeleteInputSchema = z.object({
  goalId: z.string(),
})

export type GoalDeleteInput = z.infer<typeof GoalDeleteInputSchema>
