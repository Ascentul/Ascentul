export interface OpenAIModel {
  id: string;
  label: string;
  active: boolean;
}

export interface ModelsConfig {
  models: OpenAIModel[];
}