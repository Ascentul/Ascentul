/**
 * Agent System Validation Schemas
 *
 * Zod schemas for agent actions, nudges, and preferences
 */

import { z } from 'zod'

/**
 * Agent action schema for tool execution requests
 */
export const AgentActionSchema = z.object({
  actionId: z.string().min(1),
  payload: z.record(z.any()),
  metadata: z
    .object({
      userMessage: z.string().optional(),
      context: z.record(z.any()).optional(),
    })
    .optional(),
})

export type AgentAction = z.infer<typeof AgentActionSchema>

/**
 * Nudge output schema from AI model
 */
export const NudgeOutputSchema = z.object({
  title: z.string().max(60, 'Title must be 60 characters or less'),
  message: z.string().max(200, 'Message must be 200 characters or less'),
  priority: z.enum(['low', 'medium', 'high']),
  actions: z
    .array(
      z.object({
        label: z.string().max(30),
        actionId: z.string(),
        payload: z.record(z.any()),
      })
    )
    .max(3, 'Maximum 3 actions per nudge'),
})

export type NudgeOutput = z.infer<typeof NudgeOutputSchema>

/**
 * Agent preferences update schema
 */
export const AgentPreferencesUpdateSchema = z.object({
  agent_enabled: z.boolean().optional(),
  proactive_enabled: z.boolean().optional(),
  notification_frequency: z.enum(['realtime', 'daily', 'weekly']).optional(),
  quiet_hours_start: z.number().min(0).max(23).optional(),
  quiet_hours_end: z.number().min(0).max(23).optional(),
  timezone: z.string().optional(),
  channels: z
    .object({
      inApp: z.boolean(),
      email: z.boolean(),
      push: z.boolean(),
    })
    .optional(),
  playbook_toggles: z
    .object({
      jobSearch: z.boolean(),
      resumeHelp: z.boolean(),
      interviewPrep: z.boolean(),
      networking: z.boolean(),
      careerPath: z.boolean(),
      applicationTracking: z.boolean(),
    })
    .optional(),
})

export type AgentPreferencesUpdate = z.infer<typeof AgentPreferencesUpdateSchema>

/**
 * Snooze nudge request schema
 */
export const SnoozeNudgeSchema = z.object({
  nudgeId: z.string(),
  duration: z.enum(['laterToday', 'tomorrowMorning', 'nextWeek']),
})

export type SnoozeNudge = z.infer<typeof SnoozeNudgeSchema>

/**
 * Accept nudge request schema
 */
export const AcceptNudgeSchema = z.object({
  nudgeId: z.string(),
  selectedActionIndex: z.number().min(0).max(2),
})

export type AcceptNudge = z.infer<typeof AcceptNudgeSchema>
