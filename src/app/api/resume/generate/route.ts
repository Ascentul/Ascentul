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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function getConvexClient(authResult: Awaited<ReturnType<typeof auth>>) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("Convex URL not configured");
  }

  const client = new ConvexHttpClient(convexUrl);
  const token = await authResult.getToken({
    template: process.env.CLERK_JWT_TEMPLATE || "convex",
  });

  if (token) {
    client.setAuth(token);
  }

  return client;
}

interface GenerateResumeRequest {
  resumeId: Id<"builder_resumes">;
  targetRole: string;
  targetCompany?: string;
}

export async function POST(req: NextRequest) {
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
    const { resumeId, targetRole, targetCompany } = body;

    if (!resumeId || !targetRole) {
      return NextResponse.json(
        { error: "Missing required fields: resumeId and targetRole are required" },
        { status: 400 }
      );
    }

    console.log(`Generating resume for role: ${targetRole}${targetCompany ? ` at ${targetCompany}` : ""}`);

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
        console.warn("Could not load template, using default allowed blocks");
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
      console.error("Profile load error:", error);
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
    let currentModel = getModel();
    let hasTriedFallback = false;
    let aiResponse: string | null = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`AI attempt ${attempt}/${maxAttempts} with model: ${currentModel}`);

        const completion = await openai.chat.completions.create({
          model: currentModel,
          temperature: 0.2,
          max_tokens: 1600,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        aiResponse = completion.choices[0]?.message?.content;

        if (aiResponse) {
          console.log("AI response received, length:", aiResponse.length);
          break;
        }
      } catch (error: any) {
        console.error(`AI attempt ${attempt} failed:`, error.message);

        // Check if this is a model-related error
        const isModelError =
          error.message?.toLowerCase().includes("model") ||
          error.message?.toLowerCase().includes("not found") ||
          error.code === "model_not_found" ||
          error.status === 404;

        if (isModelError && !hasTriedFallback && currentModel !== FALLBACK_MODEL) {
          console.log(`Model error detected. Falling back to ${FALLBACK_MODEL}`);
          currentModel = FALLBACK_MODEL;
          hasTriedFallback = true;
          attempt--; // Don't count this as an attempt
          continue;
        }

        if (attempt === maxAttempts) {
          return NextResponse.json(
            { error: `AI generation failed: ${error.message}` },
            { status: 502 }
          );
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
      }
    }

    if (!aiResponse) {
      return NextResponse.json(
        { error: "Failed to generate resume content" },
        { status: 502 }
      );
    }

    // 10. Parse and validate JSON response
    let parsedBlocks;
    try {
      // Extract JSON from response (handles code blocks, etc.)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
      const parsed = JSON.parse(jsonStr);

      // Validate with Zod
      const validated = resumeOutputSchema.parse(parsed);
      parsedBlocks = validated.blocks;

      console.log(`Validated ${parsedBlocks.length} blocks`);
    } catch (error: any) {
      console.error("Validation error:", error);
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
      console.warn("Error deleting old blocks:", error);
    }

    // 12. Insert new blocks
    let insertedCount = 0;
    for (const block of parsedBlocks) {
      try {
        if (process.env.NODE_ENV !== "production") {
          const dataKeys = Object.keys(((block as any)?.data) ?? {});
          console.debug("[resume.generate] inserting block", block.type, "data keys:", dataKeys);
        }
        await convex.mutation(api.builder_blocks.createBlock, {
          resumeId,
          type: block.type,
          order: block.order,
          data: block.data,
          locked: false,
        });
        insertedCount++;
      } catch (error) {
        console.error(`Failed to insert block ${block.type}:`, error);
      }
    }

    console.log(`Successfully inserted ${insertedCount} blocks`);

    return NextResponse.json({
      ok: true,
      count: insertedCount,
    });
  } catch (error: any) {
    console.error("Generate resume error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate resume" },
      { status: 500 }
    );
  }
}
