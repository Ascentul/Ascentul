import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * List all available resume templates for gallery view.
 * @returns Array<{ id, slug, name, thumbnailUrl, pageSize, allowedBlocks }>
 */
export const listTemplates = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("builder_resume_templates")
      .withIndex("by_name")
      .order("asc")
      .collect();

    return templates.map((template) => ({
      id: template._id,
      slug: template.slug,
      name: template.name,
      preview: template.preview ?? template.thumbnailUrl ?? null,
      thumbnailUrl: template.thumbnailUrl,
      pageSize: template.pageSize,
      allowedBlocks: template.allowedBlocks,
    }));
  },
});

/**
 * List all available resume templates (alias for listTemplates).
 * @returns Array<{ id, slug, name, thumbnailUrl, pageSize, allowedBlocks }>
 */
export const listTemplatesAll = query({
  args: {},
  handler: listTemplates.handler,
});

/**
 * Get a specific template by slug with full details.
 * @returns { id, slug, name, pageSize, margins, allowedBlocks, thumbnailUrl? }
 */
export const getTemplate = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("builder_resume_templates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!template) {
      throw new Error("Template not found");
    }

    return {
      id: template._id,
      slug: template.slug,
      name: template.name,
      preview: template.preview ?? template.thumbnailUrl ?? null,
      pageSize: template.pageSize,
      margins: template.margins,
      allowedBlocks: template.allowedBlocks,
      thumbnailUrl: template.thumbnailUrl,
    };
  },
});
