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

/**
 * AI request configuration constants
 * Centralized configuration for consistent AI behavior across all endpoints
 */
export const AI_CONFIG = {
  // Temperature controls randomness (0 = deterministic, 2 = very random)
  TEMPERATURE: {
    PRECISE: 0.2,      // For structured data generation (resumes, tailoring)
    BALANCED: 0.4,     // For recommendations (certifications)
    CREATIVE: 0.7,     // For creative writing (cover letters, career advice)
  },

  // Maximum tokens to generate
  MAX_TOKENS: {
    SHORT: 1200,       // Brief responses (analysis, certifications)
    MEDIUM: 1500,      // Standard responses (career advice, AI coach)
    LONG: 2800,        // Detailed responses (resume generation, tailoring)
    EXTENDED: 4000,    // Very detailed responses (cover letters, deep dives)
  },

  // Timeout for API calls (in milliseconds)
  TIMEOUT: 30000,      // 30 seconds

  // Retry configuration
  MAX_RETRY_ATTEMPTS: 3,

  // Penalty settings
  PRESENCE_PENALTY: 0.1,
  FREQUENCY_PENALTY: 0.1,
} as const;
