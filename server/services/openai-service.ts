import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { validateModelAndGetId, DEFAULT_MODEL } from "../utils/models-config";
import { logOpenAIUsage, OpenAILogEntry } from "../utils/openai-logger";

// Import the OpenAI instance from the main file
import { openaiInstance } from "../openai";

/**
 * Get the OpenAI instance with logging wrapper
 */
export function getOpenAIWithLogging() {
  // Return a wrapped version that includes logging
  return {
    chat: {
      completions: {
        create: async (params: any) => {
          const userId = params.userId || "anonymous";
          const userSelectedModel = params.model;
          
          // Validate the model or use default
          const validatedModel = validateModelAndGetId(userSelectedModel) || DEFAULT_MODEL;
          
          // Store original model for logging
          const requestedModel = userSelectedModel || DEFAULT_MODEL;
          
          // Replace with validated model
          params.model = validatedModel;
          
          // Remove userId from params if it exists (not part of OpenAI API)
          if (params.userId) {
            delete params.userId;
          }
          
          // Track request time
          const startTime = new Date();
          
          try {
            // Make the actual API call
            const response = await openaiInstance.chat.completions.create(params);
            
            // Log the successful API call
            const logEntry: OpenAILogEntry = {
              userId,
              timestamp: startTime.toISOString(),
              model: response.model,  // Use actual model from response
              prompt_tokens: response.usage?.prompt_tokens || 0,
              completion_tokens: response.usage?.completion_tokens || 0,
              total_tokens: response.usage?.total_tokens || 0,
              status: "success",
              endpoint: "chat.completions",
            };
            
            // Log the usage
            logOpenAIUsage(logEntry);
            
            return response;
          } catch (error: any) {
            // Log the failed API call
            const logEntry: OpenAILogEntry = {
              userId,
              timestamp: startTime.toISOString(),
              model: requestedModel,  // Use requested model since we don't have a response
              prompt_tokens: 0,  // We don't know token usage for failed requests
              completion_tokens: 0,
              total_tokens: 0,
              status: "error",
              error: error.message || "Unknown error",
              endpoint: "chat.completions",
            };
            
            // Log the error
            logOpenAIUsage(logEntry);
            
            // Re-throw the error
            throw error;
          }
        }
      }
    }
  };
}

/**
 * Wrapper function for generating chat completions with logs
 */
export async function createChatCompletionWithLogs({
  messages,
  model = DEFAULT_MODEL,
  temperature = 0.7,
  userId = "anonymous",
  max_tokens,
  responseFormat
}: {
  messages: ChatCompletionMessageParam[];
  model?: string;
  temperature?: number;
  userId?: string | number;
  max_tokens?: number;
  responseFormat?: { type: string };
}) {
  const openai = getOpenAIWithLogging();
  
  return await openai.chat.completions.create({
    messages,
    model,
    temperature,
    userId,
    max_tokens,
    response_format: responseFormat
  });
}