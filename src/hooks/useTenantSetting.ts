'use client';

/**
 * useTenantSetting Hook
 *
 * React hook for accessing tenant-specific settings.
 * Automatically resolves tenant from current user context.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { value, isLoading, version } = useTenantSetting(
 *     'features.ai_coach.enabled',
 *     true // default value
 *   );
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   if (!value) {
 *     return <FeatureDisabled />;
 *   }
 *
 *   return <AICoach />;
 * }
 * ```
 */

import { api } from 'convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import * as React from 'react';

import { useAuth } from '@/contexts/ClerkAuthProvider';
import {
  getVersionConflictInfo,
  isVersionConflictError,
  resolveTenantId,
  TenantId,
  TenantSettingResult,
} from '@/lib/config/types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseTenantSettingResult<T> {
  /** The setting value (or default if not found) */
  value: T;
  /** Current version for optimistic locking */
  version: number;
  /** Where the value came from */
  source: 'tenant' | 'platform' | 'default';
  /** Whether the setting is still loading */
  isLoading: boolean;
  /** Error if query failed */
  error?: Error;
}

export interface UseTenantSettingMutableResult<T> extends UseTenantSettingResult<T> {
  /** Update the setting value with optional optimistic locking */
  setValue: (newValue: T, expectedVersion?: number) => Promise<{ version: number }>;
  /** Whether an update is in progress */
  isUpdating: boolean;
  /** Error from the last update attempt */
  updateError?: Error;
  /** Reset update error */
  clearUpdateError: () => void;
}

// ============================================================================
// BASIC HOOK
// ============================================================================

/**
 * Hook to read a tenant setting.
 *
 * @param key - Setting key (e.g., "features.ai_coach.enabled")
 * @param defaultValue - Default value if setting not found
 * @returns Setting value, version, and loading state
 *
 * @example
 * ```tsx
 * const { value, isLoading } = useTenantSetting('sla.resume_review_hours', 48);
 * ```
 */
export function useTenantSetting<T>(key: string, defaultValue: T): UseTenantSettingResult<T> {
  // Use the auto-resolving query that gets tenant from current user
  const result = useQuery(api.tenant_settings.getMyTenantSetting, {
    key,
    defaultValue,
  });

  if (result === undefined) {
    return {
      value: defaultValue,
      version: 0,
      source: 'default',
      isLoading: true,
    };
  }

  return {
    value: result.value as T,
    version: result.version,
    source: result.source,
    isLoading: false,
  };
}

// ============================================================================
// MUTABLE HOOK (with update capability)
// ============================================================================

/**
 * Hook to read and update a tenant setting.
 * Includes optimistic locking support.
 *
 * @param key - Setting key
 * @param defaultValue - Default value if setting not found
 * @returns Setting value, version, and update function
 *
 * @example
 * ```tsx
 * const { value, version, setValue, isUpdating, updateError } = useTenantSettingMutable(
 *   'sla.resume_review_hours',
 *   48
 * );
 *
 * const handleSave = async () => {
 *   try {
 *     await setValue(newValue, version); // Pass version for optimistic locking
 *   } catch (error) {
 *     if (isVersionConflictError(error)) {
 *       // Show "reload and retry" message
 *     }
 *   }
 * };
 * ```
 */
export function useTenantSettingMutable<T>(
  key: string,
  defaultValue: T,
): UseTenantSettingMutableResult<T> {
  const { user } = useAuth();
  const tenantId = resolveTenantId(user?.university_id);

  // Query the setting
  const result = useQuery(api.tenant_settings.getSetting, {
    tenantId,
    key,
    defaultValue,
  });

  // Mutation for updates
  const upsertSetting = useMutation(api.tenant_settings.upsertSetting);

  // Track update state
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<Error | undefined>();

  const setValue = React.useCallback(
    async (newValue: T, expectedVersion?: number): Promise<{ version: number }> => {
      setIsUpdating(true);
      setUpdateError(undefined);

      try {
        const updated = await upsertSetting({
          tenantId,
          key,
          value: newValue,
          expectedVersion,
        });
        return { version: updated.version };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setUpdateError(err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [upsertSetting, tenantId, key],
  );

  const clearUpdateError = React.useCallback(() => {
    setUpdateError(undefined);
  }, []);

  if (result === undefined) {
    return {
      value: defaultValue,
      version: 0,
      source: 'default',
      isLoading: true,
      setValue,
      isUpdating,
      updateError,
      clearUpdateError,
    };
  }

  return {
    value: result.value as T,
    version: result.version,
    source: result.source,
    isLoading: false,
    setValue,
    isUpdating,
    updateError,
    clearUpdateError,
  };
}

// ============================================================================
// BATCH HOOK
// ============================================================================

/**
 * Hook to read multiple tenant settings at once.
 * More efficient than multiple useTenantSetting calls.
 *
 * @param settings - Array of { key, defaultValue } pairs
 * @returns Record of settings by key
 *
 * @example
 * ```tsx
 * const settings = useTenantSettingsBatch([
 *   { key: 'features.ai_coach.enabled', defaultValue: true },
 *   { key: 'sla.resume_review_hours', defaultValue: 48 },
 * ]);
 *
 * const aiCoachEnabled = settings['features.ai_coach.enabled']?.value;
 * ```
 */
export function useTenantSettingsBatch<T extends Record<string, unknown>>(
  settings: { key: string; defaultValue: unknown }[],
): {
  data: Record<string, TenantSettingResult<unknown>>;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const tenantId = resolveTenantId(user?.university_id);

  const result = useQuery(api.tenant_settings.getSettingsBatch, {
    tenantId,
    keys: settings,
  });

  if (result === undefined) {
    // Return defaults while loading
    const defaults: Record<string, TenantSettingResult<unknown>> = {};
    for (const { key, defaultValue } of settings) {
      defaults[key] = { value: defaultValue, version: 0, source: 'default' };
    }
    return { data: defaults, isLoading: true };
  }

  return { data: result, isLoading: false };
}

// ============================================================================
// SPECIFIC TYPED HOOKS
// ============================================================================

/**
 * Hook for feature module enabled/disabled settings.
 */
export function useFeatureModuleEnabled(moduleKey: string): {
  enabled: boolean;
  isLoading: boolean;
} {
  const { value, isLoading } = useTenantSetting(`features.${moduleKey}.enabled`, true);
  return { enabled: Boolean(value), isLoading };
}

/**
 * Hook for SLA settings (returns number).
 */
export function useSLASetting(
  key: string,
  defaultHours: number,
): {
  hours: number;
  isLoading: boolean;
} {
  const { value, isLoading } = useTenantSetting(`sla.${key}`, defaultHours);
  return { hours: Number(value), isLoading };
}

/**
 * Hook for notification default settings.
 */
export function useNotificationDefault(notificationType: string): {
  defaultOn: boolean;
  isLoading: boolean;
} {
  const { value, isLoading } = useTenantSetting(
    `notifications.${notificationType}.default_on`,
    true,
  );
  return { defaultOn: Boolean(value), isLoading };
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { getVersionConflictInfo, isVersionConflictError };
