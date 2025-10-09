/**
 * Admin user management functions
 * Allows super admins and university admins to create users
 */

import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { api } from "./_generated/api"

/**
 * Generate a random activation token
 */
function generateActivationToken(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Generate a random temporary password
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Create a new user account (admin only)
 * User will receive activation email with temporary password
 */
export const createUserByAdmin = mutation({
  args: {
    adminClerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.optional(v.union(
      v.literal("user"),
      v.literal("student"),
      v.literal("staff"),
      v.literal("university_admin"),
      v.literal("advisor"),
    )),
    university_id: v.optional(v.id("universities")),
  },
  handler: async (ctx, args) => {
    // Verify admin permissions
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.adminClerkId))
      .unique()

    if (!admin) {
      throw new Error("Admin not found")
    }

    const isSuperAdmin = admin.role === "super_admin" || admin.role === "admin"
    const isUniversityAdmin = (admin.role === "university_admin" || admin.role === "advisor") && admin.university_id === args.university_id

    if (!isSuperAdmin && !isUniversityAdmin) {
      throw new Error("Unauthorized - Only admins, super admins, university admins, and advisors can create users")
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique()

    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    // Generate activation token and temp password
    const activationToken = generateActivationToken()
    const tempPassword = generateTempPassword()
    const activationExpiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours

    // Create user with pending activation status
    // Note: This creates a placeholder in Convex. Actual Clerk account
    // will be created when user activates via the activation link.
    const userId = await ctx.db.insert("users", {
      clerkId: `pending_${activationToken}`, // Temporary until activated
      email: args.email,
      name: args.name,
      username: args.email.split('@')[0],
      role: args.role || "user",
      // Students always get university plan, others get university plan if they have university_id
      subscription_plan: args.role === "student" ? "university" : (args.university_id ? "university" : "free"),
      subscription_status: "active",
      university_id: args.university_id,
      account_status: "pending_activation",
      activation_token: activationToken,
      activation_expires_at: activationExpiresAt,
      temp_password: tempPassword, // In production, this should be hashed
      created_by_admin: true,
      onboarding_completed: false,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    // Schedule email to be sent (don't fail if email service is not configured)
    try {
      await ctx.scheduler.runAfter(0, api.email.sendActivationEmail, {
        email: args.email,
        name: args.name,
        tempPassword,
        activationToken,
      })
    } catch (emailError) {
      console.warn("Failed to schedule activation email:", emailError)
      // Don't fail the user creation if email scheduling fails
    }

    return {
      userId,
      activationToken,
      tempPassword, // Return for display to admin
      message: "User created successfully. Activation email will be sent shortly.",
    }
  },
})

/**
 * Get user by activation token
 * Used by the activation page to verify token validity
 */
export const getUserByActivationToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by activation token
    const users = await ctx.db.query("users").collect()
    const user = users.find(u => u.activation_token === args.token)

    if (!user) {
      return null
    }

    // Check if token expired
    if (user.activation_expires_at && user.activation_expires_at < Date.now()) {
      return null
    }

    // Return user data (excluding sensitive information)
    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      university_id: user.university_id,
      account_status: user.account_status,
      temp_password: user.temp_password, // Needed for verification
    }
  },
})

/**
 * Activate user account using activation token
 * This will be called from the activation page
 */
export const activateUserAccount = mutation({
  args: {
    activationToken: v.string(),
    clerkId: v.string(), // Clerk ID from newly created account
  },
  handler: async (ctx, args) => {
    // Find user by activation token
    const users = await ctx.db.query("users").collect()
    const user = users.find(u => u.activation_token === args.activationToken)

    if (!user) {
      throw new Error("Invalid activation token")
    }

    // Check if token expired
    if (user.activation_expires_at && user.activation_expires_at < Date.now()) {
      throw new Error("Activation token has expired")
    }

    // Check if already activated
    if (user.account_status === "active") {
      throw new Error("Account already activated")
    }

    // Activate account and link to Clerk ID
    await ctx.db.patch(user._id, {
      clerkId: args.clerkId, // Replace pending clerkId with real one
      account_status: "active",
      activation_token: undefined, // Clear token
      activation_expires_at: undefined,
      temp_password: undefined, // Clear temp password
      updated_at: Date.now(),
    })

    return {
      success: true,
      message: "Account activated successfully",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  },
})

/**
 * Regenerate activation token and resend activation email
 * Used for "Resend Activation" feature
 */
export const regenerateActivationToken = mutation({
  args: {
    adminClerkId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin permissions
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.adminClerkId))
      .unique()

    if (!admin || !["super_admin", "university_admin", "admin", "advisor"].includes(admin.role)) {
      throw new Error("Unauthorized: Only admins can regenerate activation tokens")
    }

    // Get the user
    const user = await ctx.db.get(args.userId)

    if (!user) {
      throw new Error("User not found")
    }

    // Check if user is already activated
    if (user.account_status === "active") {
      throw new Error("User account is already active")
    }

    // For university admins, check they can only manage their own university users
    if (admin.role === "university_admin" && user.university_id !== admin.university_id) {
      throw new Error("Unauthorized: Cannot manage users outside your university")
    }

    // Generate new activation token and temp password
    const activationToken = generateActivationToken()
    const tempPassword = generateTempPassword()
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    await ctx.db.patch(user._id, {
      activation_token: activationToken,
      activation_expires_at: expiresAt,
      temp_password: tempPassword,
      clerkId: `pending_${activationToken}`, // Ensure consistent pending state
      account_status: "pending_activation",
      updated_at: Date.now(),
    })

    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.ascentful.io'
    const activationUrl = `${appUrl}/activate/${activationToken}`

    // Schedule email send (runs in background)
    await ctx.scheduler.runAfter(0, api.email.sendActivationEmail, {
      email: user.email,
      name: user.name,
      tempPassword,
      activationToken,
    })

    return {
      success: true,
      message: "New activation email sent successfully",
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      }
    }
  },
})

/**
 * Get pending activation users (admin only)
 */
export const getPendingActivations = mutation({
  args: {
    adminClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.adminClerkId))
      .unique()

    if (!admin || !["super_admin", "university_admin", "advisor"].includes(admin.role)) {
      throw new Error("Unauthorized")
    }

    // Get all pending users
    const allUsers = await ctx.db.query("users").collect()
    let pendingUsers = allUsers.filter(u => u.account_status === "pending_activation")

    // Filter by university for university admins
    if (admin.role === "university_admin" && admin.university_id) {
      pendingUsers = pendingUsers.filter(u => u.university_id === admin.university_id)
    }

    return pendingUsers.map(u => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      university_id: u.university_id,
      created_at: u.created_at,
      activation_expires_at: u.activation_expires_at,
    }))
  },
})
