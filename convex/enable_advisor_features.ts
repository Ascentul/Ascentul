/**
 * Enable Advisor Features
 *
 * Helper script to enable all advisor feature flags for testing
 * Run via: npx convex run enable_advisor_features:enableAllAdvisorFlags
 */

import { internalMutation } from "./_generated/server";

export const enableAllAdvisorFlags = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const flags = [
      "advisor.dashboard",
      "advisor.students",
      "advisor.advising",
      "advisor.reviews",
      "advisor.applications",
      "advisor.analytics",
      "advisor.support",
    ];

    for (const flagKey of flags) {
      const existing = await ctx.db
        .query("platform_settings")
        .withIndex("by_setting_key", (q) => q.eq("setting_key", flagKey))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          setting_value: true,
          updated_at: now,
        });
        console.log(`✓ Enabled: ${flagKey}`);
      } else {
        await ctx.db.insert("platform_settings", {
          setting_key: flagKey,
          setting_value: true,
          created_at: now,
          updated_at: now,
        });
        console.log(`✓ Created and enabled: ${flagKey}`);
      }
    }

    console.log("\n✅ All advisor features enabled!");
    console.log("Users with advisor role can now access /advisor routes");

    return { success: true, flagsEnabled: flags.length };
  },
});

export const disableAllAdvisorFlags = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const flags = [
      "advisor.dashboard",
      "advisor.students",
      "advisor.advising",
      "advisor.reviews",
      "advisor.applications",
      "advisor.analytics",
      "advisor.support",
    ];

    for (const flagKey of flags) {
      const existing = await ctx.db
        .query("platform_settings")
        .withIndex("by_setting_key", (q) => q.eq("setting_key", flagKey))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          setting_value: false,
          updated_at: now,
        });
        console.log(`✓ Disabled: ${flagKey}`);
      }
    }

    console.log("\n✅ All advisor features disabled!");

    return { success: true, flagsDisabled: flags.length };
  },
});
