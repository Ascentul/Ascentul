import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    // Create a basic cover letter with user's career data
    // The user can then edit it or regenerate it with AI at /cover-letters
    const intro = `Dear Hiring Manager,

I am writing to express my strong interest in the ${args.job_title} position at ${args.company_name}.`;

    const experienceSection = user.current_position || user.current_company
      ? `\n\nCurrently, I work as ${user.current_position || 'a professional'}${user.current_company ? ` at ${user.current_company}` : ''}. `
      : '\n\n';

    const skillsSection = user.skills && user.skills.length > 0
      ? `My key skills include ${user.skills.slice(0, 5).join(', ')}, which align well with the requirements for this role.\n`
      : '';

    const jdSection = args.job_description
      ? `\nBased on the job description provided, I believe my background in ${user.industry || 'this field'} makes me a strong candidate for this opportunity.\n`
      : '';

    const closing = `\nI would welcome the opportunity to discuss how my background and enthusiasm can contribute to ${args.company_name}'s continued success. Thank you for considering my application.

Sincerely,
${user.name}`;

    const content = intro + experienceSection + skillsSection + jdSection + closing;

    // Save the cover letter to the database
    const now = Date.now();
    const coverLetterId = await ctx.db.insert("cover_letters", {
      user_id: user._id,
      name: `Cover Letter - ${args.company_name}`,
      job_title: args.job_title,
      company_name: args.company_name,
      template: "standard",
      content,
      closing: "Sincerely,",
      source: "ai_generated",
      created_at: now,
      updated_at: now,
    });

    return {
      success: true,
      coverLetterId,
      content,
      message: `I've created a draft cover letter for the ${args.job_title} position at ${args.company_name}. Go to the Cover Letters page to generate the full AI-powered version with your complete career profile, or edit this draft directly.`,
      url: `/cover-letters`,
      action: 'Visit Cover Letters page to generate AI version'
    };
  },
});
