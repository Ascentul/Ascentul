/**
 * Avatar upload and management functions
 */

import { mutation } from "./_generated/server"
import { v } from "convex/values"

/**
 * Generate an upload URL for avatar image
 * This allows the client to upload directly to Convex storage
 */
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Update user's profile image after successful upload
 */
export const updateUserAvatar = mutation({
  args: {
    clerkId: v.string(),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    // Get the URL for the uploaded file
    const imageUrl = await ctx.storage.getUrl(args.storageId)

    if (!imageUrl) {
      throw new Error("Failed to get image URL")
    }

    // Update user with new profile image
    await ctx.db.patch(user._id, {
      profile_image: imageUrl,
      updated_at: Date.now(),
    })

    return {
      success: true,
      imageUrl,
    }
  },
})

/**
 * Delete user's avatar and revert to default
 */
export const deleteUserAvatar = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()

    if (!user) {
      throw new Error("User not found")
    }

    // Clear profile image
    await ctx.db.patch(user._id, {
      profile_image: undefined,
      updated_at: Date.now(),
    })

    return { success: true }
  },
})
