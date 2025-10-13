import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Create an export record for a resume (PDF or DOCX).
 * Authentication is handled by the API route, so we skip auth checks here.
 * @returns { id: Id<"builder_resume_exports">, url: string, format: string, createdAt: number }
 */
export const createExportRecord = mutation({
  args: {
    resumeId: v.id("builder_resumes"),
    format: v.string(),
    url: v.string(),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    const id = await ctx.db.insert("builder_resume_exports" as any, {
      resumeId: args.resumeId,
      format: args.format,
      url: args.url,
      createdAt,
    });

    return {
      id,
      url: args.url,
      format: args.format,
      createdAt,
    };
  },
});
