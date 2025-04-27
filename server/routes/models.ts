import { Router, Request, Response } from 'express';
import { getModelsConfig, updateModelsConfig, ModelsConfig } from '../utils/models-config';
import { z } from 'zod';
import { requireAuth, isAdmin, requireAdmin } from '../auth';

// Create a router for model endpoints
const router = Router();

// Schema for validating model data in requests
const modelSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  active: z.boolean()
});

const modelsConfigSchema = z.object({
  models: z.array(modelSchema)
});

// GET /api/models - Get all available models
router.get('/', requireAuth, (req: Request, res: Response) => {
  try {
    const config = getModelsConfig();
    
    // If user is not admin, only return active models
    if (!isAdmin(req)) {
      return res.json({
        models: config.models.filter(model => model.active)
      });
    }
    
    // Admin can see all models
    return res.json(config);
  } catch (error) {
    console.error('Error fetching models:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch models configuration' 
    });
  }
});

// PUT /api/models - Update the models configuration (admin only)
router.put('/', requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const validationResult = modelsConfigSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Invalid models configuration format',
        details: validationResult.error.errors
      });
    }

    const newConfig = validationResult.data;
    const success = updateModelsConfig(newConfig);

    if (!success) {
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to update models configuration' 
      });
    }

    return res.json({ 
      success: true,
      message: 'Models configuration updated successfully' 
    });
  } catch (error) {
    console.error('Error updating models:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update models configuration' 
    });
  }
});

// PATCH /api/models/:id - Update a single model (admin only)
router.patch('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = getModelsConfig();
    
    // Find the model to update
    const modelIndex = config.models.findIndex(model => model.id === id);
    
    if (modelIndex === -1) {
      return res.status(404).json({ 
        error: 'Not Found',
        message: `Model with ID ${id} not found` 
      });
    }
    
    // Validate the update data
    const updateSchema = z.object({
      label: z.string().min(1).optional(),
      active: z.boolean().optional()
    });
    
    const validationResult = updateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Invalid update data',
        details: validationResult.error.errors
      });
    }
    
    // Update the model
    config.models[modelIndex] = {
      ...config.models[modelIndex],
      ...validationResult.data
    };
    
    // Save the updated configuration
    const success = updateModelsConfig(config);
    
    if (!success) {
      return res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Failed to update model configuration' 
      });
    }
    
    return res.json({ 
      success: true,
      message: `Model ${id} updated successfully`,
      model: config.models[modelIndex]
    });
  } catch (error) {
    console.error('Error updating model:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to update model configuration' 
    });
  }
});

export default router;