import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { AI_TOOL_REGISTRY, type AIToolId } from '@/lib/ai-quality/types';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface EvalResultForSuggestion {
  toolId: string;
  passed: boolean;
  score: number;
  riskFlags: string[];
  explanation: string;
  dimensionScores?: Record<string, { name: string; score: number; feedback?: string }>;
  promptText?: string;
  promptVersion?: string;
  inputSnapshot?: Record<string, unknown>;
  outputSnapshot?: unknown;
}

export async function POST(req: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(req);
  const log = createRequestLogger(correlationId, {
    feature: 'admin',
    httpMethod: 'POST',
    httpPath: '/api/admin/ai-quality/suggest-improvements',
  });

  const startTime = Date.now();
  log.info('Suggest improvements request started', { event: 'request.start' });

  try {
    // Verify super_admin access
    const { userId } = await auth();
    if (!userId) {
      log.warn('Unauthorized request', { event: 'auth.failed' });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: { 'x-correlation-id': correlationId } },
      );
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata as Record<string, unknown>)?.role;

    if (role !== 'super_admin') {
      log.warn('Forbidden - not super_admin', { event: 'auth.forbidden' });
      return NextResponse.json(
        { error: 'Forbidden - super_admin access required' },
        { status: 403, headers: { 'x-correlation-id': correlationId } },
      );
    }

    const body = await req.json();
    const { evalResult } = body as { evalResult: EvalResultForSuggestion };

    if (!evalResult || !evalResult.toolId) {
      return NextResponse.json(
        { error: 'Missing evalResult in request body' },
        { status: 400, headers: { 'x-correlation-id': correlationId } },
      );
    }

    const toolConfig = AI_TOOL_REGISTRY[evalResult.toolId as AIToolId];
    const toolName = toolConfig?.displayName || evalResult.toolId;

    // Build context for the AI suggestion generator
    const dimensionFeedback = evalResult.dimensionScores
      ? Object.entries(evalResult.dimensionScores)
          .map(
            ([key, dim]) =>
              `- ${dim.name}: ${dim.score}/5${dim.feedback ? ` (${dim.feedback})` : ''}`,
          )
          .join('\n')
      : 'No dimension scores available';

    const riskFlagsStr = evalResult.riskFlags.length > 0 ? evalResult.riskFlags.join(', ') : 'None';

    const promptPreview = evalResult.promptText
      ? evalResult.promptText.length > 2000
        ? evalResult.promptText.substring(0, 2000) + '...[truncated]'
        : evalResult.promptText
      : 'No prompt text available';

    const systemPrompt = `You are an expert AI prompt engineer helping to improve AI prompts for a career development platform.

Your task is to analyze evaluation results for an AI tool and provide specific, actionable suggestions to improve the prompt.

Focus on:
1. Specific weaknesses identified in the dimension scores
2. Risk flags that were triggered
3. The relationship between the prompt structure and the output quality
4. Concrete changes that would improve scores in weak dimensions

Be specific and practical. Reference actual parts of the prompt when suggesting changes.
Format your response as a JSON object with the following structure:
{
  "summary": "Brief 1-2 sentence summary of main issues",
  "suggestions": [
    {
      "priority": "high" | "medium" | "low",
      "dimension": "which dimension this addresses",
      "issue": "what the problem is",
      "suggestion": "specific change to make",
      "example": "optional example of improved prompt text"
    }
  ],
  "overallRecommendation": "high-level recommendation for prompt improvement"
}`;

    const userPrompt = `Analyze this evaluation result for the "${toolName}" AI tool and suggest improvements:

## Evaluation Summary
- **Tool**: ${toolName}
- **Passed**: ${evalResult.passed ? 'Yes' : 'No'}
- **Overall Score**: ${evalResult.score}/5
- **Prompt Version**: ${evalResult.promptVersion || 'Unknown'}

## Dimension Scores
${dimensionFeedback}

## Risk Flags
${riskFlagsStr}

## Evaluator Explanation
${evalResult.explanation || 'No explanation provided'}

## Current Prompt
\`\`\`
${promptPreview}
\`\`\`

## Sample Input Used
\`\`\`json
${JSON.stringify(evalResult.inputSnapshot, null, 2)}
\`\`\`

## Sample Output Generated
\`\`\`json
${JSON.stringify(evalResult.outputSnapshot, null, 2).substring(0, 1500)}
\`\`\`

Based on this analysis, provide specific suggestions to improve the prompt to get better evaluation scores.`;

    log.info('Generating AI suggestions', {
      event: 'ai.generate_start',
      extra: { toolId: evalResult.toolId, score: evalResult.score },
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let suggestions;
    try {
      suggestions = JSON.parse(content);
    } catch {
      suggestions = {
        summary: 'Unable to parse AI response',
        suggestions: [],
        overallRecommendation: content,
      };
    }

    const durationMs = Date.now() - startTime;
    log.info('Suggest improvements request completed', {
      event: 'request.success',
      httpStatus: 200,
      durationMs,
      extra: { toolId: evalResult.toolId, suggestionCount: suggestions.suggestions?.length || 0 },
    });

    return NextResponse.json(
      {
        success: true,
        toolId: evalResult.toolId,
        toolName,
        ...suggestions,
      },
      { headers: { 'x-correlation-id': correlationId } },
    );
  } catch (err) {
    const durationMs = Date.now() - startTime;
    log.error('Suggest improvements request failed', toErrorCode(err), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });

    // Check if it's a rate limit error
    if (err instanceof Error && err.message.includes('429')) {
      return NextResponse.json(
        {
          error: 'OpenAI rate limit exceeded. Please try again later.',
          fallbackSuggestions: {
            summary: 'Unable to generate AI suggestions due to rate limiting',
            suggestions: [
              {
                priority: 'medium',
                dimension: 'general',
                issue: 'AI suggestion service temporarily unavailable',
                suggestion:
                  'Review the dimension scores manually and focus on dimensions scoring below 3',
              },
            ],
            overallRecommendation: 'Focus on improving the lowest-scoring dimensions first.',
          },
        },
        { status: 429, headers: { 'x-correlation-id': correlationId } },
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate improvement suggestions' },
      { status: 500, headers: { 'x-correlation-id': correlationId } },
    );
  }
}
