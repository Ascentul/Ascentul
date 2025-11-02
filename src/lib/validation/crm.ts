/**
 * Contact CRM Validation Schemas
 *
 * Zod schemas for contacts, notes, interactions, and follow-ups
 */

import { z } from 'zod'

/**
 * Contact create input schema
 */
export const ContactCreateInputSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
})

export type ContactCreateInput = z.infer<typeof ContactCreateInputSchema>

/**
 * Contact update input schema
 */
export const ContactUpdateInputSchema = z.object({
  contactId: z.string(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

export type ContactUpdateInput = z.infer<typeof ContactUpdateInputSchema>

/**
 * Contact delete input schema
 */
export const ContactDeleteInputSchema = z.object({
  contactId: z.string(),
})

export type ContactDeleteInput = z.infer<typeof ContactDeleteInputSchema>

/**
 * Contact note create input schema
 */
export const NoteCreateInputSchema = z.object({
  contactId: z.string(),
  text: z.string().min(2, 'Note must be at least 2 characters'),
})

export type NoteCreateInput = z.infer<typeof NoteCreateInputSchema>

/**
 * Contact interaction log input schema
 */
export const InteractionLogInputSchema = z.object({
  contactId: z.string(),
  kind: z.enum(['email', 'call', 'meeting', 'dm', 'other']),
  at: z.number().int().positive(),
  summary: z.string().min(2, 'Summary must be at least 2 characters'),
})

export type InteractionLogInput = z.infer<typeof InteractionLogInputSchema>

/**
 * Contact follow-up create input schema
 */
export const FollowUpCreateInputSchema = z.object({
  contactId: z.string(),
  dueAt: z.number().int().positive(),
  note: z.string().min(2, 'Note must be at least 2 characters'),
})

export type FollowUpCreateInput = z.infer<typeof FollowUpCreateInputSchema>

/**
 * Contact follow-up complete input schema
 */
export const FollowUpCompleteInputSchema = z.object({
  followUpId: z.string(),
})

export type FollowUpCompleteInput = z.infer<typeof FollowUpCompleteInputSchema>

/**
 * Contact search input schema
 */
export const ContactSearchInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(50).default(10),
})

export type ContactSearchInput = z.infer<typeof ContactSearchInputSchema>
