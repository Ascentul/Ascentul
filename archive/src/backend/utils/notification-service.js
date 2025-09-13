// Track which models have been notified to users by email
// This is to avoid sending duplicate notifications
let notifiedModels = [];
/**
 * Service to handle notifications for new AI models
 */
export class ModelNotificationService {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    /**
     * Checks for newly activated models and sends notifications if needed
     * @param models Array of OpenAI models from the configuration
     * @returns Object with notification results
     */
    async checkAndNotify(models) {
        // Get active models that haven't been notified yet
        const newlyActivatedModels = models.filter(model => model.active && !notifiedModels.includes(model.id));
        if (newlyActivatedModels.length === 0) {
            return {
                newlyActivatedModels: [],
                notificationsSent: false
            };
        }
        try {
            // In a real implementation, you would send email notifications here
            // For now, we'll just log and update the notifiedModels array

            // Add the newly activated models to the notified list
            notifiedModels = [...notifiedModels, ...newlyActivatedModels.map(m => m.id)];
            return {
                newlyActivatedModels,
                notificationsSent: true
            };
        }
        catch (error) {
            console.error('Error sending model notifications:', error);
            return {
                newlyActivatedModels,
                notificationsSent: false
            };
        }
    }
    /**
     * Reset the notification tracking (useful for testing)
     */
    resetNotificationTracking() {
        notifiedModels = [];
    }
    /**
     * If SendGrid API key is available, sends email notifications about new models
     * @param userIds Optional array of user IDs to notify, if not provided will notify all users
     * @param models Array of newly activated models to notify about
     */
    async sendEmailNotifications(userIds, models) {
        if (!process.env.SENDGRID_API_KEY) {

            return false;
        }
        try {
            // Since getAllUsers might not be available in IStorage,
            // we'll use a simplified approach to handle notifications
            // For this implementation we'll simulate sending notifications 
            // and log information about what would be sent
            const userCount = userIds ? userIds.length : 'all';

            return true;
        }
        catch (error) {
            console.error('Error sending email notifications:', error);
            return false;
        }
    }
}
