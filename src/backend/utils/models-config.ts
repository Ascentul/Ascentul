import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define the models interface
export interface OpenAIModel {
  id: string;
  label: string;
  active: boolean;
}

export interface ModelsConfig {
  models: OpenAIModel[];
}

// Get the directory name in ESM module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, '../models_config.json');

// Read the models configuration from the JSON file
export function getModelsConfig(): ModelsConfig {
  try {
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(data) as ModelsConfig;
  } catch (error) {
    console.error('Error reading models config:', error);
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
    };
  }
}

// Filter models based on user type (admin or regular user)
export function getFilteredModels(isAdmin: boolean): OpenAIModel[] {
  const config = getModelsConfig();
  
  // Admins can see all models
  if (isAdmin) {
    return config.models;
  }
  
  // Regular users can only see active models
  return config.models.filter(model => model.active);
}

// Default model to fall back to if requested model is not available
export const DEFAULT_MODEL = "gpt-4o";

// Validate if a model ID is valid and active
export function validateModelAndGetId(modelId: string): string {
  try {
    const config = getModelsConfig();
    const activeModels = config.models.filter(model => model.active);
    
    // Check if the requested model exists and is active
    const model = activeModels.find(m => m.id === modelId);
    
    if (model) {
      return model.id;
    }
    
    // If model is not found or not active, return the default model
    console.log(`Model ${modelId} not found or not active. Using default model: ${DEFAULT_MODEL}`);
    return DEFAULT_MODEL;
  } catch (error) {
    console.error('Error validating model:', error);
    return DEFAULT_MODEL;
  }
}

// Update the models configuration
export function updateModelsConfig(updatedModels: OpenAIModel[]): boolean {
  try {
    const config: ModelsConfig = { models: updatedModels };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error updating models config:', error);
    return false;
  }
}