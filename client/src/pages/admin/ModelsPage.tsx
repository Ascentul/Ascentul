import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

// Define the OpenAI model type
interface OpenAIModel {
  id: string;
  label: string;
  active: boolean;
}

export default function AdminModelsPage() {
  const { isAdmin, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [models, setModels] = useState<OpenAIModel[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch models from API
  const { isLoading, error } = useQuery<OpenAIModel[], Error>({
    queryKey: ['/api/models'],
    queryFn: getQueryFn(),
    onSuccess: (data) => {
      setModels(data);
    },
  });

  // Create mutation to update models
  const updateModelsMutation = useMutation({
    mutationFn: async (models: OpenAIModel[]) => {
      const res = await apiRequest('PUT', '/api/models', { models });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/models'] });
      setHasChanges(false);
      toast({
        title: 'Models updated',
        description: 'The AI models configuration has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update models. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle toggling a model's active state
  const handleToggleActive = (id: string) => {
    const updatedModels = models.map(model => 
      model.id === id ? { ...model, active: !model.active } : model
    );
    setModels(updatedModels);
    setHasChanges(true);
  };

  // Handle saving model changes
  const handleSaveChanges = () => {
    updateModelsMutation.mutate(models);
  };

  // If user is not an admin, redirect to dashboard
  if (!isAuthLoading && !isAdmin) {
    return <Redirect to="/" />;
  }

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">AI Models Configuration</h1>
        <div className="bg-destructive/20 text-destructive p-4 rounded-md">
          Error loading models: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI Models Configuration</h1>
        <Button 
          onClick={handleSaveChanges} 
          disabled={!hasChanges || updateModelsMutation.isPending}
          className="flex items-center gap-2"
        >
          {updateModelsMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available OpenAI Models</CardTitle>
          <CardDescription>
            Manage which AI models are available to users in the AI Career Coach feature.
            Toggle models on or off to control their availability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models.map(model => (
              <div 
                key={model.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{model.label}</h3>
                  <p className="text-sm text-muted-foreground">{model.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`model-${model.id}`} className="mr-2">
                    {model.active ? 'Active' : 'Inactive'}
                  </Label>
                  <Switch 
                    id={`model-${model.id}`}
                    checked={model.active}
                    onCheckedChange={() => handleToggleActive(model.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>About Model Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <p>
              <strong>GPT-4o</strong> - The latest and most advanced OpenAI model with multimodal capabilities.
              Best for most use cases with excellent performance.
            </p>
            <p>
              <strong>GPT-3.5 Turbo</strong> - A cost-effective model for simpler tasks.
              Faster but less capable than GPT-4 models.
            </p>
            <p>
              <strong>GPT-4 Turbo</strong> - Slightly older than GPT-4o but still very capable.
            </p>
            <p>
              <strong>GPT-4 Vision</strong> - Specialized model with enhanced image analysis capabilities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}