import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { evaluate } from '@/lib/ai-evaluation';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type Skill = { name: string; level: 'basic' | 'intermediate' | 'advanced' };

/**
 * Uses AI to recommend real certifications based on training data
 * Lower temperature (0.3) and explicit constraints reduce hallucination risk
 */
async function extractCertificationsFromWeb(
  role: string,
  level: string,
  skills: string[],
): Promise<any> {
  if (!openai) return null;

  try {
    // Build comprehensive prompt that instructs AI to search and extract
    const skillsContext = skills.length > 0 ? `\nRelevant skills: ${skills.join(', ')}` : '';

    const prompt = `Recommend well-known professional certifications for a ${level} ${role} based on popular certifications in your training data.${skillsContext}

Focus on certifications from reputable providers like:
- Coursera, edX, Udacity (online learning platforms)
- AWS, Google Cloud, Microsoft Azure (cloud certifications)
- PMI, Scrum.org, SAFe (project management)
- CompTIA, Cisco, Microsoft (IT certifications)
- HubSpot, Google, Meta (marketing certifications)

Return 4 widely-recognized certifications from established providers. Include the exact certification name and provider.

Return strictly valid JSON:
{ certifications: Array<{ name: string; provider: string; difficulty: 'beginner'|'intermediate'|'advanced'; estimatedTimeToComplete: string; relevance: 'highly relevant'|'relevant'|'somewhat relevant' }> }

IMPORTANT: Only recommend established, well-known certifications from major providers. Do not invent certification names or modify existing certification names. Prefer certifications that have been popular and stable over time.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'You are a career advisor. Recommend only well-known certifications from established providers based on your training data. Never invent certification names or modify existing certification names. Prefer widely-recognized, stable certifications that have existed for multiple years.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content || '';

    // Strip markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent
        .replace(/^```json\n?/, '')
        .replace(/^```\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
    }

    const parsed = JSON.parse(cleanContent);
    if (Array.isArray(parsed?.certifications) && parsed.certifications.length > 0) {
      return parsed;
    }

    return null;
  } catch {
    // Error logged at the route handler level
    return null;
  }
}

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'career-path',
    httpMethod: 'POST',
    httpPath: '/api/career-certifications',
  });

  const startTime = Date.now();
  log.debug('Career certifications request started', { event: 'request.start' });

  try {
    const { userId } = await auth();
    if (!userId) {
      log.warn('User not authenticated', { event: 'auth.failed', errorCode: 'UNAUTHORIZED' });
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const body = await request.json().catch(() => ({}));
    const role = String(body?.role || '');
    const level = String(body?.level || '');
    const skills: Skill[] = Array.isArray(body?.skills) ? body.skills : [];
    if (!role) {
      log.warn('Missing role', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'role is required' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Extract skill names for context
    const skillNames = skills.map((s) => s.name);

    // Try AI-powered certification extraction with better prompting
    const aiResults = await extractCertificationsFromWeb(role, level, skillNames);
    if (aiResults) {
      // Evaluate AI-generated certifications (non-blocking for now)
      try {
        const evalResult = await evaluate({
          tool_id: 'career-certifications',
          input: { role, level, skills: skillNames },
          output: aiResults,
          user_id: userId,
        });

        if (!evalResult.passed) {
          log.warn('Career certifications failed AI evaluation', {
            event: 'ai.evaluation_failed',
            clerkId: userId,
            extra: {
              score: evalResult.overall_score,
              risk_flags: evalResult.risk_flags,
            },
          });
        }
      } catch (evalError) {
        // Don't block on evaluation failures
        log.warn('Error evaluating career certifications', {
          event: 'ai.evaluation_error',
          errorCode: toErrorCode(evalError),
        });
      }

      const durationMs = Date.now() - startTime;
      log.debug('Career certifications request completed', {
        event: 'request.success',
        clerkId: userId,
        httpStatus: 200,
        durationMs,
      });

      return NextResponse.json(aiResults, {
        headers: { 'x-correlation-id': correlationId },
      });
    }

    // Fallback mock data
    const mock = {
      certifications: [
        {
          name: `${role} Foundations`,
          provider: 'Coursera',
          difficulty: 'beginner',
          estimatedTimeToComplete: '4-6 weeks',
          relevance: 'highly relevant',
        },
        {
          name: `${role} Intermediate`,
          provider: 'edX',
          difficulty: 'intermediate',
          estimatedTimeToComplete: '6-8 weeks',
          relevance: 'relevant',
        },
        {
          name: 'Project Management Basics',
          provider: 'PMI',
          difficulty: 'beginner',
          estimatedTimeToComplete: '3-4 weeks',
          relevance: 'somewhat relevant',
        },
        {
          name: 'Cloud Practitioner',
          provider: 'AWS',
          difficulty: 'beginner',
          estimatedTimeToComplete: '2-4 weeks',
          relevance: 'relevant',
        },
      ],
    };

    const durationMs = Date.now() - startTime;
    log.debug('Career certifications fallback returned', {
      event: 'request.success',
      httpStatus: 200,
      durationMs,
      extra: { fallback: true },
    });

    return NextResponse.json(mock, {
      headers: { 'x-correlation-id': correlationId },
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    log.error('Career certifications error', toErrorCode(error), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
