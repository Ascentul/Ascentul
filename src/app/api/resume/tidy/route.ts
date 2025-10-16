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
    const now = Date.now();
    const lastCall = cooldownMap.get(resumeId);
    if (lastCall && now - lastCall < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastCall)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${remainingSeconds} seconds before tidying again.` },
        { status: 429 }
      );
    }

    // Set cooldown
    cooldownMap.set(resumeId, now);

    // Lazy cleanup: only when map exceeds 100 entries
    if (cooldownMap.size > 100) {
      const CLEANUP_AGE = 60 * 1000; // 1 minute (enough buffer beyond 20s cooldown)
      const entries = Array.from(cooldownMap.entries());
      for (const [key, timestamp] of entries) {
        if (now - timestamp > CLEANUP_AGE) {
          cooldownMap.delete(key);
        }
      }
    }

    console.log(`Tidying resume with ${currentBlocks.length} blocks`);

    // 7. Build AI prompt
    const userPrompt = generateTidyPrompt(currentBlocks);

    // 8. Call OpenAI with retry and fallback
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
          max_tokens: 2000,
          timeout: 30000, // 30 seconds timeout
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: AUTO_TIDY_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        });

        aiResponse = completion.choices[0]?.message?.content;

        if (aiResponse) {
          console.log('AI response received, length:', aiResponse.length);
          break;
        }
      } catch (error: any) {
        console.error(`AI attempt ${attempt} failed:`, error.message);

        // Check if this is a model-related error
        const isModelError =
          error.code === 'model_not_found' ||
          error.status === 404 ||
          (error.message && /model.*not.*found|invalid.*model/i.test(error.message));

        if (isModelError && !hasTriedFallback && currentModel !== FALLBACK_MODEL) {
          console.log(`Model error detected. Falling back to ${FALLBACK_MODEL}`);
          currentModel = FALLBACK_MODEL;
          hasTriedFallback = true;
          attempt--; // Don't count this as an attempt
          continue;
        }

        if (attempt === maxAttempts) {
          return NextResponse.json(
            { error: `AI tidy failed: ${error.message}` },
            { status: 502 }
          );
        }

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
      }
    }

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'Failed to tidy resume content' },
        { status: 502 }
      );
    }

    // 9. Parse and validate JSON response
    let parsedBlocks: ResumeBlock[];
    try {
      // Extract JSON from response (handles code blocks, etc.)
      // Use greedy matching to capture nested JSON objects correctly
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : aiResponse;
      const parsed = JSON.parse(jsonStr);

      // Validate with Zod
      const validated = aiResumeResponseSchema.parse(parsed);
      parsedBlocks = validated.blocks as ResumeBlock[];

      console.log(`Validated ${parsedBlocks.length} tidied blocks`);
    } catch (error: any) {
      console.error('Validation error:', error);
      const errorMsg = error.errors
        ? error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ')
        : error.message;

      return NextResponse.json(
        {
          error: 'AI generated invalid resume format',
          details: errorMsg,
          rawResponse: aiResponse.substring(0, 500),
        },
        { status: 502 }
      );
    }

    // 10. Return tidied blocks (client will handle applying them)
    console.log(`Successfully tidied ${parsedBlocks.length} blocks`);

    return NextResponse.json({
      ok: true,
      blocks: parsedBlocks,
      count: parsedBlocks.length,
    });
  } catch (error: any) {
    console.error('Tidy resume error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to tidy resume' },
      { status: 500 }
    );
  }
}
