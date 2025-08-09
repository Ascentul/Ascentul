import { requireAuth, isAdmin, requireAdmin } from '../auth';
import { getFilteredModels, updateModelsConfig } from '../utils/models-config';
import { ModelNotificationService } from '../utils/notification-service';
import { storage } from '../storage';
export function registerModelsRoutes(app) {
    // GET /api/models - Get all models (filtered by user role)
    app.get('/api/models', requireAuth, (req, res) => {
        try {
            // Check if the user is an admin
            const admin = isAdmin(req);
            // Get models based on user role
            const models = getFilteredModels(admin);
            // Return the models directly (not wrapped in an object)
            res.status(200).json(models);
        }
        catch (error) {
            console.error('Error fetching models:', error);
            res.status(500).json({ error: 'Failed to fetch models configuration' });
        }
    });
    // PUT /api/models - Update models (admin only)
    app.put('/api/models', requireAdmin, async (req, res) => {
        try {
            const { models } = req.body;
            // Validate the request body
            if (!models || !Array.isArray(models)) {
                return res.status(400).json({ error: 'Invalid request body' });
            }
            // Ensure each model has the required fields
            const isValid = models.every((model) => typeof model.id === 'string' &&
                typeof model.label === 'string' &&
                typeof model.active === 'boolean');
            if (!isValid) {
                return res.status(400).json({
                    error: 'Invalid model format. Each model must have id (string), label (string), and active (boolean)'
                });
            }
            // Update the models configuration
            const modelsArray = models.map((model) => ({
                id: model.id,
                label: model.label,
                active: model.active
            }));
            const success = updateModelsConfig(modelsArray);
            if (success) {
                try {
                    // Check for newly activated models and send notifications
                    const notificationService = new ModelNotificationService(storage);
                    const notificationResult = await notificationService.checkAndNotify(modelsArray);
                    // If new models were activated, include them in the response
                    if (notificationResult.newlyActivatedModels.length > 0) {
                        // Send email notifications to users who have opted in (if SendGrid is configured)
                        await notificationService.sendEmailNotifications(undefined, // Send to all users
                        notificationResult.newlyActivatedModels);
                        res.status(200).json({
                            success: true,
                            message: 'Models configuration updated successfully',
                            newlyActivatedModels: notificationResult.newlyActivatedModels,
                            notificationsSent: notificationResult.notificationsSent
                        });
                    }
                    else {
                        res.status(200).json({
                            success: true,
                            message: 'Models configuration updated successfully',
                            newlyActivatedModels: [],
                            notificationsSent: false
                        });
                    }
                }
                catch (error) {
                    const notificationError = error;
                    console.error('Error handling model notifications:', notificationError);
                    // Still return success since the models were updated
                    res.status(200).json({
                        success: true,
                        message: 'Models configuration updated successfully, but notification processing failed',
                        notificationError: notificationError.message
                    });
                }
            }
            else {
                res.status(500).json({ error: 'Failed to update models configuration' });
            }
        }
        catch (error) {
            console.error('Error updating models:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}
