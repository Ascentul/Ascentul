import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory path using ES module approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the models config file
const configPath = path.join(__dirname, '..', 'models_config.json');

// Type definitions
export interface OpenAIModel {
  id: string;
  label: string;
  active: boolean;
}

export interface ModelsConfig {
  models: OpenAIModel[];
}

/**
 * Read the models configuration file
 * @returns The models configuration
 */
export function getModelsConfig(): ModelsConfig {
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data) as ModelsConfig;
  } catch (error) {
    console.error('Error reading models configuration:', error);
    // Return a default configuration in case of error
    return {
      models: [
        { id: 'gpt-4o', label: 'GPT-4o (Default)', active: true }
      ]
    };
  }
}

/**
 * Write the models configuration to file
 * @param config The models configuration to write
 * @returns A boolean indicating success or failure
 */
export function updateModelsConfig(config: ModelsConfig): boolean {
  try {
    // Validate the config before saving
    if (!config || !Array.isArray(config.models)) {
      throw new Error('Invalid configuration format');
    }

    // Format the JSON with indentation for readability
    const data = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, data, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing models configuration:', error);
    return false;
  }
}

/**
 * Get only the active models
 * @returns Array of active models
 */
export function getActiveModels(): OpenAIModel[] {
  const config = getModelsConfig();
  return config.models.filter(model => model.active);
}