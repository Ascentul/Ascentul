import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import {
  RESUME_GENERATION_SYSTEM_PROMPT,
  generateResumePrompt,
  extractJSON,
  type UserProfile,
} from '@/lib/ai/prompts/generate';
import { callAI } from '@/lib/ai/client';
import {
  aiResumeResponseSchema,
  formatZodErrorsForAI,
  type AIResumeResponse,
} from '@/lib/validators/resume';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for AI generation

interface GenerateResumeRequest {
  resumeId: Id<'builder_resumes'>;
  targetRole: string;
  targetCompany?: string;
}

/**
 * POST /api/resume/generate
 * Generate resume blocks using AI
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body: GenerateResumeRequest = await req.json();
    const { resumeId, targetRole, targetCompany } = body;

    if (!resumeId || !targetRole) {
      return NextResponse.json(
        { error: 'Missing required fields: resumeId and targetRole are required' },
        { status: 400 }
      );
    }

    // 3. Initialize Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: 'Convex URL not configured' },
        { status: 500 }
      );
    }

    const convex = new ConvexHttpClient(convexUrl);

    // 4. Verify resume ownership
    let resume;
    try {
      resume = await convex.query(api.builder_resumes_v2.get, {
        id: resumeId,
        clerkId: userId,
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Resume not found or access denied' },
        { status: 404 }
      );
    }

    // 5. Load user profile from Convex
    let userProfile: UserProfile = {};
    try {
      const user = await convex.query(api.users.getByClerkId as any, {
        clerkId: userId,
      });

      if (user) {
        userProfile = {
          name: user.name,
          email: user.email,
          location: user.location,
          linkedin_url: user.linkedin_url,
          github_url: user.github_url,
          website: user.website,
          bio: user.bio,
          skills: user.skills,
          current_position: user.current_position,
          current_company: user.current_company,
          work_history: user.work_history,
          education_history: user.education_history,
        };
      }
    } catch (error) {
      console.warn('Could not load user profile, continuing with minimal data:', error);
    }

    // 6. Build AI prompt
    const userPrompt = generateResumePrompt({
      targetRole,
      targetCompany,
      userProfile,
    });

    console.log('Generating resume with AI for role:', targetRole);

    // 7. Call AI with retry logic (up to 3 attempts)
    let validatedResponse: AIResumeResponse | null = null;
    let lastError: string | null = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`AI attempt ${attempt}/${maxAttempts}`);

        // Adjust prompt for retry attempts
        let currentUserPrompt = userPrompt;
        if (attempt > 1 && lastError) {
          currentUserPrompt = `${userPrompt}\n\n---\nPREVIOUS ATTEMPT FAILED WITH ERRORS:\n${lastError}\n\nPlease fix these errors and provide valid JSON.`;
        }

        // Call AI (automatically uses gpt-4o-mini in dev for faster generation)
        const aiResponse = await callAI(
          RESUME_GENERATION_SYSTEM_PROMPT,
          currentUserPrompt,
          {
            // Model selection is automatic based on environment
            temperature: 0.7,
            maxTokens: 4096,
          }
        );

        console.log('AI response received, length:', aiResponse.length);

        // 8. Extract JSON from response
        let parsedJSON: unknown;
        try {
          parsedJSON = extractJSON(aiResponse);
        } catch (error: any) {
          lastError = `JSON parsing failed: ${error.message}`;
          console.warn(`Attempt ${attempt} - JSON extraction failed:`, error.message);
          continue;
        }

        // 9. Validate with Zod
        const validation = aiResumeResponseSchema.safeParse(parsedJSON);

        if (validation.success) {
          validatedResponse = validation.data;
          console.log('Validation successful, blocks:', validation.data.blocks.length);
          break;
        } else {
          lastError = formatZodErrorsForAI(validation.error);
          console.warn(`Attempt ${attempt} - Validation failed:`, lastError);

          if (attempt === maxAttempts) {
            // Last attempt failed, return validation errors with raw JSON
            return NextResponse.json(
              {
                error: 'AI response validation failed after 3 attempts',
                details: lastError,
                validationErrors: lastError,
                rawResponse: parsedJSON,
                canRetry: true,
              },
              { status: 422 } // Unprocessable Entity
            );
          }
        }
      } catch (error: any) {
        lastError = error.message;
        console.error(`Attempt ${attempt} - AI call failed:`, error);

        if (attempt === maxAttempts) {
          return NextResponse.json(
            {
              error: 'Resume generation failed after 3 attempts',
              details: error.message,
            },
            { status: 500 }
          );
        }
      }
    }

    if (!validatedResponse) {
      return NextResponse.json(
        { error: 'Failed to generate valid resume content' },
        { status: 500 }
      );
    }

    // 10. Upsert blocks in Convex
    console.log('Upserting blocks to Convex...');

    try {
      // Use bulkUpdate to replace all blocks
      await convex.mutation(api.builder_blocks.bulkUpdate, {
        resumeId,
        clerkId: userId,
        blocks: validatedResponse.blocks.map((block) => ({
          type: block.type,
          data: block.data,
          order: block.order,
          locked: false,
        })),
        clearExisting: true, // Clear existing blocks
      });

      console.log('Blocks upserted successfully');
    } catch (error: any) {
      console.error('Failed to upsert blocks:', error);
      return NextResponse.json(
        {
          error: 'Failed to save generated blocks',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // 11. Return success response
    return NextResponse.json({
      success: true,
      resumeId,
      blocksGenerated: validatedResponse.blocks.length,
      blocks: validatedResponse.blocks,
      message: 'Resume generated successfully',
    });
  } catch (error: any) {
    console.error('Resume generation error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
