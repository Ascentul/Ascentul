import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

/**
 * List all available resume templates with pagination support.
 *
 * Note: Returns minimal fields (id, slug, name, thumbnailUrl, pageSize, allowedBlocks)
 * for gallery/picker views. Use getTemplate() for full details including margins.
 *
 * @returns PaginationResult<{ id, slug, name, thumbnailUrl, pageSize, allowedBlocks }>
 */
export const listTemplates = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("builder_resume_templates")
      .withIndex("by_name")
      .paginate(args.paginationOpts);

    return {
      ...result,
      page: result.page.map((template) => ({
        id: template._id,
        slug: template.slug,
        name: template.name,
        thumbnailUrl: template.thumbnailUrl,
        pageSize: template.pageSize,
        allowedBlocks: template.allowedBlocks,
      })),
    };
  },
});

/**
 * List all available resume templates without pagination (legacy).
 *
 * Note: Returns minimal fields with consistent ordering by name.
 * Consider using listTemplates with pagination for better performance.
 *
 * @returns Array<{ id, slug, name, thumbnailUrl, pageSize, allowedBlocks }>
 */
export const listTemplatesAll = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("builder_resume_templates")
      .withIndex("by_name")
      .collect();

    return templates.map((template) => ({
      id: template._id,
      slug: template.slug,
      name: template.name,
      thumbnailUrl: template.thumbnailUrl,
      pageSize: template.pageSize,
      allowedBlocks: template.allowedBlocks,
    }));
  },
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
      pageSize: template.pageSize,
      margins: template.margins,
      allowedBlocks: template.allowedBlocks,
      thumbnailUrl: template.thumbnailUrl,
    };
  },
});
