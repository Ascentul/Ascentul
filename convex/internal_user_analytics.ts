/**
 * Internal User Analytics
 *
 * Provides detailed analytics for internal users (staff, admins, advisors)
 * for administrative visibility and team management.
 *
 * These metrics are SEPARATE from investor metrics and are used for:
 * - Team size tracking
 * - Role distribution
 * - Account status monitoring
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireSuperAdmin } from "./lib/roles";
import { INTERNAL_ROLES, isInternalRole } from "./lib/constants";

/**
 * Get comprehensive internal user analytics
 * Shows staff/admin accounts separately from billable users
 *
 * Access: Super Admin only
 */
export const getInternalUserAnalytics = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify super admin access
    await requireSuperAdmin(ctx);

    // Fetch all users
    const allUsers = await ctx.db.query("users").collect();

    // Filter for internal users (exclude test users)
    const internalUsers = allUsers.filter(
      (u) => !u.is_test_user && isInternalRole(u.role || "individual")
    );

    // Calculate stats by role
    const byRole = {
      super_admin: {
        total: 0,
        active: 0,
        suspended: 0,
        pending: 0,
        users: [] as Array<{
          name: string;
          email: string;
          account_status: string;
          created_at: number;
        }>,
      },
      staff: {
        total: 0,
        active: 0,
        suspended: 0,
        pending: 0,
        users: [] as Array<{
          name: string;
          email: string;
          account_status: string;
          created_at: number;
        }>,
      },
      university_admin: {
        total: 0,
        active: 0,
        suspended: 0,
        pending: 0,
        users: [] as Array<{
          name: string;
          email: string;
          university_id?: string;
          account_status: string;
          created_at: number;
        }>,
      },
      advisor: {
        total: 0,
        active: 0,
        suspended: 0,
        pending: 0,
        users: [] as Array<{
          name: string;
          email: string;
          university_id?: string;
          account_status: string;
          created_at: number;
        }>,
      },
    };

    // Process each internal user
    for (const user of internalUsers) {
      const role = user.role as keyof typeof byRole;
      const status = user.account_status || "active";

      if (byRole[role]) {
        byRole[role].total++;

        if (status === "active") byRole[role].active++;
        else if (status === "suspended") byRole[role].suspended++;
        else if (status === "pending_activation") byRole[role].pending++;

        // Add user details
        byRole[role].users.push({
          name: user.name,
          email: user.email,
          ...(user.university_id && { university_id: user.university_id }),
          account_status: status,
          created_at: user.created_at,
        });
      }
    }

    // Sort users by creation date (newest first)
    Object.values(byRole).forEach((roleData) => {
      roleData.users.sort((a, b) => b.created_at - a.created_at);
    });

    // Calculate overall stats
    const totalInternalUsers = internalUsers.length;
    const activeInternal = internalUsers.filter(
      (u) => (u.account_status || "active") === "active"
    ).length;
    const suspendedInternal = internalUsers.filter(
      (u) => u.account_status === "suspended"
    ).length;
    const pendingInternal = internalUsers.filter(
      (u) => u.account_status === "pending_activation"
    ).length;

    // Get all users for comparison
    const billableUsers = allUsers.filter(
      (u) =>
        !u.is_test_user &&
        !isInternalRole(u.role || "individual") &&
        u.role !== "user" // Exclude legacy role
    );

    return {
      overview: {
        total_internal_users: totalInternalUsers,
        active_internal_users: activeInternal,
        suspended_internal_users: suspendedInternal,
        pending_internal_users: pendingInternal,

        // For comparison with billable users
        total_billable_users: billableUsers.length,
        total_all_users: allUsers.filter((u) => !u.is_test_user).length,
      },

      by_role: byRole,

      recent_internal_users: internalUsers
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 10)
        .map((u) => ({
          name: u.name,
          email: u.email,
          role: u.role,
          account_status: u.account_status || "active",
          created_at: u.created_at,
        })),

      warnings: {
        // Flag any internal users with non-free plans (shouldn't happen)
        internal_with_paid_plans: internalUsers
          .filter((u) => u.subscription_plan !== "free")
          .map((u) => ({
            name: u.name,
            email: u.email,
            role: u.role,
            subscription_plan: u.subscription_plan,
          })),
      },

      generated_at: Date.now(),
    };
  },
});

/**
 * Get university admin distribution
 * Shows which universities have admins and how many
 *
 * Access: Super Admin only
 */
export const getUniversityAdminDistribution = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const universities = await ctx.db.query("universities").collect();
    const allUsers = await ctx.db.query("users").collect();

    const distribution = universities.map((uni) => {
      const uniAdmins = allUsers.filter(
        (u) =>
          !u.is_test_user &&
          u.university_id === uni._id &&
          (u.role === "university_admin" || u.role === "advisor")
      );

      return {
        university_id: uni._id,
        university_name: uni.name,
        total_admins: uniAdmins.filter((u) => u.role === "university_admin")
          .length,
        total_advisors: uniAdmins.filter((u) => u.role === "advisor").length,
        admins: uniAdmins.map((u) => ({
          name: u.name,
          email: u.email,
          role: u.role,
          account_status: u.account_status || "active",
        })),
      };
    });

    // Universities without any admins (potential issue)
    const universitiesWithoutAdmins = distribution.filter(
      (d) => d.total_admins === 0
    );

    return {
      total_universities: universities.length,
      universities_with_admins: distribution.filter((d) => d.total_admins > 0)
        .length,
      universities_without_admins: universitiesWithoutAdmins.length,
      distribution,
      warnings: {
        universities_needing_admin: universitiesWithoutAdmins.map((d) => ({
          university_id: d.university_id,
          university_name: d.university_name,
        })),
      },
    };
  },
});

/**
 * Get internal user growth over time
 * Tracks how the team has grown month-by-month
 *
 * Access: Super Admin only
 */
export const getInternalUserGrowth = query({
  args: {
    clerkId: v.string(),
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const monthsToShow = args.months || 12;
    const allUsers = await ctx.db.query("users").collect();

    const internalUsers = allUsers.filter(
      (u) => !u.is_test_user && isInternalRole(u.role || "individual")
    );

    // Calculate monthly data points
    const monthlyData = [];

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthStartTime = monthStart.getTime();

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      const monthEndTime = monthEnd.getTime();

      // Count internal users created this month
      const newInternalUsers = internalUsers.filter(
        (u) => u.created_at >= monthStartTime && u.created_at < monthEndTime
      );

      // Count total internal users at end of month
      const totalAtMonthEnd = internalUsers.filter(
        (u) =>
          u.created_at <= monthEndTime &&
          (u.account_status || "active") !== "deleted"
      ).length;

      // Break down by role
      const byRole = {
        super_admin: newInternalUsers.filter((u) => u.role === "super_admin")
          .length,
        staff: newInternalUsers.filter((u) => u.role === "staff").length,
        university_admin: newInternalUsers.filter(
          (u) => u.role === "university_admin"
        ).length,
        advisor: newInternalUsers.filter((u) => u.role === "advisor").length,
      };

      monthlyData.push({
        month: monthStart.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        }),
        new_internal_users: newInternalUsers.length,
        total_internal_users: totalAtMonthEnd,
        by_role: byRole,
      });
    }

    return {
      monthly_growth: monthlyData,
      current_month: monthlyData[monthlyData.length - 1],
      generated_at: Date.now(),
    };
  },
});
