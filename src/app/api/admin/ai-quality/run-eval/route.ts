import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { NextRequest, NextResponse } from 'next/server';

import { evaluate } from '@/lib/ai-evaluation';
import { AI_TOOL_IDS, type AIToolId } from '@/lib/ai-evaluation/types';
import { getCurrentEnvironment } from '@/lib/ai-quality/prompt-resolver';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Sample inputs for each tool (used for quick testing)
const SAMPLE_INPUTS: Record<AIToolId, Record<string, unknown>> = {
  'resume-generation': {
    jobDescription:
      'Software Engineer role requiring 3+ years experience with React, Node.js, and TypeScript.',
    userProfile: {
      name: 'John Doe',
      experience: '4 years as Full Stack Developer',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
    },
  },
  'resume-analysis': {
    resumeText: 'Experienced software engineer with 5 years building web applications...',
    jobDescription: 'Looking for a senior developer with React and Node.js experience.',
  },
  'resume-optimization': {
    resumeText: 'Software developer with experience in web development...',
    jobDescription: 'Senior Full Stack Developer position.',
    targetKeywords: ['React', 'Node.js', 'AWS'],
  },
  'resume-suggestions': {
    resumeText: 'Junior developer seeking opportunities...',
    sectionType: 'experience',
  },
  'resume-parse': {
    resumeText:
      'John Doe\nSoftware Engineer\njohn@example.com\n\nExperience:\nAcme Corp - Developer (2020-2023)',
  },
  'cover-letter-generation': {
    jobDescription: 'Marketing Manager position at tech startup.',
    userProfile: { name: 'Jane Smith', experience: 'Marketing specialist' },
  },
  'cover-letter-analysis': {
    coverLetterText: 'Dear Hiring Manager, I am excited to apply for the position...',
    jobDescription: 'Marketing Manager role.',
  },
  'ai-coach-response': {
    conversationHistory: [{ role: 'user', content: 'How do I prepare for a technical interview?' }],
    userContext: { careerGoal: 'Become a senior engineer' },
  },
  'ai-coach-message': {
    userMessage: 'What skills should I focus on?',
    conversationContext: 'Career planning discussion',
  },
  'career-path-generation': {
    currentRole: 'Junior Developer',
    targetRole: 'Engineering Manager',
    skills: ['JavaScript', 'React'],
  },
  'career-path-from-job': {
    jobDescription: 'VP of Engineering at Series B startup',
    currentLevel: 'Senior Developer',
  },
  'career-paths-generation': {
    userProfile: { experience: '3 years in software', interests: ['leadership', 'architecture'] },
    numberOfPaths: 3,
  },
  'career-certifications': {
    careerGoal: 'Cloud Architect',
    currentSkills: ['AWS basics', 'Docker'],
  },
};

// Sample outputs for testing evaluation (simulates AI-generated content)
const SAMPLE_OUTPUTS: Record<AIToolId, unknown> = {
  'resume-generation': {
    summary: 'Experienced software engineer with expertise in modern web technologies.',
    experience: [
      {
        title: 'Full Stack Developer',
        company: 'Tech Corp',
        duration: '2020-2024',
        achievements: ['Built React applications serving 100k users', 'Reduced API latency by 40%'],
      },
    ],
    skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
  },
  'resume-analysis': {
    score: 75,
    strengths: ['Strong technical skills', 'Relevant experience'],
    gaps: ['Could add more metrics', 'Missing leadership examples'],
    suggestions: ['Add quantifiable achievements', 'Highlight team collaboration'],
  },
  'resume-optimization': {
    optimizedContent: 'Senior Full Stack Developer with extensive React and Node.js experience...',
    keywordsAdded: ['React', 'Node.js', 'AWS'],
    improvements: ['Added quantifiable metrics', 'Aligned with job requirements'],
  },
  'resume-suggestions': {
    suggestions: [
      'Add specific project outcomes',
      'Include technology stack details',
      'Quantify your impact with numbers',
    ],
  },
  'resume-parse': {
    name: 'John Doe',
    email: 'john@example.com',
    title: 'Software Engineer',
    experience: [{ company: 'Acme Corp', title: 'Developer', dates: '2020-2023' }],
  },
  'cover-letter-generation': {
    content:
      'Dear Hiring Manager,\n\nI am excited to apply for the Marketing Manager position at your innovative startup...',
    paragraphs: ['introduction', 'experience', 'motivation', 'closing'],
  },
  'cover-letter-analysis': {
    score: 80,
    strengths: ['Professional tone', 'Clear interest'],
    improvements: ['Add specific company research', 'Include more achievements'],
  },
  'ai-coach-response': {
    response:
      'Great question! To prepare for a technical interview, focus on these key areas: data structures, algorithms, and system design...',
    suggestedActions: ['Practice coding challenges', 'Review common patterns', 'Prepare questions'],
  },
  'ai-coach-message': {
    message:
      'Based on your goals, I recommend focusing on leadership skills, system architecture, and cloud technologies...',
  },
  'career-path-generation': {
    steps: [
      { title: 'Mid-level Developer', timeline: '1-2 years', skills: ['System design'] },
      { title: 'Senior Developer', timeline: '2-3 years', skills: ['Mentoring', 'Architecture'] },
      { title: 'Tech Lead', timeline: '3-4 years', skills: ['Team leadership'] },
      { title: 'Engineering Manager', timeline: '4-5 years', skills: ['People management'] },
    ],
  },
  'career-path-from-job': {
    path: [
      { role: 'Staff Engineer', yearsRequired: 2 },
      { role: 'Principal Engineer', yearsRequired: 3 },
      { role: 'VP Engineering', yearsRequired: 4 },
    ],
    requiredSkills: ['Strategic thinking', 'Executive communication', 'Budget management'],
  },
  'career-paths-generation': {
    paths: [
      { name: 'Technical Leadership', roles: ['Tech Lead', 'Staff Engineer', 'Principal'] },
      { name: 'Management Track', roles: ['Team Lead', 'Engineering Manager', 'Director'] },
      { name: 'Architecture Focus', roles: ['Senior Dev', 'Architect', 'Chief Architect'] },
    ],
  },
  'career-certifications': {
    recommendations: [
      { name: 'AWS Solutions Architect', priority: 'high', timeline: '3 months' },
      { name: 'Kubernetes Administrator', priority: 'medium', timeline: '4 months' },
    ],
  },
};

export async function POST(req: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(req);
  const log = createRequestLogger(correlationId, {
    feature: 'admin',
    httpMethod: 'POST',
    httpPath: '/api/admin/ai-quality/run-eval',
  });

  const startTime = Date.now();
  log.info('Run eval request started', { event: 'request.start' });

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
    const {
      toolId,
      mode = 'sample',
      customInput,
      customOutput,
    } = body as {
      toolId?: AIToolId;
      mode?: 'sample' | 'custom' | 'all';
      customInput?: Record<string, unknown>;
      customOutput?: unknown;
    };

    // Validate tool ID if provided
    if (toolId && !AI_TOOL_IDS.includes(toolId)) {
      return NextResponse.json(
        { error: `Invalid tool ID: ${toolId}` },
        { status: 400, headers: { 'x-correlation-id': correlationId } },
      );
    }

    const results: Array<{
      toolId: AIToolId;
      passed: boolean;
      score: number;
      riskFlags: string[];
      explanation: string;
      latencyMs: number;
      error?: string;
      // Detailed info for drill-down
      dimensionScores?: Record<string, { name: string; score: number; feedback?: string }>;
      safetyGate?: { passed: boolean; safety_score: number; is_hard_failure: boolean };
      criticalFlagsPresent?: boolean;
      evaluatorModel?: string;
      evaluationVersion?: string;
      inputSnapshot?: Record<string, unknown>;
      outputSnapshot?: unknown;
      // Prompt info
      promptText?: string;
      promptVersion?: string;
    }> = [];

    // Get current environment for prompt resolution
    const env = getCurrentEnvironment();

    // Determine which tools to evaluate
    const toolsToEval = mode === 'all' ? AI_TOOL_IDS : toolId ? [toolId] : AI_TOOL_IDS.slice(0, 3);

    log.info('Running evaluations', {
      event: 'eval.start',
      extra: { toolCount: toolsToEval.length, mode },
    });

    for (const tool of toolsToEval) {
      const evalStartTime = Date.now();

      try {
        const input = mode === 'custom' && customInput ? customInput : SAMPLE_INPUTS[tool];
        const output = mode === 'custom' && customOutput ? customOutput : SAMPLE_OUTPUTS[tool];

        // Fetch the active prompt version for this tool (if any)
        let promptText: string | undefined;
        let promptVersion: string | undefined;
        try {
          const activeVersion = await convex.query(api.ai_prompt_versions.getActiveVersionForTool, {
            toolId: tool,
            env,
          });
          if (activeVersion) {
            promptText = activeVersion.prompt_text;
            promptVersion = activeVersion.version_string;
          }
        } catch (promptError) {
          // Don't fail eval if prompt fetch fails, just log it
          log.warn(`Could not fetch prompt for ${tool}`, {
            event: 'prompt.fetch_error',
            extra: { tool, error: promptError instanceof Error ? promptError.message : 'Unknown' },
          });
        }

        const evalResult = await evaluate({
          tool_id: tool,
          input,
          output: output as Record<string, unknown>,
        });

        const latencyMs = Date.now() - evalStartTime;

        results.push({
          toolId: tool,
          passed: evalResult.passed,
          score: evalResult.overall_score,
          riskFlags: evalResult.risk_flags || [],
          explanation: evalResult.explanation || '',
          latencyMs,
          // Detailed info for drill-down
          dimensionScores: evalResult.dimension_scores,
          safetyGate: evalResult.safety_gate,
          criticalFlagsPresent: evalResult.critical_flags_present,
          evaluatorModel: evalResult.evaluator_model,
          evaluationVersion: evalResult.evaluation_version,
          inputSnapshot: input,
          outputSnapshot: output,
          // Prompt info
          promptText,
          promptVersion,
        });

        log.info(`Evaluation completed for ${tool}`, {
          event: 'eval.completed',
          extra: {
            tool,
            passed: evalResult.passed,
            score: evalResult.overall_score,
            latencyMs,
          },
        });
      } catch (evalError) {
        const latencyMs = Date.now() - evalStartTime;
        log.error(`Evaluation failed for ${tool}`, toErrorCode(evalError), {
          event: 'eval.error',
          extra: { tool },
        });

        results.push({
          toolId: tool,
          passed: false,
          score: 0,
          riskFlags: ['evaluation_error'],
          explanation: evalError instanceof Error ? evalError.message : 'Unknown error',
          latencyMs,
          error: evalError instanceof Error ? evalError.message : 'Unknown error',
        });
      }
    }

    // Calculate summary stats
    const passedCount = results.filter((r) => r.passed).length;
    const avgScore =
      results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;
    const avgLatency =
      results.length > 0 ? results.reduce((sum, r) => sum + r.latencyMs, 0) / results.length : 0;

    const durationMs = Date.now() - startTime;
    log.info('Run eval request completed', {
      event: 'request.success',
      httpStatus: 200,
      durationMs,
      extra: {
        totalTools: results.length,
        passedCount,
        avgScore: avgScore.toFixed(2),
      },
    });

    return NextResponse.json(
      {
        success: true,
        summary: {
          total: results.length,
          passed: passedCount,
          failed: results.length - passedCount,
          passRate: results.length > 0 ? (passedCount / results.length) * 100 : 0,
          avgScore,
          avgLatencyMs: Math.round(avgLatency),
        },
        results,
      },
      { headers: { 'x-correlation-id': correlationId } },
    );
  } catch (err) {
    const durationMs = Date.now() - startTime;
    log.error('Run eval request failed', toErrorCode(err), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });

    return NextResponse.json(
      { error: 'Failed to run evaluations' },
      { status: 500, headers: { 'x-correlation-id': correlationId } },
    );
  }
}
