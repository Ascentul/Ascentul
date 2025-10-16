import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { openai } from '@/lib/ai/openaiClient';
import { getModel, FALLBACK_MODEL } from '@/lib/ai/aiConfig';
import {
  AUTO_TIDY_SYSTEM_PROMPT,
  generateTidyPrompt,
  tidyResponseSchema,
} from '@/lib/ai/prompts/tidy';
import { extractJSON, formatZodErrors } from '@/lib/ai/prompts/generate';
import type { ResumeBlock } from '@/lib/validators/resume';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AutoTidyRequest {
  resumeId: Id<"builder_resumes">;
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
 * Auto-tidy resume blocks - improve clarity and impact using AI
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Check if OpenAI key is available at runtime
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI not configured. OPENAI_API_KEY environment variable is missing.' },
        { status: 503 }
      );
    }

    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AutoTidyRequest = await req.json();
    const { resumeId } = body;

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Missing required field: resumeId' },
        { status: 400 }
      );
    }

    // 2. Initialize Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 });
    }

    const client = new ConvexHttpClient(convexUrl);

    // 3. Get resume with blocks and verify ownership BEFORE checking cooldown
    // This prevents attackers from consuming another user's cooldown quota
    let resumeData;
    try {
      resumeData = await client.query(api.builder_resumes.getResume, {
        id: resumeId,
        clerkId: userId,
      });
    } catch (error) {
      return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 403 });
    }

    // 4. Check cooldown AFTER ownership verification
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

    // Lazy cleanup: only when map exceeds 100 entries to avoid running cleanup on every request
    if (cooldownMap.size > 100) {
      const CLEANUP_AGE = 5 * 60 * 1000;
      const entries = Array.from(cooldownMap.entries());
      for (const [key, timestamp] of entries) {
        if (now - timestamp > CLEANUP_AGE) {
          cooldownMap.delete(key);
        }
      }
    }

    if (!resumeData || !resumeData.blocks || resumeData.blocks.length === 0) {
      return NextResponse.json({ error: 'No blocks found to tidy' }, { status: 400 });
    }

    const currentBlocks = resumeData.blocks as ResumeBlock[];

    // 5. Generate the tidy prompt with current blocks
    const userPrompt = generateTidyPrompt(currentBlocks);

    console.log('Auto-tidying resume, blocks:', currentBlocks.length);

    // 6. Call OpenAI with retry logic (up to 3 attempts)
    let currentModel = getModel();
    let hasTriedFallback = false;
    let lastError = '';

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`AI attempt ${attempt}/3 with model: ${currentModel}`);

        // Build prompt with previous errors if this is a retry
        let currentPrompt = userPrompt;
        if (attempt > 1 && lastError) {
          currentPrompt = `${userPrompt}\n\n---\nPREVIOUS ATTEMPT FAILED WITH ERRORS:\n${lastError}\n\nPlease fix these errors and return valid JSON matching the schema exactly. Ensure all required fields are present and all blocks from the original resume are included.`;
        }

        // Call OpenAI with timeout to prevent hanging requests
        const completion = await openai.chat.completions.create(
          {
            model: currentModel,
            temperature: 0.2,
            max_tokens: 1600,
            messages: [
              { role: 'system', content: AUTO_TIDY_SYSTEM_PROMPT },
              { role: 'user', content: currentPrompt },
            ],
          },
          {
            timeout: 30000, // 30 seconds timeout
          }
        );

        const aiResponse = completion.choices[0]?.message?.content;

        if (!aiResponse) {
          throw new Error('No content in AI response');
        }

        console.log('AI response received, length:', aiResponse.length);

        // 7. Extract JSON from response
        const parsed = extractJSON(aiResponse);

        // 8. Validate with Zod
        const validation = tidyResponseSchema.safeParse(parsed);

        if (validation.success) {
          const improvedBlocks = validation.data.blocks;

          // Verify we got the same number of blocks back
          if (improvedBlocks.length !== currentBlocks.length) {
            lastError = `Block count mismatch: expected ${currentBlocks.length} blocks, got ${improvedBlocks.length}. You must return ALL blocks in the same order.`;
            console.warn(`Attempt ${attempt} - Block count mismatch`);

            if (attempt === 3) {
              return NextResponse.json({
                error: 'Failed to tidy resume: block count mismatch',
                details: lastError,
              }, { status: 500 });
            }
            continue;
          }

          console.log('Validation successful, improved blocks:', improvedBlocks.length);

          // Return original and improved blocks for diff preview
          return NextResponse.json({
            success: true,
            originalBlocks: currentBlocks,
            improvedBlocks,
            message: `Successfully improved ${improvedBlocks.length} blocks`,
            attempts: attempt,
          });
        } else {
          // Format Zod errors for next attempt
          lastError = formatZodErrors(validation.error);
          console.warn(`Attempt ${attempt} - Validation failed:`, lastError);

          if (attempt === 3) {
            return NextResponse.json({
              error: 'Failed to generate valid improved resume after 3 attempts',
              validationErrors: lastError,
            }, { status: 422 });
          }
        }
      } catch (error: any) {
        lastError = error.message || 'Unknown error during AI call';
        console.error(`Attempt ${attempt} - AI call failed:`, error);

        // Check if this is a model-related error and we haven't tried the fallback yet
        const isModelError =
          error.message?.toLowerCase().includes('model') ||
          error.message?.toLowerCase().includes('not found') ||
          error.code === 'model_not_found' ||
          error.status === 404;

        if (isModelError && !hasTriedFallback && currentModel !== FALLBACK_MODEL) {
          console.log(`Model error detected. Falling back to ${FALLBACK_MODEL}`);
          currentModel = FALLBACK_MODEL;
          hasTriedFallback = true;
          // Don't count this as a failed attempt - retry with fallback model
          attempt--;
          continue;
        }

        if (attempt === 3) {
          return NextResponse.json({
            error: 'Auto-tidy failed after 3 attempts',
            details: error.message,
          }, { status: 500 });
        }

        // Exponential backoff before retry
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
        }
      }
    }

    // Fallback if loop exits without returning
    return NextResponse.json({
      error: 'Failed to tidy resume',
      details: lastError,
    }, { status: 500 });
  } catch (error: any) {
    console.error('Auto-tidy error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to tidy resume' },
      { status: 500 }
    );
  }
}
