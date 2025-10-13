import OpenAI from 'openai';

/**
 * Initialize OpenAI client
 * Use a default key in test environment to prevent initialization errors
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'test-key-for-unit-tests',
});

/**
 * Get the optimal AI model based on environment and task type
 * - Development: Use faster, cheaper models for quick iteration (2-5s)
 * - Production: Use high-quality models for best results (10-20s)
 *
 * @param preferFast - Force using a faster model even in production
 * @returns Model name to use
 */
export function getOptimalModel(preferFast: boolean = false): string {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev || preferFast) {
    // gpt-4o-mini: Faster (2-5s), cheaper, still high quality
    return 'gpt-4o-mini';
  }

  // gpt-4o: Best quality, slower (10-20s)
  return 'gpt-4o';
}

/**
 * Call AI with a prompt (OpenAI GPT-4)
 * This is a simple wrapper that can be extended for Claude or other models
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const model = options?.model || getOptimalModel();
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens || 4096;

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    return content;
  } catch (error: any) {
    console.error('AI call error:', error);
    throw new Error(`AI call failed: ${error.message}`);
  }
}

/**
 * Call AI with retry logic
 */
export async function callAIWithRetry(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    maxRetries?: number;
  }
): Promise<string> {
  const maxRetries = options?.maxRetries || 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callAI(systemPrompt, userPrompt, options);
    } catch (error: any) {
      lastError = error;
      console.warn(`AI call attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('AI call failed after retries');
}
