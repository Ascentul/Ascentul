import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { evaluate } from '@/lib/ai-evaluation';

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
  } catch (error) {
    console.error('Certification extraction failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const role = String(body?.role || '');
    const level = String(body?.level || '');
    const skills: Skill[] = Array.isArray(body?.skills) ? body.skills : [];
    if (!role) return NextResponse.json({ error: 'role is required' }, { status: 400 });

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
          console.warn('[AI Evaluation] Career certifications failed evaluation:', {
            score: evalResult.overall_score,
            risk_flags: evalResult.risk_flags,
            explanation: evalResult.explanation,
          });
        }
      } catch (evalError) {
        // Don't block on evaluation failures
        console.error('[AI Evaluation] Error evaluating career certifications:', evalError);
      }

      return NextResponse.json(aiResults);
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
    return NextResponse.json(mock);
  } catch (error: any) {
    console.error('POST /api/career-certifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
