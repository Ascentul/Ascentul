import express from 'express';
import { db } from "../db";
import { eq } from "drizzle-orm";
import { platformSettings } from "@shared/schema";
import { requireAdmin } from "../auth";  // Use auth.ts implementation instead of validateRequest.ts
import { z } from "zod";

const router = express.Router();

// Settings validation schema
const settingsSchema = z.object({
  general: z.object({
    platformName: z.string(),
    supportEmail: z.string().email(),
    defaultTimezone: z.string(),
    maintenanceMode: z.boolean(),
  }),
  features: z.object({
    enableReviews: z.boolean(),
    enableAICoach: z.boolean(),
    enableResumeStudio: z.boolean(),
    enableVoicePractice: z.boolean(),
    enableCareerGoals: z.boolean(),
  }),
  userRoles: z.object({
    defaultUserRole: z.string(),
    freeFeatures: z.array(z.string()),
    proFeatures: z.array(z.string()),
  }),
  university: z.object({
    defaultSeatCount: z.number(),
    trialDurationDays: z.number(),
    defaultAdminPermissions: z.array(z.string()),
  }),
  email: z.object({
    notifyOnReviews: z.boolean(),
    notifyOnSignups: z.boolean(),
    notifyOnErrors: z.boolean(),
    defaultReplyToEmail: z.string().email(),
    enableMarketingEmails: z.boolean(),
  }),
  api: z.object({
    openaiModel: z.string(),
    maxTokensPerRequest: z.number(),
    webhookUrls: z.array(z.string()),
  }),
  security: z.object({
    requireMfaForAdmins: z.boolean(),
    sessionTimeoutMinutes: z.number(),
    allowedIpAddresses: z.array(z.string()),
  }),
});

// Get default settings
function getDefaultSettings() {
  return {
    general: {
      platformName: "Ascentul",
      supportEmail: "support@ascentul.io",
      defaultTimezone: "America/New_York",
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
      defaultUserRole: "regular",
      freeFeatures: ["resume-builder", "job-search", "basic-interview"],
      proFeatures: ["ai-coach", "voice-practice", "unlimited-storage"],
    },
    university: {
      defaultSeatCount: 100,
      trialDurationDays: 30,
      defaultAdminPermissions: ["manage-users", "view-analytics"],
    },
    email: {
      notifyOnReviews: true,
      notifyOnSignups: true,
      notifyOnErrors: true,
      defaultReplyToEmail: "noreply@ascentul.io",
      enableMarketingEmails: false,
    },
    api: {
      openaiModel: "gpt-4o",
      maxTokensPerRequest: 4000,
      webhookUrls: [],
    },
    security: {
      requireMfaForAdmins: false,
      sessionTimeoutMinutes: 60,
      allowedIpAddresses: [],
    },
  };
}

// Get platform settings
router.get('/', requireAdmin, async (req, res) => {
  try {
    console.log('⭐ GET /api/settings request received');
    console.log('⭐ User authenticated:', req.user ? 'Yes' : 'No');
    console.log('⭐ User role:', req.user?.role);
    console.log('⭐ User details:', req.user);
    
    // Try to fetch existing settings
    const settings = await db.select().from(platformSettings).limit(1);
    console.log('⭐ Settings query result:', JSON.stringify(settings));
    
    if (settings && settings.length > 0) {
      console.log('⭐ Returning existing settings');
      return res.status(200).json(settings[0]);
    }
    
    // If no settings exist yet, return defaults
    console.log('⭐ No settings found, returning defaults');
    const defaultSettings = getDefaultSettings();
    console.log('⭐ Default settings:', JSON.stringify(defaultSettings));
    return res.status(200).json(defaultSettings);
  } catch (error) {
    console.error('⭐ Error fetching platform settings:', error);
    return res.status(500).json({ error: 'Failed to fetch platform settings' });
  }
});

// Update platform settings
router.put('/', requireAdmin, async (req, res) => {
  try {
    const settingsData = req.body;
    
    // Validate settings
    const validatedSettings = settingsSchema.parse(settingsData);
    
    // Check if settings exist
    const existingSettings = await db.select().from(platformSettings).limit(1);
    
    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      await db.update(platformSettings)
        .set({
          ...validatedSettings,
          updatedAt: new Date(),
        })
        .where(eq(platformSettings.id, existingSettings[0].id));
      
      return res.json({ 
        message: 'Settings updated successfully',
        settings: {
          ...existingSettings[0],
          ...validatedSettings,
          updatedAt: new Date(),
        }
      });
    } else {
      // Create new settings
      const [newSettings] = await db.insert(platformSettings)
        .values({
          ...validatedSettings,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return res.json({ 
        message: 'Settings created successfully',
        settings: newSettings
      });
    }
  } catch (error) {
    console.error('Error updating platform settings:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid settings data',
        details: error.errors
      });
    }
    return res.status(500).json({ error: 'Failed to update platform settings' });
  }
});

// Reset platform settings to defaults
router.post('/reset', requireAdmin, async (req, res) => {
  try {
    const defaultSettings = getDefaultSettings();
    const existingSettings = await db.select().from(platformSettings).limit(1);
    
    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings with defaults
      await db.update(platformSettings)
        .set({
          ...defaultSettings,
          updatedAt: new Date(),
        })
        .where(eq(platformSettings.id, existingSettings[0].id));
    } else {
      // Create new settings with defaults
      await db.insert(platformSettings)
        .values({
          ...defaultSettings,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
    }
    
    return res.json({ 
      message: 'Settings reset to defaults successfully',
      settings: defaultSettings
    });
  } catch (error) {
    console.error('Error resetting platform settings:', error);
    return res.status(500).json({ error: 'Failed to reset platform settings' });
  }
});

export default router;