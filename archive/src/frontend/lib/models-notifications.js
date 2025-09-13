// Store previously seen models in localStorage to track new ones
const LOCAL_STORAGE_KEY = 'ascentul_seen_models';
/**
 * Gets the list of previously seen model IDs from localStorage
 */
export function getSeenModels() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    }
    catch (error) {
        console.error('Error retrieving seen models from localStorage:', error);
    }
    return [];
}
/**
 * Adds new models to the seen models list in localStorage
 */
export function addToSeenModels(modelIds) {
    try {
        const currentSeenModels = getSeenModels();
        // Create a unique array by concatenating and filtering
        const combined = [...currentSeenModels, ...modelIds];
        const uniqueModels = combined.filter((value, index, self) => self.indexOf(value) === index);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(uniqueModels));
    }
    catch (error) {
        console.error('Error updating seen models in localStorage:', error);
    }
}
/**
 * Processes model updates and determines which ones are new
 */
export function processModelUpdates(models) {
    // Get only active models
    const activeModels = models.filter(model => model.active);
    // Get previously seen model IDs
    const seenModelIds = getSeenModels();
    // Find newly activated models (active but not previously seen)
    const newModels = activeModels.filter(model => !seenModelIds.includes(model.id));
    // Determine if there are new models
    const hasNewModels = newModels.length > 0;
    return {
        hasNewModels,
        newModels
    };
}
/**
 * Marks all the provided model IDs as seen
 */
export function markModelsAsSeen(models) {
    const modelIds = models.map(model => model.id);
    addToSeenModels(modelIds);
}
