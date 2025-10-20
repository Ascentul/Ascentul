import { ZodError } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { openai } from '@/lib/ai/openaiClient';
import { getModel, FALLBACK_MODEL } from '@/lib/ai/aiConfig';
import { AUTO_TIDY_SYSTEM_PROMPT, generateTidyPrompt } from '@/lib/ai/prompts/tidy';
import { aiResumeResponseSchema } from '@/lib/validators/resume';
import type { ResumeBlock } from '@/lib/validators/resume';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface TidyResumeRequest {
  resumeId: Id<'builder_resumes'>;
  currentBlocks: ResumeBlock[];
}

/**
 * IMPORTANT: In-memory cooldown - may not work consistently in serverless deployments
 *
 * In serverless platforms (Vercel, AWS Lambda), each function instance maintains its own
 * memory state. This means:
 * - Users can bypass cooldown by hitting different instances
 * - The map will be lost on cold starts
 * - Not suitable for production rate limiting
 *
 * TODO: For production, replace with:
 * - Distributed cache (Redis, Vercel KV)
 * - Database-based rate limiting (Convex with TTL)
 * - Edge rate limiting (Vercel Edge Config)
 *
 * Current implementation provides basic protection for single-instance dev environment only.
 */
const cooldownMap = new Map<string, number>();
const COOLDOWN_MS = 20000; // 20 seconds

/**
 * Check if a resume is currently in cooldown period
 * @param resumeId - The ID of the resume to check
 * @returns Object with allowed status and remaining seconds if in cooldown
 */
async function checkCooldown(resumeId: string): Promise<{ allowed: boolean; remainingSeconds?: number }> {
  const now = Date.now();
  const lastCall = cooldownMap.get(resumeId);

  if (lastCall && now - lastCall < COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastCall)) / 1000);
    return { allowed: false, remainingSeconds };
  }

  // Set cooldown
  cooldownMap.set(resumeId, now);

  // Incremental cleanup: iterate in insertion order to avoid sort overhead
  // Keeps map size bounded without O(n log n) cost on every request
  if (cooldownMap.size > 100) {
    const CLEANUP_AGE = 60 * 1000; // 1 minute (enough buffer beyond 20s cooldown)
    const MAX_CLEANUP_PER_REQUEST = 10; // Clean up 10 oldest entries at a time
    const MAX_EXAMINE_PER_REQUEST = 50;

    let cleaned = 0;
    let examined = 0;
    for (const [key, timestamp] of cooldownMap.entries()) {
      if (cleaned >= MAX_CLEANUP_PER_REQUEST) break;
      if (examined >= MAX_EXAMINE_PER_REQUEST) break;
      examined++;
      if (now - timestamp > CLEANUP_AGE) {
        cooldownMap.delete(key);
        cleaned++;
      }
    }
  }

  return { allowed: true };
}

/**
 * Call OpenAI API with retry logic and model fallback
 * @param userPrompt - The prompt to send to OpenAI
 * @param maxAttempts - Maximum number of attempts for the primary model (default: 3).
 *                      A single additional attempt is made automatically if the fallback model is required.
 * @returns The AI response string
 * @throws Error if all attempts fail
 */
async function parseTidyResponse(aiResponse: string): Promise<ResumeBlock[]> {
  let jsonStr = aiResponse.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  } else {
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
  }

  const parsed = JSON.parse(jsonStr);

  // Validate with Zod
  const validated = aiResumeResponseSchema.parse(parsed);
  const parsedBlocks = validated.blocks as ResumeBlock[];

  console.log(`Validated ${parsedBlocks.length} tidied blocks`);
  return parsedBlocks;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Check if OpenAI key is available at runtime
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI not configured. OPENAI_API_KEY environment variable is missing.' },
        { status: 503 }
      );
    }

    // 2. Authenticate user
    const authResult = await auth();
    const { userId } = authResult;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Parse and validate request body
    let body: TidyResumeRequest;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { resumeId, currentBlocks } = body;

    if (!resumeId || !currentBlocks || !Array.isArray(currentBlocks)) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeId and currentBlocks are required' },
        { status: 400 }
      );
    }

    if (currentBlocks.length === 0) {
      return NextResponse.json(
        { error: 'No blocks to tidy. Add some content first.' },
        { status: 400 }
      );
    }

    // 4. Initialize Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    const convex = new ConvexHttpClient(convexUrl);
    const token = await authResult.getToken({ template: 'convex' });
    if (token) {
      convex.setAuth(token);
    }

    // 5. Verify resume ownership BEFORE checking cooldown
    try {
      await convex.query(api.builder_resumes.getResume, {
        id: resumeId,
        clerkId: userId,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Resume not found or access denied' },
        { status: 403 }
      );
    }

    // 6. Check cooldown AFTER ownership verification
    const cooldownCheck = await checkCooldown(resumeId);
    if (!cooldownCheck.allowed) {
      return NextResponse.json(
        { error: `Please wait ${cooldownCheck.remainingSeconds} seconds before tidying again.` },
        { status: 429 }
      );
    }

    console.log(`Tidying resume with ${currentBlocks.length} blocks`);

    // 7. Build AI prompt and call OpenAI
    const userPrompt = generateTidyPrompt(currentBlocks);

    let aiResponse: string;
    try {
      aiResponse = await callOpenAIWithRetry(userPrompt);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: errorMessage },
        { status: 502 }
      );
    }

    // 8. Parse and validate JSON response
    let parsedBlocks: ResumeBlock[];
    try {
      parsedBlocks = await parseTidyResponse(aiResponse);
    } catch (error: unknown) {
      console.error('Validation error:', error);

      if (error instanceof ZodError) {
        const errorMsg = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('; ');
        const truncatedErrorMsg = errorMsg.length > 1000
          ? `${errorMsg.slice(0, 1000)}... (truncated)`
          : errorMsg;

        return NextResponse.json(
          {
            error: 'AI generated invalid resume format',
            details: truncatedErrorMsg,
            rawResponse: aiResponse.substring(0, 500),
          },
          { status: 502 }
        );
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        {
          error: 'AI generated invalid resume format',
          details: errorMessage,
          rawResponse: aiResponse.substring(0, 500),
        },
        { status: 502 }
      );
    }

    console.log(`Successfully tidied ${parsedBlocks.length} blocks`);

    return NextResponse.json({
      ok: true,
      blocks: parsedBlocks,
      count: parsedBlocks.length,
    });
  } catch (error: unknown) {
    console.error('Tidy resume error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to tidy resume';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
