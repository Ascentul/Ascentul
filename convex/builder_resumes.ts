import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    const id = await ctx.db.insert("builder_resumes" as any, {
      userId: user._id,
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
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const resume = await ctx.db.get(args.id) as any;
    if (!resume) {
      throw new Error("Not found");
    }
    if (resume.userId !== user._id) {
      throw new Error("Forbidden");
    }

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
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Unauthorized");
    }
    const userId = user.tokenIdentifier;

    const resume = await ctx.db.get(args.id) as any;
    if (!resume) {
      throw new Error("Not found");
    }
    if (resume.userId !== userId) {
      throw new Error("Forbidden");
    }

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
 * @returns { id: Id<"builder_resumes">, title: string, blocksCreated: number }
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
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();

    // 1. Create the resume
    const resumeId = await ctx.db.insert("builder_resumes" as any, {
      userId: user._id,
      title: args.title,
      templateSlug: args.templateSlug,
      themeId: args.themeId,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    let blocksCreated = 0;

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

        // Build education array
        const education = [];
        if (user.education_history && user.education_history.length > 0) {
          for (const edu of user.education_history) {
            education.push({
              school: edu.school || "",
              degree: edu.degree || "",
              field: edu.field_of_study || undefined,
              end: edu.is_current ? undefined : edu.end_year || undefined,
              details: edu.description ? [edu.description] : [],
            });
          }
        }
        // Add flat education fields if they exist
        if (user.major || user.university_name || user.graduation_year) {
          education.push({
            school: user.university_name || "",
            degree: user.major || "",
            field: undefined,
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

        // Helper to get label from URL
        const getLabelFromUrl = (url: string): string => {
          try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.replace('www.', '');
            const parts = hostname.split('.');
            // Extract the primary domain name, handling multi-part domains
            // For subdomains like 'blog.example.com', get 'example' (second-to-last part)
            // For simple domains like 'example.com', get 'example' (first part)
            const domainPart = parts.length > 2 ? parts[parts.length - 2] : parts[0];
            return domainPart.split('-').map(word =>
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
          } catch {
            return 'Website';
          }
        };

        // Build validated links array
        const validLinks = [
          user.linkedin_url && { label: 'LinkedIn', url: user.linkedin_url },
          user.github_url && { label: 'GitHub', url: user.github_url },
          user.website && { label: getLabelFromUrl(user.website), url: user.website },
        ]
          .filter((link): link is { label: string; url: string } =>
            typeof link === 'object' && link !== null && isValidHttpUrl(link.url)
          );

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
          const experienceItems = user.work_history.map((exp: any) => ({
            company: exp.company || "Company Name",
            role: exp.role || "Job Title",
            location: exp.location || undefined,
            start: exp.start_date || undefined,
            end: exp.is_current ? undefined : exp.end_date || undefined,
            bullets: exp.summary ? [exp.summary] : [],
          }));

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
          const educationItems = education.map((edu) => ({
            school: edu.school || "School Name",
            degree: edu.degree || undefined,
            end: edu.end || undefined,
            details: edu.details || [],
          }));

          await ctx.db.insert("resume_blocks", {
            resumeId: resumeId as any,
            type: "education",
            data: { items: educationItems },
            order: order++,
            locked: false,
          });
          blocksCreated++;
        }

        // 6. Projects block (if items exist)
        if (projects.length > 0) {
          const projectItems = projects.map((proj) => ({
            name: proj.title || "Project Name",
            description: proj.description || "",
            bullets: proj.technologies && proj.technologies.length > 0
              ? [
                  `Technologies: ${proj.technologies.join(", ")}`,
                  ...(proj.url ? [`URL: ${proj.url}`] : []),
                  ...(proj.github_url ? [`GitHub: ${proj.github_url}`] : []),
                ]
              : [],
          }));

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
        // Don't fail the whole operation if auto-populate fails
        // The resume was still created, just without blocks
      }
    }

    return {
      id: resumeId,
      title: args.title,
      templateSlug: args.templateSlug,
      themeId: args.themeId,
      blocksCreated,
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
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Unauthorized");
    }
    const userId = user.tokenIdentifier;

    const resume = await ctx.db.get(args.id) as any;
    if (!resume) {
      throw new Error("Not found");
    }
    if (resume.userId !== userId) {
      throw new Error("Forbidden");
    }

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
 * Update resume thumbnail (called by thumbnail generator hook)
 * @returns { success: boolean }
 */
export const updateThumbnail = mutation({
  args: {
    resumeId: v.id("builder_resumes"),
    thumbnailDataUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Verify resume exists
    const resume = await ctx.db.get(args.resumeId);
    if (!resume) {
      throw new Error("Resume not found");
    }

    // Update thumbnail
    await ctx.db.patch(args.resumeId, {
      thumbnailDataUrl: args.thumbnailDataUrl,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
