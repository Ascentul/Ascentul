import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireSuperAdmin } from "./lib/roles";

export const getUniversitySettings = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!currentUser) throw new Error("User not found");

    if (currentUser.university_id) {
      return await ctx.db.get(currentUser.university_id);
    }

    return null;
  }
});

export const getUniversity = query({
  args: { universityId: v.id("universities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.universityId);
  }
});

export const getUniversityBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("universities")
      .withIndex("by_slug", q => q.eq("slug", args.slug))
      .unique();
  }
});

export const getUniversityByAdminEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("universities")
      .withIndex("by_admin_email", q => q.eq("admin_email", args.email))
      .unique();
  }
});

export const getUniversityAdminCounts = query({
  args: {},
  handler: async (ctx) => {
    // Only super admins should see admin counts across all universities
    await requireSuperAdmin(ctx);

    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "university_admin"))
      .collect();

    const counts: Record<string, number> = {};
    for (const admin of admins) {
      if (admin.university_id) {
        const uniId = admin.university_id as string;
        counts[uniId] = (counts[uniId] || 0) + 1;
      }
    }

    return counts;
  }
});
