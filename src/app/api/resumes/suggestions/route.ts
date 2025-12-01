import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { evaluate } from '@/lib/ai-evaluation';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function heuristicSuggestions(resumeText: string, jobDescription: string) {
  const text = (resumeText || '').slice(0, 4000);
  const jd = (jobDescription || '').slice(0, 4000);
  const mostCommon = (s: string) => {
    const tokens = (s.match(/[A-Za-z][A-Za-z0-9+.#-]{3,}/g) || []).map((t) => t.toLowerCase());
    const counts = new Map<string, number>();
    for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
  };
  const jdCommon = mostCommon(jd).slice(0, 30);
  const resumeSet = new Set(mostCommon(text));
  const recommendedSkills = jdCommon.filter((k) => !resumeSet.has(k)).slice(0, 10);
  const improvedSummary = `Experienced professional. Tailor your summary to emphasize: ${recommendedSkills.slice(0, 5).join(', ')}.`;
  return { improvedSummary, recommendedSkills };
}

export async function POST(req: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(req);
  const log = createRequestLogger(correlationId, {
    feature: 'resume',
    httpMethod: 'POST',
    httpPath: '/api/resumes/suggestions',
  });

  const startTime = Date.now();
  log.info('Resume suggestions request started', { event: 'request.start' });

  try {
    const { resumeText, jobDescription } = await req.json();
    if (!resumeText) {
      log.warn('Missing resumeText', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Missing resumeText' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        log.info('Starting OpenAI suggestions', { event: 'ai.request' });
        const client = new OpenAI({ apiKey });
        const prompt = `Improve the RESUME SUMMARY and list RECOMMENDED SKILLS to add based on the JOB DESCRIPTION. Return JSON with { improvedSummary: string, recommendedSkills: string[] }.
RESUME TEXT:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription || ''}`;
        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'Return JSON only. No markdown.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });
        const content = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);

        log.info('OpenAI suggestions completed', { event: 'ai.response' });

        // Evaluate AI-generated suggestions (non-blocking for now)
        try {
          const evalResult = await evaluate({
            tool_id: 'resume-suggestions',
            input: { resumeText, jobDescription },
            output: parsed,
          });

          if (!evalResult.passed) {
            log.warn('Resume suggestions failed AI evaluation', {
              event: 'ai.evaluation.failed',
              extra: {
                score: evalResult.overall_score,
                riskFlagsCount: evalResult.risk_flags?.length ?? 0,
              },
            });
          }
        } catch (evalError) {
          // Don't block on evaluation failures
          log.warn('Error evaluating resume suggestions', {
            event: 'ai.evaluation.error',
            errorCode: toErrorCode(evalError),
          });
        }

        const durationMs = Date.now() - startTime;
        log.info('Resume suggestions request completed', {
          event: 'request.success',
          httpStatus: 200,
          durationMs,
        });

        return NextResponse.json(parsed, {
          headers: { 'x-correlation-id': correlationId },
        });
      } catch (e) {
        log.warn('AI suggestions error, falling back to heuristic', {
          event: 'ai.fallback',
          errorCode: toErrorCode(e),
        });
        const durationMs = Date.now() - startTime;
        log.info('Resume suggestions completed with heuristic', {
          event: 'request.success',
          httpStatus: 200,
          durationMs,
          extra: { method: 'heuristic' },
        });
        return NextResponse.json(heuristicSuggestions(resumeText, jobDescription || ''), {
          headers: { 'x-correlation-id': correlationId },
        });
      }
    }

    log.info('No OpenAI key, using heuristic suggestions', { event: 'ai.not_configured' });
    const durationMs = Date.now() - startTime;
    log.info('Resume suggestions completed with heuristic', {
      event: 'request.success',
      httpStatus: 200,
      durationMs,
      extra: { method: 'heuristic' },
    });
    return NextResponse.json(heuristicSuggestions(resumeText, jobDescription || ''), {
      headers: { 'x-correlation-id': correlationId },
    });
  } catch (e) {
    const durationMs = Date.now() - startTime;
    log.error('Resume suggestions request failed', toErrorCode(e), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
