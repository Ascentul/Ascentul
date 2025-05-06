import { Router } from 'express';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { platformSettings } from '@shared/schema';
import { requireSuperAdmin } from '../utils/validateRequest';

const router = Router();

// Get all platform settings
router.get('/', requireSuperAdmin, async (req, res) => {
  try {
    // Fetch settings from database
    const settings = await db.select().from(platformSettings).limit(1);
    
    // If no settings exist, return default settings
    if (!settings.length) {
      // Create default settings in the database
      const defaultSettings = getDefaultSettings();
      const [createdSettings] = await db.insert(platformSettings).values(defaultSettings).returning();
      return res.json(createdSettings);
    }
    
    return res.json(settings[0]);
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return res.status(500).json({ message: 'Failed to fetch platform settings' });
  }
});

// Update settings for a specific section
router.put('/:section', requireSuperAdmin, async (req, res) => {
  const { section } = req.params;
  const sectionData = req.body;
  
  try {
    // Validate section name
    const validSections = ['general', 'features', 'userRoles', 'university', 'email', 'api', 'security'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ message: 'Invalid settings section' });
    }
    
    // Get current settings
    const currentSettings = await db.select().from(platformSettings).limit(1);
    
    if (!currentSettings.length) {
      // If no settings exist, create default settings first
      const defaultSettings = getDefaultSettings();
      defaultSettings[section] = sectionData;
      
      const [createdSettings] = await db.insert(platformSettings).values(defaultSettings).returning();
      return res.json(createdSettings);
    }
    
    // Update only the specific section
    const updatedSettings = {
      ...currentSettings[0],
      [section]: sectionData,
      updatedAt: new Date()
    };
    
    const [result] = await db
      .update(platformSettings)
      .set(updatedSettings)
      .where(eq(platformSettings.id, currentSettings[0].id))
      .returning();
    
    return res.json(result);
  } catch (error) {
    console.error(`Error updating ${section} settings:`, error);
    return res.status(500).json({ message: `Failed to update ${section} settings` });
  }
});

// Helper function to get default settings
function getDefaultSettings() {
  return {
    general: {
      platformName: 'Ascentul',
      supportEmail: 'support@ascentul.io',
      defaultTimezone: 'America/New_York',
      maintenanceMode: false,
    },
    features: {
      enableReviews: true,
      enableAICoach: true,
      enableResumeStudio: true,
      enableVoicePractice: true,
      enableCareerGoals: true,
    },
    userRoles: {
      defaultUserRole: 'regular',
      freeFeatures: ['basic_resume', 'job_search', 'application_tracking'],
      proFeatures: ['ai_coach', 'voice_practice', 'advanced_analytics'],
    },
    university: {
      defaultSeatCount: 50,
      trialDurationDays: 30,
      defaultAdminPermissions: ['manage_students', 'view_analytics'],
    },
    email: {
      notifyOnReviews: true,
      notifyOnSignups: true,
      notifyOnErrors: true,
      defaultReplyToEmail: 'no-reply@ascentul.io',
      enableMarketingEmails: true,
    },
    api: {
      openaiModel: 'gpt-4o',
      maxTokensPerRequest: 4096,
      webhookUrls: [],
    },
    security: {
      requireMfaForAdmins: false,
      sessionTimeoutMinutes: 120,
      allowedIpAddresses: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export default router;