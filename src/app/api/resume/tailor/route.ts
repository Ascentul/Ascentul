import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import OpenAI from 'openai';
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
 * Tailor resume blocks for a specific job description using AI
 */
export async function POST(req: NextRequest) {
  try {
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

    // Initialize Convex client
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 });
    }

    const client = new ConvexHttpClient(convexUrl);

    // Verify resume ownership
    try {
      await client.query(api.builder_resumes.getResume, { id: resumeId });
    } catch (error) {
      return NextResponse.json({ error: 'Resume not found or access denied' }, { status: 403 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Generate the tailoring prompt
    const userPrompt = generateTailoringPrompt({
      jobDescription,
      currentBlocks,
    });

    let attempts = 0;
    const maxAttempts = 3;
    let lastResponse: string = '';
    let validatedData: AIResumeResponse | null = null;

    while (attempts < maxAttempts && !validatedData) {
      attempts++;

      try {
        // Call OpenAI
        const messages: Array<{role: 'system' | 'user', content: string}> = [
          { role: 'system', content: RESUME_SYSTEM_PROMPT },
          { role: 'user', content: attempts === 1 ? userPrompt : lastResponse },
        ];

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content || '{"blocks":[]}';
        lastResponse = content;

        // Extract and parse JSON
        const parsed = extractJSONFromResponse(content);

        // Validate with Zod
        const validation = validateAIResponse(parsed);

        if (validation.success && validation.data) {
          validatedData = validation.data;
          break;
        } else if (validation.errors) {
          // Format errors for AI to fix
          const errorMessage = formatZodErrorsForAI(validation.errors);

          if (attempts < maxAttempts) {
            // Prepare correction prompt for next attempt
            lastResponse = generateCorrectionPrompt({
              validationErrors: errorMessage,
              badJson: content,
            });
          } else {
            // Last attempt failed, return error
            return NextResponse.json({
              error: 'Failed to generate valid resume after multiple attempts',
              validationErrors: errorMessage,
              lastAttempt: parsed,
            }, { status: 500 });
          }
        }
      } catch (error: any) {
        if (attempts >= maxAttempts) {
          throw error;
        }
        // Continue to next attempt
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
      attempts,
    });
  } catch (error: any) {
    console.error('Resume tailoring error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to tailor resume' },
      { status: 500 }
    );
  }
}
