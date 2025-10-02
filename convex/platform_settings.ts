import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to get a setting by key
async function getSetting(ctx: any, key: string, defaultValue: any) {
  const setting = await ctx.db
    .query("platform_settings")
    .withIndex("by_setting_key", (q: any) => q.eq("setting_key", key))
    .unique();
  return setting ? setting.setting_value : defaultValue;
}

// Platform settings for configurable system-wide preferences
export const getPlatformSettings = query({
  args: {},
  handler: async (ctx) => {
    return {
      openai_model: await getSetting(ctx, "openai_model", process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      openai_temperature: await getSetting(ctx, "openai_temperature", 0.7),
      openai_max_tokens: await getSetting(ctx, "openai_max_tokens", 4000),
      maintenance_mode: await getSetting(ctx, "maintenance_mode", false),
      allow_signups: await getSetting(ctx, "allow_signups", true),
      default_user_role: await getSetting(ctx, "default_user_role", 'user'),
    };
  },
});

// Helper to upsert a setting
async function upsertSetting(ctx: any, key: string, value: any) {
  const existing = await ctx.db
    .query("platform_settings")
    .withIndex("by_setting_key", (q: any) => q.eq("setting_key", key))
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, {
      setting_value: value,
      updated_at: Date.now(),
    });
  } else {
    await ctx.db.insert("platform_settings", {
      setting_key: key,
      setting_value: value,
      created_at: Date.now(),
      updated_at: Date.now(),
    });
  }
}

// Update platform settings (admin only)
export const updatePlatformSettings = mutation({
  args: {
    clerkId: v.string(),
    settings: v.object({
      openai_model: v.optional(v.string()),
      openai_temperature: v.optional(v.number()),
      openai_max_tokens: v.optional(v.number()),
      maintenance_mode: v.optional(v.boolean()),
      allow_signups: v.optional(v.boolean()),
      default_user_role: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!currentUser) throw new Error("User not found");

    const isAdmin = ["admin", "super_admin"].includes(currentUser.role);
    if (!isAdmin) throw new Error("Unauthorized - Admin access required");

    // Save each setting to database
    if (args.settings.openai_model !== undefined) {
      await upsertSetting(ctx, "openai_model", args.settings.openai_model);
    }
    if (args.settings.openai_temperature !== undefined) {
      await upsertSetting(ctx, "openai_temperature", args.settings.openai_temperature);
    }
    if (args.settings.openai_max_tokens !== undefined) {
      await upsertSetting(ctx, "openai_max_tokens", args.settings.openai_max_tokens);
    }
    if (args.settings.maintenance_mode !== undefined) {
      await upsertSetting(ctx, "maintenance_mode", args.settings.maintenance_mode);
    }
    if (args.settings.allow_signups !== undefined) {
      await upsertSetting(ctx, "allow_signups", args.settings.allow_signups);
    }
    if (args.settings.default_user_role !== undefined) {
      await upsertSetting(ctx, "default_user_role", args.settings.default_user_role);
    }

    // Get current settings to return
    const updatedSettings = {
      openai_model: await getSetting(ctx, "openai_model", 'gpt-4o-mini'),
      openai_temperature: await getSetting(ctx, "openai_temperature", 0.7),
      openai_max_tokens: await getSetting(ctx, "openai_max_tokens", 4000),
      maintenance_mode: await getSetting(ctx, "maintenance_mode", false),
      allow_signups: await getSetting(ctx, "allow_signups", true),
      default_user_role: await getSetting(ctx, "default_user_role", 'user'),
    };

    return {
      success: true,
      settings: updatedSettings,
      message: 'Settings updated successfully',
    };
  },
});

// Get available OpenAI models
export const getAvailableOpenAIModels = query({
  args: {},
  handler: async (ctx) => {
    return [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most advanced model, best quality responses',
        cost_per_1k_tokens: 0.03,
        max_tokens: 4096,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Fast and cost-effective for most tasks',
        cost_per_1k_tokens: 0.0015,
        max_tokens: 4096,
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: 'Latest GPT-4 with improved performance',
        cost_per_1k_tokens: 0.03,
        max_tokens: 4096,
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Legacy model, fastest response times',
        cost_per_1k_tokens: 0.002,
        max_tokens: 4096,
      },
    ];
  },
});
