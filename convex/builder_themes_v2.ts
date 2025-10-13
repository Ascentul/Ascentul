import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * List all available resume themes (public access)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const themes = await ctx.db
      .query("builder_resume_themes")
      .collect();

    return themes.map((theme) => ({
      id: theme._id,
      name: theme.name,
      fonts: theme.fonts,
      fontSizes: theme.fontSizes,
      colors: theme.colors,
    }));
  },
});

/**
 * Get a specific theme by ID (public access)
 */
export const get = query({
  args: {
    id: v.id("builder_resume_themes"),
  },
  handler: async (ctx, args) => {
    const theme = await ctx.db.get(args.id);

    if (!theme) {
      throw new Error("Theme not found");
    }

    return {
      id: theme._id,
      name: theme.name,
      fonts: theme.fonts,
      fontSizes: theme.fontSizes,
      colors: theme.colors,
    };
  },
});

/**
 * Get a theme by name (public access)
 */
export const getByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const theme = await ctx.db
      .query("builder_resume_themes")
      .withIndex("by_name", (q: any) => q.eq("name", args.name))
      .unique();

    if (!theme) {
      throw new Error(`Theme not found: ${args.name}`);
    }

    return {
      id: theme._id,
      name: theme.name,
      fonts: theme.fonts,
      fontSizes: theme.fontSizes,
      colors: theme.colors,
    };
  },
});

/**
 * Create a new theme (admin only - no auth for now, add later)
 */
export const create = mutation({
  args: {
    name: v.string(),
    fonts: v.object({
      heading: v.string(),
      body: v.string(),
    }),
    fontSizes: v.optional(
      v.object({
        heading: v.number(),
        body: v.number(),
      })
    ),
    colors: v.object({
      primary: v.string(),
      text: v.string(),
      accent: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Validate input
    if (!args.name || args.name.trim().length === 0) {
      throw new Error("Name is required");
    }

    // Validate font sizes if provided
    if (args.fontSizes) {
      if (args.fontSizes.heading < 8 || args.fontSizes.heading > 72) {
        throw new Error("Heading font size must be between 8 and 72");
      }
      if (args.fontSizes.body < 8 || args.fontSizes.body > 72) {
        throw new Error("Body font size must be between 8 and 72");
      }
    }

    // Validate color hex format (basic check)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(args.colors.primary) &&
        !args.colors.primary.startsWith('rgb') &&
        !args.colors.primary.startsWith('hsl')) {
      throw new Error("Primary color must be a valid hex, rgb, or hsl color");
    }
    if (!hexColorRegex.test(args.colors.text) &&
        !args.colors.text.startsWith('rgb') &&
        !args.colors.text.startsWith('hsl')) {
      throw new Error("Text color must be a valid hex, rgb, or hsl color");
    }
    if (!hexColorRegex.test(args.colors.accent) &&
        !args.colors.accent.startsWith('rgb') &&
        !args.colors.accent.startsWith('hsl')) {
      throw new Error("Accent color must be a valid hex, rgb, or hsl color");
    }

    // Check if theme name already exists
    const existing = await ctx.db
      .query("builder_resume_themes")
      .withIndex("by_name", (q: any) => q.eq("name", args.name))
      .unique();

    if (existing) {
      throw new Error(`Theme with name "${args.name}" already exists`);
    }

    // Create theme
    const themeId = await ctx.db.insert("builder_resume_themes" as any, {
      name: args.name.trim(),
      fonts: args.fonts,
      fontSizes: args.fontSizes,
      colors: args.colors,
    });

    return {
      id: themeId,
      name: args.name,
    };
  },
});

/**
 * Update a theme (admin only - no auth for now, add later)
 */
export const update = mutation({
  args: {
    id: v.id("builder_resume_themes"),
    name: v.optional(v.string()),
    fonts: v.optional(
      v.object({
        heading: v.string(),
        body: v.string(),
      })
    ),
    fontSizes: v.optional(
      v.object({
        heading: v.number(),
        body: v.number(),
      })
    ),
    colors: v.optional(
      v.object({
        primary: v.string(),
        text: v.string(),
        accent: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const theme = await ctx.db.get(args.id);

    if (!theme) {
      throw new Error("Theme not found");
    }

    // Validate font sizes if provided
    if (args.fontSizes) {
      if (args.fontSizes.heading < 8 || args.fontSizes.heading > 72) {
        throw new Error("Heading font size must be between 8 and 72");
      }
      if (args.fontSizes.body < 8 || args.fontSizes.body > 72) {
        throw new Error("Body font size must be between 8 and 72");
      }
    }

    // Validate colors if provided
    if (args.colors) {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(args.colors.primary) &&
          !args.colors.primary.startsWith('rgb') &&
          !args.colors.primary.startsWith('hsl')) {
        throw new Error("Primary color must be a valid hex, rgb, or hsl color");
      }
      if (!hexColorRegex.test(args.colors.text) &&
          !args.colors.text.startsWith('rgb') &&
          !args.colors.text.startsWith('hsl')) {
        throw new Error("Text color must be a valid hex, rgb, or hsl color");
      }
      if (!hexColorRegex.test(args.colors.accent) &&
          !args.colors.accent.startsWith('rgb') &&
          !args.colors.accent.startsWith('hsl')) {
        throw new Error("Accent color must be a valid hex, rgb, or hsl color");
      }
    }

    // Update theme
    const updates: any = {};
    if (args.name !== undefined) {
      if (!args.name || args.name.trim().length === 0) {
        throw new Error("Name cannot be empty");
      }

      // Check if new name conflicts with existing theme
      const existing = await ctx.db
        .query("builder_resume_themes")
        .withIndex("by_name", (q: any) => q.eq("name", args.name))
        .unique();

      if (existing && existing._id !== args.id) {
        throw new Error(`Theme with name "${args.name}" already exists`);
      }

      updates.name = args.name.trim();
    }
    if (args.fonts !== undefined) updates.fonts = args.fonts;
    if (args.fontSizes !== undefined) updates.fontSizes = args.fontSizes;
    if (args.colors !== undefined) updates.colors = args.colors;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

/**
 * Delete a theme (admin only - no auth for now, add later)
 */
export const remove = mutation({
  args: {
    id: v.id("builder_resume_themes"),
  },
  handler: async (ctx, args) => {
    const theme = await ctx.db.get(args.id);

    if (!theme) {
      throw new Error("Theme not found");
    }

    // Check if any resumes use this theme
    const resumesUsingTheme = await ctx.db
      .query("builder_resumes")
      .filter((q: any) => q.eq(q.field("themeId"), args.id))
      .collect();

    if (resumesUsingTheme.length > 0) {
      throw new Error(
        `Cannot delete theme: ${resumesUsingTheme.length} resume(s) are using it`
      );
    }

    // Delete theme
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
