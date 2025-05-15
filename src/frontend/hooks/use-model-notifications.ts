import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { processModelUpdates, markModelsAsSeen } from '@/lib/models-notifications';

// Define OpenAIModel interface inline to avoid import issues
interface OpenAIModel {
  id: string;
  label: string;
  active: boolean;
}

export function useModelNotifications() {
  const [hasNewModels, setHasNewModels] = useState(false);
  const [newModels, setNewModels] = useState<OpenAIModel[]>([]);
  
  // Fetch available models
  const { data: models = [] } = useQuery<OpenAIModel[]>({
    queryKey: ['/api/models'],
    // Fetch every 24 hours (in milliseconds)
    staleTime: 24 * 60 * 60 * 1000,
    // Don't refetch on window focus for this query
    refetchOnWindowFocus: false,
  });
  
  // Check for new models when the models data changes
  useEffect(() => {
    if (models && models.length > 0) {
      const result = processModelUpdates(models);
      setHasNewModels(result.hasNewModels);
      setNewModels(result.newModels);
    }
  }, [models]);
  
  return {
    hasNewModels,
    newModels,
    // Reset notification state
    clearNotifications: () => {
      if (newModels.length > 0) {
        markModelsAsSeen(newModels);
        setHasNewModels(false);
        setNewModels([]);
      }
    }
  };
}