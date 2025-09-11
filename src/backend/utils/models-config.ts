import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { ENV } from "../../config/env"

// Define the models interface
export interface OpenAIModel {
  id: string
  label: string
  active: boolean
}

export interface ModelsConfig {
  models: OpenAIModel[]
}

// Get the directory name in ESM module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CONFIG_PATH = path.join(__dirname, "../models_config.json")

// Define available models
const AVAILABLE_MODELS = {
  "gpt-4o-mini": "gpt-4o-mini", // Smaller, faster, more cost-effective model
  "gpt-4o": "gpt-4o", // Full-sized model, more capable but more expensive
  "gpt-3.5-turbo": "gpt-3.5-turbo" // Legacy model
}

// Read the models configuration from the JSON file
export function getModelsConfig(): ModelsConfig {
  try {
    const data = fs.readFileSync(CONFIG_PATH, "utf8")
    return JSON.parse(data) as ModelsConfig
  } catch (error) {
    console.error("Error reading models config:", error)
    // Return a default configuration if there's an error
    return {
      models: [
        {
          id: "gpt-4o",
          label: "GPT-4o",
          active: true
        },
        {
          id: "gpt-3.5-turbo",
          label: "GPT-3.5 Turbo",
          active: true
        }
      ]
    }
  }
}

// Filter models based on user type (admin or regular user)
export function getFilteredModels(isAdmin: boolean): OpenAIModel[] {
  const config = getModelsConfig()

  // Admins can see all models
  if (isAdmin) {
    return config.models
  }

  // Regular users can only see active models
  return config.models.filter((model) => model.active)
}

// Set the default model to gpt-4o-mini
export const DEFAULT_MODEL = "gpt-4o-mini"

// Custom error for invalid model IDs
class InvalidModelError extends Error {
  constructor(modelId: string) {
    super(`Invalid model ID: ${modelId}`)
    this.name = "InvalidModelError"
  }
}

/**
 * Validates a model ID and returns the correct ID if it's valid
 * @param modelId The model ID to validate
 * @returns The validated model ID
 * @throws InvalidModelError if the model ID is invalid
 */
export function validateModelAndGetId(modelId: string): string {
  // Check if the model ID is in the available models
  if (Object.keys(AVAILABLE_MODELS).includes(modelId)) {
    return AVAILABLE_MODELS[modelId as keyof typeof AVAILABLE_MODELS]
  }

  // If not a direct match, try to match a prefix
  for (const [key, value] of Object.entries(AVAILABLE_MODELS)) {
    if (modelId.startsWith(key)) {
      return value
    }
  }

  // If we're in development mode, default to the default model
  if (ENV.NODE_ENV !== "production") {

    return false
  }
}
