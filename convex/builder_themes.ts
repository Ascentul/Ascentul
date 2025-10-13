import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * List all available resume themes.
 * @returns Array<{ id, name, fonts, colors, fontSizes? }>
 */
export const listThemes = query({
  args: {},
  handler: async (ctx) => {
    const themes = await ctx.db.query("builder_resume_themes").collect();

    return themes.map((theme) => ({
      id: theme._id,
      name: theme.name,
      fonts: theme.fonts,
      colors: theme.colors,
      fontSizes: theme.fontSizes,
    }));
  },
});

/**
 * Alias for listThemes - List all available resume themes.
 * @returns Array<{ id, name, fonts, colors, fontSizes? }>
 */
export const listThemesAll = query({
  args: {},
  handler: async (ctx) => {
    const themes = await ctx.db.query("builder_resume_themes").collect();

    return themes.map((theme) => ({
      id: theme._id,
      name: theme.name,
      fonts: theme.fonts,
      colors: theme.colors,
      fontSizes: theme.fontSizes,
    }));
  },
});

/**
 * Get a specific theme by ID with full details.
 * @returns { id, name, fonts, colors, fontSizes? }
 */
export const getTheme = query({
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
      colors: theme.colors,
      fontSizes: theme.fontSizes,
    };
  },
});
