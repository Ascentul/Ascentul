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
