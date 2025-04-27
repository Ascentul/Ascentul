import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface OpenAIModel {
  id: string;
  label: string;
  active: boolean;
}

interface ModelsConfig {
  models: OpenAIModel[];
}

const AdminModelsPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [localModels, setLocalModels] = useState<OpenAIModel[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch models from the API
  const { 
    data, 
    isLoading, 
    error 
  } = useQuery<ModelsConfig>({
    queryKey: ['/api/models'],
  });

  // Update local state when data changes
  useEffect(() => {
    if (data) {
      setLocalModels(data.models);
    }
  }, [data]);

  // Update models configuration mutation
  const updateModelsMutation = useMutation({
    mutationFn: async (models: OpenAIModel[]) => {
      const res = await apiRequest("PUT", "/api/models", { models });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "AI model configuration has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/models'] });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update models: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Toggle individual model active status
  const handleToggleModel = (id: string) => {
    const updatedModels = localModels.map(model => 
      model.id === id ? { ...model, active: !model.active } : model
    );
    setLocalModels(updatedModels);
    setHasChanges(true);
  };

  // Save changes
  const handleSaveChanges = () => {
    updateModelsMutation.mutate(localModels);
  };

  // If not admin, redirect to home
  if (!authLoading && user && user.userType !== "admin") {
    toast({
      title: "Access Denied",
      description: "You don't have permission to access this page.",
      variant: "destructive",
    });
    return <Redirect to="/" />;
  }

  // If not logged in, redirect to login
  if (!authLoading && !user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">AI Model Management</CardTitle>
          <CardDescription>
            Configure which AI models are available to users in the AI Career Coach feature.
            Active models will be shown to users, while inactive models will be hidden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading models...</span>
            </div>
          ) : error ? (
            <div className="text-destructive py-4">
              Failed to load models. Please try again.
            </div>
          ) : (
            <div className="space-y-4">
              {localModels.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between p-4 border rounded-md"
                >
                  <div>
                    <h3 className="font-medium">{model.label}</h3>
                    <p className="text-sm text-muted-foreground">{model.id}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      {model.active ? "Active" : "Inactive"}
                    </span>
                    <Switch
                      checked={model.active}
                      onCheckedChange={() => handleToggleModel(model.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={handleSaveChanges}
            disabled={!hasChanges || updateModelsMutation.isPending}
          >
            {updateModelsMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {updateModelsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminModelsPage;