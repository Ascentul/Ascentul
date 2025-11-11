import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get current viewer (authenticated user) with student context
 *
 * Returns viewer info including:
 * - role: user's role (individual, student, admin, etc.)
 * - student: { universityName } if user is a student, null otherwise
 *
 * Usage in React components:
 * const viewer = useQuery(api.viewer.getViewer, { clerkId: user.id })
 */
export const getViewer = query({
  args: {
    clerkId: v.string()
  },
  handler: async (ctx, args) => {
    // Get user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return null;
    }

    // Check if user is a student (role === "student" or legacy "user" with university)
    const isStudent = user.role === "student" ||
                     (user.role === "user" && user.university_id);

    let studentContext = null;

    if (isStudent && user.university_id) {
      // Get student profile (if exists)
      const studentProfile = await ctx.db
        .query("studentProfiles")
        .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
        .first();

      // Get university details
      const university = await ctx.db.get(user.university_id);

      if (university) {
        studentContext = {
          universityName: university.name,
          universityId: university._id,
          studentProfile: studentProfile ? {
            major: studentProfile.major,
            year: studentProfile.year,
            status: studentProfile.status,
          } : null,
        };
      }
    }

    return {
      role: user.role,
      userId: user._id,
      clerkId: user.clerkId,
      name: user.name,
      email: user.email,
      student: studentContext,
    };
  },
});
