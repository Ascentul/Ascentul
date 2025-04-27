import { OpenAIModel } from '@/types/models';

// Local storage keys
const SEEN_MODELS_KEY = 'ascentul_seen_models';
const MODEL_NOTIFICATIONS_KEY = 'ascentul_model_notifications';

// Get the list of models the user has already seen
export function getSeenModels(): string[] {
  try {
    const storedModels = localStorage.getItem(SEEN_MODELS_KEY);
    if (storedModels) {
      return JSON.parse(storedModels);
    }
  } catch (error) {
    console.error('Error retrieving seen models from localStorage:', error);
  }
  return [];
}

// Mark models as seen
export function markModelsSeen(modelIds: string[]): void {
  try {
    const seenModels = getSeenModels();
    const updatedSeenModels = [...new Set([...seenModels, ...modelIds])];
    localStorage.setItem(SEEN_MODELS_KEY, JSON.stringify(updatedSeenModels));
  } catch (error) {
    console.error('Error saving seen models to localStorage:', error);
  }
}

// Find new models that the user hasn't seen before
export function findNewModels(models: OpenAIModel[]): OpenAIModel[] {
  const seenModels = getSeenModels();
  // Only return active models that haven't been seen
  return models.filter(model => model.active && !seenModels.includes(model.id));
}

// Store notifications to be shown
export function storeModelNotifications(notifications: { id: string, label: string }[]): void {
  try {
    localStorage.setItem(MODEL_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error storing model notifications to localStorage:', error);
  }
}

// Get notifications to be shown
export function getModelNotifications(): { id: string, label: string }[] {
  try {
    const notifications = localStorage.getItem(MODEL_NOTIFICATIONS_KEY);
    if (notifications) {
      return JSON.parse(notifications);
    }
  } catch (error) {
    console.error('Error retrieving model notifications from localStorage:', error);
  }
  return [];
}

// Clear notifications after they've been shown
export function clearModelNotifications(): void {
  try {
    localStorage.removeItem(MODEL_NOTIFICATIONS_KEY);
  } catch (error) {
    console.error('Error clearing model notifications from localStorage:', error);
  }
}

// Process models into notifications and mark them as seen
export function processModelUpdates(models: OpenAIModel[]): {
  hasNewModels: boolean;
  newModels: OpenAIModel[];
} {
  const newModels = findNewModels(models);
  const hasNewModels = newModels.length > 0;
  
  if (hasNewModels) {
    // Store notifications to show
    storeModelNotifications(newModels.map(model => ({ 
      id: model.id, 
      label: model.label 
    })));
    
    // Mark these models as seen for next time
    markModelsSeen(newModels.map(model => model.id));
  }
  
  return { hasNewModels, newModels };
}