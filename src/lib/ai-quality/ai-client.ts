/**
 * AI Client with Prompt Resolution
 *
 * This module provides a wrapper around OpenAI that automatically resolves
 * prompts from the AI Quality Center and records telemetry/eval data.
 *
 * Usage:
 * ```ts
 * import { createAIClient } from '@/lib/ai-quality/ai-client';
 *
 * const aiClient = await createAIClient();
 * const result = await aiClient.generateWithPrompt({
 *   toolId: 'resume-generation',
 *   userMessage: profileContext + '\n\nJob Description:\n' + jobDescription,
 *   fallbackSystemPrompt: 'You are a professional resume writer...',
 * });
 * ```
 */

import { ConvexHttpClient } from 'convex/browser';
import OpenAI from 'openai';

import {
  createPromptTelemetry,
  fetchPromptForTool,
  getCurrentEnvironment,
  type ResolvedPrompt,
} from './prompt-resolver';
import { AI_TOOL_REGISTRY, type AIToolId, type Environment } from './types';

export interface AIClientOptions {
  openaiApiKey?: string;
  convexUrl?: string;
  environment?: Environment;
}

export interface GenerateOptions {
  toolId: AIToolId;
  userMessage: string;
  fallbackSystemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' | 'text' };
  userId?: string;
}

export interface GenerateResult {
  content: string;
  promptMetadata: {
    versionId?: string;
    versionString: string;
    resolved: boolean;
    isExperiment: boolean;
    variantName?: string | null;
  };
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  model: string;
}

/**
 * Create an AI client with prompt resolution capabilities
 */
export async function createAIClient(options: AIClientOptions = {}) {
  const openaiApiKey = options.openaiApiKey || process.env.OPENAI_API_KEY;
  const convexUrl = options.convexUrl || process.env.NEXT_PUBLIC_CONVEX_URL;
  const env = options.environment || getCurrentEnvironment();

  if (!openaiApiKey) {
    throw new Error('OpenAI API key is required');
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });
  const convexClient = convexUrl ? new ConvexHttpClient(convexUrl) : null;

  return {
    /**
     * Generate content using a versioned prompt from the AI Quality Center
     */
    async generateWithPrompt(opts: GenerateOptions): Promise<GenerateResult> {
      const startTime = Date.now();

      // Try to resolve prompt from Convex
      let resolvedPrompt: ResolvedPrompt | null = null;
      if (convexClient) {
        try {
          resolvedPrompt = await fetchPromptForTool(opts.toolId, convexClient, {
            env,
            userId: opts.userId,
          });
        } catch (error) {
          console.warn(`[AIClient] Failed to resolve prompt for ${opts.toolId}, using fallback`);
        }
      }

      // Determine which prompt to use
      const systemPrompt = resolvedPrompt?.promptText || opts.fallbackSystemPrompt;
      const model =
        resolvedPrompt?.model || opts.model || AI_TOOL_REGISTRY[opts.toolId].defaultModel;
      const temperature = resolvedPrompt?.temperature ?? opts.temperature ?? 0.7;
      const maxTokens = resolvedPrompt?.maxTokens || opts.maxTokens || 4096;

      // Call OpenAI
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: opts.userMessage },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: opts.responseFormat,
      });

      const latencyMs = Date.now() - startTime;
      const content = response.choices[0]?.message?.content || '';

      // Build metadata
      const promptMetadata = {
        versionId: resolvedPrompt?.versionId,
        versionString: resolvedPrompt?.versionString || 'fallback',
        resolved: !!resolvedPrompt,
        isExperiment: resolvedPrompt?.isExperiment || false,
        variantName: resolvedPrompt?.variantName,
      };

      // Create telemetry (can be used for logging)
      const _telemetry = createPromptTelemetry(opts.toolId, env, resolvedPrompt);

      return {
        content,
        promptMetadata,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        latencyMs,
        model,
      };
    },

    /**
     * Get evaluation recording metadata for use with server-side recording
     *
     * Note: Evaluation recording should be done via Convex internal mutation
     * from a server context (API route or server action), not from the client.
     */
    getEvalMetadata(opts: {
      toolId: AIToolId;
      input: unknown;
      output: unknown;
      score?: number;
      passed: boolean;
      riskFlags?: string[];
      evaluatorReason?: string;
      latencyMs?: number;
      tokenCount?: number;
      modelUsed?: string;
      promptMetadata?: GenerateResult['promptMetadata'];
    }) {
      return {
        toolId: opts.toolId,
        versionId: opts.promptMetadata?.versionId,
        versionString: opts.promptMetadata?.versionString,
        env,
        input: opts.input,
        output: opts.output,
        score: opts.score,
        passed: opts.passed,
        riskFlags: opts.riskFlags,
        evaluatorReason: opts.evaluatorReason,
        latencyMs: opts.latencyMs,
        tokenCount: opts.tokenCount,
        modelUsed: opts.modelUsed,
        isExperiment: opts.promptMetadata?.isExperiment,
        variantName: opts.promptMetadata?.variantName,
      };
    },

    /**
     * Get the current environment
     */
    getEnvironment(): Environment {
      return env;
    },

    /**
     * Direct access to the OpenAI client for custom operations
     */
    getOpenAIClient(): OpenAI {
      return openai;
    },
  };
}

/**
 * Example integration for an API route:
 *
 * ```ts
 * // In src/app/api/resumes/generate/route.ts
 *
 * import { createAIClient } from '@/lib/ai-quality/ai-client';
 * import { evaluate } from '@/lib/ai-evaluation';
 *
 * export async function POST(req: NextRequest) {
 *   const { jobDescription, userProfile } = await req.json();
 *
 *   // Create AI client with prompt resolution
 *   const aiClient = await createAIClient();
 *
 *   // Generate with automatic prompt resolution
 *   const result = await aiClient.generateWithPrompt({
 *     toolId: 'resume-generation',
 *     userMessage: buildUserMessage(jobDescription, userProfile),
 *     fallbackSystemPrompt: FALLBACK_RESUME_PROMPT,
 *     responseFormat: { type: 'json_object' },
 *   });
 *
 *   // Parse the result
 *   const resume = JSON.parse(result.content);
 *
 *   // Run evaluation
 *   const evalResult = await evaluate({
 *     tool_id: 'resume-generation',
 *     input: { jobDescription, userProfile },
 *     output: resume,
 *   });
 *
 *   // Record the evaluation with prompt version tracking
 *   await aiClient.recordEvaluation({
 *     toolId: 'resume-generation',
 *     input: { jobDescription, userProfile },
 *     output: resume,
 *     score: evalResult.score,
 *     passed: evalResult.passed,
 *     riskFlags: evalResult.risk_flags,
 *     latencyMs: result.latencyMs,
 *     tokenCount: result.usage?.totalTokens,
 *     modelUsed: result.model,
 *     promptMetadata: result.promptMetadata,
 *   });
 *
 *   return NextResponse.json({
 *     resume,
 *     meta: {
 *       promptVersion: result.promptMetadata.versionString,
 *       isExperiment: result.promptMetadata.isExperiment,
 *     },
 *   });
 * }
 * ```
 */
