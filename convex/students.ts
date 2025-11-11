import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Helper function to require student role
 * Throws error if user is not a student with valid studentProfile
 */
export async function requireStudent(ctx: any, userId: any) {
  const user = await ctx.db.get(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user is a student
  const isStudent = user.role === "student" ||
                   (user.role === "user" && user.university_id);

  if (!isStudent) {
    throw new Error("Unauthorized: Student role required");
  }

  // Check if user has university_id
  if (!user.university_id) {
    throw new Error("Student must belong to a university");
  }

  // Check if studentProfile exists
  const studentProfile = await ctx.db
    .query("studentProfiles")
    .withIndex("by_user_id", (q) => q.eq("user_id", userId))
    .first();

  if (!studentProfile) {
    throw new Error("Student profile not found. Student must have a valid profile.");
  }

  return { user, studentProfile };
}

/**
 * Accept a student invite using a token
 *
 * This mutation:
 * 1. Validates the invite token (checks expiration, status)
 * 2. Updates user role to "student"
 * 3. Creates studentProfile linked to the university
 * 4. Updates invite status to "accepted"
 * 5. Links user to university via university_id
 *
 * Args:
 * - token: Unique invite token from email
 * - clerkId: Clerk user ID of the accepting user
 *
 * Returns: { success: true, universityName: string, studentProfileId: Id<"studentProfiles"> }
 */
export const acceptInvite = mutation({
  args: {
    token: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Find the invite by token
    const invite = await ctx.db
      .query("studentInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      throw new Error("Invalid invite token");
    }

    // 2. Validate invite status
    if (invite.status !== "pending") {
      throw new Error(`Invite is ${invite.status}. Only pending invites can be accepted.`);
    }

    // 3. Check if invite has expired
    if (invite.expires_at < now) {
      // Auto-expire the invite
      await ctx.db.patch(invite._id, {
        status: "expired",
        updated_at: now,
      });
      throw new Error("Invite has expired");
    }

    // 4. Get the accepting user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // 5. Verify email matches (optional security check)
    if (user.email !== invite.email) {
      throw new Error("Email mismatch. This invite was sent to a different email address.");
    }

    // 6. Get university details
    const university = await ctx.db.get(invite.university_id);
    if (!university) {
      throw new Error("University not found");
    }

    // 7. Check if user already has a student profile (race condition check)
    const existingProfile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .first();

    if (existingProfile) {
      throw new Error("User already has a student profile");
    }

    // 8. Update user: set role to "student", link to university, set subscription
    await ctx.db.patch(user._id, {
      role: "student",
      university_id: invite.university_id,
      subscription_plan: "university",
      subscription_status: "active",
      updated_at: now,
    });

    // 9. Create student profile with defensive race condition handling
    // Re-check for existing profile immediately before insert to minimize race window
    const raceCheckProfile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .first();

    let studentProfileId;

    if (raceCheckProfile) {
      // Profile was created by concurrent request - this is OK, use existing
      console.warn(`Race condition detected: studentProfile already exists for user ${user.email}`);
      studentProfileId = raceCheckProfile._id;
    } else {
      // Safe to create profile
      try {
        const metadata = invite.metadata || {};
        studentProfileId = await ctx.db.insert("studentProfiles", {
          user_id: user._id,
          university_id: invite.university_id,
          student_id: metadata.student_id,
          major: metadata.major,
          year: metadata.year,
          enrollment_date: now,
          status: "active",
          created_at: now,
          updated_at: now,
        });
      } catch (error) {
        // If insert fails due to concurrent creation, fetch the existing profile
        const fallbackProfile = await ctx.db
          .query("studentProfiles")
          .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
          .first();

        if (fallbackProfile) {
          console.warn(`Insert failed but profile exists - likely race condition for user ${user.email}`);
          studentProfileId = fallbackProfile._id;
        } else {
          // Genuine error - re-throw
          throw error;
        }
      }
    }

    // 10. Mark invite as accepted
    await ctx.db.patch(invite._id, {
      status: "accepted",
      accepted_at: now,
      accepted_by_user_id: user._id,
      updated_at: now,
    });

    // 11. Increment university license usage
    await ctx.db.patch(university._id, {
      license_used: (university.license_used || 0) + 1,
      updated_at: now,
    });

    return {
      success: true,
      universityName: university.name,
      studentProfileId,
    };
  },
});

/**
 * Get student profile for current user
 */
export const getStudentProfile = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return null;
    }

    // Get student profile
    const studentProfile = await ctx.db
      .query("studentProfiles")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .first();

    if (!studentProfile) {
      return null;
    }

    // Get university
    const university = await ctx.db.get(studentProfile.university_id);

    return {
      ...studentProfile,
      university: university ? {
        name: university.name,
        slug: university.slug,
      } : null,
    };
  },
});

/**
 * Validate an invite token without accepting it
 * Useful for showing invite details before acceptance
 */
export const validateInviteToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const invite = await ctx.db
      .query("studentInvites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) {
      return { valid: false, reason: "Invalid token" };
    }

    if (invite.status !== "pending") {
      return { valid: false, reason: `Invite is ${invite.status}` };
    }

    if (invite.expires_at < now) {
      return { valid: false, reason: "Invite has expired" };
    }

    // Get university
    const university = await ctx.db.get(invite.university_id);

    return {
      valid: true,
      email: invite.email,
      universityName: university?.name || "Unknown University",
      expiresAt: invite.expires_at,
    };
  },
});

/**
 * Check for duplicate student profiles (for monitoring/debugging)
 * Returns users with multiple studentProfile records
 *
 * NOTE: Due to Convex's lack of unique constraints, duplicates are theoretically
 * possible via race conditions. This query helps detect and clean them up.
 */
export const findDuplicateProfiles = query({
  args: {},
  handler: async (ctx) => {
    // Get all student profiles
    const allProfiles = await ctx.db.query("studentProfiles").collect();

    // Group by user_id
    const profilesByUser = new Map<string, typeof allProfiles>();

    for (const profile of allProfiles) {
      const userId = profile.user_id.toString();
      if (!profilesByUser.has(userId)) {
        profilesByUser.set(userId, []);
      }
      profilesByUser.get(userId)!.push(profile);
    }

    // Find users with multiple profiles
    const duplicates = [];
    for (const [userIdStr, profiles] of profilesByUser.entries()) {
      if (profiles.length > 1) {
        // Get the actual user document
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("_id"), profiles[0].user_id))
          .first();

        duplicates.push({
          userId: userIdStr,
          email: user?.email || "unknown",
          name: user?.name || "unknown",
          profileCount: profiles.length,
          profiles: profiles.map((p) => ({
            id: p._id,
            universityId: p.university_id,
            createdAt: p.created_at,
          })),
        });
      }
    }

    return {
      duplicatesFound: duplicates.length > 0,
      count: duplicates.length,
      duplicates,
    };
  },
});
