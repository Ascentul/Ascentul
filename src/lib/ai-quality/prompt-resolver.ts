/**
 * Prompt Resolver - Client-side helper for resolving prompts in AI routes
 *
 * This module provides utilities for AI route handlers to fetch the active
 * prompt version for their tool and environment.
 */

import { ConvexHttpClient } from 'convex/browser';

import { api } from '../../../convex/_generated/api';
import { AI_TOOL_REGISTRY, AIToolId, Environment } from './types';

/**
 * Resolved prompt result from Convex
 */
export interface ResolvedPrompt {
  versionId: string;
  versionString: string;
  promptText: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  isExperiment: boolean;
  variantName?: string | null;
  experimentId?: string | null;
}

/**
 * Options for the prompt resolver
 */
export interface PromptResolverOptions {
  /** Convex client instance */
  convexClient: ConvexHttpClient;
  /** Current environment */
  env: Environment;
  /** User ID for experiment assignment (optional) */
  userId?: string;
}

/**
 * Get the current environment based on process.env
 */
export function getCurrentEnvironment(): Environment {
  // Check NEXT_PUBLIC_CONVEX_URL for environment hints
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || '';

  // If URL contains 'production' or doesn't have 'dev'/'preview', assume prod
  if (convexUrl.includes('production') || process.env.NODE_ENV === 'production') {
    return 'prod';
  }

  return 'dev';
}

/**
 * Create a prompt resolver for use in API routes
 *
 * @example
 * ```ts
 * const resolver = createPromptResolver({
 *   convexClient: convex,
 *   env: getCurrentEnvironment(),
 * });
 *
 * const prompt = await resolver.resolve('resume-generation');
 * ```
 */
export function createPromptResolver(options: PromptResolverOptions) {
  const { convexClient, env } = options;

  return {
    /**
     * Resolve the active prompt for a tool
     *
     * Returns the prompt text and metadata, or null if no binding exists
     */
    async resolve(toolId: AIToolId): Promise<ResolvedPrompt | null> {
      try {
        // Use the public query to get the active version
        const version = await convexClient.query(api.ai_prompt_versions.getActiveVersionForTool, {
          toolId,
          env,
        });

        if (!version) {
          return null;
        }

        return {
          versionId: version._id,
          versionString: version.version_string,
          promptText: version.prompt_text,
          model: version.model,
          temperature: version.temperature,
          maxTokens: version.max_tokens,
          isExperiment: false, // TODO: Add experiment support via binding query
          variantName: null,
          experimentId: null,
        };
      } catch (error) {
        console.error(`[PromptResolver] Error resolving prompt for ${toolId}:`, error);
        return null;
      }
    },

    /**
     * Resolve prompt with fallback to default
     *
     * If no binding exists, returns the provided fallback prompt
     */
    async resolveWithFallback(
      toolId: AIToolId,
      fallbackPrompt: string,
    ): Promise<{ prompt: string; resolved: boolean; metadata: Partial<ResolvedPrompt> }> {
      const resolved = await this.resolve(toolId);

      if (resolved) {
        return {
          prompt: resolved.promptText,
          resolved: true,
          metadata: {
            versionId: resolved.versionId,
            versionString: resolved.versionString,
            model: resolved.model,
            temperature: resolved.temperature,
            maxTokens: resolved.maxTokens,
            isExperiment: resolved.isExperiment,
            variantName: resolved.variantName,
            experimentId: resolved.experimentId,
          },
        };
      }

      return {
        prompt: fallbackPrompt,
        resolved: false,
        metadata: {
          versionString: 'fallback',
          isExperiment: false,
        },
      };
    },

    /**
     * Get the default model for a tool from the registry
     */
    getDefaultModel(toolId: AIToolId): string {
      return AI_TOOL_REGISTRY[toolId].defaultModel;
    },

    /**
     * Get the current environment
     */
    getEnvironment(): Environment {
      return env;
    },
  };
}

/**
 * Telemetry metadata to include with AI calls
 *
 * Add this to your OpenAI call metadata for tracking
 */
export interface PromptTelemetry {
  tool_id: string;
  version_id?: string;
  version_string: string;
  env: Environment;
  is_experiment: boolean;
  variant_name?: string | null;
  experiment_id?: string | null;
}

/**
 * Create telemetry metadata from resolved prompt
 */
export function createPromptTelemetry(
  toolId: AIToolId,
  env: Environment,
  resolved: Partial<ResolvedPrompt> | null,
): PromptTelemetry {
  return {
    tool_id: toolId,
    version_id: resolved?.versionId,
    version_string: resolved?.versionString || 'fallback',
    env,
    is_experiment: resolved?.isExperiment || false,
    variant_name: resolved?.variantName,
    experiment_id: resolved?.experimentId,
  };
}

/**
 * Helper for server components - wraps the Convex fetch
 *
 * @example
 * ```ts
 * // In an API route
 * const prompt = await fetchPromptForTool('resume-generation', convexClient);
 * ```
 */
export async function fetchPromptForTool(
  toolId: AIToolId,
  convexClient: ConvexHttpClient,
  options?: { env?: Environment; userId?: string },
): Promise<ResolvedPrompt | null> {
  const env = options?.env || getCurrentEnvironment();

  try {
    const version = await convexClient.query(api.ai_prompt_versions.getActiveVersionForTool, {
      toolId,
      env,
    });

    if (!version) {
      return null;
    }

    return {
      versionId: version._id,
      versionString: version.version_string,
      promptText: version.prompt_text,
      model: version.model,
      temperature: version.temperature,
      maxTokens: version.max_tokens,
      isExperiment: false,
      variantName: null,
      experimentId: null,
    };
  } catch (error) {
    console.error(`[fetchPromptForTool] Error for ${toolId}:`, error);
    return null;
  }
}

/**
 * Type guard to check if a tool ID is valid
 */
export function isValidToolId(toolId: string): toolId is AIToolId {
  return toolId in AI_TOOL_REGISTRY;
}
