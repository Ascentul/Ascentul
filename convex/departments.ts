/**
 * Departments Module
 *
 * Handles university department queries and mutations.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a department by ID
 */
export const getDepartment = query({
  args: {
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.departmentId);
  },
});

/**
 * Get all departments for a university
 */
export const getDepartmentsByUniversity = query({
  args: {
    universityId: v.id("universities"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("departments")
      .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
      .collect();
  },
});
