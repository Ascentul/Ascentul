/**
 * Follow-up priority and status types
 * Used consistently across UI components
 */

export const FOLLOW_UP_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type FollowUpPriority = (typeof FOLLOW_UP_PRIORITIES)[number];

export const FOLLOW_UP_STATUSES = ['open', 'done'] as const;
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];
