import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * List all available resume templates (public access)
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("builder_resume_templates")
      .collect();

    return templates.map((template) => ({
      id: template._id,
      slug: template.slug,
      name: template.name,
      preview: template.preview ?? template.thumbnailUrl ?? null,
      thumbnailUrl: template.thumbnailUrl,
      pageSize: template.pageSize,
      margins: template.margins,
      allowedBlocks: template.allowedBlocks,
    }));
  },
});

/**
 * Get a specific template by slug (public access)
 */
export const getBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("builder_resume_templates")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();

    if (!template) {
      throw new Error(`Template not found: ${args.slug}`);
    }

    return {
      id: template._id,
      slug: template.slug,
      name: template.name,
      preview: template.preview ?? template.thumbnailUrl ?? null,
      thumbnailUrl: template.thumbnailUrl,
      pageSize: template.pageSize,
      margins: template.margins,
      allowedBlocks: template.allowedBlocks,
    };
  },
});

/**
 * Get a template by ID (public access)
 */
export const get = query({
  args: {
    id: v.id("builder_resume_templates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);

    if (!template) {
      throw new Error("Template not found");
    }

    return {
      id: template._id,
      slug: template.slug,
      name: template.name,
      preview: template.preview ?? template.thumbnailUrl ?? null,
      thumbnailUrl: template.thumbnailUrl,
      pageSize: template.pageSize,
      margins: template.margins,
      allowedBlocks: template.allowedBlocks,
    };
  },
});

/**
 * Create a new template (admin only - no auth for now, add later)
 */
export const create = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    thumbnailUrl: v.optional(v.string()),
    pageSize: v.string(), // "A4" or "Letter"
    margins: v.object({
      top: v.number(),
      right: v.number(),
      bottom: v.number(),
      left: v.number(),
    }),
    allowedBlocks: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate input
    if (!args.slug || args.slug.trim().length === 0) {
      throw new Error("Slug is required");
    }

    if (!args.name || args.name.trim().length === 0) {
      throw new Error("Name is required");
    }

    const validPageSizes = ['A4', 'Letter'];
    if (!validPageSizes.includes(args.pageSize)) {
      throw new Error("Page size must be 'A4' or 'Letter'");
    }

    // Validate margins
    if (args.margins.top < 0 || args.margins.right < 0 ||
        args.margins.bottom < 0 || args.margins.left < 0) {
      throw new Error("Margins must be non-negative");
    }

    // Validate thumbnailUrl format if provided
    if (args.thumbnailUrl && args.thumbnailUrl.trim().length > 0) {
      try {
        const url = new URL(args.thumbnailUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error("thumbnailUrl must use http or https protocol");
        }
      } catch {
        throw new Error("Invalid URL format for thumbnailUrl");
      }
    }

    // Check if slug already exists
    const existing = await ctx.db
      .query("builder_resume_templates")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      throw new Error(`Template with slug "${args.slug}" already exists`);
    }

    // Create template
    const templateId = await ctx.db.insert("builder_resume_templates" as any, {
      slug: args.slug.trim(),
      name: args.name.trim(),
      preview: args.thumbnailUrl,
      thumbnailUrl: args.thumbnailUrl,
      pageSize: args.pageSize,
      margins: args.margins,
      allowedBlocks: args.allowedBlocks,
    });

    return {
      id: templateId,
      slug: args.slug.trim(),
      name: args.name,
    };
  },
});

/**
 * Update a template (admin only - no auth for now, add later)
 */
export const update = mutation({
  args: {
    id: v.id("builder_resume_templates"),
    name: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    pageSize: v.optional(v.string()),
    margins: v.optional(
      v.object({
        top: v.number(),
        right: v.number(),
        bottom: v.number(),
        left: v.number(),
      })
    ),
    allowedBlocks: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);

    if (!template) {
      throw new Error("Template not found");
    }

    // Validate page size if provided
    if (args.pageSize) {
      const validPageSizes = ['A4', 'Letter'];
      if (!validPageSizes.includes(args.pageSize)) {
        throw new Error("Page size must be 'A4' or 'Letter'");
      }
    }

    // Validate margins if provided
    if (args.margins) {
      if (args.margins.top < 0 || args.margins.right < 0 ||
          args.margins.bottom < 0 || args.margins.left < 0) {
        throw new Error("Margins must be non-negative");
      }
    }

    // Update template
    const updates: any = {};
    if (args.name !== undefined) {
      if (!args.name || args.name.trim().length === 0) {
        throw new Error("Name cannot be empty");
      }
      updates.name = args.name.trim();
    }
    // Keep preview and thumbnailUrl synchronized to prevent data inconsistency
    if (args.thumbnailUrl !== undefined) {
      // Validate URL format if provided and non-empty
      if (args.thumbnailUrl && args.thumbnailUrl.trim().length > 0) {
        try {
          const url = new URL(args.thumbnailUrl);
          if (!['http:', 'https:'].includes(url.protocol)) {
            throw new Error("thumbnailUrl must use http or https protocol");
          }
        } catch {
          throw new Error("Invalid URL format for thumbnailUrl");
        }
      }
      updates.thumbnailUrl = args.thumbnailUrl;
      updates.preview = args.thumbnailUrl;
    }
    if (args.pageSize !== undefined) updates.pageSize = args.pageSize;
    if (args.margins !== undefined) updates.margins = args.margins;
    if (args.allowedBlocks !== undefined) updates.allowedBlocks = args.allowedBlocks;

    await ctx.db.patch(args.id, updates);

    return { success: true };
  },
});

/**
 * Delete a template (admin only - no auth for now, add later)
 */
export const remove = mutation({
  args: {
    id: v.id("builder_resume_templates"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.id);

    if (!template) {
      throw new Error("Template not found");
    }

    // Check if any resumes use this template
    const resumesUsingTemplate = await ctx.db
      .query("builder_resumes")
      .filter((q: any) => q.eq(q.field("templateSlug"), template.slug))
      .collect();

    if (resumesUsingTemplate.length > 0) {
      throw new Error(
        `Cannot delete template: ${resumesUsingTemplate.length} resume(s) are using it`
      );
    }

    // Delete template
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
