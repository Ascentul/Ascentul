import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import { openai } from '@/lib/ai/openaiClient';
import { getModel, FALLBACK_MODEL } from '@/lib/ai/aiConfig';
import type { Id } from '../../../../../convex/_generated/dataModel';
import {
  validateAIResponse,
  formatZodErrorsForAI,
  type AIResumeResponse,
} from '@/lib/resume-validation';
import {
  RESUME_SYSTEM_PROMPT,
  generateTailoringPrompt,
  generateCorrectionPrompt,
  extractJSONFromResponse,
} from '@/lib/ai-prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TailorResumeRequest {
  resumeId: Id<"builder_resumes">;
  jobDescription: string;
  currentBlocks: any[];
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
 * Tailor resume blocks for a specific job description using AI
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

    const body: TailorResumeRequest = await req.json();
    const { resumeId, jobDescription, currentBlocks } = body;

    if (!resumeId || !jobDescription || !currentBlocks) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeId, jobDescription, and currentBlocks' },
        { status: 400 }
      );
    }

    // 2. Initialize Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 });
    }

    const client = new ConvexHttpClient(convexUrl);

    // 3. Verify resume ownership BEFORE checking cooldown
    // This prevents attackers from consuming another user's cooldown quota
    try {
      await client.query(api.builder_resumes.getResume, { id: resumeId, clerkId: userId });
    } catch (error) {
      return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 403 });
    }

    // 4. Check cooldown AFTER ownership verification
    const now = Date.now();
    const lastCall = cooldownMap.get(resumeId);
    if (lastCall && now - lastCall < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - (now - lastCall)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${remainingSeconds} seconds before tailoring again.` },
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

    // 5. Generate the tailoring prompt
    const userPrompt = generateTailoringPrompt({
      jobDescription,
      currentBlocks,
    });

    console.log('Tailoring resume for job description, blocks:', currentBlocks.length);

    // 6. Call OpenAI with retry logic (up to 3 attempts)
    let validatedData: AIResumeResponse | null = null;
    let lastResponse: string = '';
    let lastError: string | null = null;
    const maxAttempts = 3;
    let currentModel = getModel();
    let hasTriedFallback = false;

    for (let attempts = 1; attempts <= maxAttempts; attempts++) {
      try {
        console.log(`AI attempt ${attempts}/${maxAttempts} with model: ${currentModel}`);

        // Adjust prompt for retry attempts
        let currentUserPrompt = userPrompt;
        if (attempts > 1 && lastError) {
          currentUserPrompt = generateCorrectionPrompt({
            validationErrors: lastError,
            badJson: lastResponse,
          });
        }

        // Call OpenAI
        const messages: Array<{role: 'system' | 'user', content: string}> = [
          { role: 'system', content: RESUME_SYSTEM_PROMPT },
          { role: 'user', content: currentUserPrompt },
        ];

        const response = await openai.chat.completions.create({
          model: currentModel,
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 1600,
        });

        const content = response.choices[0]?.message?.content || '{"blocks":[]}';
        lastResponse = content;

        console.log('AI response received, length:', content.length);

        // 7. Extract and parse JSON
        const parsed = extractJSONFromResponse(content);

        // 8. Validate with Zod
        const validation = validateAIResponse(parsed);

        if (validation.success && validation.data) {
          validatedData = validation.data;
          console.log('Validation successful, blocks:', validatedData.blocks.length);
          break;
        } else if (validation.errors) {
          lastError = formatZodErrorsForAI(validation.errors);
          console.warn(`Attempt ${attempts} - Validation failed:`, lastError);

          if (attempts === maxAttempts) {
            return NextResponse.json({
              error: 'Failed to generate valid resume after multiple attempts',
              validationErrors: lastError,
              lastAttempt: parsed,
            }, { status: 422 });
          }
        }
      } catch (error: any) {
        lastError = error.message;
        console.error(`Attempt ${attempts} - AI call failed:`, error);

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
          attempts--;
          continue;
        }

        if (attempts === maxAttempts) {
          return NextResponse.json({
            error: 'Resume tailoring failed after 3 attempts',
            details: error.message,
          }, { status: 500 });
        }

        // Exponential backoff before retry
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempts - 1), 5000)));
        }
      }
    }

    if (!validatedData) {
      return NextResponse.json({
        error: 'Failed to tailor resume',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      blocks: validatedData.blocks,
      message: `Tailored resume with ${validatedData.blocks.length} blocks`,
    });
  } catch (error: any) {
    console.error('Resume tailoring error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to tailor resume' },
      { status: 500 }
    );
  }
}
