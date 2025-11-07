/**
 * Enable Advisor Features
 *
 * Helper script to enable all advisor feature flags for testing
 * Run via: npx convex run enable_advisor_features:enableAllAdvisorFlags
 */

import { internalMutation } from "./_generated/server";

const ADVISOR_FLAGS = [
  "advisor.dashboard",
  "advisor.students",
  "advisor.advising",
  "advisor.reviews",
  "advisor.applications",
  "advisor.analytics",
  "advisor.support",
] as const;

export const enableAllAdvisorFlags = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Batch fetch all existing settings to avoid N+1 queries
    const allSettings = await ctx.db
      .query("platform_settings")
      .collect();

    const settingsMap = new Map(
      allSettings.map((s) => [s.setting_key, s])
    );

    let enabledCount = 0;
    let createdCount = 0;

    // Process flags sequentially for clear logging
    for (const flagKey of ADVISOR_FLAGS) {
      const existing = settingsMap.get(flagKey);

      if (existing) {
        await ctx.db.patch(existing._id, {
          setting_value: true,
          updated_at: now,
        });
        console.log(`✓ Enabled: ${flagKey}`);
        enabledCount++;
      } else {
        await ctx.db.insert("platform_settings", {
          setting_key: flagKey,
          setting_value: true,
          created_at: now,
          updated_at: now,
        });
        console.log(`✓ Created and enabled: ${flagKey}`);
        createdCount++;
      }
    }

    console.log("\n✅ All advisor features enabled!");
    console.log("Users with advisor role can now access /advisor routes");

    return {
      success: true,
      flagsEnabled: enabledCount,
      flagsCreated: createdCount,
      total: enabledCount + createdCount,
    };
  },
});

export const disableAllAdvisorFlags = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Batch fetch all existing settings to avoid N+1 queries
    const allSettings = await ctx.db
      .query("platform_settings")
      .collect();

    const settingsMap = new Map(
      allSettings.map((s) => [s.setting_key, s])
    );

    let disabledCount = 0;

    // Process flags sequentially for clear logging
    for (const flagKey of ADVISOR_FLAGS) {
      const existing = settingsMap.get(flagKey);

      if (existing) {
        await ctx.db.patch(existing._id, {
          setting_value: false,
          updated_at: now,
        });
        console.log(`✓ Disabled: ${flagKey}`);
        disabledCount++;
      }
    }

    console.log("\n✅ All advisor features disabled!");

    return { success: true, flagsDisabled: disabledCount };
  },
});
