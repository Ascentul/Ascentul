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