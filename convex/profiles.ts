import { query } from "./_generated/server";

/**
 * PROFILE DATA SOURCE DISCOVERY:
 *
 * Collection: "users" (lines 6-109 in convex/schema.ts)
 * - This is the SINGLE source of truth for all user profile data
 * - Profile page uses: api.users.getUserByClerkId (line 108 in app/(dashboard)/profile/page.tsx)
 *
 * Key fields from "users" table:
 * - name, email, location, linkedin_url, github_url, website
 * - current_position, job_title, company, skills (comma-separated string)
 * - work_history: array of { id, role, company, start_date, end_date, is_current, location, summary }
 * - education_history: array of { id, school, degree, field_of_study, start_year, end_year, is_current, description }
 * - dream_job, career_goals, experience_level, industry
 *
 * Owner keys tried in order:
 * 1. identity.tokenIdentifier (Convex auth standard)
 * 2. identity.subject (Clerk ID from JWT)
 * 3. clerkId from users table (indexed as "by_clerk_id")
 * 4. email (fallback, indexed as "by_email")
 *
 * Projects collection (separate table):
 * - Collection: "projects" (lines 171-188 in convex/schema.ts)
 * - Owner: user_id (Id<"users">), indexed as "by_user"
 * - Fields: title, role, start_date, end_date, company, url, github_url, description, type, technologies[]
 */

/**
 * Get the current user's profile snapshot for AI resume generation
 * Returns normalized profile shape with empty arrays as defaults
 * Tries multiple auth methods in order of preference
 */
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    // Auth check - get the authenticated user's identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized - No user identity found");
    }

    // Extract potential owner identifiers from identity
    const tokenIdentifier = identity.tokenIdentifier; // e.g., "https://clerk.example.com|user_xxx"
    const subject = identity.subject; // Clerk user ID from JWT (most common)
    const email = identity.email;

    // Try to find user by various owner keys in order of preference
    let user = null;

    // Method 1: Try by subject (Clerk ID) - most reliable
    if (subject) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", subject))
        .unique();
    }

    // Method 2: Try by tokenIdentifier if subject didn't work
    if (!user && tokenIdentifier) {
      // Check if tokenIdentifier ends with a clerk user ID pattern
      const clerkIdMatch = tokenIdentifier.match(/user_[A-Za-z0-9_-]+$/);
      if (clerkIdMatch) {
        const extractedClerkId = clerkIdMatch[0];
        user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", extractedClerkId))
          .unique();
      }
    }

    // Method 3: Fallback to email lookup
    if (!user && email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();
    }

    // If no user found, return null (not an error - user may not have profile yet)
    if (!user) {
      return null;
    }

    // Get user's projects from separate collection
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();

    // Sort projects by start_date (most recent first)
    projects.sort((a, b) => {
      const dateA = a.start_date ? a.start_date : 0;
      const dateB = b.start_date ? b.start_date : 0;
      return dateB - dateA;
    });

    // Parse comma-separated skills into array, ensuring we always return an array
    let primarySkills: string[] = [];
    let secondarySkills: string[] | undefined = undefined;

    if (user.skills && typeof user.skills === "string") {
      const skillsArray = user.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // If we have skills, all go to primary for now
      // (can be split into primary/secondary later based on some criteria)
      primarySkills = skillsArray;
    }

    // Build education array from both sources:
    // 1. education_history array (if it exists)
    // 2. Flat fields: major, university_name, graduation_year
    const education = [];

    // Add education_history entries if they exist
    if (user.education_history && user.education_history.length > 0) {
      for (const edu of user.education_history) {
        education.push({
          school: edu.school || "",
          degree: edu.degree || "",
          field: edu.field_of_study || undefined,
          location: undefined, // Not stored in education_history schema
          end: edu.is_current ? undefined : edu.end_year || undefined,
          details: edu.description ? [edu.description] : [],
        });
      }
    }

    // Add flat education fields if they exist (profile page uses these)
    if (user.major || user.university_name || user.graduation_year) {
      education.push({
        school: user.university_name || "",
        degree: user.major || "",
        field: undefined,
        location: undefined,
        end: user.graduation_year || undefined,
        details: [],
      });
    }

    // Helper to extract label from URL
    const getLabelFromUrl = (url: string): string => {
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '');
        // Extract domain name before TLD (e.g., "github.com" -> "GitHub")
        const parts = hostname.split('.');
        // Use second-to-last part for subdomains, otherwise first part
        const domainPart = parts.length > 2 ? parts[parts.length - 2] : parts[0];
        // Capitalize each word for hyphenated domains
        return domainPart.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      } catch {
        return 'Website';
      }
    };

    // Build links array in new {label, url} format
    const links = [];
    if (user.linkedin_url) {
      try {
        new URL(user.linkedin_url);
        links.push({ label: 'LinkedIn', url: user.linkedin_url });
      } catch {
        // Skip invalid URL
      }
    }
    if (user.github_url) {
      try {
        new URL(user.github_url);
        links.push({ label: 'GitHub', url: user.github_url });
      } catch {
        // Skip invalid URL
      }
    }
    if (user.website) {
      try {
        new URL(user.website);
        links.push({ label: getLabelFromUrl(user.website), url: user.website });
      } catch {
        // Skip invalid URL
      }
    }

    // Return normalized snapshot for AI generation
    return {
      fullName: user.name || "",
      title:
        user.current_position ||
        user.job_title ||
        user.dream_job ||
        undefined,
      contact: {
        email: user.email || undefined,
        phone: undefined, // Not stored in schema
        location: user.location || undefined,
        links: links,
      },
      // Map work_history to experience format with empty arrays as fallback
      experience:
        user.work_history && user.work_history.length > 0
          ? user.work_history.map((exp) => ({
              company: exp.company || "",
              role: exp.role || "",
              location: exp.location || undefined,
              start: exp.start_date || "",
              end: exp.is_current ? undefined : exp.end_date || undefined,
              bullets: exp.summary ? [exp.summary] : [],
            }))
          : [],
      // Education from both education_history array and flat fields
      education: education.length > 0 ? education : [],
      // Skills parsed from comma-separated string to array structure
      skills: {
        primary: primarySkills.length > 0 ? primarySkills : [],
        secondary: secondarySkills,
      },
      // Projects from separate collection, mapped to normalized format
      projects:
        projects.length > 0
          ? projects.map((proj) => ({
              name: proj.title || "",
              description: proj.description || undefined,
              bullets: proj.technologies.length > 0
                ? [
                    `Technologies: ${proj.technologies.join(", ")}`,
                    ...(proj.url ? [`URL: ${proj.url}`] : []),
                    ...(proj.github_url ? [`GitHub: ${proj.github_url}`] : []),
                  ]
                : [],
            }))
          : [],
    };
  },
});
