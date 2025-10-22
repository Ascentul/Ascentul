/**
 * Phase 7 - Part A: Streaming Suggestions API
 * Streams AI-generated improvement suggestions for resume content
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { openai } from '@/lib/ai/openaiClient';
import { getModel, AI_CONFIG } from '@/lib/ai/aiConfig';
import { SUGGESTIONS_SYSTEM_PROMPT, generateSuggestionsPrompt } from '@/lib/ai/prompts/suggestions';
import {
  createSSEStream,
  createDurationTracker,
} from '@/lib/ai/streaming/utils';
import type {
  StreamSuggestionsRequest,
  AISuggestion,
  StreamChunk,
} from '@/lib/ai/streaming/types';
import type { ResumeBlock } from '@/lib/validators/resume';
import { validateContent } from '@/features/resume/ai/guardrails';
import { logEvent } from '@/lib/telemetry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Guard: Only runs when V2 store flag is enabled
 */
function checkV2Enabled(): boolean {
  return process.env.NEXT_PUBLIC_RESUME_V2_STORE === 'true';
}

/**
 * Parse AI response and extract suggestions
 * Handles both streaming chunks and complete responses
 */
function parseSuggestions(text: string): AISuggestion[] {
  try {
    // Remove markdown code blocks if present
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
    }

    // Find JSON object or array
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    // Extract suggestions array from response
    const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];

    // Add unique IDs to suggestions that don't have them
    return suggestions.map((s: AISuggestion, index: number) => ({
      id: s.id || `suggestion-${Date.now()}-${Math.random().toString(36).slice(2, 11)}-${index}`,
      actionType: s.actionType || 'rewrite_bullet',
      severity: s.severity || 'info',
      message: s.message || 'Improve content',
      detail: s.detail,
      blockId: s.blockId,
      itemIndex: s.itemIndex,
      proposedContent: s.proposedContent,
      confidence: s.confidence,
    }));
  } catch (error) {
    console.error('[parseSuggestions] Failed to parse:', error);
    return [];
  }
}

/**
 * POST /api/ai/stream-suggestions
 * Streams AI suggestions for resume improvement
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Check V2 flag
    if (!checkV2Enabled()) {
      return NextResponse.json(
        { error: 'Streaming suggestions require V2 store (NEXT_PUBLIC_RESUME_V2_STORE=true)' },
        { status: 503 }
      );
    }

    // 2. Check OpenAI configuration
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI not configured. OPENAI_API_KEY environment variable is missing.' },
        { status: 503 }
      );
    }

    // 3. Authenticate user
    const authResult = await auth();
    const { userId } = authResult;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Parse request
    let body: StreamSuggestionsRequest;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { resumeId, blockIds, targetRole, targetCompany } = body;

    if (!resumeId) {
      return NextResponse.json(
        { error: 'Missing required field: resumeId' },
        { status: 400 }
      );
    }

    // Phase 7 - Part B: Validate context (targetRole, targetCompany if provided)
    if (targetRole) {
      const roleValidation = validateContent(targetRole, { maxWords: 50 });
      if (!roleValidation.ok) {
        logEvent('ai_guardrail_blocked', {
          field: 'targetRole',
          reason: roleValidation.reason,
        });
        return NextResponse.json(
          { error: `Invalid target role: ${roleValidation.reason}` },
          { status: 400 }
        );
      }
    }

    if (targetCompany) {
      const companyValidation = validateContent(targetCompany, { maxWords: 50 });
      if (!companyValidation.ok) {
        logEvent('ai_guardrail_blocked', {
          field: 'targetCompany',
          reason: companyValidation.reason,
        });
        return NextResponse.json(
          { error: `Invalid target company: ${companyValidation.reason}` },
          { status: 400 }
        );
      }
    }

    // 5. Initialize Convex client
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

    // 6. Verify resume ownership and fetch blocks
    let resume: any;
    try {
      resume = await convex.query(api.builder_resumes.getResume, {
        id: resumeId as Id<'builder_resumes'>,
        clerkId: userId,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Resume not found or access denied' },
        { status: 403 }
      );
    }

    // Filter blocks if specific IDs requested
    let blocksToAnalyze: ResumeBlock[] = resume.blocks || [];
    if (blockIds && blockIds.length > 0) {
      blocksToAnalyze = blocksToAnalyze.filter((block: any) =>
        blockIds.includes(block._id || block.id)
      );
    }

    if (blocksToAnalyze.length === 0) {
      return NextResponse.json(
        { error: 'No blocks to analyze' },
        { status: 400 }
      );
    }

    console.log(`[stream-suggestions] Analyzing ${blocksToAnalyze.length} blocks for resume ${resumeId}`);

    // 7. Create streaming response
    const model = getModel();
    const tracker = createDurationTracker();

    const stream = createSSEStream(async (send) => {
      // Send metadata chunk
      const metadataChunk: StreamChunk = {
        type: 'metadata',
        timestamp: Date.now(),
        data: {
          model,
          analyzedBlocks: blocksToAnalyze.length,
        },
      };
      send(metadataChunk);

      try {
        // Build prompt
        const userPrompt = generateSuggestionsPrompt(blocksToAnalyze, {
          targetRole,
          targetCompany,
        });

        // Call OpenAI with streaming disabled (we'll parse complete response)
        // Note: We're not using OpenAI streaming here to keep response parsing simpler
        // Future enhancement: implement true token-by-token streaming
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: SUGGESTIONS_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: AI_CONFIG.TEMPERATURE.PRECISE,
          max_tokens: AI_CONFIG.MAX_TOKENS.MEDIUM,
          timeout: 45000, // 45 seconds - leave buffer before maxDuration
        });
          },
          {
            timeout: AI_CONFIG.TIMEOUT,
          }
        );

        const aiResponse = completion.choices[0]?.message?.content || '';

        // Parse suggestions from response
        const suggestions = parseSuggestions(aiResponse);

        console.log(`[stream-suggestions] Generated ${suggestions.length} suggestions`);

        // Send each suggestion as a chunk
        for (const suggestion of suggestions) {
          const suggestionChunk: StreamChunk = {
            type: 'suggestion',
            timestamp: Date.now(),
            data: suggestion,
          };
          send(suggestionChunk);
        }

        // Send done chunk
        const doneChunk: StreamChunk = {
          type: 'done',
          timestamp: Date.now(),
          data: {
            totalSuggestions: suggestions.length,
            durationMs: tracker.getDuration(),
          },
        };
        send(doneChunk);
      } catch (error) {
        console.error('[stream-suggestions] OpenAI error:', error);

        // Send error chunk
        const errorChunk: StreamChunk = {
          type: 'error',
          timestamp: Date.now(),
          data: {
            code: 'OPENAI_ERROR',
            message: error instanceof Error ? error.message : 'Failed to generate suggestions',
          },
        };
        send(errorChunk);
      }
    });

    // Return streaming response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[stream-suggestions] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to stream suggestions';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
