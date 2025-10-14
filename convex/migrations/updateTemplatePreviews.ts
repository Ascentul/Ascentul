import { mutation } from "../_generated/server";

/**
 * Migration: Update template thumbnailUrl from .png to .svg
 *
 * Run this once to update existing templates to use SVG previews
 *
 * Usage (in Convex dashboard):
 * - Go to Functions tab
 * - Run: migrations.updateTemplatePreviews()
 */
export const updateTemplatePreviews = mutation({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db.query("builder_resume_templates").collect();

    let updated = 0;

    for (const template of templates) {
      if (template.thumbnailUrl && template.thumbnailUrl.endsWith('.png')) {
        const newUrl = template.thumbnailUrl.replace('.png', '.svg');

        await ctx.db.patch(template._id, {
          thumbnailUrl: newUrl
        });

        updated++;
        console.log(`Updated ${template.slug}: ${template.thumbnailUrl} → ${newUrl}`);
      }
    }

    return {
      success: true,
      message: `Updated ${updated} template(s)`,
      total: templates.length,
    };
  },
});

/**
 * Alternative: Delete all templates to force re-seed
 *
 * WARNING: This will delete all templates! Only use if you want to start fresh.
 * The seedTemplates function will automatically run on next query.
 */
export const deleteAllTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db.query("builder_resume_templates").collect();

    for (const template of templates) {
      await ctx.db.delete(template._id);
    }

    return {
      success: true,
      message: `Deleted ${templates.length} template(s)`,
      note: "Templates will be re-seeded on next query with SVG previews"
    };
  },
});
