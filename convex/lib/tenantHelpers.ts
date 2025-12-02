/**
 * Tenant Resolution Helpers
 *
 * Utilities for multi-tenant handling in Convex functions.
 * Supports both university tenants and B2C (individual) users.
 *
 * ## Tenant Model
 * - University users: tenantId = users.university_id
 * - B2C users: tenantId = 'b2c_default' (constant)
 *
 * ## Usage
 *
 * ```typescript
 * import { resolveTenantId, getTenantSettingWithFallback, B2C_TENANT_ID } from './lib/tenantHelpers';
 *
 * // Resolve tenant from user
 * const tenantId = resolveTenantId(user.university_id);
 *
 * // Get setting with fallback chain
 * const { value, version } = await getTenantSettingWithFallback(
 *   ctx,
 *   tenantId,
 *   'features.ai_coach.enabled',
 *   true // default
 * );
 * ```
 */

import { QueryCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Constant tenant ID for B2C (individual) users.
 * Used when a user has no university_id.
 */
export const B2C_TENANT_ID = 'b2c_default' as const;

/**
 * Type representing a tenant ID - either a university ID or the B2C constant.
 */
export type TenantId = Id<'universities'> | typeof B2C_TENANT_ID;

// ============================================================================
// TENANT RESOLUTION
// ============================================================================

/**
 * Resolve tenant ID from a user's university_id.
 *
 * - If user has university_id, returns that ID
 * - Otherwise, returns B2C_TENANT_ID
 *
 * @param universityId - User's university_id (may be null/undefined for B2C users)
 * @returns The resolved tenant ID
 *
 * @example
 * ```typescript
 * const user = await getAuthenticatedUser(ctx);
 * const tenantId = resolveTenantId(user.university_id);
 * // tenantId is now either the university ID or 'b2c_default'
 * ```
 */
export function resolveTenantId(universityId: Id<'universities'> | null | undefined): TenantId {
  return universityId ?? B2C_TENANT_ID;
}

/**
 * Check if a tenant ID represents the B2C default tenant.
 */
export function isB2CTenant(tenantId: TenantId): tenantId is typeof B2C_TENANT_ID {
  return tenantId === B2C_TENANT_ID;
}

/**
 * Check if a tenant ID represents a university tenant.
 */
export function isUniversityTenant(tenantId: TenantId): tenantId is Id<'universities'> {
  return tenantId !== B2C_TENANT_ID;
}

// ============================================================================
// SETTING RETRIEVAL WITH FALLBACK
// ============================================================================

/**
 * Result of a setting lookup with version info.
 */
export interface TenantSettingResult<T> {
  value: T;
  version: number;
  source: 'tenant' | 'platform' | 'default';
}

/**
 * Get a tenant setting with fallback chain.
 *
 * Resolution order:
 * 1. tenant_settings table (for the specific tenant)
 * 2. platform_settings table (if B2C tenant, for global defaults)
 * 3. Provided default value
 *
 * @param ctx - Convex query context
 * @param tenantId - Tenant ID (university ID or 'b2c_default')
 * @param key - Setting key (e.g., "features.ai_coach.enabled")
 * @param defaultValue - Default value if not found
 * @returns Setting value, version, and source
 *
 * @example
 * ```typescript
 * const result = await getTenantSettingWithFallback(
 *   ctx,
 *   tenantId,
 *   'sla.resume_review_hours',
 *   48
 * );
 * console.log(result.value); // 48 or tenant-specific value
 * console.log(result.source); // 'tenant', 'platform', or 'default'
 * ```
 */
export async function getTenantSettingWithFallback<T>(
  ctx: QueryCtx,
  tenantId: TenantId,
  key: string,
  defaultValue: T,
): Promise<TenantSettingResult<T>> {
  // 1. Check tenant_settings table
  const tenantSetting = await ctx.db
    .query('tenant_settings')
    .withIndex('by_tenant_key', (q) => q.eq('tenant_id', tenantId).eq('settings_key', key))
    .unique();

  if (tenantSetting) {
    return {
      value: tenantSetting.settings_value as T,
      version: tenantSetting.version,
      source: 'tenant',
    };
  }

  // 2. For B2C tenant, also check platform_settings as fallback
  if (isB2CTenant(tenantId)) {
    const platformSetting = await ctx.db
      .query('platform_settings')
      .withIndex('by_setting_key', (q) => q.eq('setting_key', key))
      .unique();

    if (platformSetting) {
      return {
        value: platformSetting.setting_value as T,
        version: 0, // Platform settings don't have versioning
        source: 'platform',
      };
    }
  }

  // 3. Return default value
  return {
    value: defaultValue,
    version: 0,
    source: 'default',
  };
}

/**
 * Get multiple tenant settings in a single query.
 *
 * @param ctx - Convex query context
 * @param tenantId - Tenant ID
 * @param keys - Array of setting keys with defaults
 * @returns Map of key to { value, version, source }
 */
export async function getTenantSettingsBatch<T extends Record<string, unknown>>(
  ctx: QueryCtx,
  tenantId: TenantId,
  keysWithDefaults: { key: string; defaultValue: unknown }[],
): Promise<Record<string, TenantSettingResult<unknown>>> {
  // Fetch all tenant settings for this tenant
  const allTenantSettings = await ctx.db
    .query('tenant_settings')
    .withIndex('by_tenant', (q) => q.eq('tenant_id', tenantId))
    .collect();

  // Create lookup map
  const tenantSettingsMap = new Map(allTenantSettings.map((s) => [s.settings_key, s]));

  // For B2C, also fetch platform settings
  let platformSettingsMap = new Map<string, { setting_value: unknown }>();
  if (isB2CTenant(tenantId)) {
    const platformSettings = await ctx.db.query('platform_settings').collect();
    platformSettingsMap = new Map(platformSettings.map((s) => [s.setting_key, s]));
  }

  // Resolve each key
  const results: Record<string, TenantSettingResult<unknown>> = {};
  for (const { key, defaultValue } of keysWithDefaults) {
    const tenantSetting = tenantSettingsMap.get(key);
    if (tenantSetting) {
      results[key] = {
        value: tenantSetting.settings_value,
        version: tenantSetting.version,
        source: 'tenant',
      };
      continue;
    }

    if (isB2CTenant(tenantId)) {
      const platformSetting = platformSettingsMap.get(key);
      if (platformSetting) {
        results[key] = {
          value: platformSetting.setting_value,
          version: 0,
          source: 'platform',
        };
        continue;
      }
    }

    results[key] = {
      value: defaultValue,
      version: 0,
      source: 'default',
    };
  }

  return results;
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

/**
 * Default tenant settings used when initializing a new tenant.
 * These define the baseline configuration.
 */
export const DEFAULT_TENANT_SETTINGS: Record<
  string,
  { value: unknown; type: 'boolean' | 'string' | 'number' | 'json' }
> = {
  // Feature modules
  'features.resume_studio.enabled': { value: true, type: 'boolean' },
  'features.ai_coach.enabled': { value: true, type: 'boolean' },
  'features.career_path_explorer.enabled': { value: true, type: 'boolean' },
  'features.network_hub.enabled': { value: true, type: 'boolean' },
  'features.interview_practice.enabled': { value: false, type: 'boolean' },

  // SLA settings
  'sla.resume_review_hours': { value: 48, type: 'number' },
  'sla.cover_letter_review_hours': { value: 48, type: 'number' },
  'sessions.booking.max_days_ahead': { value: 14, type: 'number' },
  'sessions.cancellation_cutoff_hours': { value: 24, type: 'number' },

  // Notification defaults
  'notifications.session_reminders.default_on': { value: true, type: 'boolean' },
  'notifications.application_followups.default_on': { value: true, type: 'boolean' },
  'notifications.weekly_digest.default_on': { value: true, type: 'boolean' },

  // Branding (null/undefined means use platform default)
  'branding.logo_url': { value: null, type: 'string' },
  'branding.primary_color': { value: '#5371FF', type: 'string' },
  'branding.campus_display_name': { value: null, type: 'string' },
};

/**
 * Get default value for a setting key.
 */
export function getDefaultSettingValue(key: string): unknown {
  return DEFAULT_TENANT_SETTINGS[key]?.value ?? null;
}

/**
 * Get value type for a setting key.
 */
export function getSettingValueType(
  key: string,
): 'boolean' | 'string' | 'number' | 'json' | undefined {
  return DEFAULT_TENANT_SETTINGS[key]?.type;
}
