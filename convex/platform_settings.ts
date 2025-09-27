import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Platform settings for configurable system-wide preferences
export const getPlatformSettings = query({
  args: {},
  handler: async (ctx) => {
    // For now, return default settings. In a real implementation,
    // this could be stored in a database table or environment variables
    return {
      openai_model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      openai_temperature: 0.7,
      openai_max_tokens: 4000,
      maintenance_mode: false,
      allow_signups: true,
      default_user_role: 'user',
    };
  },
});

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

    // In a real implementation, you would save these to a database table
    // For now, we'll just validate the input and return success

    const updatedSettings = {
      openai_model: args.settings.openai_model || 'gpt-4o-mini',
      openai_temperature: args.settings.openai_temperature || 0.7,
      openai_max_tokens: args.settings.openai_max_tokens || 4000,
      maintenance_mode: args.settings.maintenance_mode || false,
      allow_signups: args.settings.allow_signups ?? true,
      default_user_role: args.settings.default_user_role || 'user',
    };

    // TODO: In a production app, save to database table
    // For now, we'll just return the updated settings

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
