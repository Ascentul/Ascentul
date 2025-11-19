/**
 * Shared TypeScript types for Advisor Applications feature
 *
 * These types define the domain model for the applications management system,
 * including enriched data structures, filter state, and need-action triage rules.
 */

import { Id } from 'convex/_generated/dataModel';

// ============================================================================
// Need Action Triage
// ============================================================================

/**
 * Reasons why an application might need advisor attention
 * These drive the "Need Action" metric and visual indicators
 */
export type NeedActionReason =
  | 'no_next_step'   // No next step has been defined
  | 'overdue'        // Due date is in the past
  | 'due_soon'       // Due date is within 3 days
  | 'stale';         // No activity in 14+ days

/**
 * Human-readable labels for need action reasons (for UI display)
 */
export const NEED_ACTION_LABELS: Record<NeedActionReason, string> = {
  no_next_step: 'No next step defined',
  overdue: 'Overdue',
  due_soon: 'Due within 3 days',
  stale: 'No activity in 14+ days',
};

/**
 * Icons for need action reasons (for visual indicators)
 */
export const NEED_ACTION_ICONS: Record<NeedActionReason, string> = {
  no_next_step: '⚪',
  overdue: '🔴',
  due_soon: '🟠',
  stale: '⏱️',
};

/**
 * Urgency levels for prioritizing advisor work
 * Used to sort and visually distinguish applications
 */
export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

/**
 * Urgency level labels
 */
export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  critical: 'Overdue',
  high: 'Due today',
  medium: 'Due soon',
  low: 'Stale',
  none: 'On track',
};

// ============================================================================
// Application Data Types
// ============================================================================

/**
 * Application stages (source of truth for application state)
 */
export type ApplicationStage =
  | 'Prospect'
  | 'Applied'
  | 'Interview'
  | 'Offer'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn'
  | 'Archived';

/**
 * Active stages where applications need ongoing advisor attention
 */
export const ACTIVE_STAGES: ApplicationStage[] = [
  'Prospect',
  'Applied',
  'Interview',
];

/**
 * Final/terminal stages where no further action is expected
 */
export const TERMINAL_STAGES: ApplicationStage[] = [
  'Accepted',
  'Rejected',
  'Withdrawn',
  'Archived',
];

/**
 * Enriched application with student information and computed fields
 * This extends the base application data from Convex with additional
 * fields needed for the advisor console UI
 */
export interface EnrichedApplication {
  _id: Id<'applications'>;
  user_id: Id<'users'>;

  // Student information (joined from users table)
  student_name: string;
  student_email: string;
  student_graduation_year?: string;

  // Application details
  company_name: string;
  position_title: string;
  stage: ApplicationStage;
  application_url?: string;
  location?: string;

  // Timeline
  applied_date?: number;
  created_at: number;
  updated_at: number;

  // Advisor workflow
  next_step?: string;
  next_step_date?: number;  // Due date
  notes?: string;
  assigned_advisor_id?: Id<'users'>;

  // Computed fields for triage
  needsAction: boolean;
  needActionReasons: NeedActionReason[];
  daysSinceUpdate: number;
  isOverdue: boolean;
  isDueSoon: boolean;
  isStale: boolean;
  urgencyLevel: UrgencyLevel;
}

// ============================================================================
// Filter & Search State
// ============================================================================

/**
 * Time window options for focusing on recent or upcoming items
 */
export type TimeWindow = 'all' | 'this_week' | 'this_month' | 'custom';

/**
 * Time window labels
 */
export const TIME_WINDOW_LABELS: Record<TimeWindow, string> = {
  all: 'All Time',
  this_week: 'This Week',
  this_month: 'This Month',
  custom: 'Custom Range',
};

/**
 * Filter state for the applications table/kanban views
 * All filters are optional and can be combined
 */
export interface ApplicationFilters {
  // Text search (company, position, student name)
  search: string;

  // Stage filter (empty array = show all stages)
  stages: ApplicationStage[];

  // Cohort/graduation year filter (empty array = show all cohorts)
  cohorts: string[];

  // Show only applications needing action
  needsAction: boolean;

  // Filter by specific need action reason
  needActionReason?: NeedActionReason;

  // Filter by assigned advisor (undefined = show all)
  assignedAdvisorId?: Id<'users'>;

  // Show only active stages (Prospect, Applied, Interview)
  activeOnly: boolean;

  // Time window filter (affects due dates and last updated)
  timeWindow: TimeWindow;

  // Date range filter for applied_at
  appliedDateRange?: {
    from: number;
    to: number;
  };
}

/**
 * Default filter state for "all applications" view
 */
export const DEFAULT_FILTERS: ApplicationFilters = {
  search: '',
  stages: [],
  cohorts: [],
  needsAction: false,
  activeOnly: false,
  timeWindow: 'all',
};

/**
 * Default filter state for "inbox mode" (advisor-focused triage view)
 */
export const INBOX_MODE_FILTERS: ApplicationFilters = {
  search: '',
  stages: [],
  cohorts: [],
  needsAction: true,  // Show only items needing action
  activeOnly: false,
  timeWindow: 'all',
};

/**
 * Sort options for the table view
 */
export type ApplicationSortField =
  | 'updated_at'
  | 'applied_at'
  | 'student_name'
  | 'company_name'
  | 'due_date';

export type ApplicationSortDirection = 'asc' | 'desc';

export interface ApplicationSort {
  field: ApplicationSortField;
  direction: ApplicationSortDirection;
}

/**
 * Default sort (most recently updated first)
 */
export const DEFAULT_SORT: ApplicationSort = {
  field: 'updated_at',
  direction: 'desc',
};

// ============================================================================
// Selection State (for bulk operations)
// ============================================================================

/**
 * Selection state for bulk operations
 * Tracks which applications are currently selected
 */
export interface ApplicationSelection {
  // Set of selected application IDs
  selectedIds: Set<string>;

  // Whether "select all" is active (respects current filters)
  selectAll: boolean;

  // IDs explicitly excluded when selectAll is true
  excludedIds: Set<string>;
}

/**
 * Empty selection state
 */
export const EMPTY_SELECTION: ApplicationSelection = {
  selectedIds: new Set(),
  selectAll: false,
  excludedIds: new Set(),
};

// ============================================================================
// Statistics & Metrics
// ============================================================================

/**
 * Application pipeline statistics
 * Displayed in the header metrics cards
 */
export interface ApplicationStats {
  // Total counts
  total: number;
  active: number;  // In Prospect, Applied, or Interview stage

  // Stage-specific counts
  offers: number;
  accepted: number;
  rejected: number;

  // Student engagement
  studentsWithApps: number;

  // Triage metrics
  needingAction: number;
  needActionBreakdown: Record<NeedActionReason, number>;

  // Success metrics
  conversionRate: number;  // (offers + accepted) / active * 100
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Result of a bulk operation
 */
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Bulk action types
 */
export type BulkActionType =
  | 'change_stage'
  | 'archive'
  | 'assign_advisor'
  | 'mark_reviewed';

// ============================================================================
// View State
// ============================================================================

/**
 * View mode for the applications page
 */
export type ApplicationViewMode = 'kanban' | 'table';

/**
 * Scope selector (filter by advisor ownership)
 */
export type ApplicationScope =
  | 'my-students'      // Only students I own (default for advisors)
  | 'all'              // All students in university (university_admin only)
  | 'assigned-to-me';  // Applications assigned to me (via assigned_advisor_id)

// ============================================================================
// Empty State Types
// ============================================================================

/**
 * Types of empty states we might encounter
 */
export type EmptyStateType =
  | 'no-apps'           // No applications exist yet
  | 'no-results'        // Filters returned no results
  | 'no-action-needed'; // No applications need action (good state!)

// ============================================================================
// Analytics Events
// ============================================================================

/**
 * Analytics event names for tracking user interactions
 * These should be logged to your analytics service (Mixpanel, Amplitude, etc.)
 */
export const ANALYTICS_EVENTS = {
  // View events
  VIEW_CHANGED: 'advisor_applications_view_changed',
  SCOPE_CHANGED: 'advisor_applications_scope_changed',
  FILTER_APPLIED: 'advisor_applications_filter_applied',

  // Action events
  STAGE_CHANGED: 'advisor_applications_stage_changed',
  BULK_STAGE_CHANGED: 'advisor_applications_bulk_stage_changed',
  NEXT_STEP_UPDATED: 'advisor_applications_next_step_updated',
  BULK_ARCHIVED: 'advisor_applications_bulk_archived',

  // Triage events
  NEED_ACTION_CLICKED: 'advisor_applications_need_action_clicked',
  STUDENT_VIEWED: 'advisor_applications_student_viewed',
} as const;

/**
 * Analytics event properties (for type safety)
 */
export interface AnalyticsProperties {
  [ANALYTICS_EVENTS.VIEW_CHANGED]: {
    fromView: ApplicationViewMode;
    toView: ApplicationViewMode;
  };

  [ANALYTICS_EVENTS.STAGE_CHANGED]: {
    applicationId: string;
    fromStage: ApplicationStage;
    toStage: ApplicationStage;
    studentId: string;
  };

  [ANALYTICS_EVENTS.BULK_STAGE_CHANGED]: {
    count: number;
    toStage: ApplicationStage;
    fromStages: ApplicationStage[];
  };

  [ANALYTICS_EVENTS.NEED_ACTION_CLICKED]: {
    count: number;
    breakdown: Record<NeedActionReason, number>;
  };
}
