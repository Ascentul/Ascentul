/**
 * Admin user management functions
 * Allows super admins and university admins to create users
 */

import { v } from "convex/values"
import { mutation, internalMutation } from "./_generated/server"
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
      v.literal("staff"),
      v.literal("university_admin"),
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
    const isUniversityAdmin = admin.role === "university_admin" && admin.university_id === args.university_id

    if (!isSuperAdmin && !isUniversityAdmin) {
      throw new Error("Unauthorized - Only admins can create users")
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
    const activationExpiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days

    // Create user with pending activation status
    // Note: This creates a placeholder in Convex. Actual Clerk account
    // will be created when user activates via the activation link.
    const userId = await ctx.db.insert("users", {
      clerkId: `pending_${activationToken}`, // Temporary until activated
      email: args.email,
      name: args.name,
      username: args.email.split('@')[0],
      role: args.role || "user",
      subscription_plan: args.university_id ? "university" : "free",
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

    // Schedule email to be sent (using internal mutation to call action)
    await ctx.scheduler.runAfter(0, api.admin_users.sendActivationEmailInternal, {
      userId,
      email: args.email,
      name: args.name,
      tempPassword,
      activationToken,
    })

    return {
      userId,
      activationToken,
      tempPassword, // Return for display to admin
      message: "User created successfully. Activation email will be sent shortly.",
    }
  },
})

/**
 * Internal mutation to trigger activation email sending
 * This is called by scheduler from createUserByAdmin
 */
export const sendActivationEmailInternal = internalMutation({
  args: {
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
    tempPassword: v.string(),
    activationToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Call the email action
    try {
      await ctx.scheduler.runAfter(0, api.email.sendActivationEmail, {
        email: args.email,
        name: args.name,
        tempPassword: args.tempPassword,
        activationToken: args.activationToken,
      })
    } catch (error) {
      console.error("Failed to schedule activation email:", error)
      // Update user to indicate email failed
      await ctx.db.patch(args.userId, {
        updated_at: Date.now(),
      })
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

    if (!admin || !["super_admin", "admin", "university_admin"].includes(admin.role)) {
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
