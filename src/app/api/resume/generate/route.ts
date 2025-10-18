import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { openai } from "@/lib/ai/openaiClient";
import { getModel, FALLBACK_MODEL } from "@/lib/ai/aiConfig";
import { systemPrompt } from "@/lib/ai/prompts/system";
import { buildGeneratePrompt } from "@/lib/ai/prompts/generate";
import { resumeOutputSchema } from "@/lib/ai/resumeSchemas";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Calculate exponential backoff delay for retry attempts
 * @param attempt - Current attempt number (1-indexed)
 * @param maxDelay - Maximum delay in milliseconds (default: 5000ms)
 * @returns Delay in milliseconds (1s, 2s, 4s, 5s, 5s, ...)
 */
function getRetryDelay(attempt: number, maxDelay = 5000): number {
  return Math.min(1000 * Math.pow(2, attempt - 1), maxDelay);
}

async function getConvexClient(authResult: Awaited<ReturnType<typeof auth>>) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("Convex URL not configured");
  }

  const client = new ConvexHttpClient(convexUrl);
  const token = await authResult.getToken({
    template: process.env.CLERK_JWT_TEMPLATE || "convex",
  });

  if (!token) {
    throw new Error(
      "Failed to obtain authentication token. " +
      "This may indicate a JWT template configuration issue. " +
      "Verify CLERK_JWT_TEMPLATE matches your Clerk dashboard settings."
    );
  }

  client.setAuth(token);

  return client;
}

interface GenerateResumeRequest {
  resumeId: Id<"builder_resumes">;
  targetRole: string;
  targetCompany?: string;
}

export async function POST(req: NextRequest) {
  let resumeIdForLog: string | null = null;
  try {
    // 1. Check if OpenAI key is available at runtime
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI not configured. OPENAI_API_KEY environment variable is missing." },
        { status: 503 }
      );
    }

    // 2. Authenticate user
    const authResult = await auth();
    const { userId } = authResult;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Parse and validate request body
    const body: GenerateResumeRequest = await req.json();
    resumeIdForLog = body.resumeId;
    const { resumeId, targetRole, targetCompany } = body;

    if (!resumeId || !targetRole) {
      return NextResponse.json(
        { error: "Missing required fields: resumeId and targetRole are required" },
        { status: 400 }
      );
    }

    logger.info("Generating resume", {
      resumeId,
      targetRole,
      targetCompany,
    });

    // 4. Initialize Convex client
    let convex: ConvexHttpClient;
    try {
      convex = await getConvexClient(authResult);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Convex URL not configured" },
        { status: 500 }
      );
    }

    // 5. Verify resume ownership
    let resume;
    try {
      resume = await convex.query(api.builder_resumes.getResume, {
        id: resumeId,
        clerkId: userId,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: "Resume not found or access denied" },
        { status: 404 }
      );
    }

    // 6. Get template to know allowed blocks
    let allowedBlocks = ["header", "summary", "experience", "education", "skills", "projects"];
    if (resume.templateId) {
      try {
        const template = await convex.query(api.builder_templates.getTemplate, {
          id: resume.templateId,
        });
        if (template?.allowedBlocks && template.allowedBlocks.length > 0) {
          allowedBlocks = template.allowedBlocks;
        }
      } catch (error) {
        logger.warn("Could not load template, using default allowed blocks", {
          resumeId,
          templateId: resume.templateId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // 7. Load user profile
    let profile;
    try {
      profile = await convex.query(api.profiles.getMyProfile, {});

      if (!profile) {
        return NextResponse.json(
          { error: "No career profile found. Please complete your career profile first." },
          { status: 400 }
        );
      }
    } catch (error: any) {
      logger.error("Profile load error", error, { userId });
      return NextResponse.json(
        { error: "Failed to load career profile" },
        { status: 500 }
      );
    }

    // 8. Build AI prompt
    const userPrompt = buildGeneratePrompt({
      targetRole,
      targetCompany,
      profile,
      allowedBlocks,
    });

    // 9. Call OpenAI with retry and fallback
    // Timing calculation for 60s maxDuration:
    // - 2 models × 2 attempts × (12s timeout + 1s backoff) = 52s worst case
    // - Leaves 8s buffer for processing, validation, and DB operations
    let aiResponse: string | null = null;
    const maxAttempts = 2; // Reduced from 3 to fit within 60s maxDuration
    const REQUEST_TIMEOUT = 12000; // 12s (reduced from 15s to fit timing budget)
    const primaryModel = getModel();
    const modelsToTry = [primaryModel];
    if (primaryModel !== FALLBACK_MODEL) {
      modelsToTry.push(FALLBACK_MODEL);
    }
    let lastErrorMessage = "Unknown error";

    for (const currentModel of modelsToTry) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          logger.info("AI attempt starting", {
            attempt,
            maxAttempts,
            model: currentModel,
          });

          const completion = await openai.chat.completions.create(
            {
              model: currentModel,
              temperature: 0.2,
              max_tokens: 1600,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
            },
            {
              timeout: REQUEST_TIMEOUT,
            }
          );

          aiResponse = completion.choices?.[0]?.message?.content;

          if (aiResponse) {
            logger.info("AI response received", {
              length: aiResponse.length,
              model: currentModel,
              attempt,
            });
            break; // Success for this model
          }
        } catch (error: any) {
          lastErrorMessage = error?.message || "Unknown error";
          logger.error("AI attempt failed", error, {
            attempt,
            model: currentModel,
            maxAttempts,
          });

          if (attempt === maxAttempts) {
            break; // Try next model (if any)
          }

          // Exponential backoff before retry
          await new Promise((resolve) => setTimeout(resolve, getRetryDelay(attempt)));
        }
      }

      if (aiResponse) {
        break; // No need to try fallback models
      } else {
        logger.warn("Model exhausted attempts", {
          model: currentModel,
          maxAttempts,
          lastErrorMessage,
        });
      }
    }

    if (!aiResponse) {
      return NextResponse.json(
        { error: `Failed to generate resume content: ${lastErrorMessage}` },
        { status: 502 }
      );
    }

    // 10. Parse and validate JSON response
    let parsedBlocks;
    try {
      // Extract JSON from response (handles code blocks, etc.)
      let jsonStr = aiResponse.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
      }

      // Try to find JSON object boundaries more carefully by tracking brace depth
      // This handles edge cases like multiple objects or text after the JSON
      const firstBrace = jsonStr.indexOf("{");
      if (firstBrace !== -1) {
        let depth = 0;
        let lastBrace = -1;
        let inString = false;
        let escapeNext = false;
        for (let i = firstBrace; i < jsonStr.length; i++) {
          const char = jsonStr[i];
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          if (char === '"') {
            inString = !inString;
            continue;
          }
          if (inString) continue;
          if (char === '{') depth++;
          if (char === '}') {
            depth--;
            if (depth === 0) {
              lastBrace = i;
              break;
            }
          }
        }
        if (lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
      }

      const parsed = JSON.parse(jsonStr);

      // Validate with Zod
      const validated = resumeOutputSchema.parse(parsed);
      parsedBlocks = validated.blocks;

      logger.info("Validated AI blocks", {
        resumeId,
        blockCount: parsedBlocks.length,
      });
    } catch (error: any) {
      logger.error("Validation error while parsing AI response", error, {
        resumeId,
        responsePreview: aiResponse.substring(0, 200),
      });
      const errorMsg = error.errors
        ? error.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("; ")
        : error.message;

      return NextResponse.json(
        {
          error: "AI generated invalid resume format",
          details: errorMsg,
          rawResponse: aiResponse.substring(0, 500),
        },
        { status: 502 }
      );
    }

    // 11. Delete existing non-locked blocks
    try {
      const existingBlocks = await convex.query(api.builder_blocks.listBlocks, {
        resumeId,
      });

      for (const block of existingBlocks) {
        if (!block.locked) {
          await convex.mutation(api.builder_blocks.deleteBlock, {
            id: block._id,
          });
        }
      }
    } catch (error) {
      logger.warn("Error deleting old blocks", {
        resumeId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // 12. Insert new blocks (batch insert with fallback)
    const normalizedBlocks = parsedBlocks.map((block) => ({
      type: block.type,
      order: block.order,
      data: block.data,
      locked: false,
    }));

    const BATCH_SIZE = 200;
    let insertedCount = 0;
    let batchInsertFailed = false;
    let nextIndex = 0;

    try {
      for (let i = 0; i < normalizedBlocks.length; i += BATCH_SIZE) {
        const batch = normalizedBlocks.slice(i, i + BATCH_SIZE);
        const result = await convex.mutation(api.builder_blocks.createBlocks, {
          resumeId,
          blocks: batch,
        });
        const batchCount = result?.insertedCount ?? batch.length;
        insertedCount += batchCount;
        nextIndex = i + batch.length;
      }
    } catch (error) {
      batchInsertFailed = true;
      logger.error("Batch block insert failed", error, {
        resumeId,
        insertedCountSoFar: insertedCount,
      });
    }

    if (batchInsertFailed) {
      for (let i = nextIndex; i < normalizedBlocks.length; i++) {
        const block = normalizedBlocks[i];
        try {
          // Limit fallback debug logs to avoid excessive console noise in development
          if (process.env.NODE_ENV !== "production" && i - nextIndex < 5) {
            logger.debug("Inserting block (fallback)", {
              resumeId,
              blockType: block.type,
              remaining: normalizedBlocks.length - i,
            });
          }
          await convex.mutation(api.builder_blocks.createBlock, {
            resumeId,
            type: block.type,
            order: block.order,
            data: block.data,
            locked: block.locked,
          });
          insertedCount++;
        } catch (error) {
          logger.error("Failed to insert block during fallback", error, {
            resumeId,
            blockType: block.type,
          });
        }
      }
    }

    logger.info("Inserted generated blocks", {
      resumeId,
      insertedCount,
      batchMode: !batchInsertFailed,
    });

    return NextResponse.json({
      ok: true,
      count: insertedCount,
    });
  } catch (error: any) {
    logger.error("Generate resume error", error, { resumeId: resumeIdForLog });
    return NextResponse.json(
      { error: error.message || "Failed to generate resume" },
      { status: 500 }
    );
  }
}
