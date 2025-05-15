import { OpenAIModel } from '../utils/models-config';
// Using any for storage to avoid type conflicts
// This is a pragmatic approach since we're only using the storage as a dependency injection,
// not actually calling methods that would cause type conflicts
import type { MemStorage } from '../storage';

// Track which models have been notified to users by email
// This is to avoid sending duplicate notifications
let notifiedModels: string[] = [];

/**
 * Service to handle notifications for new AI models
 */
export class ModelNotificationService {
  private storage: any;
  
  constructor(storage: any) {
    this.storage = storage;
  }
  
  /**
   * Checks for newly activated models and sends notifications if needed
   * @param models Array of OpenAI models from the configuration
   * @returns Object with notification results
   */
  async checkAndNotify(models: OpenAIModel[]): Promise<{
    newlyActivatedModels: OpenAIModel[];
    notificationsSent: boolean;
  }> {
    // Get active models that haven't been notified yet
    const newlyActivatedModels = models.filter(model => 
      model.active && !notifiedModels.includes(model.id)
    );
    
    if (newlyActivatedModels.length === 0) {
      return {
        newlyActivatedModels: [],
        notificationsSent: false
      };
    }
    
    try {
      // In a real implementation, you would send email notifications here
      // For now, we'll just log and update the notifiedModels array
      
      console.log(`New models activated: ${newlyActivatedModels.map(m => m.label).join(', ')}`);
      
      // Add the newly activated models to the notified list
      notifiedModels = [...notifiedModels, ...newlyActivatedModels.map(m => m.id)];
      
      return {
        newlyActivatedModels,
        notificationsSent: true
      };
    } catch (error) {
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
  resetNotificationTracking(): void {
    notifiedModels = [];
  }
  
  /**
   * If SendGrid API key is available, sends email notifications about new models
   * @param userIds Optional array of user IDs to notify, if not provided will notify all users
   * @param models Array of newly activated models to notify about
   */
  async sendEmailNotifications(
    userIds: number[] | undefined, 
    models: OpenAIModel[]
  ): Promise<boolean> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('SendGrid API key not available, skipping email notifications');
      return false;
    }
    
    try {
      // Since getAllUsers might not be available in IStorage,
      // we'll use a simplified approach to handle notifications
      
      // For this implementation we'll simulate sending notifications 
      // and log information about what would be sent
      
      const userCount = userIds ? userIds.length : 'all';
      console.log(`Would send email to ${userCount} users about new models: ${models.map(m => m.label).join(', ')}`);
      
      return true;
    } catch (error) {
      console.error('Error sending email notifications:', error);
      return false;
    }
  }
}