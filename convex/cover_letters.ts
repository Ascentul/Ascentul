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

    // Referential integrity: Check for active reviews before deletion
    const activeReviews = await ctx.db
      .query("advisor_reviews")
      .withIndex("by_student", (q) => q.eq("student_id", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("asset_type"), "cover_letter"),
          q.eq(q.field("cover_letter_id"), args.coverLetterId),
          q.neq(q.field("status"), "completed"),
          q.neq(q.field("status"), "cancelled"),
        ),
      )
      .first();

    if (activeReviews) {
      throw new Error(
        "Cannot delete cover letter: Active review in progress. Please wait for the review to complete or contact your advisor.",
      );
    }

    await ctx.db.delete(args.coverLetterId);
    return args.coverLetterId;
  },
});

// Generate cover letter content (AI-powered)
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

    // Mock AI-generated content for now
    // In production, this would integrate with OpenAI or another AI service
    const mockContent = `Dear Hiring Manager,

I am writing to express my strong interest in the ${args.job_title} position at ${args.company_name}. With my background and experience, I am confident that I would be a valuable addition to your team.

${args.user_experience ? `My experience includes: ${args.user_experience}` : 'I bring relevant experience and skills that align well with this role.'}

${args.job_description ? 'Based on the job description, I believe my skills in problem-solving, communication, and technical expertise make me an ideal candidate.' : 'I am excited about the opportunity to contribute to your organization.'}

I would welcome the opportunity to discuss how my background and enthusiasm can contribute to ${args.company_name}'s continued success. Thank you for considering my application.

Sincerely,
${user.name}`;

    return { content: mockContent };
  },
});
