/**
 * Tenant Settings Engine
 *
 * Per-tenant configuration with optimistic locking for enterprise multi-tenant support.
 *
 * ## Features
 * - Per-university and B2C tenant settings
 * - Optimistic locking to prevent concurrent overwrites
 * - Fallback chain: tenant_settings → platform_settings → defaults
 * - Audit logging on all changes
 *
 * ## Usage
 *
 * ```typescript
 * // Query: Get a setting
 * const result = await ctx.runQuery(api.tenant_settings.getSetting, {
 *   tenantId: 'b2c_default', // or university ID
 *   key: 'features.ai_coach.enabled',
 *   defaultValue: true,
 * });
 *
 * // Mutation: Update with optimistic locking
 * const updated = await ctx.runMutation(api.tenant_settings.upsertSetting, {
 *   tenantId: universityId,
 *   key: 'sla.resume_review_hours',
 *   value: 24,
 *   expectedVersion: result.version, // Optional - if provided, enforces optimistic lock
 * });
 * ```
 */

import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';
import {
  getAuthenticatedUser,
  requireUniversityAdmin,
  requireSuperAdmin,
  isSuperAdmin,
  assertUniversityAccess,
  AuthUser,
} from './lib/authorization';
import {
  TenantId,
  B2C_TENANT_ID,
  resolveTenantId,
  getTenantSettingWithFallback,
  DEFAULT_TENANT_SETTINGS,
  getSettingValueType,
} from './lib/tenantHelpers';
import { safeLogAudit } from './lib/auditLogger';

// ============================================================================
// VALIDATORS
// ============================================================================

/**
 * Validator for tenant ID (university ID or 'b2c_default')
 */
const tenantIdValidator = v.union(v.id('universities'), v.literal('b2c_default'));

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a single tenant setting with fallback.
 *
 * Resolution order:
 * 1. tenant_settings for the specific tenant
 * 2. platform_settings (for B2C only)
 * 3. Provided default value
 */
export const getSetting = query({
  args: {
    tenantId: tenantIdValidator,
    key: v.string(),
    defaultValue: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const result = await getTenantSettingWithFallback(
      ctx,
      args.tenantId,
      args.key,
      args.defaultValue ?? null,
    );

    return {
      value: result.value,
      version: result.version,
      source: result.source,
    };
  },
});

/**
 * Get all settings for a tenant.
 * Returns only tenant-specific overrides, not platform defaults.
 */
export const getAllSettings = query({
  args: {
    tenantId: tenantIdValidator,
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query('tenant_settings')
      .withIndex('by_tenant', (q) => q.eq('tenant_id', args.tenantId))
      .collect();

    return settings.map((s) => ({
      key: s.settings_key,
      value: s.settings_value,
      version: s.version,
      valueType: s.value_type,
      updatedAt: s.updated_at,
      updatedBy: s.updated_by,
    }));
  },
});

/**
 * Get multiple settings in a batch.
 * More efficient than multiple getSetting calls.
 */
export const getSettingsBatch = query({
  args: {
    tenantId: tenantIdValidator,
    keys: v.array(
      v.object({
        key: v.string(),
        defaultValue: v.optional(v.any()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Fetch all tenant settings for this tenant in one query
    const allTenantSettings = await ctx.db
      .query('tenant_settings')
      .withIndex('by_tenant', (q) => q.eq('tenant_id', args.tenantId))
      .collect();

    const settingsMap = new Map(allTenantSettings.map((s) => [s.settings_key, s]));

    // For B2C, also fetch platform settings
    let platformSettingsMap = new Map<string, { setting_value: unknown }>();
    if (args.tenantId === B2C_TENANT_ID) {
      const platformSettings = await ctx.db.query('platform_settings').collect();
      platformSettingsMap = new Map(platformSettings.map((s) => [s.setting_key, s]));
    }

    // Resolve each key
    const results: Record<
      string,
      { value: unknown; version: number; source: 'tenant' | 'platform' | 'default' }
    > = {};
    for (const { key, defaultValue } of args.keys) {
      const tenantSetting = settingsMap.get(key);
      if (tenantSetting) {
        results[key] = {
          value: tenantSetting.settings_value,
          version: tenantSetting.version,
          source: 'tenant',
        };
        continue;
      }

      if (args.tenantId === B2C_TENANT_ID) {
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
        value: defaultValue ?? null,
        version: 0,
        source: 'default',
      };
    }

    return results;
  },
});

/**
 * Get the current user's tenant settings (auto-resolves tenant from user).
 * Useful for hooks that don't have tenant ID readily available.
 */
export const getMyTenantSetting = query({
  args: {
    key: v.string(),
    defaultValue: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Return default for unauthenticated users
      return {
        value: args.defaultValue ?? null,
        version: 0,
        source: 'default' as const,
      };
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    const tenantId = resolveTenantId(user?.university_id);

    return getTenantSettingWithFallback(ctx, tenantId, args.key, args.defaultValue ?? null);
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Upsert a tenant setting with optional optimistic locking.
 *
 * If expectedVersion is provided:
 * - For new settings: expectedVersion must be 0 or undefined
 * - For existing settings: expectedVersion must match current version
 * - Throws VERSION_CONFLICT error if mismatch
 *
 * Authorization:
 * - Super admins can update any tenant
 * - University admins can only update their own university
 */
export const upsertSetting = mutation({
  args: {
    tenantId: tenantIdValidator,
    key: v.string(),
    value: v.any(),
    valueType: v.optional(
      v.union(v.literal('boolean'), v.literal('string'), v.literal('number'), v.literal('json')),
    ),
    expectedVersion: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const now = Date.now();

    // Authorization check
    await checkTenantSettingsAccess(ctx, user, args.tenantId);

    // Check for existing setting
    const existing = await ctx.db
      .query('tenant_settings')
      .withIndex('by_tenant_key', (q) =>
        q.eq('tenant_id', args.tenantId).eq('settings_key', args.key),
      )
      .unique();

    // Optimistic locking check
    if (args.expectedVersion !== undefined) {
      const currentVersion = existing?.version ?? 0;
      if (args.expectedVersion !== currentVersion) {
        throw new ConvexError({
          code: 'VERSION_CONFLICT',
          message: `Version conflict: expected ${args.expectedVersion}, found ${currentVersion}`,
          currentVersion,
        });
      }
    }

    // Determine value type
    const valueType = args.valueType ?? getSettingValueType(args.key) ?? inferValueType(args.value);

    let settingId: Id<'tenant_settings'>;
    let newVersion: number;
    const previousValue = existing?.settings_value;

    if (existing) {
      // Update existing setting
      newVersion = existing.version + 1;
      await ctx.db.patch(existing._id, {
        settings_value: args.value,
        value_type: valueType,
        version: newVersion,
        updated_by: user._id,
        updated_by_role: user.role,
        notes: args.notes,
        updated_at: now,
      });
      settingId = existing._id;
    } else {
      // Create new setting
      newVersion = 1;
      settingId = await ctx.db.insert('tenant_settings', {
        tenant_id: args.tenantId,
        settings_key: args.key,
        settings_value: args.value,
        value_type: valueType,
        version: newVersion,
        updated_by: user._id,
        updated_by_role: user.role,
        notes: args.notes,
        created_at: now,
        updated_at: now,
      });
    }

    // Audit log
    await safeLogAudit(ctx, {
      category: 'system',
      action: existing ? 'tenant_setting.updated' : 'tenant_setting.created',
      actorUserId: user._id,
      actorRole: user.role,
      actorUniversityId: user.university_id ?? undefined,
      targetType: 'tenant_setting',
      targetId: settingId,
      previousValue: existing ? { value: previousValue, version: existing.version } : undefined,
      newValue: { value: args.value, version: newVersion },
      metadata: {
        tenant_id: args.tenantId,
        key: args.key,
        value_type: valueType,
      },
    });

    return {
      id: settingId,
      key: args.key,
      value: args.value,
      version: newVersion,
      updatedAt: now,
    };
  },
});

/**
 * Delete a tenant setting (revert to platform/default).
 */
export const deleteSetting = mutation({
  args: {
    tenantId: tenantIdValidator,
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Authorization check
    await checkTenantSettingsAccess(ctx, user, args.tenantId);

    const existing = await ctx.db
      .query('tenant_settings')
      .withIndex('by_tenant_key', (q) =>
        q.eq('tenant_id', args.tenantId).eq('settings_key', args.key),
      )
      .unique();

    if (!existing) {
      return { deleted: false };
    }

    await ctx.db.delete(existing._id);

    // Audit log
    await safeLogAudit(ctx, {
      category: 'system',
      action: 'tenant_setting.deleted',
      actorUserId: user._id,
      actorRole: user.role,
      actorUniversityId: user.university_id ?? undefined,
      targetType: 'tenant_setting',
      targetId: existing._id,
      previousValue: { value: existing.settings_value, version: existing.version },
      metadata: {
        tenant_id: args.tenantId,
        key: args.key,
      },
    });

    return { deleted: true };
  },
});

/**
 * Initialize default settings for a new tenant.
 * Only creates settings that don't already exist.
 *
 * Typically called when provisioning a new university.
 */
export const initializeTenantDefaults = mutation({
  args: {
    tenantId: tenantIdValidator,
    settingKeys: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);
    const now = Date.now();

    // Determine which keys to initialize
    const keysToInit = args.settingKeys ?? Object.keys(DEFAULT_TENANT_SETTINGS);

    // Get existing settings for this tenant
    const existingSettings = await ctx.db
      .query('tenant_settings')
      .withIndex('by_tenant', (q) => q.eq('tenant_id', args.tenantId))
      .collect();

    const existingKeys = new Set(existingSettings.map((s) => s.settings_key));

    // Create only missing settings
    const created: string[] = [];
    for (const key of keysToInit) {
      if (existingKeys.has(key)) {
        continue;
      }

      const defaultConfig = DEFAULT_TENANT_SETTINGS[key];
      if (!defaultConfig) {
        continue;
      }

      await ctx.db.insert('tenant_settings', {
        tenant_id: args.tenantId,
        settings_key: key,
        settings_value: defaultConfig.value,
        value_type: defaultConfig.type,
        version: 1,
        updated_by: user._id,
        updated_by_role: user.role,
        notes: 'Initialized with defaults',
        created_at: now,
        updated_at: now,
      });

      created.push(key);
    }

    // Audit log
    if (created.length > 0) {
      await safeLogAudit(ctx, {
        category: 'system',
        action: 'tenant_settings.initialized',
        actorUserId: user._id,
        actorRole: user.role,
        targetType: 'tenant',
        targetId: args.tenantId,
        metadata: {
          tenant_id: args.tenantId,
          settings_created: created,
          count: created.length,
        },
      });
    }

    return {
      tenantId: args.tenantId,
      created,
      skipped: keysToInit.filter((k) => !created.includes(k)),
    };
  },
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if user has access to modify tenant settings.
 */
async function checkTenantSettingsAccess(
  ctx: { db: any; auth: any },
  user: AuthUser,
  tenantId: TenantId,
): Promise<void> {
  // Super admins can access any tenant
  if (isSuperAdmin(user)) {
    return;
  }

  // For B2C tenant, only super admins can modify (platform defaults)
  if (tenantId === B2C_TENANT_ID) {
    throw new Error('Forbidden: Only super admins can modify B2C tenant settings');
  }

  // University admins can only modify their own university's settings
  if (user.role !== 'university_admin') {
    throw new Error('Forbidden: Only university admins can modify tenant settings');
  }

  if (!user.university_id || user.university_id !== tenantId) {
    throw new Error('Forbidden: You can only modify settings for your own university');
  }
}

/**
 * Infer value type from value.
 */
function inferValueType(value: unknown): 'boolean' | 'string' | 'number' | 'json' {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  return 'json';
}
