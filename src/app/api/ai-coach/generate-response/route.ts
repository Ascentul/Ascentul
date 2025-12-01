import { auth } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { buildUserContext } from '@/lib/ai-coach-helpers';
import { evaluate } from '@/lib/ai-evaluation';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'ai-coach',
    httpMethod: 'POST',
    httpPath: '/api/ai-coach/generate-response',
  });

  const startTime = Date.now();
  log.info('AI Coach request started', { event: 'request.start' });

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      log.warn('Unauthorized AI Coach request', {
        event: 'auth.failed',
        errorCode: 'UNAUTHORIZED',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }
    const token = await getToken({ template: 'convex' });
    if (!token) {
      log.warn('Failed to obtain auth token', { event: 'auth.failed', errorCode: 'TOKEN_ERROR' });
      return NextResponse.json(
        { error: 'Failed to obtain auth token' },
        {
          status: 401,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    log.info('User authenticated', { event: 'auth.success', clerkId: userId });

    const body = await request.json();
    const { query, conversationHistory = [] } = body;

    if (!query || typeof query !== 'string') {
      log.warn('Invalid query parameter', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Query is required' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Fetch user context data for personalized coaching
    let userContext = '';
    try {
      log.debug('Fetching user context data', { event: 'context.fetch.start' });
      const [userProfile, goals, applications, resumes, coverLetters, projects] = await Promise.all(
        [
          convexServer.query(api.users.getUserByClerkId, { clerkId: userId }, token),
          convexServer.query(api.goals.getUserGoals, { clerkId: userId }, token),
          convexServer.query(api.applications.getUserApplications, { clerkId: userId }, token),
          convexServer.query(api.resumes.getUserResumes, { clerkId: userId }, token),
          convexServer.query(api.cover_letters.getUserCoverLetters, { clerkId: userId }, token),
          convexServer.query(api.projects.getUserProjects, { clerkId: userId }, token),
        ],
      );

      userContext = buildUserContext({
        userProfile,
        goals,
        applications,
        resumes,
        coverLetters,
        projects,
      });
      log.debug('User context fetched successfully', {
        event: 'context.fetch.success',
        extra: {
          goalsCount: goals?.length ?? 0,
          applicationsCount: applications?.length ?? 0,
          resumesCount: resumes?.length ?? 0,
        },
      });
    } catch (error) {
      log.warn('Failed to fetch user context', {
        event: 'context.fetch.error',
        errorCode: toErrorCode(error),
      });
      userContext = 'Unable to load user context data.';
    }

    let response: string;

    const model = process.env.OPENAI_MODEL || 'gpt-4o';

    if (openai) {
      try {
        log.info('Starting OpenAI request', {
          event: 'ai.request',
          extra: { model, historyLength: conversationHistory.length },
        });

        // Build conversation context for the AI
        const systemPrompt = `You are an expert AI Career Coach. Your role is to provide personalized, actionable career advice based on the user's questions and background.

Key guidelines:
- Be supportive, encouraging, and professional
- Provide specific, actionable advice tailored to THIS user's profile, goals, and experience
- Consider current market trends and industry insights
- Help with career planning, skill development, job search strategies, interview preparation, and professional growth
- Reference the user's specific goals, applications, projects, and experience when relevant
- Ask clarifying questions when needed to provide better guidance
- Keep responses concise but comprehensive (aim for 2-4 paragraphs)
- Use a warm, approachable tone while maintaining professionalism

Always remember you're helping someone with their career development and professional growth.

${userContext ? `\n--- USER CONTEXT (Use this to personalize your advice) ---\n${userContext}\n` : ''}`;

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          {
            role: 'system',
            content: systemPrompt,
          },
        ];

        // Add conversation history
        conversationHistory.forEach((msg: any) => {
          messages.push({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.message,
          });
        });

        // Add current query
        messages.push({
          role: 'user',
          content: query,
        });

        const completion = await openai.chat.completions.create({
          model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 1500,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        });

        response =
          completion.choices[0]?.message?.content ||
          'I apologize, but I was unable to generate a response. Please try again.';

        const tokenUsage = completion.usage;
        log.info('OpenAI response received', {
          event: 'ai.response',
          extra: {
            model,
            promptTokens: tokenUsage?.prompt_tokens,
            completionTokens: tokenUsage?.completion_tokens,
            totalTokens: tokenUsage?.total_tokens,
          },
        });

        // Evaluate AI Coach response (non-blocking for now)
        try {
          const evalResult = await evaluate({
            tool_id: 'ai-coach-response',
            input: { query, conversationHistory, userContext },
            output: { response },
            user_id: userId,
          });

          if (!evalResult.passed) {
            log.warn('AI Coach response failed evaluation', {
              event: 'ai.evaluation.failed',
              extra: {
                score: evalResult.overall_score,
                riskFlagsCount: evalResult.risk_flags?.length ?? 0,
              },
            });
          }
        } catch (evalError) {
          // Don't block on evaluation failures
          log.warn('Error evaluating AI Coach response', {
            event: 'ai.evaluation.error',
            errorCode: toErrorCode(evalError),
          });
        }
      } catch (openaiError) {
        log.error('OpenAI API error', toErrorCode(openaiError), {
          event: 'ai.error',
          extra: { model },
        });
        response =
          "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.";
      }
    } else {
      log.warn('OpenAI not configured', { event: 'ai.not_configured' });
      // Fallback response when OpenAI is not available
      response = `Thank you for your question about: "${query}". I'm currently unable to access my AI capabilities. Please ensure the OpenAI API is properly configured, or try again later.`;
    }

    const durationMs = Date.now() - startTime;
    log.info('AI Coach request completed', {
      event: 'request.success',
      httpStatus: 200,
      durationMs,
    });

    return NextResponse.json(
      { response },
      {
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    log.error('AI Coach request failed', toErrorCode(error), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
