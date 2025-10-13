/**
 * AI configuration helpers
 */

/**
 * Get the OpenAI model to use for resume generation
 * Defaults to "gpt-5" if not specified
 */
export function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-5";
}

/**
 * Fallback model to use if the primary model fails
 */
export const FALLBACK_MODEL = "gpt-4o-mini";
