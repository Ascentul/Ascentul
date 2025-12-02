/**
 * Configuration Types
 *
 * Type definitions for feature flags, experiments, and tenant settings.
 * These types are used across both client and server code.
 */

import { Id } from 'convex/_generated/dataModel';

// ============================================================================
// TENANT TYPES
// ============================================================================

/**
 * Constant for B2C (individual) users.
 * Used when a user has no university_id.
 */
export const B2C_TENANT_ID = 'b2c_default' as const;

/**
 * Type representing a tenant ID - either a university ID or the B2C constant.
 */
export type TenantId = Id<'universities'> | typeof B2C_TENANT_ID;

/**
 * Resolve tenant ID from user's university_id.
 */
export function resolveTenantId(
  universityId: Id<'universities'> | string | null | undefined,
): TenantId {
  if (universityId && universityId !== 'null' && universityId !== 'undefined') {
    return universityId as Id<'universities'>;
  }
  return B2C_TENANT_ID;
}

// ============================================================================
// CONFIG CONTEXT
// ============================================================================

/**
 * Context for feature flags and experiments.
 * Used to determine flag/experiment eligibility.
 */
export interface ConfigContext {
  userId?: Id<'users'> | string;
  clerkId?: string;
  tenantId: TenantId;
  role?: string;
  anonymousId?: string;
}

// ============================================================================
// FEATURE FLAG TYPES
// ============================================================================

/**
 * Provider interface for feature flags.
 */
export interface FeatureFlagProvider {
  /**
   * Check if a feature flag is enabled.
   */
  isEnabled(flag: string, context: ConfigContext): Promise<boolean>;

  /**
   * Get multiple feature flags at once.
   */
  getFlags(flags: string[], context: ConfigContext): Promise<Record<string, boolean>>;
}

// ============================================================================
// EXPERIMENT TYPES
// ============================================================================

/**
 * Status of an experiment.
 */
export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'concluded';

/**
 * A variant in an experiment.
 */
export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number; // 0-100, must sum to 100 across all variants
}

/**
 * Configuration for an experiment.
 */
export interface ExperimentConfig {
  id: string;
  name: string;
  description?: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  /** Optional: Only run for specific tenants (null = all tenants) */
  tenantIds?: TenantId[];
  /** Percentage of eligible users to include (0-100) */
  userPercentage?: number;
}

/**
 * Result of getting an experiment variant.
 */
export interface ExperimentResult {
  variant: string;
  enrolled: boolean;
}

/**
 * Provider interface for experiments.
 */
export interface ExperimentProvider {
  /**
   * Get the variant for a user in an experiment.
   */
  getVariant(experimentId: string, context: ConfigContext): ExperimentResult;
}

// ============================================================================
// TENANT SETTING TYPES
// ============================================================================

/**
 * Value types for tenant settings.
 */
export type SettingValueType = 'boolean' | 'string' | 'number' | 'json';

/**
 * Result of a tenant setting lookup.
 */
export interface TenantSettingResult<T = unknown> {
  value: T;
  version: number;
  source: 'tenant' | 'platform' | 'default';
}

/**
 * A tenant setting with metadata.
 */
export interface TenantSetting<T = unknown> {
  tenantId: TenantId;
  key: string;
  value: T;
  version: number;
  valueType?: SettingValueType;
  updatedAt: number;
  updatedBy?: string;
}

/**
 * Provider interface for tenant settings.
 */
export interface TenantSettingsProvider {
  /**
   * Get a setting value with optional default.
   */
  getSetting<T>(key: string, defaultValue: T): Promise<TenantSettingResult<T>>;

  /**
   * Update a setting with optional optimistic locking.
   */
  setSetting<T>(key: string, value: T, expectedVersion?: number): Promise<{ version: number }>;
}

// ============================================================================
// SETTING KEY CONSTANTS
// ============================================================================

/**
 * Known tenant setting keys for type safety.
 */
export const TENANT_SETTING_KEYS = {
  // Feature modules
  FEATURES_RESUME_STUDIO_ENABLED: 'features.resume_studio.enabled',
  FEATURES_AI_COACH_ENABLED: 'features.ai_coach.enabled',
  FEATURES_CAREER_PATH_EXPLORER_ENABLED: 'features.career_path_explorer.enabled',
  FEATURES_NETWORK_HUB_ENABLED: 'features.network_hub.enabled',
  FEATURES_INTERVIEW_PRACTICE_ENABLED: 'features.interview_practice.enabled',

  // SLA settings
  SLA_RESUME_REVIEW_HOURS: 'sla.resume_review_hours',
  SLA_COVER_LETTER_REVIEW_HOURS: 'sla.cover_letter_review_hours',
  SESSIONS_BOOKING_MAX_DAYS_AHEAD: 'sessions.booking.max_days_ahead',
  SESSIONS_CANCELLATION_CUTOFF_HOURS: 'sessions.cancellation_cutoff_hours',

  // Notification defaults
  NOTIFICATIONS_SESSION_REMINDERS_DEFAULT_ON: 'notifications.session_reminders.default_on',
  NOTIFICATIONS_APPLICATION_FOLLOWUPS_DEFAULT_ON: 'notifications.application_followups.default_on',
  NOTIFICATIONS_WEEKLY_DIGEST_DEFAULT_ON: 'notifications.weekly_digest.default_on',

  // Branding
  BRANDING_LOGO_URL: 'branding.logo_url',
  BRANDING_PRIMARY_COLOR: 'branding.primary_color',
  BRANDING_CAMPUS_DISPLAY_NAME: 'branding.campus_display_name',
} as const;

export type TenantSettingKey = (typeof TENANT_SETTING_KEYS)[keyof typeof TENANT_SETTING_KEYS];

// ============================================================================
// VERSION CONFLICT ERROR
// ============================================================================

/**
 * Error thrown when optimistic locking fails.
 */
export class VersionConflictError extends Error {
  constructor(
    public expectedVersion: number,
    public currentVersion: number,
  ) {
    super(
      `Version conflict: expected ${expectedVersion}, found ${currentVersion}. ` +
        `The setting was modified by another user. Please reload and try again.`,
    );
    this.name = 'VersionConflictError';
  }
}

/**
 * Check if an error is a version conflict error.
 */
export function isVersionConflictError(error: unknown): error is VersionConflictError {
  if (error instanceof VersionConflictError) {
    return true;
  }
  // Also check for ConvexError with VERSION_CONFLICT code
  if (
    error &&
    typeof error === 'object' &&
    'data' in error &&
    typeof (error as any).data === 'object' &&
    (error as any).data?.code === 'VERSION_CONFLICT'
  ) {
    return true;
  }
  return false;
}

/**
 * Extract version info from a version conflict error.
 */
export function getVersionConflictInfo(error: unknown): { currentVersion: number } | null {
  if (error instanceof VersionConflictError) {
    return { currentVersion: error.currentVersion };
  }
  if (
    error &&
    typeof error === 'object' &&
    'data' in error &&
    typeof (error as any).data === 'object' &&
    (error as any).data?.code === 'VERSION_CONFLICT'
  ) {
    return { currentVersion: (error as any).data.currentVersion };
  }
  return null;
}
