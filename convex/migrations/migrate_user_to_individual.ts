/**
 * Migration: Migrate legacy "user" role to "individual"
 *
 * The "user" role was the original role for non-university users.
 * It has been renamed to "individual" for clarity.
 *
 * This migration updates all users with role="user" to role="individual".
 *
 * IMPORTANT - Clerk Sync Required:
 * This is a ONE-TIME legacy data migration that updates Convex roles directly.
 * Per the Clerk-first role update pattern, Clerk publicMetadata.role is the source
 * of truth for authorization. After running this migration, you MUST sync the
 * updated roles to Clerk:
 *
 *   npx convex run admin/syncRolesToClerk:syncAllRolesToClerk --dryRun true
 *   npx convex run admin/syncRolesToClerk:syncAllRolesToClerk --dryRun false
 *
 * Run: npx convex run migrations/migrate_user_to_individual:migrate
 * Dry run: npx convex run migrations/migrate_user_to_individual:dryRun
 */

import { internalMutation, mutation, query } from '../_generated/server';
import { requireSuperAdmin } from '../lib/roles';

/**
 * Preview what would be migrated (dry run)
 */
export const dryRun = query({
  args: {},
  handler: async (ctx) => {
    // Require super_admin - this query exposes user emails, names, and IDs
    await requireSuperAdmin(ctx);

    const usersWithLegacyRole = await ctx.db
      .query('users')
      .withIndex('by_role', (q) => q.eq('role', 'user'))
      .collect();

    return {
      totalUsers: usersWithLegacyRole.length,
      users: usersWithLegacyRole.map((u) => ({
        id: u._id,
        email: u.email,
        name: u.name,
        currentRole: u.role,
        hasUniversityId: !!u.university_id,
      })),
      warnings: usersWithLegacyRole
        .filter((u) => u.university_id)
        .map((u) => ({
          id: u._id,
          email: u.email,
          message:
            'Has university_id - will be skipped (needs manual assignment to student/advisor/university_admin)',
        })),
    };
  },
});

/**
 * Execute the migration (super_admin only - use from admin UI)
 */
export const migrate = mutation({
  args: {},
  handler: async (ctx) => {
    // Require super_admin
    await requireSuperAdmin(ctx);

    const usersWithLegacyRole = await ctx.db
      .query('users')
      .withIndex('by_role', (q) => q.eq('role', 'user'))
      .collect();

    const now = Date.now();
    const results = {
      totalUsers: usersWithLegacyRole.length,
      migrated: 0,
      skipped: 0,
      warnings: [] as Array<{ id: string; email: string; reason: string }>,
    };

    for (const user of usersWithLegacyRole) {
      // Skip users with university_id - individual role must not have university_id
      // These users likely need a university-specific role (student/advisor/university_admin)
      if (user.university_id) {
        results.warnings.push({
          id: user._id,
          email: user.email,
          reason:
            'Has university_id - skipped (needs manual assignment to student/advisor/university_admin)',
        });
        results.skipped++;
        continue;
      }
      await ctx.db.patch(user._id, {
        role: 'individual',
        updated_at: now,
      });

      results.migrated++;
    }

    return results;
  },
});

/**
 * Internal migration - can be run from CLI without auth
 * Use: npx convex run migrations/migrate_user_to_individual:migrateInternal
 *
 * This is safe because:
 * 1. Only developers with deployment access can run CLI commands
 * 2. It's an internal mutation (not exposed to clients)
 * 3. The operation is idempotent and non-destructive
 *
 * IMPORTANT: After running, sync roles to Clerk (see file header for details)
 */
export const migrateInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const usersWithLegacyRole = await ctx.db
      .query('users')
      .withIndex('by_role', (q) => q.eq('role', 'user'))
      .collect();

    const now = Date.now();
    const results = {
      totalUsers: usersWithLegacyRole.length,
      migrated: 0,
      skipped: 0,
      warnings: [] as Array<{ id: string; email: string; reason: string }>,
    };

    for (const user of usersWithLegacyRole) {
      // Skip users with university_id - individual role must not have university_id
      // These users likely need a university-specific role (student/advisor/university_admin)
      if (user.university_id) {
        results.warnings.push({
          id: user._id,
          email: user.email,
          reason:
            'Has university_id - skipped (needs manual assignment to student/advisor/university_admin)',
        });
        results.skipped++;
        continue;
      }

      await ctx.db.patch(user._id, {
        role: 'individual',
        updated_at: now,
      });

      results.migrated++;
    }

    return results;
  },
});

/**
 * Count users by role (for verification)
 */
export const countByRole = query({
  args: {},
  handler: async (ctx) => {
    // Require super_admin - role distribution data should not be publicly accessible
    await requireSuperAdmin(ctx);

    const allUsers = await ctx.db.query('users').collect();

    const counts: Record<string, number> = {};
    for (const user of allUsers) {
      const role = user.role ?? 'unknown';
      counts[role] = (counts[role] || 0) + 1;
    }

    return {
      total: allUsers.length,
      byRole: counts,
    };
  },
});
