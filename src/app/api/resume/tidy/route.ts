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

  // Incremental cleanup: avoid O(n) spikes by cleaning up oldest entries by timestamp
  // More efficient than full cleanup and keeps map size bounded
  if (cooldownMap.size > 100) {
    const CLEANUP_AGE = 60 * 1000; // 1 minute (enough buffer beyond 20s cooldown)
    const MAX_CLEANUP_PER_REQUEST = 10; // Clean up 10 oldest entries at a time

    // Sort by timestamp (oldest first) to ensure we clean actual oldest entries
    const sortedEntries = Array.from(cooldownMap.entries())
      .sort(([, a], [, b]) => a - b) // Sort by timestamp ascending (oldest first)
      .slice(0, MAX_CLEANUP_PER_REQUEST);

    for (const [key, timestamp] of sortedEntries) {
      if (now - timestamp > CLEANUP_AGE) {
        cooldownMap.delete(key);
      }
    }
  }

  return { allowed: true };
}

/**
 * Call OpenAI API with retry logic and model fallback
 * @param userPrompt - The prompt to send to OpenAI
 * @param maxAttempts - Maximum number of retry attempts (default: 3)
 * @returns The AI response string
 * @throws Error if all attempts fail
 */
async function callOpenAIWithRetry(
  userPrompt: string,
  maxAttempts: number = 3
): Promise<string> {
  let currentModel = getModel();
  let hasTriedFallback = false;
  let aiResponse: string | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`AI attempt ${attempt}/${maxAttempts} with model: ${currentModel}`);

      const completion = await openai.chat.completions.create(
        {
          model: currentModel,
          temperature: 0.2,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: AUTO_TIDY_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        },
        {
          timeout: 30000, // 30 seconds timeout
        }
      );

      aiResponse = completion.choices?.[0]?.message?.content;

      if (aiResponse) {
        console.log('AI response received, length:', aiResponse.length);
        return aiResponse;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any)?.code;
      const errorStatus = (error as any)?.status;

      console.error(`AI attempt ${attempt} failed:`, errorMessage);

      // Check if this is a model-related error (e.g., model not available, invalid model name)
      const isModelError =
        errorCode === 'model_not_found' ||
        errorStatus === 404 ||
        (errorMessage && /model.*not.*found|invalid.*model/i.test(errorMessage));

      // Model fallback: Give a "free retry" without counting against maxAttempts
      // This ensures users aren't penalized for OpenAI API model availability issues
      if (isModelError && !hasTriedFallback && currentModel !== FALLBACK_MODEL) {
        console.log(`Model error detected. Falling back to ${FALLBACK_MODEL}`);
        currentModel = FALLBACK_MODEL;
        hasTriedFallback = true;

        // Decrement attempt counter to retry with fallback model at the same attempt number
        // Example: If attempt=2 fails with model error, decrement to attempt=1, then loop
        // increments back to attempt=2 for the fallback retry. This effectively gives
        // a "free" retry for model fallback, so total attempts can be maxAttempts + 1.
        attempt--;
        continue;
      }

      if (attempt === maxAttempts) {
        throw new Error(`AI tidy failed: ${errorMessage}`);
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
    }
  }

  throw new Error('Failed to get AI response after all attempts');
}

/**
 * Parse and validate AI response into ResumeBlock array
 * @param aiResponse - Raw AI response string
 * @returns Validated array of ResumeBlock objects
 * @throws Error if parsing or validation fails
 */
async function parseTidyResponse(aiResponse: string): Promise<ResumeBlock[]> {
  const extractFirstJSON = (text: string): string | null => {
    let normalized = text.trim();
    if (normalized.startsWith("```")) {
      normalized = normalized.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
      normalized = normalized.replace(/```\s*$/i, "");
    }

    let depth = 0;
    let start = -1;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i];
      if (char === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0 && start !== -1) {
          return normalized.slice(start, i + 1);
        }
      }
    }
    return null;
  };

  const jsonStr = extractFirstJSON(aiResponse) ?? aiResponse.trim();
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

      // Handle Zod validation errors which have an 'errors' array
      const zodErrors = (error as any)?.errors;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorMsg = zodErrors
        ? zodErrors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ')
        : errorMessage;

      return NextResponse.json(
        {
          error: 'AI generated invalid resume format',
          details: errorMsg,
          rawResponse: aiResponse.substring(0, 500),
        },
        { status: 502 }
      );
    }

    // 9. Return tidied blocks (client will handle applying them)
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
