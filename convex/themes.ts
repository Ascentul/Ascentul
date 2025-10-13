import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

/**
 * List all available resume themes with pagination support.
 *
 * Note: Returns minimal fields (id, name, fonts, colors) for lighter payloads
 * in list/picker views. Use getTheme() or getThemeByName() for full details
 * including fontSizes.
 *
 * @returns PaginationResult<{ id, name, fonts, colors }>
 */
export const listThemes = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("builder_resume_themes")
      .paginate(args.paginationOpts);

    return {
      ...result,
      page: result.page.map((theme) => ({
        id: theme._id,
        name: theme.name,
        fonts: theme.fonts,
        colors: theme.colors,
      })),
    };
  },
});

/**
 * List all available resume themes without pagination (legacy).
 *
 * Note: Returns minimal fields for lighter payloads. Consider using
 * listThemes with pagination for better performance with large datasets.
 *
 * @returns Array<{ id, name, fonts, colors }>
 */
export const listThemesAll = query({
  args: {},
  handler: async (ctx) => {
    const themes = await ctx.db
      .query("builder_resume_themes")
      .collect();

    return themes.map((theme) => ({
      id: theme._id,
      name: theme.name,
      fonts: theme.fonts,
      colors: theme.colors,
    }));
  },
});

/**
 * Get a specific theme by ID.
 * @returns { id, name, fonts, fontSizes?, colors }
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
      fontSizes: theme.fontSizes,
      colors: theme.colors,
    };
  },
});

/**
 * Get a theme by name.
 * @returns { id, name, fonts, fontSizes?, colors }
 */
export const getThemeByName = query({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const theme = await ctx.db
      .query("builder_resume_themes")
      .withIndex("by_name", (q) => q.eq("name", args.name))
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
