/**
 * Feature Flags System
 *
 * Manages feature flags stored in platform_settings table
 * Flags control rollout of advisor features
 */

import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get feature flag value
 * Returns boolean - defaults to false if not set
 */
export const getFeatureFlag = query({
  args: {
    flag: v.string(),
  },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("platform_settings")
      .withIndex("by_setting_key", (q) => q.eq("setting_key", args.flag))
      .unique();

    if (!setting) {
      return false; // Default to disabled
    }

    return setting.setting_value === true;
  },
});

/**
 * Get multiple feature flags at once
 * Returns map of flag -> boolean
 *
 * Optimized: Fetches all settings in one query to avoid N+1 pattern
 */
export const getFeatureFlags = query({
  args: {
    flags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Fetch all settings in a single query
    const allSettings = await ctx.db
      .query("platform_settings")
      .collect();

    // Create map for O(1) lookups
    const settingsMap = new Map(
      allSettings.map((s) => [s.setting_key, s.setting_value === true])
    );

    // Build results with requested flags only
    const results: Record<string, boolean> = {};
    for (const flag of args.flags) {
      results[flag] = settingsMap.get(flag) ?? false; // Default to false if not found
    }

    return results;
  },
});

/**
 * Set feature flag value (admin only)
 */
export const setFeatureFlag = mutation({
  args: {
    flag: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get current user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Only super_admin can change feature flags
    if (user.role !== "super_admin") {
      throw new Error("Unauthorized: Only super admins can modify feature flags");
    }

    const now = Date.now();

    // Check if setting exists
    const existing = await ctx.db
      .query("platform_settings")
      .withIndex("by_setting_key", (q) => q.eq("setting_key", args.flag))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        setting_value: args.enabled,
        updated_at: now,
      });
    } else {
      await ctx.db.insert("platform_settings", {
        setting_key: args.flag,
        setting_value: args.enabled,
        created_at: now,
        updated_at: now,
      });
    }

    return { success: true, flag: args.flag, enabled: args.enabled };
  },
});

/**
 * Initialize default advisor feature flags (internal use only)
 */
export const initializeAdvisorFlags = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const defaultFlags = [
      { key: "advisor.dashboard", value: false },
      { key: "advisor.students", value: false },
      { key: "advisor.advising", value: false },
      { key: "advisor.reviews", value: false },
      { key: "advisor.applications", value: false },
      { key: "advisor.analytics", value: false },
      { key: "advisor.support", value: false },
    ];

    for (const flag of defaultFlags) {
      const existing = await ctx.db
        .query("platform_settings")
        .withIndex("by_setting_key", (q) => q.eq("setting_key", flag.key))
        .unique();

      if (!existing) {
        await ctx.db.insert("platform_settings", {
          setting_key: flag.key,
          setting_value: flag.value,
          created_at: now,
          updated_at: now,
        });
        console.log(`✓ Initialized flag: ${flag.key} = ${flag.value}`);
      } else {
        console.log(`✓ Flag already exists: ${flag.key} = ${existing.setting_value}`);
      }
    }

    return { success: true, flagsInitialized: defaultFlags.length };
  },
});

/**
 * List all feature flags (admin only)
 */
export const listFeatureFlags = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "super_admin") {
      throw new Error("Unauthorized: Only super admins can view all feature flags");
    }

    const allFlags = await ctx.db
      .query("platform_settings")
      .collect();

    return allFlags
      .filter((f) => f.setting_key.startsWith("advisor."))
      .map((f) => ({
        flag: f.setting_key,
        enabled: f.setting_value === true,
        updatedAt: f.updated_at,
      }))
      .sort((a, b) => a.flag.localeCompare(b.flag));
  },
});
