import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Helper function: Build cover letter intro section
 */
function buildIntroSection(jobTitle: string, companyName: string): string {
  return `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${companyName}.`;
}

/**
 * Helper function: Build experience section
 */
function buildExperienceSection(workHistory?: Array<{
  role?: string;
  company?: string;
  is_current?: boolean;
  summary?: string;
}>): string {
  if (!workHistory || workHistory.length === 0) {
    return '\n\n';
  }

  // Find current position
  const currentRole = workHistory.find(w => w.is_current);

  if (currentRole && currentRole.role && currentRole.company) {
    const summary = currentRole.summary ? ` ${currentRole.summary}` : '';
    return `\n\nCurrently, I work as ${currentRole.role} at ${currentRole.company}.${summary} `;
  }

  // Fallback to most recent role
  const recentRole = workHistory[0];
  if (recentRole && recentRole.role && recentRole.company) {
    const summary = recentRole.summary ? ` ${recentRole.summary}` : '';
    return `\n\nMost recently, I worked as ${recentRole.role} at ${recentRole.company}.${summary} `;
  }

  return '\n\n';
}

/**
 * Helper function: Build skills section
 *
 * Parses comma-separated skill names and generates a formatted skills section.
 *
 * @param skills - Comma-separated skill names (e.g., "React, TypeScript, Node.js")
 * @returns Formatted skills section or empty string
 *
 * Note: This follows the application-wide convention of using commas as skill delimiters.
 * Skill names containing commas (e.g., "Communication, written & verbal") will be
 * incorrectly split. Users should avoid commas within individual skill names.
 */
function buildSkillsSection(skills?: string): string {
  if (!skills || skills.trim().length === 0) {
    return '';
  }

  // Parse comma-separated skills with robust validation
  const skillsArray = skills
    .split(',')
    .map(s => s.trim())
    .filter(s => {
      // Filter out empty strings, whitespace-only, and excessively long skill names
      return s.length > 0 && s.length <= 100 && !/^\s+$/.test(s);
    })
    // Deduplicate skills (case-insensitive)
    .filter((skill, index, self) =>
      index === self.findIndex(s => s.toLowerCase() === skill.toLowerCase())
    );

  if (skillsArray.length === 0) {
    return '';
  }

  const topSkills = skillsArray.slice(0, 5);
  return `My key skills include ${topSkills.join(', ')}, which align well with the requirements for this role.\n`;
}

/**
 * Helper function: Build job description match section
 */
function buildJobDescriptionSection(jobDescription?: string, industry?: string): string {
  if (!jobDescription) {
    return '';
  }
  return `\nBased on the job description provided, I believe my background in ${industry || 'this field'} makes me a strong candidate for this opportunity.\n`;
}

/**
 * Helper function: Build closing section
 */
function buildClosingSection(companyName: string, userName: string): string {
  return `\nI would welcome the opportunity to discuss how my background and enthusiasm can contribute to ${companyName}'s continued success. Thank you for considering my application.

Sincerely,
${userName}`;
}

// Get cover letters for a user
export const getUserCoverLetters = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // OPTIMIZED: Add limit to prevent bandwidth issues
    const coverLetters = await ctx.db
      .query("cover_letters")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .order("desc")
      .take(50); // Limit to 50 most recent cover letters

    return coverLetters;
  },
});

// Create a new cover letter
export const createCoverLetter = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    job_title: v.string(),
    company_name: v.optional(v.string()),
    template: v.string(),
    content: v.optional(v.string()),
    closing: v.string(),
    source: v.optional(
      v.union(
        v.literal("manual"),
        v.literal("ai_generated"),
        v.literal("ai_optimized"),
        v.literal("pdf_upload"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const coverLetterId = await ctx.db.insert("cover_letters", {
      user_id: user._id,
      name: args.name,
      job_title: args.job_title,
      company_name: args.company_name,
      template: args.template,
      content: args.content,
      closing: args.closing,
      source: args.source ?? "manual",
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    const doc = await ctx.db.get(coverLetterId);
    return doc;
  },
});

// Update a cover letter
export const updateCoverLetter = mutation({
  args: {
    clerkId: v.string(),
    coverLetterId: v.id("cover_letters"),
    updates: v.object({
      name: v.optional(v.string()),
      job_title: v.optional(v.string()),
      company_name: v.optional(v.string()),
      template: v.optional(v.string()),
      content: v.optional(v.string()),
      closing: v.optional(v.string()),
      source: v.optional(
        v.union(
          v.literal("manual"),
          v.literal("ai_generated"),
          v.literal("ai_optimized"),
          v.literal("pdf_upload"),
        ),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const coverLetter = await ctx.db.get(args.coverLetterId);
    if (!coverLetter || coverLetter.user_id !== user._id) {
      throw new Error("Cover letter not found or unauthorized");
    }

    await ctx.db.patch(args.coverLetterId, {
      ...args.updates,
      updated_at: Date.now(),
    });

    return args.coverLetterId;
  },
});

// Delete a cover letter
export const deleteCoverLetter = mutation({
  args: {
    clerkId: v.string(),
    coverLetterId: v.id("cover_letters"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const coverLetter = await ctx.db.get(args.coverLetterId);
    if (!coverLetter || coverLetter.user_id !== user._id) {
      throw new Error("Cover letter not found or unauthorized");
    }

    await ctx.db.delete(args.coverLetterId);
    return args.coverLetterId;
  },
});

// Generate cover letter content (AI-powered) and save to database
export const generateCoverLetterContent = mutation({
  args: {
    clerkId: v.string(),
    job_title: v.string(),
    company_name: v.string(),
    job_description: v.optional(v.string()),
    user_experience: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    // Create a cover letter with user's complete career data
    // Now uses work_history for accurate experience representation
    const content = [
      buildIntroSection(args.job_title, args.company_name),
      buildExperienceSection(user.work_history),
      buildSkillsSection(user.skills),
      buildJobDescriptionSection(args.job_description, user.industry),
      buildClosingSection(args.company_name, user.name),
    ].join('');

    // Save the cover letter to the database
    const now = Date.now();
    const coverLetterId = await ctx.db.insert("cover_letters", {
      user_id: user._id,
      name: `Cover Letter - ${args.company_name}`,
      job_title: args.job_title,
      company_name: args.company_name,
      template: 'standard',
      content,
      closing: 'Sincerely,',
      source: 'ai_generated',
      created_at: now,
      updated_at: now,
    });

    return {
      success: true,
      coverLetterId,
      content,
      message: `Cover letter created successfully. IMPORTANT: Display a preview using the 'content' field.`
    };
  },
});
