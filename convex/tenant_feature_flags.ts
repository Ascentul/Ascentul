/**
 * Tenant Feature Flags
 *
 * Extends platform feature flags with per-tenant overrides.
 *
 * ## Resolution Order
 * 1. tenant_flag_overrides (if tenant has explicit override)
 * 2. platform_settings (platform-wide default)
 * 3. false (fallback)
 *
 * ## Usage
 *
 * ```typescript
 * // Get flag with tenant context
 * const isEnabled = await ctx.runQuery(api.tenant_feature_flags.getFeatureFlagWithTenant, {
 *   flag: 'advisor.dashboard',
 *   tenantId: universityId,
 * });
 *
 * // Set tenant override
 * await ctx.runMutation(api.tenant_feature_flags.setTenantFlagOverride, {
 *   tenantId: universityId,
 *   flag: 'advisor.dashboard',
 *   enabled: true,
 * });
 * ```
 */

import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import {
  getAuthenticatedUser,
  requireSuperAdmin,
  isSuperAdmin,
  AuthUser,
} from './lib/authorization';
import { TenantId, B2C_TENANT_ID, resolveTenantId } from './lib/tenantHelpers';
import { safeLogAudit } from './lib/auditLogger';

// ============================================================================
// VALIDATORS
// ============================================================================

const tenantIdValidator = v.union(v.id('universities'), v.literal('b2c_default'));

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get a feature flag with tenant override support.
 *
 * Resolution order:
 * 1. tenant_flag_overrides (if tenant has explicit override)
 * 2. platform_settings (platform-wide default)
 * 3. false (fallback)
 */
export const getFeatureFlagWithTenant = query({
  args: {
    flag: v.string(),
    tenantId: v.optional(tenantIdValidator),
  },
  handler: async (ctx, args) => {
    const tenantId = args.tenantId ?? B2C_TENANT_ID;

    // 1. Check tenant override
    const override = await ctx.db
      .query('tenant_flag_overrides')
      .withIndex('by_tenant_flag', (q) => q.eq('tenant_id', tenantId).eq('flag_key', args.flag))
      .unique();

    if (override) {
      return override.enabled;
    }

    // 2. Fall back to platform flag
    const platformFlag = await ctx.db
      .query('platform_settings')
      .withIndex('by_setting_key', (q) => q.eq('setting_key', args.flag))
      .unique();

    if (platformFlag?.setting_value === true) {
      return true;
    }

    // 3. Default to false
    return false;
  },
});

/**
 * Get multiple feature flags with tenant context (batch query).
 * More efficient than multiple single calls.
 */
export const getFeatureFlagsWithTenant = query({
  args: {
    flags: v.array(v.string()),
    tenantId: v.optional(tenantIdValidator),
  },
  handler: async (ctx, args) => {
    const tenantId = args.tenantId ?? B2C_TENANT_ID;

    // Fetch all tenant overrides for this tenant
    const allOverrides = await ctx.db
      .query('tenant_flag_overrides')
      .withIndex('by_tenant', (q) => q.eq('tenant_id', tenantId))
      .collect();

    const overridesMap = new Map(allOverrides.map((o) => [o.flag_key, o.enabled]));

    // Fetch all platform settings (for fallback)
    const allPlatformSettings = await ctx.db.query('platform_settings').collect();
    const platformMap = new Map(allPlatformSettings.map((s) => [s.setting_key, s.setting_value]));

    // Resolve each flag
    const results: Record<string, boolean> = {};
    for (const flag of args.flags) {
      // Check override first
      if (overridesMap.has(flag)) {
        results[flag] = overridesMap.get(flag)!;
        continue;
      }

      // Fall back to platform
      const platformValue = platformMap.get(flag);
      results[flag] = platformValue === true;
    }

    return results;
  },
});

/**
 * Get feature flag for current user's tenant (auto-resolves tenant).
 */
export const getMyFeatureFlag = query({
  args: {
    flag: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // For unauthenticated users, return platform default
    if (!identity) {
      const platformFlag = await ctx.db
        .query('platform_settings')
        .withIndex('by_setting_key', (q) => q.eq('setting_key', args.flag))
        .unique();
      return platformFlag?.setting_value === true;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique();

    const tenantId = resolveTenantId(user?.university_id);

    // Check tenant override
    const override = await ctx.db
      .query('tenant_flag_overrides')
      .withIndex('by_tenant_flag', (q) => q.eq('tenant_id', tenantId).eq('flag_key', args.flag))
      .unique();

    if (override) {
      return override.enabled;
    }

    // Fall back to platform flag
    const platformFlag = await ctx.db
      .query('platform_settings')
      .withIndex('by_setting_key', (q) => q.eq('setting_key', args.flag))
      .unique();

    return platformFlag?.setting_value === true;
  },
});

/**
 * List all tenant flag overrides for a tenant.
 */
export const listTenantFlagOverrides = query({
  args: {
    tenantId: tenantIdValidator,
  },
  handler: async (ctx, args) => {
    const overrides = await ctx.db
      .query('tenant_flag_overrides')
      .withIndex('by_tenant', (q) => q.eq('tenant_id', args.tenantId))
      .collect();

    return overrides.map((o) => ({
      flag: o.flag_key,
      enabled: o.enabled,
      updatedAt: o.updated_at,
      updatedBy: o.updated_by,
    }));
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Set a tenant-specific flag override.
 *
 * Authorization:
 * - Super admins can set overrides for any tenant
 * - University admins can set overrides for their own university
 */
export const setTenantFlagOverride = mutation({
  args: {
    tenantId: tenantIdValidator,
    flag: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const now = Date.now();

    // Authorization check
    await checkFlagOverrideAccess(user, args.tenantId);

    // Check for existing override
    const existing = await ctx.db
      .query('tenant_flag_overrides')
      .withIndex('by_tenant_flag', (q) =>
        q.eq('tenant_id', args.tenantId).eq('flag_key', args.flag),
      )
      .unique();

    const previousValue = existing?.enabled;

    if (existing) {
      // Update existing override
      await ctx.db.patch(existing._id, {
        enabled: args.enabled,
        updated_by: user._id,
        updated_at: now,
      });
    } else {
      // Create new override
      await ctx.db.insert('tenant_flag_overrides', {
        tenant_id: args.tenantId,
        flag_key: args.flag,
        enabled: args.enabled,
        updated_by: user._id,
        created_at: now,
        updated_at: now,
      });
    }

    // Audit log
    await safeLogAudit(ctx, {
      category: 'system',
      action: existing ? 'feature_flag_override.updated' : 'feature_flag_override.created',
      actorUserId: user._id,
      actorRole: user.role,
      actorUniversityId: user.university_id ?? undefined,
      targetType: 'feature_flag_override',
      targetId: args.flag,
      previousValue: existing ? { enabled: previousValue } : undefined,
      newValue: { enabled: args.enabled },
      metadata: {
        tenant_id: args.tenantId,
        flag: args.flag,
      },
    });

    return {
      tenantId: args.tenantId,
      flag: args.flag,
      enabled: args.enabled,
    };
  },
});

/**
 * Remove a tenant-specific flag override (revert to platform default).
 */
export const removeTenantFlagOverride = mutation({
  args: {
    tenantId: tenantIdValidator,
    flag: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Authorization check
    await checkFlagOverrideAccess(user, args.tenantId);

    const existing = await ctx.db
      .query('tenant_flag_overrides')
      .withIndex('by_tenant_flag', (q) =>
        q.eq('tenant_id', args.tenantId).eq('flag_key', args.flag),
      )
      .unique();

    if (!existing) {
      return { removed: false };
    }

    await ctx.db.delete(existing._id);

    // Audit log
    await safeLogAudit(ctx, {
      category: 'system',
      action: 'feature_flag_override.deleted',
      actorUserId: user._id,
      actorRole: user.role,
      actorUniversityId: user.university_id ?? undefined,
      targetType: 'feature_flag_override',
      targetId: args.flag,
      previousValue: { enabled: existing.enabled },
      metadata: {
        tenant_id: args.tenantId,
        flag: args.flag,
      },
    });

    return { removed: true };
  },
});

/**
 * Bulk set multiple flag overrides for a tenant.
 * Useful for initializing a new tenant or batch updates.
 */
export const setTenantFlagOverridesBatch = mutation({
  args: {
    tenantId: tenantIdValidator,
    overrides: v.array(
      v.object({
        flag: v.string(),
        enabled: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const now = Date.now();

    // Authorization check
    await checkFlagOverrideAccess(user, args.tenantId);

    // Get existing overrides
    const existingOverrides = await ctx.db
      .query('tenant_flag_overrides')
      .withIndex('by_tenant', (q) => q.eq('tenant_id', args.tenantId))
      .collect();

    const existingMap = new Map(existingOverrides.map((o) => [o.flag_key, o]));

    const results: { flag: string; enabled: boolean; action: 'created' | 'updated' }[] = [];

    for (const { flag, enabled } of args.overrides) {
      const existing = existingMap.get(flag);

      if (existing) {
        if (existing.enabled !== enabled) {
          await ctx.db.patch(existing._id, {
            enabled,
            updated_by: user._id,
            updated_at: now,
          });
          results.push({ flag, enabled, action: 'updated' });
        }
      } else {
        await ctx.db.insert('tenant_flag_overrides', {
          tenant_id: args.tenantId,
          flag_key: flag,
          enabled,
          updated_by: user._id,
          created_at: now,
          updated_at: now,
        });
        results.push({ flag, enabled, action: 'created' });
      }
    }

    // Audit log for batch operation
    if (results.length > 0) {
      await safeLogAudit(ctx, {
        category: 'system',
        action: 'feature_flag_overrides.batch_updated',
        actorUserId: user._id,
        actorRole: user.role,
        actorUniversityId: user.university_id ?? undefined,
        targetType: 'tenant',
        targetId: args.tenantId,
        metadata: {
          tenant_id: args.tenantId,
          changes: results,
          count: results.length,
        },
      });
    }

    return {
      tenantId: args.tenantId,
      results,
    };
  },
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if user has access to modify flag overrides.
 */
function checkFlagOverrideAccess(user: AuthUser, tenantId: TenantId): void {
  // Super admins can access any tenant
  if (isSuperAdmin(user)) {
    return;
  }

  // For B2C tenant, only super admins can modify
  if (tenantId === B2C_TENANT_ID) {
    throw new Error('Forbidden: Only super admins can modify B2C flag overrides');
  }

  // University admins can only modify their own university's flags
  if (user.role !== 'university_admin') {
    throw new Error('Forbidden: Only university admins can modify flag overrides');
  }

  if (!user.university_id || user.university_id !== tenantId) {
    throw new Error('Forbidden: You can only modify flag overrides for your own university');
  }
}
