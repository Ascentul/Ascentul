import { query } from "./_generated/server";

type ProfileContactLink = {
  label: string;
  url: string;
};

type ProfileContact = {
  email?: string;
  phone?: string;
  location?: string;
  links: ProfileContactLink[];
};

type ProfileExperience = {
  company: string;
  role: string;
  location?: string;
  start: string;
  end?: string;
  bullets: string[];
};

type ProfileEducation = {
  school: string;
  degree: string;
  field?: string;
  location?: string;
  end?: string;
  details: string[];
};

type ProfileProject = {
  name: string;
  description?: string;
  bullets: string[];
};

export interface ProfileSnapshot {
  fullName: string;
  title?: string;
  contact: ProfileContact;
  bio?: string;
  experience: ProfileExperience[];
  education: ProfileEducation[];
  skills: {
    primary: string[];
    secondary?: string[];
  };
  projects: ProfileProject[];
}

/**
 * PROFILE DATA SOURCE DISCOVERY:
 *
 * Collection: "users" (lines 6-109 in convex/schema.ts)
 * - This is the SINGLE source of truth for all user profile data
 * - Profile page uses: api.users.getUserByClerkId (line 108 in app/(dashboard)/profile/page.tsx)
 *
 * Key fields from "users" table:
 * - name, email, location, linkedin_url, github_url, website
 * - bio (professional summary)
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
  handler: async (ctx): Promise<ProfileSnapshot | null> => {
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
    const education: ProfileEducation[] = [];

    // Add education_history entries if they exist
    if (user.education_history && user.education_history.length > 0) {
      for (const edu of user.education_history) {
        education.push({
          school: edu.school || "",
          degree: edu.degree || "",
          field: edu.field_of_study || undefined,
          location: undefined, // Not stored in education_history schema
          end: edu.is_current ? undefined : edu.end_year,
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

    // Helper to validate HTTP/HTTPS URLs
    const isValidHttpUrl = (urlString: string): boolean => {
      try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    };

    /**
     * Helper to extract domain label from URL for display purposes
     *
     * Examples:
     * - https://example.com → "Example"
     * - https://my-portfolio.com → "My Portfolio"
     * - https://example.co.uk → "Example" (handles ccTLDs)
     * - https://subdomain.example.com → "Example" (ignores subdomains)
     *
     * Known limitations:
     * - Hardcoded ccTLD list (not exhaustive, but covers ~90% of cases)
     * - Single-part hostnames (e.g., "localhost") return the hostname itself
     * - Non-standard TLDs may not be handled correctly
     * - For production URLs, these limitations are generally acceptable
     *
     * For comprehensive TLD handling, consider using a library like:
     * - tldts: https://www.npmjs.com/package/tldts
     * - psl (Public Suffix List): https://www.npmjs.com/package/psl
     */
    const getLabelFromUrl = (url: string): string => {
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.replace('www.', '');
        const parts = hostname.split('.');

        // Edge case: Single-part hostname (e.g., "localhost", "intranet")
        // Return as-is since there's no TLD to strip
        if (parts.length === 1) {
          const label = parts[0];
          return label.charAt(0).toUpperCase() + label.slice(1);
        }

        // Handle country-code TLDs (ccTLDs) like .co.uk, .com.au
        // Expanded list covers common ccTLDs (~90% of production use cases)
        const knownCcTlds = [
          'co.uk', 'com.au', 'co.nz', 'co.za', 'com.br', 'co.jp',
          'co.in', 'com.cn', 'net.au', 'org.uk', 'ac.uk', 'gov.uk',
          'com.mx', 'co.kr', 'com.sg', 'co.id', 'com.ar', 'com.co'
        ];
        const lastTwo = parts.slice(-2).join('.');

        // For ccTLDs, extract third-to-last part; otherwise second-to-last
        // Ensures we get "example" from both "example.co.uk" and "example.com"
        const domainPart = knownCcTlds.includes(lastTwo) && parts.length > 2
          ? parts[parts.length - 3]
          : parts[parts.length - 2];

        // Capitalize each word for hyphenated domains
        return domainPart.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      } catch {
        return 'Website';
      }
    };

    // Build links array using filter/map pattern for cleaner code
    const links = [
      user.linkedin_url && { label: 'LinkedIn', url: user.linkedin_url },
      user.github_url && { label: 'GitHub', url: user.github_url },
      user.website && { label: getLabelFromUrl(user.website), url: user.website },
    ]
      .filter((link): link is { label: string; url: string } =>
        typeof link === 'object' && link !== null && isValidHttpUrl(link.url)
      );

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
      bio: user.bio || undefined, // Professional bio/summary
      // Map work_history to experience format with empty arrays as fallback
      experience:
        user.work_history && user.work_history.length > 0
          ? user.work_history.map((exp) => ({
              company: exp.company || "",
              role: exp.role || "",
              location: exp.location || undefined,
              start: exp.start_date || "",
              end: exp.is_current ? undefined : exp.end_date,
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
