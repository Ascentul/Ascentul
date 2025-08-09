import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
export default function AdminModelsPage() {
    const { isAdmin, isLoading: isAuthLoading } = useAuth();
    const { toast } = useToast();
    const [models, setModels] = useState([]);
    const [hasChanges, setHasChanges] = useState(false);
    // Fetch models from API
    const { data: modelsData, isLoading, error } = useQuery({
        queryKey: ['/api/models']
    });
    // Update models state when data is loaded
    React.useEffect(() => {
        if (modelsData) {
            setModels(modelsData);
        }
    }, [modelsData]);
    // Create mutation to update models
    const updateModelsMutation = useMutation({
        mutationFn: async (models) => {
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
        onError: (error) => {
            toast({
                title: 'Update failed',
                description: error.message || 'Failed to update models. Please try again.',
                variant: 'destructive',
            });
        },
    });
    // Handle toggling a model's active state
    const handleToggleActive = (id) => {
        const updatedModels = models.map(model => model.id === id ? { ...model, active: !model.active } : model);
        setModels(updatedModels);
        setHasChanges(true);
    };
    // Handle saving model changes
    const handleSaveChanges = () => {
        updateModelsMutation.mutate(models);
    };
    // If user is not an admin, redirect to dashboard
    if (!isAuthLoading && !isAdmin) {
        return _jsx(Redirect, { to: "/" });
    }
    if (isLoading || isAuthLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsx(Loader2, { className: "h-12 w-12 animate-spin text-primary" }) }));
    }
    if (error) {
        return (_jsxs("div", { className: "p-6 max-w-4xl mx-auto", children: [_jsx("h1", { className: "text-2xl font-bold mb-6", children: "AI Models Configuration" }), _jsxs("div", { className: "bg-destructive/20 text-destructive p-4 rounded-md", children: ["Error loading models: ", error.message] })] }));
    }
    return (_jsxs("div", { className: "p-6 max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "AI Models Configuration" }), _jsxs(Button, { onClick: handleSaveChanges, disabled: !hasChanges || updateModelsMutation.isPending, className: "flex items-center gap-2", children: [updateModelsMutation.isPending ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Save, { className: "h-4 w-4" })), "Save Changes"] })] }), _jsxs(Card, { className: "mb-8", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Available OpenAI Models" }), _jsx(CardDescription, { children: "Manage which AI models are available to users in the AI Career Coach feature. Toggle models on or off to control their availability." })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: models.map(model => (_jsxs("div", { className: "flex items-center justify-between p-4 border rounded-lg", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-medium", children: model.label }), _jsx("p", { className: "text-sm text-muted-foreground", children: model.id })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Label, { htmlFor: `model-${model.id}`, className: "mr-2", children: model.active ? 'Active' : 'Inactive' }), _jsx(Switch, { id: `model-${model.id}`, checked: model.active, onCheckedChange: () => handleToggleActive(model.id) })] })] }, model.id))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "About Model Configuration" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4 text-sm", children: [_jsxs("p", { children: [_jsx("strong", { children: "GPT-4o" }), " - The latest and most advanced OpenAI model with multimodal capabilities. Best for most use cases with excellent performance."] }), _jsxs("p", { children: [_jsx("strong", { children: "GPT-3.5 Turbo" }), " - A cost-effective model for simpler tasks. Faster but less capable than GPT-4 models."] }), _jsxs("p", { children: [_jsx("strong", { children: "GPT-4 Turbo" }), " - Slightly older than GPT-4o but still very capable."] }), _jsxs("p", { children: [_jsx("strong", { children: "GPT-4 Vision" }), " - Specialized model with enhanced image analysis capabilities."] })] }) })] })] }));
}
