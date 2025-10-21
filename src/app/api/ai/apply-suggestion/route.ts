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
import { validateContent, sanitize } from '@/features/resume/ai/guardrails';
import { logEvent } from '@/lib/telemetry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Short timeout - simple mutations

/**
 * Guard: Only runs when V2 store flag is enabled
 */
function checkV2Enabled(): boolean {
  return process.env.NEXT_PUBLIC_RESUME_V2_STORE === 'true';
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
): Promise<any> {
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
    suggestion.actionType,
    suggestion.itemIndex,
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
    ...block,
    data: updatedData,
  };
}

/**
 * Apply content changes based on suggestion type
 */
function applyContentChange(
  block: any,
  actionType: string,
  itemIndex: number | undefined,
  newContent: string
): any {
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
          // Parse bullet index from suggestion if available
          // For now, assume we're rewriting the entire bullets array or specific bullet
          // This is simplified - in production, you'd parse more precisely
          if (Array.isArray(item.bullets)) {
            // If newContent looks like a single bullet, replace first bullet
            // Otherwise, try to parse as bullet list
            const bulletLines = newContent.split('\n').filter(line => line.trim());
            if (bulletLines.length === 1) {
              // Single bullet - replace first or specified bullet
              item.bullets[0] = newContent.trim();
            } else {
              // Multiple bullets - replace all
              item.bullets = bulletLines.map(line => line.replace(/^[-•*]\s*/, '').trim());
            }
          } else {
            // No bullets yet - create array with new content
            item.bullets = [newContent.trim()];
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

    case 'header':
    case 'projects':
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
    let body: ApplySuggestionRequest;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { resumeId, suggestion, editedContent } = body;

    if (!resumeId || !suggestion) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeId and suggestion' },
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

    console.log(`[apply-suggestion] Applying suggestion ${suggestion.id} to block ${suggestion.blockId}`);

    // 6. Apply the suggestion
    try {
      const updatedBlock = await applySuggestionToBlock(
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
        historyEntryId: `ai-apply-${Date.now()}`, // Client will handle history
      };

      console.log(`[apply-suggestion] Successfully applied suggestion ${suggestion.id}`);
      logEvent('ai_suggestion_applied', {
        suggestion_id: suggestion.id,
        action_type: suggestion.actionType,
        block_type: updatedBlock.type,
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

      return NextResponse.json(response, { status: 400 });
    }
  } catch (error) {
    console.error('[apply-suggestion] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to apply suggestion';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
