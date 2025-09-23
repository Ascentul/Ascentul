import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a university if it doesn't exist (by slug), otherwise return existing id
export const createUniversity = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    license_plan: v.union(
      v.literal("Starter"),
      v.literal("Basic"),
      v.literal("Pro"),
      v.literal("Enterprise"),
    ),
    license_seats: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("trial"),
      v.literal("suspended"),
    ),
    admin_email: v.optional(v.string()),
    created_by_clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("universities")
      .withIndex("by_slug", q => q.eq("slug", args.slug))
      .unique();

    if (existing) return existing._id;

    let created_by_id: any = undefined;
    if (args.created_by_clerkId) {
      const creator = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", q => q.eq("clerkId", args.created_by_clerkId as string))
        .unique();
      if (creator) created_by_id = creator._id;
    }

    const now = Date.now();
    const uniId = await ctx.db.insert("universities", {
      name: args.name,
      slug: args.slug,
      license_plan: args.license_plan,
      license_seats: args.license_seats,
      license_used: 0,
      license_start: now,
      license_end: undefined,
      status: args.status,
      admin_email: args.admin_email,
      created_by_id,
      created_at: now,
      updated_at: now,
    });

    return uniId;
  }
});

// Assign a university to a user by Clerk ID and optionally make them an admin
export const assignUniversityToUser = mutation({
  args: {
    userClerkId: v.string(),
    universitySlug: v.string(),
    makeAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", args.userClerkId))
      .unique();
    if (!user) throw new Error("User not found");

    const university = await ctx.db
      .query("universities")
      .withIndex("by_slug", q => q.eq("slug", args.universitySlug))
      .unique();
    if (!university) throw new Error("University not found");

    await ctx.db.patch(user._id, {
      university_id: university._id,
      subscription_plan: "university",
      ...(args.makeAdmin ? { role: "university_admin" as const } : {}),
      updated_at: Date.now(),
    });

    return user._id;
  }
});

// Get all universities for admin management
export const getAllUniversities = query({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // TODO: Add proper admin authorization check
    return await ctx.db
      .query("universities")
      .collect();
  }
});

// Update a university (admin only)
export const updateUniversity = mutation({
  args: {
    universityId: v.id("universities"),
    updates: v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      license_plan: v.optional(v.union(
        v.literal("Starter"),
        v.literal("Basic"),
        v.literal("Pro"),
        v.literal("Enterprise"),
      )),
      license_seats: v.optional(v.number()),
      status: v.optional(v.union(
        v.literal("active"),
        v.literal("expired"),
        v.literal("trial"),
        v.literal("suspended"),
      )),
      admin_email: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // TODO: Add proper admin authorization check
    const { universityId, updates } = args;

    await ctx.db.patch(universityId, {
      ...updates,
      updated_at: Date.now(),
    });

    return universityId;
  }
});

// Optional helper to fetch by slug
export const getUniversityBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("universities")
      .withIndex("by_slug", q => q.eq("slug", args.slug))
      .unique();
  }
});
