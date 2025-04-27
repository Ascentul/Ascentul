import { Express, Request, Response } from 'express';
import { requireAuth, isAdmin, requireAdmin } from '../auth';
import { getFilteredModels, updateModelsConfig, OpenAIModel } from '../utils/models-config';

export function registerModelsRoutes(app: Express) {
  // GET /api/models - Get all models (filtered by user role)
  app.get('/api/models', requireAuth, (req: Request, res: Response) => {
    try {
      // Check if the user is an admin
      const admin = isAdmin(req);
      
      // Get models based on user role
      const models = getFilteredModels(admin);
      
      // Return the models directly (not wrapped in an object)
      res.status(200).json(models);
    } catch (error) {
      console.error('Error fetching models:', error);
      res.status(500).json({ error: 'Failed to fetch models configuration' });
    }
  });

  // PUT /api/models - Update models (admin only)
  app.put('/api/models', requireAdmin, (req: Request, res: Response) => {
    try {
      const { models } = req.body;
      
      // Validate the request body
      if (!models || !Array.isArray(models)) {
        return res.status(400).json({ error: 'Invalid request body' });
      }
      
      // Ensure each model has the required fields
      const isValid = models.every((model: any) => 
        typeof model.id === 'string' && 
        typeof model.label === 'string' && 
        typeof model.active === 'boolean'
      );
      
      if (!isValid) {
        return res.status(400).json({ 
          error: 'Invalid model format. Each model must have id (string), label (string), and active (boolean)' 
        });
      }
      
      // Update the models configuration
      const modelsArray: OpenAIModel[] = models.map((model: any) => ({
        id: model.id,
        label: model.label,
        active: model.active
      }));
      
      const success = updateModelsConfig(modelsArray);
      
      if (success) {
        res.status(200).json({ success: true, message: 'Models configuration updated successfully' });
      } else {
        res.status(500).json({ error: 'Failed to update models configuration' });
      }
    } catch (error) {
      console.error('Error updating models:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}