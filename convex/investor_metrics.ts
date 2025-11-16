/**
 * Investor metrics and reporting
 * Provides accurate user counts and growth metrics for investor reports
 *
 * PERFORMANCE NOTE:
 * These queries load all users into memory for accurate metrics calculation.
 * This is acceptable for super admin-only investor reporting (infrequent access).
 *
 * WHEN TO OPTIMIZE:
 * - When user count exceeds ~50,000: Consider caching computed metrics
 * - If queries timeout: Implement scheduled computation with cached results
 * - If accessed frequently: Add a cached_metrics table updated hourly
 *
 * For optimization patterns, see: https://docs.convex.dev/database/pagination
 */

import { v } from "convex/values"
import { query } from "./_generated/server"
import { requireSuperAdmin } from "./lib/roles"

/**
 * Get comprehensive user metrics for investor reporting
 * Excludes test users for accurate counts
 *
 * PERFORMANCE: Loads all users - acceptable for <50k users, super admin only
 */
export const getUserMetrics = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify super admin
    await requireSuperAdmin(ctx)

    // NOTE: Loads all users for comprehensive metrics
    // For large datasets (>50k users), consider implementing caching
    const allUsers = await ctx.db.query("users").collect()

    // Separate real users from test users
    const realUsers = allUsers.filter(u => !u.is_test_user)
    const testUsers = allUsers.filter(u => u.is_test_user)

    // Active users (real users only, not deleted/suspended)
    const activeUsers = realUsers.filter(
      u => (u.account_status || 'active') === 'active'
    )

    // Deleted users (real users only)
    const deletedUsers = realUsers.filter(
      u => u.account_status === 'deleted'
    )

    // Pending activation (real users only)
    const pendingUsers = realUsers.filter(
      u => u.account_status === 'pending_activation'
    )

    // Suspended users (real users only)
    const suspendedUsers = realUsers.filter(
      u => u.account_status === 'suspended'
    )

    // Subscription breakdown (active real users only)
    const freeUsers = activeUsers.filter(
      u => u.subscription_plan === 'free'
    )
    const premiumUsers = activeUsers.filter(
      u => u.subscription_plan === 'premium'
    )
    const universityUsers = activeUsers.filter(
      u => u.subscription_plan === 'university'
    )

    // Role breakdown (active real users only)
    const individualUsers = activeUsers.filter(
      u => u.role === 'user' || u.role === 'individual'
    )
    const students = activeUsers.filter(u => u.role === 'student')
    const staff = activeUsers.filter(u => u.role === 'staff')
    const universityAdmins = activeUsers.filter(u => u.role === 'university_admin')
    const advisors = activeUsers.filter(u => u.role === 'advisor')
    const superAdmins = activeUsers.filter(u => u.role === 'super_admin')

    // Growth metrics (last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const newUsersLast30Days = activeUsers.filter(
      u => u.created_at >= thirtyDaysAgo
    ).length

    // Monthly recurring revenue estimate (premium users only)
    const mrr = premiumUsers.length * 30 // Assuming $30/month per premium user

    return {
      // Total counts (real users only)
      total_real_users: realUsers.length,
      active_users: activeUsers.length,
      deleted_users: deletedUsers.length,
      pending_users: pendingUsers.length,
      suspended_users: suspendedUsers.length,

      // Test users (separate tracking)
      test_users: testUsers.length,

      // Subscription breakdown (active only)
      by_plan: {
        free: freeUsers.length,
        premium: premiumUsers.length,
        university: universityUsers.length,
      },

      // Role breakdown (active only)
      by_role: {
        individual: individualUsers.length,
        student: students.length,
        staff: staff.length,
        university_admin: universityAdmins.length,
        advisor: advisors.length,
        super_admin: superAdmins.length,
      },

      // Growth metrics
      growth: {
        new_users_last_30_days: newUsersLast30Days,
        growth_rate_30d: activeUsers.length > 0
          ? ((newUsersLast30Days / activeUsers.length) * 100).toFixed(2) + '%'
          : '0%',
      },

      // Revenue metrics
      revenue: {
        mrr: mrr,
        arr: mrr * 12,
        paying_users: premiumUsers.length,
      },

      // Timestamp for report generation
      generated_at: Date.now(),
    }
  },
})

/**
 * Get user growth over time
 * Returns monthly user counts for the last 12 months
 *
 * PERFORMANCE: Loads all users - acceptable for <50k users, super admin only
 */
export const getUserGrowthHistory = query({
  args: {
    clerkId: v.string(),
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify super admin
    await requireSuperAdmin(ctx)

    const monthsToShow = args.months || 12
    // NOTE: Loads all users for growth analysis
    const allUsers = await ctx.db.query("users").collect()
    const realUsers = allUsers.filter(u => !u.is_test_user)

    // Calculate monthly data points
    const monthlyData = []
    const now = Date.now()

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const monthStartTime = monthStart.getTime()

      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      const monthEndTime = monthEnd.getTime()

      // Count users created in this month
      const usersCreatedThisMonth = realUsers.filter(
        u => u.created_at >= monthStartTime && u.created_at < monthEndTime
      ).length

      // Count total active users at end of this month
      // Note: Uses current account_status, not historical state at monthEndTime
      const activeUsersAtMonthEnd = realUsers.filter(
        u => u.created_at <= monthEndTime &&
        (u.account_status || 'active') === 'active'
      ).length

      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        new_users: usersCreatedThisMonth,
        total_active: activeUsersAtMonthEnd,
      })
    }

    return monthlyData
  },
})

/**
 * Get university metrics for investor reporting
 * Shows institutional adoption stats
 *
 * PERFORMANCE: Loads all universities and users - acceptable for current scale
 */
export const getUniversityMetrics = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify super admin
    await requireSuperAdmin(ctx)

    const universities = await ctx.db.query("universities").collect()
    // NOTE: Loads all users for university utilization calculation
    const allUsers = await ctx.db.query("users").collect()

    // Filter active students/advisors only
    const activeUniversityUsers = allUsers.filter(
      u => !u.is_test_user &&
      (u.account_status || 'active') === 'active' &&
      u.subscription_plan === 'university' &&
      u.university_id
    )

    // Calculate metrics per university
    const universityStats = universities.map(uni => {
      const uniUsers = activeUniversityUsers.filter(u => u.university_id === uni._id)
      const students = uniUsers.filter(u => u.role === 'student')
      const admins = uniUsers.filter(u => u.role === 'university_admin')
      const advisors = uniUsers.filter(u => u.role === 'advisor')

      return {
        university_id: uni._id,
        name: uni.name,
        plan: uni.license_plan,
        total_seats: uni.license_seats,
        used_seats: uniUsers.length,
        available_seats: uni.license_seats - uniUsers.length,
        utilization_rate: ((uniUsers.length / uni.license_seats) * 100).toFixed(1) + '%',
        students: students.length,
        admins: admins.length,
        advisors: advisors.length,
      }
    })

    // Calculate aggregate metrics
    const totalSeats = universities.reduce((sum, u) => sum + u.license_seats, 0);
    const utilizationRate = totalSeats > 0
      ? ((activeUniversityUsers.length / totalSeats) * 100).toFixed(1) + '%'
      : '0%';

    return {
      total_universities: universities.length,
      total_seats: totalSeats,
      used_seats: activeUniversityUsers.length,
      utilization_rate: utilizationRate,
      universities: universityStats,
    }
  },
})
