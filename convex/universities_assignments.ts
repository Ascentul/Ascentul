import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { getAuthenticatedUser } from "./lib/roles";

export const assignUniversityToUser = mutation({
  args: {
    userClerkId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    universitySlug: v.string(),
    makeAdmin: v.optional(v.boolean()),
    sendInviteEmail: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actingUser = await getAuthenticatedUser(ctx);
    const isSuperAdmin = actingUser.role === "super_admin";

    if (!args.userClerkId && !args.userEmail) {
      throw new Error("Either userClerkId or userEmail must be provided");
    }

    let user = null;

    if (args.userClerkId) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", q => q.eq("clerkId", args.userClerkId!))
        .unique();
    } else if (args.userEmail) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", q => q.eq("email", args.userEmail!))
        .unique();
    }

    if (!user) throw new Error("User not found");

    const university = await ctx.db
      .query("universities")
      .withIndex("by_slug", q => q.eq("slug", args.universitySlug))
      .unique();
    if (!university) throw new Error("University not found");

    if (
      !isSuperAdmin &&
      !(actingUser.role === "university_admin" && actingUser.university_id === university._id)
    ) {
      throw new Error("Unauthorized");
    }

    const newRole = args.makeAdmin ? "university_admin" as const : user.role;

    if (!isSuperAdmin && user.university_id && user.university_id !== university._id) {
      throw new Error("User already assigned to a different university");
    }

    await ctx.db.patch(user._id, {
      university_id: university._id,
      subscription_plan: "university",
      ...(args.makeAdmin ? { role: newRole } : {}),
      updated_at: Date.now(),
    });

    if (args.sendInviteEmail && user.account_status === "pending_activation" && user.activation_token) {
      try {
        if (newRole === "university_admin") {
          await ctx.scheduler.runAfter(0, api.email.sendUniversityAdminInvitationEmail, {
            email: user.email,
            name: user.name,
            universityName: university.name,
            activationToken: user.activation_token,
          });
        } else if (newRole === "advisor") {
          await ctx.scheduler.runAfter(0, api.email.sendUniversityAdvisorInvitationEmail, {
            email: user.email,
            name: user.name,
            universityName: university.name,
            activationToken: user.activation_token,
          });
        } else if (newRole === "student") {
          await ctx.scheduler.runAfter(0, api.email.sendUniversityStudentInvitationEmail, {
            email: user.email,
            name: user.name,
            universityName: university.name,
            activationToken: user.activation_token,
          });
        }
      } catch (emailError) {
        console.warn("Failed to schedule university invitation email:", emailError);
      }
    }

    return user._id;
  }
});

export const updateUniversitySettings = mutation({
  args: {
    universityId: v.id("universities"),
    settings: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      website: v.optional(v.string()),
      contact_email: v.optional(v.string()),
      max_students: v.optional(v.number()),
      license_seats: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const isAuthorized =
      currentUser.role === "super_admin" ||
      (currentUser.role === "university_admin" && currentUser.university_id === args.universityId);

    if (!isAuthorized) throw new Error("Unauthorized - University admin access required");

    await ctx.db.patch(args.universityId, {
      ...args.settings,
      updated_at: Date.now(),
    });

    return {
      success: true,
      message: 'University settings updated successfully',
    };
  }
});
