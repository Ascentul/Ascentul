import { v } from 'convex/values';

/**
 * Follow-up priority levels
 * Used consistently across schema, validators, and UI
 */
export const FOLLOW_UP_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type FollowUpPriority = (typeof FOLLOW_UP_PRIORITIES)[number];

/**
 * Convex validator for follow-up priority
 * Use this in mutation args to ensure consistency with schema
 */
export const followUpPriorityValidator = v.union(
  v.literal('low'),
  v.literal('medium'),
  v.literal('high'),
  v.literal('urgent'),
);

/**
 * Follow-up status values
 */
export const FOLLOW_UP_STATUSES = ['open', 'done'] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

/**
 * Convex validator for follow-up status
 */
export const followUpStatusValidator = v.union(v.literal('open'), v.literal('done'));
