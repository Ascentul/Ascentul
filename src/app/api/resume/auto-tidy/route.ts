import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { callAI } from '@/lib/ai/client';
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
 * Auto-tidy resume blocks - improve clarity and impact using AI
 */
export async function POST(req: NextRequest) {
  try {
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

    // Initialize Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 });
    }

    const client = new ConvexHttpClient(convexUrl);

    // Get resume with blocks and verify ownership
    let resumeData;
    try {
      resumeData = await client.query(api.builder_resumes.getResume, {
        id: resumeId,
        clerkId: userId,
      });
    } catch (error) {
      return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 403 });
    }

    if (!resumeData || !resumeData.blocks || resumeData.blocks.length === 0) {
      return NextResponse.json({ error: 'No blocks found to tidy' }, { status: 400 });
    }

    const currentBlocks = resumeData.blocks as ResumeBlock[];

    // Generate the tidy prompt with current blocks
    const userPrompt = generateTidyPrompt(currentBlocks);

    // 3-attempt retry loop with error correction
    let lastError = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // Build prompt with previous errors if this is a retry
        let currentPrompt = userPrompt;
        if (attempt > 1 && lastError) {
          currentPrompt = `${userPrompt}\n\n---\nPREVIOUS ATTEMPT FAILED WITH ERRORS:\n${lastError}\n\nPlease fix these errors and return valid JSON matching the schema exactly. Ensure all required fields are present and all blocks from the original resume are included.`;
        }

        // Call AI with lower temperature for consistency (auto model selection)
        const aiResponse = await callAI(AUTO_TIDY_SYSTEM_PROMPT, currentPrompt, {
          temperature: 0.5,
          maxTokens: 4096,
        });

        // Extract JSON from response
        const parsed = extractJSON(aiResponse);

        // Validate with Zod
        const validation = tidyResponseSchema.safeParse(parsed);

        if (validation.success) {
          const improvedBlocks = validation.data.blocks;

          // Verify we got the same number of blocks back
          if (improvedBlocks.length !== currentBlocks.length) {
            lastError = `Block count mismatch: expected ${currentBlocks.length} blocks, got ${improvedBlocks.length}. You must return ALL blocks in the same order.`;
            if (attempt === 3) {
              return NextResponse.json({
                error: 'Failed to tidy resume: block count mismatch',
                details: lastError,
              }, { status: 500 });
            }
            continue;
          }

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

          if (attempt === 3) {
            return NextResponse.json({
              error: 'Failed to generate valid improved resume after 3 attempts',
              validationErrors: lastError,
            }, { status: 500 });
          }
        }
      } catch (error: any) {
        console.error(`Auto-tidy attempt ${attempt} error:`, error);
        lastError = error.message || 'Unknown error during AI call';

        if (attempt === 3) {
          throw error;
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
