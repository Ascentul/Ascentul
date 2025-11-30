/**
 * Departments Module
 *
 * Handles university department queries.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireTenant } from "./advisor_auth";

/**
 * Get a department by ID
 */
export const getDepartment = query({
  args: {
    departmentId: v.id("departments"),
  },
  handler: async (ctx, args) => {
    const sessionCtx = await getCurrentUser(ctx);

    const department = await ctx.db.get(args.departmentId);
    if (!department) {
      throw new Error("Department not found");
    }

    // Super admins can access any department
    if (sessionCtx.role === "super_admin") {
      return department;
    }

    const universityId = requireTenant(sessionCtx);
    if (department.university_id !== universityId) {
      throw new Error("Unauthorized: Department is not in your university");
    }

    // Allow university-scoped roles to read department data
    const allowedRoles: typeof sessionCtx.role[] = [
      "university_admin",
      "advisor",
      "staff",
      "student",
    ];
    if (!allowedRoles.includes(sessionCtx.role)) {
      throw new Error(`Unauthorized role: ${sessionCtx.role}`);
    }

    return department;
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
    const sessionCtx = await getCurrentUser(ctx);

    // Super admins can read any university
    if (sessionCtx.role !== "super_admin") {
      const universityId = requireTenant(sessionCtx);
      if (universityId !== args.universityId) {
        throw new Error("Unauthorized: Different university");
      }

      const allowedRoles: typeof sessionCtx.role[] = [
        "university_admin",
        "advisor",
        "staff",
        "student",
      ];
      if (!allowedRoles.includes(sessionCtx.role)) {
        throw new Error(`Unauthorized role: ${sessionCtx.role}`);
      }
    }

    return await ctx.db
      .query("departments")
      .withIndex("by_university", (q) => q.eq("university_id", args.universityId))
      .collect();
  },
});
