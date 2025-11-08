/**
 * Enable Advisor Features
 *
 * Helper script to enable all advisor feature flags for testing
 * Run via: npx convex run enable_advisor_features:enableAllAdvisorFlags
 */

import { internalMutation } from './_generated/server';

const ADVISOR_FLAGS = [
  'advisor.dashboard',
  'advisor.students',
  'advisor.advising',
  'advisor.reviews',
  'advisor.applications',
  'advisor.analytics',
  'advisor.support',
] as const;

export const enableAllAdvisorFlags = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Batch fetch all existing settings to avoid N+1 queries
    const allSettings = await ctx.db
      .query('platform_settings')
      .collect();

    const settingsMap = new Map(
      allSettings.map((s) => [s.setting_key, s])
    );

    let enabledCount = 0;
    let createdCount = 0;
    let failedCount = 0;
    const failedFlags: string[] = [];

    // Process flags sequentially for clear logging
    for (const flagKey of ADVISOR_FLAGS) {
      const existing = settingsMap.get(flagKey);

      try {
        if (existing) {
          await ctx.db.patch(existing._id, {
            setting_value: true,
            updated_at: now,
          });
          console.log(`✓ Enabled: ${flagKey}`);
          enabledCount++;
        } else {
          await ctx.db.insert('platform_settings', {
            setting_key: flagKey,
            setting_value: true,
            created_at: now,
            updated_at: now,
          });
          console.log(`✓ Created and enabled: ${flagKey}`);
          createdCount++;
        }
      } catch (error) {
        console.error(`✗ Failed to process ${flagKey}:`, error);
        failedCount++;
        failedFlags.push(flagKey);
      }
    }

    console.log('\n✅ All advisor features enabled!');
    console.log('Users with advisor role can now access /advisor routes');

    return {
      success: failedCount === 0,
      flagsEnabled: enabledCount,
      flagsCreated: createdCount,
      total: enabledCount + createdCount,
      failedCount,
      failedFlags,
    };
  },
});

export const disableAllAdvisorFlags = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Batch fetch all existing settings to avoid N+1 queries
    const allSettings = await ctx.db
      .query('platform_settings')
      .collect();

    const settingsMap = new Map(
      allSettings.map((s) => [s.setting_key, s])
    );

    let disabledCount = 0;
    let failedCount = 0;
    const failedFlags: string[] = [];

    // Process flags sequentially for clear logging
    for (const flagKey of ADVISOR_FLAGS) {
      const existing = settingsMap.get(flagKey);

      try {
        if (existing) {
          await ctx.db.patch(existing._id, {
            setting_value: false,
            updated_at: now,
          });
          console.log(`✓ Disabled: ${flagKey}`);
          disabledCount++;
        }
      } catch (error) {
        console.error(`✗ Failed to disable ${flagKey}:`, error);
        failedCount++;
        failedFlags.push(flagKey);
      }
    }

    console.log('\n✅ All advisor features disabled!');

    return {
      success: failedCount === 0,
      flagsDisabled: disabledCount,
      failedCount,
      failedFlags,
    };
  },
});
