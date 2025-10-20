import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import type { FunctionReference, FunctionReturnType } from 'convex/server';
import { api } from '../../../../../convex/_generated/api';
import { openai } from '@/lib/ai/openaiClient';
import { getModel, FALLBACK_MODEL, AI_CONFIG } from '@/lib/ai/aiConfig';
import { logger } from '@/lib/logger';
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
  type TailoringContext,
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
 * - Cooldown entries persist until the instance is recycled (no automatic cleanup)
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
const CONTEXT_QUERY_TIMEOUT_MS = 6000; // 6 seconds for Convex read contexts

/**
 * Wraps a promise with a timeout, racing against a rejection after the specified duration.
 * Ensures timeout is always cleared using .finally() to prevent memory leaks.
 *
 * @param promise - The promise to race against the timeout
 * @param timeoutMs - Timeout duration in milliseconds
 * @param errorMessage - Error message to throw on timeout
 * @returns Promise that resolves with the original value or rejects on timeout
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

// Type helpers for Convex queries - visibility set to "public" for user-accessible queries
// Note: Using 'any' for args and return types since Convex query signatures vary widely
type QueryReference = FunctionReference<"query", "public", any, any>;
type QueryResult<Ref extends QueryReference> = FunctionReturnType<Ref>;

/**
 * Tailor resume blocks for a specific job description using AI
 */
export async function POST(req: NextRequest) {
  let resumeId: Id<"builder_resumes"> | undefined;
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
    ({ resumeId } = body);
    const { jobDescription, currentBlocks } = body;

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
      logger.warn('Resume ownership verification failed', {
        resumeId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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

    // Set cooldown after verifying ownership
    cooldownMap.set(resumeId, now);

    // Incremental cleanup: filter expired entries first, then cap map size
    if (cooldownMap.size > 100) {
      const CLEANUP_AGE = 60 * 1000; // 1 minute (enough buffer beyond 20s cooldown)
      const MAX_CLEANUP_PER_REQUEST = 10; // Clean up 10 oldest entries at a time

      const expiredEntries = Array.from(cooldownMap.entries())
        .filter(([, timestamp]) => now - timestamp > CLEANUP_AGE)
        .slice(0, MAX_CLEANUP_PER_REQUEST);

      for (const [key] of expiredEntries) {
        cooldownMap.delete(key);
      }

      if (cooldownMap.size > 100) {
        const oldestEntries = Array.from(cooldownMap.entries())
          .sort(([, a], [, b]) => a - b)
          .slice(0, MAX_CLEANUP_PER_REQUEST);

        for (const [key] of oldestEntries) {
          cooldownMap.delete(key);
        }
      }
    }

    // 5. Load supporting resume context with timeout protection
    type TailorContextData = [
      QueryResult<typeof api.users.getUserByClerkId>,
      QueryResult<typeof api.goals.getUserGoals>,
      QueryResult<typeof api.applications.getUserApplications>,
      QueryResult<typeof api.resumes.getUserResumes>,
      QueryResult<typeof api.cover_letters.getUserCoverLetters>,
      QueryResult<typeof api.projects.getUserProjects>
    ];

    const resumeContext: TailoringContext = {
      userProfile: null,
      goals: [],
      applications: [],
      resumes: [],
      coverLetters: [],
      projects: [],
    };

    try {
      // Note: Promise.race cancels waiting on slow responses, but Convex queries
      // continue running in the background. Safe here since these are reads only.
      const [
        userProfile,
        goals,
        applications,
        resumes,
        coverLetters,
        projects,
      ] = await withTimeout(
        Promise.all([
          client.query(api.users.getUserByClerkId, { clerkId: userId }),
          client.query(api.goals.getUserGoals, { clerkId: userId }),
          client.query(api.applications.getUserApplications, { clerkId: userId }),
          client.query(api.resumes.getUserResumes, { clerkId: userId }),
          client.query(api.cover_letters.getUserCoverLetters, { clerkId: userId }),
          client.query(api.projects.getUserProjects, { clerkId: userId }),
        ]),
        CONTEXT_QUERY_TIMEOUT_MS,
        `Convex context queries timed out after ${CONTEXT_QUERY_TIMEOUT_MS}ms`
      ) as TailorContextData;

      resumeContext.userProfile = userProfile ?? null;
      resumeContext.goals = (goals ?? []).slice(0, 5);
      resumeContext.applications = (applications ?? []).slice(0, 5);
      resumeContext.resumes = (resumes ?? []).slice(0, 5);
      resumeContext.coverLetters = (coverLetters ?? []).slice(0, 5);
      resumeContext.projects = (projects ?? []).slice(0, 5);

      logger.debug('Resume context fetched', {
        resumeId,
        hasProfile: Boolean(userProfile),
        goalsCount: goals?.length ?? 0,
        applicationsCount: applications?.length ?? 0,
        resumesCount: resumes?.length ?? 0,
        coverLettersCount: coverLetters?.length ?? 0,
        projectsCount: projects?.length ?? 0,
      });
    } catch (error) {
      if (contextTimeoutHandle) {
        clearTimeout(contextTimeoutHandle);
      }

      logger.warn('Failed to load resume context for tailoring', {
        resumeId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // 6. Generate the tailoring prompt
    const userPrompt = generateTailoringPrompt({
      jobDescription,
      currentBlocks,
      resumeContext,
    });

    logger.info('Tailoring resume for job description', {
      resumeId,
      userId,
      blocksCount: currentBlocks.length,
    });

    // 7. Call OpenAI with retry logic (up to 3 attempts)
    let validatedData: AIResumeResponse | null = null;
    let lastResponse: string = '';
    let lastError: string | null = null;
    const maxAttempts = AI_CONFIG.MAX_RETRY_ATTEMPTS;
    let currentModel = getModel();
    let hasTriedFallback = false;

    let actualAttempts = 0;
    let retriesRemaining = maxAttempts;

    while (retriesRemaining > 0) {
      retriesRemaining--;
      actualAttempts++;

      try {
        logger.debug('AI attempt starting', {
          attempt: actualAttempts,
          maxAttempts,
          model: currentModel,
          resumeId,
        });

        // Adjust prompt for retry attempts
        let currentUserPrompt = userPrompt;
        if (actualAttempts > 1 && lastError) {
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

        const response = await openai.chat.completions.create(
          {
            model: currentModel,
            messages,
            response_format: { type: 'json_object' },
            temperature: AI_CONFIG.TEMPERATURE.PRECISE,
            max_tokens: AI_CONFIG.MAX_TOKENS.LONG,
          },
          {
            timeout: AI_CONFIG.TIMEOUT,
          }
        );

        const content = response.choices[0]?.message?.content || '{"blocks":[]}';
        lastResponse = content;

        logger.debug('AI response received', {
          contentLength: content.length,
          attempt: actualAttempts,
          resumeId,
        });

        // 8. Extract and parse JSON
        const parsed = extractJSONFromResponse(content);

        // 9. Validate with Zod
        const validation = validateAIResponse(parsed);

        if (validation.success && validation.data) {
          validatedData = validation.data;
          logger.info('Resume tailoring validation successful', {
            blocksCount: validatedData.blocks.length,
            attempt: actualAttempts,
            resumeId,
          });
          break;
        } else if (validation.errors) {
          lastError = formatZodErrorsForAI(validation.errors);
          logger.warn('Resume tailoring validation failed', {
            attempt: actualAttempts,
            validationErrors: lastError,
            resumeId,
          });

          if (retriesRemaining === 0) {
            return NextResponse.json({
              error: 'Failed to generate valid resume after multiple attempts',
              validationErrors: lastError,
              lastAttempt: parsed,
            }, { status: 422 });
          }

          continue;
        }
      } catch (error: any) {
        lastError = error.message;
        logger.error('AI call failed during resume tailoring', error, {
          attempt: actualAttempts,
          model: currentModel,
          resumeId,
        });

        // Check if this is a model-related error and we haven't tried the fallback yet
        const isModelError =
          error.code === 'model_not_found' ||
          error.status === 404 ||
          (error.message && /model.*not.*found|invalid.*model/i.test(error.message));

        if (isModelError && !hasTriedFallback && currentModel !== FALLBACK_MODEL) {
          logger.info('Model error detected, falling back', {
            previousModel: currentModel,
            fallbackModel: FALLBACK_MODEL,
            resumeId,
          });
          currentModel = FALLBACK_MODEL;
          hasTriedFallback = true;
          // Don't count this as a failed attempt - retry with fallback model
          retriesRemaining++;
          continue;
        }

        if (retriesRemaining === 0) {
          return NextResponse.json({
            error: `Resume tailoring failed after ${maxAttempts} attempts`,
            details: error.message,
          }, { status: 500 });
        }

        // Exponential backoff before retry
        const backoffDelay = Math.min(1000 * Math.pow(2, actualAttempts - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }

    if (!validatedData) {
      logger.error('Resume tailoring failed - no valid data generated', undefined, {
        resumeId,
        maxAttempts,
      });
      return NextResponse.json({
        error: 'Failed to tailor resume',
      }, { status: 500 });
    }

    logger.info('Resume tailoring completed successfully', {
      resumeId,
      blocksCount: validatedData.blocks.length,
    });

    return NextResponse.json({
      success: true,
      blocks: validatedData.blocks,
      message: `Tailored resume with ${validatedData.blocks.length} blocks`,
    });
  } catch (error: any) {
    logger.error('Resume tailoring error - unexpected exception', error, {
      resumeId,
    });
    return NextResponse.json(
      { error: error.message || 'Failed to tailor resume' },
      { status: 500 }
    );
  }
}
