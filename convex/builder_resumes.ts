import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * Type Safety Note:
 * This file contains several `as any` casts due to Convex framework limitations:
 *
 * 1. Table names in queries/inserts: Convex's type system doesn't properly infer
 *    table names in some contexts, requiring casts like `"builder_resumes" as any`
 *
 * 2. Index names: Custom indexes defined in schema.ts aren't fully type-checked
 *    at compile time, requiring `as any` for index names like `"by_user"`
 *
 * 3. Query builders: The `q` parameter in withIndex callbacks lacks proper typing
 *    in the current Convex version
 *
 * These casts are intentional workarounds for framework constraints and don't
 * compromise runtime safety as Convex validates all operations at runtime.
 *
 * TODO: Remove these casts when Convex improves type inference in future versions.
 */

type ResumeInsertArgs = {
  title: string;
  templateSlug: string;
  themeId?: Id<"builder_resume_themes">;
};

/**
 * Helper to validate HTTP/HTTPS URLs
 */
function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

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
function getLabelFromUrl(url: string): string {
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
}

/**
 * Build validated links array from user profile
 */
function buildValidLinks(user: any): Array<{ label: string; url: string }> {
  return [
    user.linkedin_url && { label: 'LinkedIn', url: user.linkedin_url },
    user.github_url && { label: 'GitHub', url: user.github_url },
    user.website && { label: getLabelFromUrl(user.website), url: user.website },
  ]
    .filter((link): link is { label: string; url: string } =>
      typeof link === 'object' && link !== null && isValidHttpUrl(link.url)
    );
}

/**
 * Build education items from user profile
 */
function buildEducationItems(user: any): Array<{
  school: string;
  degree?: string;
  field?: string;
  end?: string;
  details: string[];
}> {
  const education = [];

  // Add structured education history
  if (user.education_history && user.education_history.length > 0) {
    for (const edu of user.education_history) {
      // Skip entries without required school field
      if (!edu.school) continue;

      education.push({
        school: edu.school,
        degree: edu.degree || undefined,
        field: edu.field_of_study || undefined,
        end: edu.is_current ? undefined : edu.end_year || undefined,
        details: edu.description ? [edu.description] : [],
      });
    }
  }

  // Add flat education fields if they exist
  // Only create entry if university_name is present (required field)
  if (user.university_name) {
    education.push({
      school: user.university_name,
      degree: user.major || undefined,
      field: undefined,
      end: user.graduation_year || undefined,
      details: [],
    });
  }

  return education;
}

/**
 * Build experience items from user work history
 * Filters out entries missing required company or role fields
 */
function buildExperienceItems(workHistory: any[]): Array<{
  company: string;
  role: string;
  location?: string;
  start?: string;
  end?: string;
  bullets: string[];
}> {
  return workHistory
    .filter((exp: any) => exp.company && exp.role) // Skip entries without required fields
    .map((exp: any) => ({
      company: exp.company,
      role: exp.role,
      location: exp.location || undefined,
      start: exp.start_date || undefined,
      end: exp.is_current ? undefined : exp.end_date || undefined,
      bullets: exp.summary ? [exp.summary] : [],
    }));
}

/**
 * Build project items from user projects
 * Filters out entries missing required name field
 *
 * NOTE: Hardcoded labels ("Technologies:", "URL:", "GitHub:") are in English.
 * For internationalization (i18n) support, consider:
 * - Externalizing strings to i18n files (e.g., en.json, es.json)
 * - Using a translation function: t('project.technologies')
 * - Passing locale context to this function
 *
 * Example with i18n:
 * ```typescript
 * import { t } from '@/lib/i18n';
 * bullets: [
 *   ...(proj.technologies ? [`${t('project.technologies')}: ${proj.technologies.join(", ")}`] : []),
 *   ...(proj.url ? [`${t('project.url')}: ${proj.url}`] : []),
 * ]
 * ```
 */
function buildProjectItems(projects: any[]): Array<{
  name: string;
  description: string;
  bullets: string[];
}> {
  return projects
    .filter((proj) => proj.title) // Skip entries without required name field
    .map((proj) => ({
      name: proj.title,
      description: proj.description || "",
      bullets: [
        // TODO(i18n): Externalize these label strings when adding internationalization
        ...(Array.isArray(proj.technologies) && proj.technologies.length > 0
          ? [`Technologies: ${proj.technologies.join(", ")}`]
          : []),
        ...(proj.url ? [`URL: ${proj.url}`] : []),
        ...(proj.github_url ? [`GitHub: ${proj.github_url}`] : []),
      ],
    }));
}

async function getUserByClerkIdOrThrow(ctx: any, clerkId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Verify resume ownership and return both user and resume
 *
 * This helper consolidates the common authentication and authorization pattern
 * used across multiple resume mutations (updateResumeMeta, deleteResume,
 * updateThumbnail, getThumbnailUrl).
 *
 * @param ctx - Convex mutation/query context
 * @param resumeId - ID of the resume to verify ownership for
 * @returns Object containing the authenticated user and the resume
 * @throws "Unauthorized" if not authenticated
 * @throws "User not found" if user doesn't exist in database
 * @throws "Resume not found" if resume doesn't exist
 * @throws "Forbidden" if user doesn't own the resume
 *
 * @example
 * const { user, resume } = await verifyResumeOwnership(ctx, args.resumeId);
 * // Now safe to modify resume...
 */
async function verifyResumeOwnership(ctx: any, resumeId: Id<"builder_resumes">) {
  // Step 1: Check authentication
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }

  // Step 2: Get user from database
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  // Step 3: Get resume from database
  const resume = await ctx.db.get(resumeId) as any;
  if (!resume) {
    throw new Error("Resume not found");
  }

  // Step 4: Verify ownership
  if (resume.userId !== user._id) {
    throw new Error("Forbidden");
  }

  return { user, resume };
}

/**
 * Verify resume ownership using explicit clerkId parameter
 *
 * Similar to verifyResumeOwnership but accepts clerkId as a parameter
 * instead of using ctx.auth. Useful for queries and operations where
 * authentication is handled via explicit clerkId parameter.
 *
 * @param ctx - Convex query/mutation context
 * @param clerkId - Clerk user ID
 * @param resumeId - ID of the resume to verify ownership for
 * @returns Object containing the user and the resume
 * @throws "User not found" if user doesn't exist in database
 * @throws "Resume not found" if resume doesn't exist
 * @throws "Forbidden" if user doesn't own the resume
 *
 * @example
 * const { user, resume } = await verifyResumeOwnershipByClerkId(ctx, args.clerkId, args.id);
 * // Now safe to access resume...
 */
async function verifyResumeOwnershipByClerkId(
  ctx: any,
  clerkId: string,
  resumeId: Id<"builder_resumes">
) {
  // Step 1: Get user from database
  const user = await getUserByClerkIdOrThrow(ctx, clerkId);

  // Step 2: Get resume from database
  const resume = await ctx.db.get(resumeId) as any;
  if (!resume) {
    throw new Error("Resume not found");
  }

  // Step 3: Verify ownership
  if (resume.userId !== user._id) {
    throw new Error("Forbidden");
  }

  return { user, resume };
}

async function insertResumeRecord(
  ctx: any,
  userId: Id<"users">,
  args: ResumeInsertArgs,
) {
  const now = Date.now();
  const id = await ctx.db.insert("builder_resumes" as any, {
    userId,
    title: args.title,
    templateSlug: args.templateSlug,
    themeId: args.themeId,
    version: 1,
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    title: args.title,
    templateSlug: args.templateSlug,
    themeId: args.themeId,
  };
}

/**
 * Create a new resume for the authenticated user.
 * @returns { id: Id<"builder_resumes">, title: string, templateSlug: string, themeId?: Id<"builder_resume_themes"> }
 */
export const createResume = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    templateSlug: v.string(),
    themeId: v.optional(v.id("builder_resume_themes")),
  },
  handler: async (ctx, args) => {
    const user = await getUserByClerkIdOrThrow(ctx, args.clerkId);
    return insertResumeRecord(ctx, user._id, {
      title: args.title,
      templateSlug: args.templateSlug,
      themeId: args.themeId,
    });
  },
});

/**
 * List all resumes for the authenticated user.
 * @returns Array of resume objects
 */
export const listUserResumes = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return [];

    const resumes = await ctx.db
      .query("builder_resumes" as any)
      .withIndex("by_user" as any, (q: any) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return resumes;
  },
});

/**
 * Get a resume and its blocks for the authenticated user.
 * @returns { resume: object, blocks: Array }
 */
export const getResume = query({
  args: {
    id: v.id("builder_resumes"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify authentication and ownership using consolidated helper
    const { resume } = await verifyResumeOwnershipByClerkId(ctx, args.clerkId, args.id);

    const blocks = await ctx.db
      .query("resume_blocks")
      .withIndex("by_resume", (q: any) => q.eq("resumeId", resume._id))
      .collect();

    // Sort blocks by order ascending
    blocks.sort((a: any, b: any) => a.order - b.order);

    return {
      resume,
      blocks,
    };
  },
});

/**
 * Update resume metadata with optimistic concurrency control.
 * @returns { id: Id<"builder_resumes">, updatedAt: number }
 */
export const updateResumeMeta = mutation({
  args: {
    id: v.id("builder_resumes"),
    title: v.optional(v.string()),
    templateSlug: v.optional(v.string()),
    themeId: v.optional(v.id("builder_resume_themes")),
    expectedUpdatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify authentication and ownership
    const { resume } = await verifyResumeOwnership(ctx, args.id);

    // Optimistic concurrency check
    if (resume.updatedAt !== args.expectedUpdatedAt) {
      throw new Error("Conflict: resume was updated by another process");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updates.title = args.title;
    if (args.templateSlug !== undefined) updates.templateSlug = args.templateSlug;
    if (args.themeId !== undefined) updates.themeId = args.themeId;

    await ctx.db.patch(args.id as any, updates);

    return {
      id: args.id,
      updatedAt: updates.updatedAt,
    };
  },
});

/**
 * Create a new resume with auto-populated blocks from user profile.
 * @returns { id: Id<"builder_resumes">, title: string, templateSlug: string, themeId?: Id<"builder_resume_themes">, blocksCreated: number, autoPopulateError: boolean }
 */
export const createResumeWithBlocks = mutation({
  args: {
    clerkId: v.string(),
    title: v.string(),
    templateSlug: v.string(),
    themeId: v.optional(v.id("builder_resume_themes")),
    autoPopulate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getUserByClerkIdOrThrow(ctx, args.clerkId);

    // 1. Create the resume
    const resume = await insertResumeRecord(ctx, user._id, {
      title: args.title,
      templateSlug: args.templateSlug,
      themeId: args.themeId,
    });
    const resumeId = resume.id;

    let blocksCreated = 0;
    let autoPopulateError = false;

    // 2. If autoPopulate is true, fetch profile and create blocks
    if (args.autoPopulate) {
      try {
        // Fetch user's profile data (using same logic as profiles.getMyProfile)
        // Get projects from separate collection
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

        // Parse skills from comma-separated string
        let primarySkills: string[] = [];
        if (user.skills && typeof user.skills === "string") {
          primarySkills = user.skills
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
        }

        // Build data using helper functions
        const education = buildEducationItems(user);
        const validLinks = buildValidLinks(user);

        // Create blocks based on available data
        let order = 0;

        // 1. Header block (always create if we have a name)
        if (user.name) {
          await ctx.db.insert("resume_blocks", {
            resumeId: resumeId as any,
            type: "header",
            data: {
              fullName: user.name,
              title: user.current_position || user.job_title || user.dream_job || undefined,
              contact: {
                email: user.email || undefined,
                phone: undefined,
                location: user.location || undefined,
                links: validLinks,
              },
            },
            order: order++,
            locked: false,
          });
          blocksCreated++;
        }

        // 2. Summary block (if bio exists)
        if (user.bio && user.bio.trim().length > 0) {
          await ctx.db.insert("resume_blocks", {
            resumeId: resumeId as any,
            type: "summary",
            data: {
              paragraph: user.bio.trim(),
            },
            order: order++,
            locked: false,
          });
          blocksCreated++;
        }

        // 3. Experience block (if work history exists)
        if (user.work_history && user.work_history.length > 0) {
          const experienceItems = buildExperienceItems(user.work_history);

          await ctx.db.insert("resume_blocks", {
            resumeId: resumeId as any,
            type: "experience",
            data: { items: experienceItems },
            order: order++,
            locked: false,
          });
          blocksCreated++;
        }

        // 4. Skills block (always include)
        await ctx.db.insert("resume_blocks", {
          resumeId: resumeId as any,
          type: "skills",
          data: {
            primary: primarySkills.length > 0 ? primarySkills : [],
            secondary: [],
          },
          order: order++,
          locked: false,
        });
        blocksCreated++;

        // 5. Education block (if items exist)
        if (education.length > 0) {
          await ctx.db.insert("resume_blocks", {
            resumeId: resumeId as any,
            type: "education",
            data: { items: education },
            order: order++,
            locked: false,
          });
          blocksCreated++;
        }

        // 6. Projects block (if items exist)
        if (projects.length > 0) {
          const projectItems = buildProjectItems(projects);

          await ctx.db.insert("resume_blocks", {
            resumeId: resumeId as any,
            type: "projects",
            data: { items: projectItems },
            order: order++,
            locked: false,
          });
          blocksCreated++;
        }
      } catch (error) {
        console.error("Error auto-populating resume:", error);
        autoPopulateError = true;
        // Don't fail the whole operation if auto-populate fails; resume still created
      }
    }

    return {
      id: resumeId,
      title: resume.title,
      templateSlug: resume.templateSlug,
      themeId: resume.themeId,
      blocksCreated,
      autoPopulateError,
    };
  },
});

/**
 * Delete a resume and all its blocks.
 * @returns { id: Id<"builder_resumes"> }
 */
export const deleteResume = mutation({
  args: {
    id: v.id("builder_resumes"),
  },
  handler: async (ctx, args) => {
    // Verify authentication and ownership
    await verifyResumeOwnership(ctx, args.id);

    // Delete all blocks for this resume
    const blocks = await ctx.db
      .query("resume_blocks")
      .withIndex("by_resume", (q: any) => q.eq("resumeId", args.id))
      .collect();

    for (const block of blocks) {
      await ctx.db.delete(block._id);
    }

    // Delete the resume
    await ctx.db.delete(args.id as any);

    return { id: args.id };
  },
});

/**
 * Duplicate an existing resume and all of its blocks.
 * @returns { id: Id<"builder_resumes">, title: string, templateSlug: string, blocksCopied: number }
 */
export const duplicateResume = mutation({
  args: {
    clerkId: v.string(),
    resumeId: v.id("builder_resumes"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify authentication and ownership using consolidated helper
    const { user, resume: original } = await verifyResumeOwnershipByClerkId(
      ctx,
      args.clerkId,
      args.resumeId
    );

    const now = Date.now();
    const title = args.title?.trim()?.length
      ? args.title.trim()
      : `${original.title ?? "Untitled resume"} Copy`;

    const newResumeId = await ctx.db.insert("builder_resumes" as any, {
      userId: user._id,
      title,
      templateSlug: original.templateSlug,
      themeId: original.themeId,
      version: 1,
      thumbnailDataUrl: original.thumbnailDataUrl,
      thumbnailStorageId: original.thumbnailStorageId,
      createdAt: now,
      updatedAt: now,
    });

    const blocks = await ctx.db
      .query("resume_blocks")
      .withIndex("by_resume", (q: any) => q.eq("resumeId", args.resumeId))
      .collect();

    // Copy all blocks - Convex mutations are atomic, so any error will
    // automatically roll back ALL writes including the new resume insertion
    try {
      for (const block of blocks) {
        await ctx.db.insert("resume_blocks", {
          resumeId: newResumeId,
          type: block.type,
          data: block.data,
          order: block.order,
          locked: block.locked,
        });
      }
    } catch (error) {
      // Convex automatically rolls back all database writes on error,
      // including the resume created on line 520. No manual cleanup needed.
      throw new Error(`Failed to duplicate resume blocks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      id: newResumeId,
      title,
      templateSlug: original.templateSlug,
      blocksCopied: blocks.length,
    };
  },
});

/**
 * Update resume thumbnail (called by thumbnail generator hook)
 * @returns { success: boolean }
 */
export const updateThumbnail = mutation({
  args: {
    resumeId: v.id("builder_resumes"),
    thumbnailDataUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify authentication and ownership
    await verifyResumeOwnership(ctx, args.resumeId);

    // Update thumbnail
    const updatedAt = Date.now();
    await ctx.db.patch(args.resumeId, {
      thumbnailDataUrl: args.thumbnailDataUrl,
      updatedAt,
    });

    return { success: true, updatedAt };
  },
});

/**
 * Get thumbnail URL for a resume with access control.
 * Supports both storage-based thumbnails and legacy base64 data URLs.
 * @returns { url: string | null }
 */
export const getThumbnailUrl = query({
  args: {
    resumeId: v.id("builder_resumes"),
  },
  handler: async (ctx, args) => {
    // Verify authentication and ownership
    // TODO: Add support for publicly shared resumes or resumes shared with specific users
    // For now, only the owner can access thumbnails
    const { resume } = await verifyResumeOwnership(ctx, args.resumeId);

    // Priority 1: Storage-based thumbnail (new system)
    if (resume.thumbnailStorageId) {
      try {
        const url = await ctx.storage.getUrl(resume.thumbnailStorageId);

        // getUrl can return null if the storage ID is invalid or file was deleted
        if (url) {
          return { url };
        }

        // Storage ID exists but file is missing - log for monitoring
        console.warn(
          `[getThumbnailUrl] Storage file not found for resume ${args.resumeId}, ` +
          `storageId: ${resume.thumbnailStorageId}. Falling back to base64.`
        );
        // Fall through to base64 fallback
      } catch (error) {
        // Storage retrieval failed - could be permission issues, dangling ID, or service outage
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
          `[getThumbnailUrl] Failed to retrieve storage URL for resume ${args.resumeId}: ${errorMessage}. ` +
          `Falling back to base64.`
        );
        // Fall through to base64 fallback instead of failing the entire query
      }
    }

    // Priority 2: Base64 data URL (legacy system)
    // Also serves as fallback if storage retrieval fails
    if (resume.thumbnailDataUrl) {
      return { url: resume.thumbnailDataUrl };
    }

    // No thumbnail available in either format
    return { url: null };
  },
});
