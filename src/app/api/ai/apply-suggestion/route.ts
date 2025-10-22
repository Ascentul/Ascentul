/**
 * Phase 7 - Part A: Apply Suggestion API
 * Applies an AI suggestion to resume content via MutationBroker
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import type {
  ApplySuggestionRequest,
  ApplySuggestionResponse,
} from '@/lib/ai/streaming/types';
import { validateContent, sanitize, type SanitizeResult } from '@/features/resume/ai/guardrails';
import { logEvent } from '@/lib/telemetry';
import { applySuggestionSchema } from './schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Short timeout - simple mutations

/**
 * Guard: Only runs when V2 store flag is enabled
 */
function checkV2Enabled(): boolean {
  return process.env.NEXT_PUBLIC_RESUME_V2_STORE === 'true';
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const rateLimiter = new Map<string, number[]>();

const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;
type IdempotencyStatus = {
  timestamp: number;
  status: 'processing' | 'completed';
  response?: ApplySuggestionResponse;
};
const idempotencyCache = new Map<string, IdempotencyStatus>();

function recordRequestTimestamp(userId: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = rateLimiter.get(userId)?.filter((ts) => ts >= windowStart) ?? [];
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimiter.set(userId, timestamps);
    return false;
  }
  timestamps.push(now);
  rateLimiter.set(userId, timestamps);
  return true;
}

function purgeIdempotencyCache(now: number) {
  for (const [key, entry] of idempotencyCache.entries()) {
    if (now - entry.timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}

function buildIdempotencyKey(resumeId: string, suggestionId: string, customKey?: string) {
  return customKey ?? `${resumeId}:${suggestionId}`;
}

/**
 * Apply a suggestion to a specific block
 * Returns the updated block data
 */
async function applySuggestionToBlock(
  convex: ConvexHttpClient,
  userId: string,
  resumeId: Id<'builder_resumes'>,
  blockId: string,
  suggestion: ApplySuggestionRequest['suggestion'],
  editedContent?: string
): Promise<{ block: any; sanitized: SanitizeResult }> {
  // Fetch the current resume and blocks
  const result = await convex.query(api.builder_resumes.getResume, {
    id: resumeId,
    clerkId: userId,
  });

  if (!result || !result.blocks) {
    throw new Error('Resume or blocks not found');
  }

  const block = result.blocks.find((b: any) => b._id === blockId || b.id === blockId);
  if (!block) {
    throw new Error(`Block ${blockId} not found`);
  }

  // Store resume's current updatedAt for optimistic concurrency
  if (!result.resume.updatedAt) {
    throw new Error('Resume missing updatedAt timestamp - cannot ensure concurrency safety');
  }
  const expectedResumeUpdatedAt = result.resume.updatedAt;

  // Use edited content if provided, otherwise use proposed content
  const contentToApply = editedContent ?? suggestion.proposedContent;
  if (!contentToApply) {
    throw new Error('No content to apply');
  }

  // Phase 7 - Part B: Validate content with guardrails
  const isContactInfo = block.type === 'header';
  const validation = validateContent(contentToApply, {
    isContactInfo,
    allowUrls: isContactInfo || block.type === 'projects',
  });

  if (!validation.ok) {
    console.warn('[apply-suggestion] Guardrail blocked:', validation.reason);
    throw new Error(`Content validation failed: ${validation.reason}`);
  }

  // Phase 7 - Part B: Sanitize content
  const sanitized = sanitize(contentToApply);
  const finalContent = sanitized.text;

  // Log sanitization if any redactions occurred
  if (sanitized.redactions > 0) {
    console.log('[apply-suggestion] Content sanitized:', sanitized.redactions, 'redactions');
  }

  // Apply suggestion based on action type and block type
  const updatedData = applyContentChange(
    block,
    suggestion,
    finalContent
  );

  // Update block via Convex mutation
  await convex.mutation(api.builder_blocks.update, {
    id: block._id as Id<'resume_blocks'>,
    clerkId: userId,
    data: updatedData,
    expectedResumeUpdatedAt,
  });

  // Return updated block
  return {
    block: {
      ...block,
      data: updatedData,
    },
    sanitized,
  };
}

/**
 * Apply content changes based on suggestion type
 *
 * ## Bullet Format Support
 *
 * For experience/project bullets, the function expects:
 * - `newContent`: Plain text content WITHOUT bullet markers (e.g., "Led team of 5 engineers")
 * - `bulletIndex`: Zero-based index of the bullet to replace (e.g., 0 for first bullet)
 * - The function automatically trims whitespace from `newContent`
 *
 * ### Supported Flow:
 * 1. AI generates suggestion with `itemIndex` (which experience/project) and `bulletIndex` (which bullet)
 * 2. API receives clean text content in `newContent` (no markers like "- " or "• ")
 * 3. Function replaces the specific bullet at `items[itemIndex].bullets[bulletIndex]`
 *
 * ### Validation:
 * - Throws if `bulletIndex` is negative or >= bullets.length
 * - Defaults to index 0 if `bulletIndex` is not provided
 * - Creates new bullets array if none exists
 *
 * @param block - Resume block to modify
 * @param suggestion - AI suggestion containing indices and action type
 * @param newContent - Clean text content (pre-sanitized, no bullet markers)
 * @returns Updated block data
 * @throws {Error} If indices are out of bounds or block structure is invalid
 */
function applyContentChange(
  block: any,
  suggestion: ApplySuggestionRequest['suggestion'],
  newContent: string
): any {
  const { actionType, itemIndex, bulletIndex } = suggestion;
  const data = { ...block.data };

  switch (block.type) {
    case 'experience': {
      if (itemIndex !== undefined && data.items && Array.isArray(data.items)) {
        const item = data.items[itemIndex];
        if (!item) {
          throw new Error(`Experience item at index ${itemIndex} not found`);
        }

        // For experience blocks, we typically modify bullets
        if (actionType === 'rewrite_bullet' || actionType === 'strengthen_verb' || actionType === 'add_metric') {
          if (!Array.isArray(item.bullets)) {
            // No bullets yet - create array with new content
            item.bullets = [newContent.trim()];
          } else {
            // Use bulletIndex from suggestion if provided, otherwise default to 0
            const bulletIdx = bulletIndex ?? 0;

            if (bulletIdx < 0 || bulletIdx >= item.bullets.length) {
              throw new Error(
                `Bullet index ${bulletIdx} is out of bounds (bullets array has ${item.bullets.length} items)`
              );
            }

            // Replace the specific bullet at the given index
            item.bullets[bulletIdx] = newContent.trim();
          }
        }

        data.items[itemIndex] = item;
      }
      break;
    }

    case 'summary': {
      if (actionType === 'expand_summary' || actionType === 'condense_text') {
        data.paragraph = newContent;
      }
      break;
    }

    case 'skills': {
      // For skills, content might be comma-separated list
      if (actionType === 'rewrite_bullet') {
        const skills = newContent.split(',').map(s => s.trim()).filter(s => s);
        if (itemIndex === undefined || itemIndex === 0) {
          data.primary = skills;
        } else {
          data.secondary = skills;
        }
      }
      break;
    }

    case 'education': {
      if (itemIndex !== undefined && data.items && Array.isArray(data.items)) {
        // Similar to experience - update specific field
        data.items[itemIndex] = {
          ...data.items[itemIndex],
          // Depending on suggestion, update degree, school, etc.
          // For now, assume we're updating a text field
          description: newContent,
        };
      }
      break;
    }

    case 'projects': {
      if (itemIndex !== undefined && data.items && Array.isArray(data.items)) {
        const item = data.items[itemIndex];
        if (!item) {
          throw new Error(`Project item at index ${itemIndex} not found`);
        }

        // Projects have similar bullet structure to experience
        if (actionType === 'rewrite_bullet' || actionType === 'strengthen_verb' || actionType === 'add_metric') {
          if (!Array.isArray(item.bullets)) {
            // No bullets yet - create array with new content
            item.bullets = [newContent.trim()];
          } else {
            // Use bulletIndex from suggestion if provided, otherwise default to 0
            const bulletIdx = bulletIndex ?? 0;

            if (bulletIdx < 0 || bulletIdx >= item.bullets.length) {
              throw new Error(
                `Bullet index ${bulletIdx} is out of bounds (bullets array has ${item.bullets.length} items)`
              );
            }

            // Replace the specific bullet at the given index
            item.bullets[bulletIdx] = newContent.trim();
          }
        }

        data.items[itemIndex] = item;
      }
      break;
    }

    case 'header':
      throw new Error(`Block type '${block.type}' does not support AI suggestions`);

    default:
      throw new Error(`Unsupported block type: ${block.type}`);
  }

  return data;
}

/**
 * POST /api/ai/apply-suggestion
 * Applies an AI suggestion to resume content
 */
export async function POST(req: NextRequest) {
  let cachedKey: string | null = null;
  try {
    // 1. Check V2 flag
    if (!checkV2Enabled()) {
      return NextResponse.json(
        { error: 'Apply suggestion requires V2 store (NEXT_PUBLIC_RESUME_V2_STORE=true)' },
        { status: 503 }
      );
    }

    // 2. Authenticate user
    const authResult = await auth();
    const { userId } = authResult;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Parse request
    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const parsed = applySuggestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { resumeId, suggestion, editedContent, idempotencyKey } = parsed.data;

    if (!recordRequestTimestamp(userId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please slow down and try again.' },
        { status: 429 }
      );
    }

    const now = Date.now();
    purgeIdempotencyCache(now);

    const idKey = buildIdempotencyKey(resumeId, suggestion.id, idempotencyKey);
    cachedKey = idKey;
    const existing = idempotencyCache.get(idKey);
    if (existing) {
      if (existing.status === 'processing') {
        return NextResponse.json(
          { error: 'Suggestion already processing. Please retry shortly.' },
          { status: 409 }
        );
      }

      if (existing.response) {
        return NextResponse.json(
          { ...existing.response, idempotent: true },
          existing.response.success ? { status: 200 } : { status: 400 }
        );
      }
    }

    idempotencyCache.set(idKey, { timestamp: now, status: 'processing' });

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

    console.log(`[apply-suggestion] Applying suggestion ${suggestion.id} to block ${suggestion.blockId}`);

    // 6. Apply the suggestion
    try {
      const { block: updatedBlock, sanitized } = await applySuggestionToBlock(
        convex,
        userId,
        resumeId as Id<'builder_resumes'>,
        suggestion.blockId,
        suggestion,
        editedContent
      );

      const response: ApplySuggestionResponse = {
        success: true,
        updatedBlock,
        // historyEntryId omitted - client handles history tracking
        sanitized: sanitized.redactions > 0
          ? {
              redactions: sanitized.redactions,
              patterns: sanitized.patterns,
            }
          : undefined,
      };

      console.log(`[apply-suggestion] Successfully applied suggestion ${suggestion.id}`);
      logEvent('ai_suggestion_applied', {
        suggestion_id: suggestion.id,
        action_type: suggestion.actionType,
        block_type: updatedBlock.type,
      });
      if (sanitized.redactions > 0) {
        logEvent('ai_content_sanitized', {
          suggestion_id: suggestion.id,
          redactions: sanitized.redactions,
          patterns: sanitized.patterns,
        });
      }

      idempotencyCache.set(idKey, {
        timestamp: Date.now(),
        status: 'completed',
        response,
      });

      return NextResponse.json(response);
    } catch (error) {
      console.error('[apply-suggestion] Failed to apply:', error);

      // Check if guardrail blocked
      const isGuardrailError = error instanceof Error && error.message.includes('validation failed');
      if (isGuardrailError) {
        const message = error.message;
        const codeMatch = message.match(/validation failed: (.+)/);
        logEvent('ai_guardrail_blocked', {
          suggestion_id: suggestion.id,
          reason: codeMatch?.[1] || 'validation_failed',
        });
      } else {
        logEvent('ai_suggestion_apply_failed', {
          suggestion_id: suggestion.id,
          error: error instanceof Error ? error.message : 'unknown',
        });
      }

      const response: ApplySuggestionResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply suggestion',
      };

      idempotencyCache.delete(idKey);

      return NextResponse.json(response, { status: 400 });
    }
  } catch (error) {
    console.error('[apply-suggestion] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to apply suggestion';
    if (cachedKey) {
      idempotencyCache.delete(cachedKey);
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
