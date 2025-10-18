/**
 * AI Resume Builder - Convex Actions
 *
 * This module handles AI-powered resume generation using OpenAI's structured outputs.
 * It replaces the legacy REST API `/api/resumes/generate` with Convex actions for better reactivity.
 *
 * Flow:
 * 1. User triggers AI generation from studio toolbar
 * 2. Action fetches user profile via profiles.getMyProfile()
 * 3. Action calls OpenAI with job description + profile data
 * 4. Action validates response with Zod schema
 * 5. Action inserts blocks via builder_blocks.bulkUpdate()
 * 6. Canvas reactively updates via Convex subscription
 *
 * TOKEN OPTIMIZATION:
 * Profile data is aggressively summarized before sending to OpenAI to:
 * - Reduce prompt token usage (lower costs)
 * - Stay within model context limits (8K/128K tokens)
 * - Improve response quality (less noise)
 * - Faster generation (smaller inputs = faster processing)
 *
 * Limits applied (see buildProfileSummary):
 * - Experience: 3 items max, 4 bullets each, 180 chars/bullet
 * - Education: 3 items max, 3 details each
 * - Skills: 12 per category (primary/secondary)
 * - Projects: 3 items max, 200 char descriptions, 3 bullets each
 * - Bio/summary: 400 chars max
 * - Contact links: 4 links max
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { aiResumeResponseSchema, formatZodErrorsForAI } from "../src/lib/validators/resume";
import { isCareerProfileDTO, type CareerProfileDTO } from "../src/types/profile";

import type { OpenAI as OpenAIType } from "openai";

// OpenAI client is loaded lazily via dynamic import to support ESM environments
let openai: OpenAIType | null = null;
let openaiLoadPromise: Promise<OpenAIType | null> | null = null;

async function getOpenAIClient(): Promise<OpenAIType | null> {
  if (openai) {
    return openai;
  }

  if (!openaiLoadPromise) {
    openaiLoadPromise = import("openai")
      .then(({ default: OpenAI }) => {
        // Validate API key before initializing client to fail fast with clear error
        if (!process.env.OPENAI_API_KEY) {
          console.error("OPENAI_API_KEY environment variable is not set.");
          console.error("AI features will be unavailable. Set OPENAI_API_KEY in your environment.");
          return null;
        }

        openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        return openai;
      })
      .catch((error) => {
        console.warn("OpenAI SDK not available. AI generation will fail if attempted.");
        console.error(error);
        return null;
      });
  }

  return openaiLoadPromise;
}

const RESUME_BLOCKS_SCHEMA = {
  type: "object",
  properties: {
    blocks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["header", "summary", "experience", "education", "skills", "projects", "custom"] },
          order: { type: "integer", minimum: 0 },
          data: { type: "object" },
        },
        required: ["type", "order", "data"],
        additionalProperties: false,
      },
    },
  },
  required: ["blocks"],
  additionalProperties: false,
} as const;

function truncateText(text: string | undefined, maxLength: number): string | undefined {
  if (!text) return text;
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function summarizeBullets(bullets: string[] | undefined, maxItems: number): string[] {
  if (!Array.isArray(bullets)) return [];
  return bullets
    .filter((bullet) => typeof bullet === "string" && bullet.trim().length > 0)
    .slice(0, maxItems)
    .map((bullet) => truncateText(bullet.trim(), 180) ?? "");
}

function summarizeExperience(profile: CareerProfileDTO) {
  if (!Array.isArray(profile.experience)) return [];
  return profile.experience.slice(0, 3).map((exp) => ({
    company: exp.company,
    role: exp.role,
    location: exp.location,
    period: [exp.start, exp.end].filter((val) => val != null).join(" – "),
    bullets: summarizeBullets(exp.bullets, 4),
  }));
}

function summarizeEducation(profile: CareerProfileDTO) {
  if (!Array.isArray(profile.education)) return [];
  return profile.education.slice(0, 3).map((edu) => ({
    school: edu.school,
    degree: edu.degree,
    field: edu.field,
    end: edu.end,
    details: summarizeBullets(edu.details, 3),
  }));
}

function summarizeSkills(profile: CareerProfileDTO) {
  const primary = Array.isArray(profile.skills?.primary)
    ? profile.skills.primary
        .filter((skill) => typeof skill === "string" && skill.trim().length > 0)
        .slice(0, 12)
    : [];

  const secondary = Array.isArray(profile.skills?.secondary)
    ? profile.skills.secondary
        .filter((skill) => typeof skill === "string" && skill.trim().length > 0)
        .slice(0, 12)
    : [];

  return { primary, secondary };
}

function summarizeProjects(profile: CareerProfileDTO) {
  if (!Array.isArray(profile.projects)) return [];
  return profile.projects.slice(0, 3).map((proj) => ({
    name: proj.name,
    description: truncateText(proj.description, 200),
    bullets: summarizeBullets(proj.bullets, 3),
  }));
}

/**
 * Build optimized profile summary for AI prompt
 *
 * Extracts only relevant fields and applies aggressive limits to reduce token usage.
 * This prevents sending unnecessary data to OpenAI and helps stay within context limits.
 *
 * Optimization strategy:
 * - Extract only resume-relevant fields (excludes internal IDs, metadata, etc.)
 * - Truncate long text fields (bio, descriptions)
 * - Limit array lengths (experience, education, skills, projects)
 * - Remove null/undefined values to reduce JSON size
 *
 * Token savings example:
 * - Full profile with 10 jobs: ~2000 tokens
 * - Summarized (3 jobs, trimmed): ~500 tokens (75% reduction)
 *
 * @param profile - Full user profile from profiles.getMyProfile()
 * @returns Optimized profile summary for AI consumption
 */
function buildProfileSummary(profile: CareerProfileDTO) {
  const contactLinks = Array.isArray(profile.contact?.links)
    ? profile.contact.links
        .filter((link) => typeof link?.label === "string" && typeof link?.url === "string")
        .slice(0, 4) // Limit to 4 links max
        .map((link) => ({ label: link.label, url: link.url }))
    : [];

  return {
    fullName: profile.fullName,
    title: profile.title,
    contact: {
      email: profile.contact?.email,
      phone: profile.contact?.phone,
      location: profile.contact?.location,
      links: contactLinks,
    },
    summary: truncateText(profile.bio, 400), // 400 chars max
    experience: summarizeExperience(profile), // 3 items, 4 bullets each
    education: summarizeEducation(profile), // 3 items, 3 details each
    skills: summarizeSkills(profile), // 12 per category
    projects: summarizeProjects(profile), // 3 items, 3 bullets each
  };
}

/**
 * Generate resume blocks using AI based on job description and user profile
 *
 * @param clerkId - Clerk user ID for authentication
 * @param resumeId - Target resume document ID
 * @param jobDescription - Job description to tailor resume for
 * @param clearExisting - Whether to replace existing blocks (default: true)
 *
 * @returns { success: boolean, blocksCreated: number, error?: string }
 */
export const generateBlocks = action({
  args: {
    clerkId: v.string(),
    resumeId: v.id("builder_resumes"),
    jobDescription: v.string(),
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const openaiClient = await getOpenAIClient();

    // Guard: Ensure OpenAI is available
    if (!openaiClient) {
      return {
        success: false,
        blocksCreated: 0,
        error: "OpenAI SDK not initialized. Check OPENAI_API_KEY environment variable.",
      };
    }

    // Step 1: Fetch user profile
    const profile = await ctx.runQuery(api.profiles.getMyProfile);

    if (!profile) {
      return {
        success: false,
        blocksCreated: 0,
        error: "User profile not found. Please complete your profile first.",
      };
    }

    // Validate profile shape matches expected CareerProfileDTO
    if (!isCareerProfileDTO(profile)) {
      console.error("Profile shape mismatch:", profile);
      return {
        success: false,
        blocksCreated: 0,
        error: "Profile data is incomplete or invalid. Please update your profile.",
      };
    }

    // Step 2: Verify resume ownership
    const resume = await ctx.runQuery(api.builder_resumes.getResume, {
      id: args.resumeId,
      clerkId: args.clerkId,
    });

    if (!resume || !resume.resume) {
      return {
        success: false,
        blocksCreated: 0,
        error: "Resume not found or you don't have permission to edit it.",
      };
    }

    // Step 3: Construct AI prompt
    // Type-safe: profile is validated as CareerProfileDTO via isCareerProfileDTO guard
    const profileSummary = buildProfileSummary(profile);

    const systemPrompt = `You are an expert resume writer. Generate a professional resume tailored to the job description provided.

Use the user's profile data to create relevant blocks. Output must be valid JSON matching the schema.

Guidelines:
- Start with order=0 for first block, increment by 1 for each subsequent block
- Header block is required and must be first (order=0)
- Include 2-4 relevant blocks based on profile data (experience, education, skills, projects)
- Tailor content to match job description keywords and requirements
- Use strong action verbs and quantifiable achievements
- Keep bullets concise (15-20 words each)
- For experience/education items with no data, use items: [] to skip that block`;

    let userPrompt = `Job Description:
${args.jobDescription}

User Profile:
${JSON.stringify(profileSummary, null, 2)}

Generate a resume with blocks in this order:
1. Header (required, order=0)
2. Summary (optional, order=1)
3. Experience (if profile has work history, order=2)
4. Education (if profile has education, order=3)
5. Skills (if profile has skills, order=4)
6. Projects (if profile has projects, order=5)`;

    // Step 4: Call OpenAI with structured outputs
    let attempt = 0;
    const maxAttempts = 3;
    let lastError = "";

    while (attempt < maxAttempts) {
      attempt++;

      try {
        const completion = await openaiClient.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-2024-08-06",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "resume_blocks",
              strict: true,
              schema: RESUME_BLOCKS_SCHEMA,
            },
          },
        });

        const rawResponse = completion.choices?.[0]?.message?.content;
        if (!rawResponse) {
          throw new Error("Empty response from OpenAI");
        }

        let parsedResponse;
        try {
          parsedResponse = JSON.parse(rawResponse);
        } catch (e) {
          throw new Error(
            `Invalid JSON response from OpenAI: ${e instanceof Error ? e.message : String(e)}`
          );
        }

        // Step 5: Validate with Zod schema
        const validated = aiResumeResponseSchema.parse(parsedResponse);

        // Step 6: Insert blocks via bulkUpdate mutation
        const result = await ctx.runMutation(api.builder_blocks.bulkUpdate, {
          resumeId: args.resumeId,
          clerkId: args.clerkId,
          blocks: validated.blocks,
          clearExisting: args.clearExisting ?? true,
        });

        return {
          success: true,
          blocksCreated: result.createdCount,
        };

      } catch (error: any) {
        if (error.name === "ZodError") {
          // Validation error - format for AI correction
          lastError = formatZodErrorsForAI(error);
          console.error(`Attempt ${attempt} failed with validation errors:\n${lastError}`);

          // If not last attempt, retry with error feedback
          if (attempt < maxAttempts) {
            userPrompt += `\n\nPrevious attempt had validation errors:\n${lastError}\n\nPlease fix and regenerate.`;
            continue;
          }
        } else if (error.message?.includes("rate_limit")) {
          return {
            success: false,
            blocksCreated: 0,
            error: "OpenAI rate limit exceeded. Please try again in a few moments.",
          };
        } else {
          lastError = error.message || "Unknown error occurred";
          console.error(`Attempt ${attempt} failed:`, error);
        }

        // If last attempt or non-recoverable error, return failure
        if (attempt >= maxAttempts) {
          break;
        }
      }
    }

    return {
      success: false,
      blocksCreated: 0,
      error: `Failed after ${maxAttempts} attempts. Last error: ${lastError}`,
    };
  },
});

/**
 * Regenerate a single block using AI (for iterative refinement)
 *
 * @param clerkId - Clerk user ID
 * @param resumeId - Target resume document ID
 * @param blockId - Block to regenerate
 * @param refinementPrompt - User guidance for regeneration (e.g., "make it more technical")
 *
 * @returns { success: boolean, error?: string }
 */
export const regenerateBlock = action({
  args: {
    clerkId: v.string(),
    resumeId: v.id("builder_resumes"),
    blockId: v.id("resume_blocks"),
    refinementPrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await getOpenAIClient())) {
      return {
        success: false,
        error: "OpenAI SDK not initialized.",
      };
    }

    // Fetch current block
    const blocks = await ctx.runQuery(api.builder_blocks.list, {
      resumeId: args.resumeId,
      clerkId: args.clerkId,
    });

    const currentBlock = blocks.find((b: any) => b._id === args.blockId);
    if (!currentBlock) {
      return {
        success: false,
        error: "Block not found.",
      };
    }

    // TODO: Implement single-block regeneration logic
    // This is a placeholder for Phase 3 enhancement
    return {
      success: false,
      error: "Single block regeneration not yet implemented. Use generateBlocks for full resume.",
    };
  },
});
