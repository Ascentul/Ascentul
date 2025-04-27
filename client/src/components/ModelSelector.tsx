import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

interface OpenAIModel {
  id: string;
  label: string;
  active: boolean;
}

export default function ModelSelector({ selectedModel, onModelChange, disabled = false }: ModelSelectorProps) {
  const { toast } = useToast();
  
  // Fetch available models from API
  const { data: models, isLoading, error } = useQuery<OpenAIModel[], Error>({
    queryKey: ['/api/models'],
  });
  
  // Default to gpt-4o on error or while loading
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error loading models',
        description: 'Using default model (GPT-4o).',
        variant: 'destructive',
      });
    }
  }, [error, toast]);
  
  // If no model is selected, default to first model or gpt-4o
  useEffect(() => {
    if (!selectedModel && models && models.length > 0) {
      onModelChange(models[0].id);
    }
  }, [models, selectedModel, onModelChange]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading models...</span>
      </div>
    );
  }

  if (error || !models || models.length === 0) {
    return (
      <Select
        value="gpt-4o"
        disabled={true}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="GPT-4o" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select 
      value={selectedModel || models[0].id}
      onValueChange={onModelChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={selectedModel ? selectedModel : "Select a model"} />
      </SelectTrigger>
      <SelectContent>
        {models.map(model => (
          <SelectItem key={model.id} value={model.id}>
            {model.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}