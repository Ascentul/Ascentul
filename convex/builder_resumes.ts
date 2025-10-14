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

        // Create blocks based on available data
        let order = 0;

        // Header block (always create if we have a name)
        if (user.name) {
          await ctx.db.insert("resume_blocks", {
            resumeId: resumeId as any,
            type: "header",
            data: {
              fullName: user.name,
              title: user.current_position || user.job_title || user.dream_job || "",
              contact: {
                email: user.email || undefined,
                phone: undefined,
                location: user.location || undefined,
                links: [user.linkedin_url, user.github_url, user.website].filter(Boolean),
              },
            },
            order: order++,
            locked: false,
          });
          blocksCreated++;
        }

        // Experience block
        if (user.work_history && user.work_history.length > 0) {
          const experienceItems = user.work_history.map((exp: any) => ({
            company: exp.company || "",
            role: exp.role || "",
            location: exp.location || undefined,
            start: exp.start_date || "",
            end: exp.is_current ? "" : exp.end_date || "",
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

        // Education block
        if (education.length > 0) {
          const educationItems = education.map((edu) => ({
            school: edu.school,
            degree: edu.degree,
            end: edu.end || "",
            details: edu.details,
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

        // Skills block
        if (primarySkills.length > 0) {
          await ctx.db.insert("resume_blocks", {
            resumeId: resumeId as any,
            type: "skills",
            data: {
              primary: primarySkills,
              secondary: [],
            },
            order: order++,
            locked: false,
          });
          blocksCreated++;
        }

        // Projects block
        if (projects.length > 0) {
          const projectItems = projects.map((proj) => ({
            name: proj.title || "",
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
