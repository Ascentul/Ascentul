import { v } from 'convex/values';

import { query } from './_generated/server';

/**
 * Get current viewer (authenticated user) with student context
 *
 * Returns viewer info including:
 * - role: user's role (individual, student, admin, etc.)
 * - student: { universityName } if user is a student, null otherwise
 *
 * RESILIENCE STRATEGY:
 * - Uses .first() instead of .unique() for clerkId lookup
 * - This prioritizes availability over strictness
 * - If duplicate clerkId entries exist (data corruption), app continues working
 * - Trade-off: Masks data integrity issues, but prevents user-facing failures
 * - Duplicate detection available via admin tools
 *
 * Usage in React components:
 * const viewer = useQuery(api.viewer.getViewer)
 */
export const getViewer = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify authenticated user is available from auth context
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.warn('viewer:getViewer called without auth identity', {
        timestamp: new Date().toISOString(),
        clerkIdArg: args.clerkId,
      });
      return null;
    }

    const clerkId = identity.subject;

    if (args.clerkId && args.clerkId !== clerkId) {
      console.warn('viewer:getViewer incoming clerkId mismatch ignored', {
        timestamp: new Date().toISOString(),
      });
    }

    // Get user by Clerk ID
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
      .first();

    // RESILIENCE: Using .first() instead of .unique() allows the app to continue working
    // even if duplicate clerkId entries ever exist. In that case, the first matching
    // record will be used. If you suspect duplicates, run:
    //   npx convex run users:findDuplicateClerkIds
    // to inspect and clean up data integrity issues.

    if (!user) {
      return null;
    }

    // Check if user is a student (role === "student" or legacy "user" with university)
    const isStudent = user.role === 'student' || (user.role === 'user' && user.university_id);

    // Check if user is university-affiliated (student, advisor, or university_admin)
    const isUniversityAffiliated =
      ['student', 'advisor', 'university_admin'].includes(user.role) ||
      (user.role === 'user' && user.university_id);

    let studentContext = null;
    let universityContext = null;

    // Get university context for all university-affiliated users
    if (isUniversityAffiliated && user.university_id) {
      const university = await ctx.db.get(user.university_id);

      if (university) {
        universityContext = {
          universityName: university.name,
          universityId: university._id,
          universityLogo: university.logo_url || null,
        };
      }
    }

    if (isStudent && user.university_id) {
      // Get student profile (if exists)
      // Order by created_at ascending to always get the oldest profile if duplicates exist
      const studentProfile = await ctx.db
        .query('studentProfiles')
        .withIndex('by_user_id', (q) => q.eq('user_id', user._id))
        .order('asc')
        .first();

      // Get university details
      const university = await ctx.db.get(user.university_id);

      if (university) {
        studentContext = {
          universityName: university.name,
          universityId: university._id,
          universityLogo: university.logo_url || null,
          studentProfile: studentProfile
            ? {
                major: studentProfile.major,
                year: studentProfile.year,
                status: studentProfile.status,
              }
            : null,
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
      university: universityContext,
    };
  },
});
