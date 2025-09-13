import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save a job search entry for the user
export const createJobSearch = mutation({
  args: {
    clerkId: v.string(),
    keywords: v.optional(v.string()),
    location: v.optional(v.string()),
    remote_only: v.optional(v.boolean()),
    results_count: v.number(),
    // Capture any other filters as JSON so we can evolve without schema churn
    search_data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const id = await ctx.db.insert("job_searches", {
      user_id: user._id,
      keywords: args.keywords,
      location: args.location,
      remote_only: args.remote_only ?? false,
      results_count: args.results_count,
      search_data: args.search_data,
      created_at: Date.now(),
    });

    return id;
  },
});

// Return the most recent N searches for the user
export const getRecentJobSearches = query({
  args: { clerkId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const items = await ctx.db
      .query("job_searches")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .take(args.limit ?? 10);

    return items;
  },
});
