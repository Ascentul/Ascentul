import express from "express"
import { requireAdmin } from "../auth" // Use auth.ts implementation instead of validateRequest.ts
import { z } from "zod"
import { supabase } from "../supabase"

const router = express.Router()

// Settings validation schema
const settingsSchema = z.object({
  general: z.object({
    platformName: z.string(),
    supportEmail: z.string().email(),
    defaultTimezone: z.string(),
    maintenanceMode: z.boolean()
  }),
  features: z.object({
    enableReviews: z.boolean(),
    enableAICoach: z.boolean(),
    enableResumeStudio: z.boolean(),
    enableVoicePractice: z.boolean(),
    enableCareerGoals: z.boolean()
  }),
  userRoles: z.object({
    defaultUserRole: z.string(),
    freeFeatures: z.array(z.string()),
    proFeatures: z.array(z.string())
  }),
  university: z.object({
    defaultSeatCount: z.number(),
    trialDurationDays: z.number(),
    defaultAdminPermissions: z.array(z.string()),
    defaultLicenseSeats: z.number()
  }),
  email: z.object({
    notifyOnReviews: z.boolean(),
    notifyOnSignups: z.boolean(),
    notifyOnErrors: z.boolean(),
    defaultReplyToEmail: z.string().email(),
    enableMarketingEmails: z.boolean()
  }),
  api: z.object({
    openaiModel: z.string(),
    maxTokensPerRequest: z.number(),
    webhookUrls: z.array(z.string())
  }),
  security: z.object({
    requireMfaForAdmins: z.boolean(),
    sessionTimeoutMinutes: z.number(),
    allowedIpAddresses: z.array(z.string())
  }),
  xpSystem: z.object({
    goalCompletionReward: z.number(),
    goalCreationReward: z.number(),
    personalAchievementValue: z.number(),
    personalAchievementCreationReward: z.number(),
    resumeCreationReward: z.number(),
    achievementEarnedReward: z.number()
  }),
  admin: z.object({
    bulkThreshold: z.number(),
    defaultHealthValue: z.number()
  })
})

// Get default settings
function getDefaultSettings() {
  return {
    general: {
      platformName: "Ascentul",
      supportEmail: "support@ascentul.io",
      defaultTimezone: "America/New_York",
      maintenanceMode: false
    },
    features: {
      enableReviews: true,
      enableAICoach: true,
      enableResumeStudio: true,
      enableVoicePractice: true,
      enableCareerGoals: true
    },
    userRoles: {
      defaultUserRole: "regular",
      freeFeatures: ["resume-builder", "job-search", "basic-interview"],
      proFeatures: ["ai-coach", "voice-practice", "unlimited-storage"]
    },
    university: {
      defaultSeatCount: 100,
      trialDurationDays: 30,
      defaultAdminPermissions: ["manage-users", "view-analytics"],
      defaultLicenseSeats: 100
    },
    email: {
      notifyOnReviews: true,
      notifyOnSignups: true,
      notifyOnErrors: true,
      defaultReplyToEmail: "noreply@ascentul.io",
      enableMarketingEmails: false
    },
    api: {
      openaiModel: "gpt-4o",
      maxTokensPerRequest: 4000,
      webhookUrls: []
    },
    security: {
      requireMfaForAdmins: false,
      sessionTimeoutMinutes: 60,
      allowedIpAddresses: []
    },
    xpSystem: {
      goalCompletionReward: 10,
      goalCreationReward: 5,
      personalAchievementValue: 50,
      personalAchievementCreationReward: 10,
      resumeCreationReward: 5,
      achievementEarnedReward: 10
    },
    admin: {
      bulkThreshold: 100,
      defaultHealthValue: 100
    }
  }
}

// Get platform settings
router.get("/", requireAdmin, async (req, res) => {
  try {
    console.log("🔧 GET /api/settings request received")
    console.log("🔧 User authenticated:", req.user ? "Yes" : "No")
    console.log("🔧 User role:", req.user?.role)
    console.log("🔧 User email:", req.user?.email)
    console.log("🔧 User ID:", req.user?.id)

    // Try to fetch existing settings using Supabase
    console.log(
      "🔧 Attempting to fetch settings from database using Supabase..."
    )
    const { data: settings, error } = await supabase
      .from("platform_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("🔧 Supabase query error:", error)
      // If there's an error (like table doesn't exist or is empty), return defaults
      console.log("🔧 Database error, returning default settings")
      const defaultSettings = getDefaultSettings()
      console.log("🔧 Default settings keys:", Object.keys(defaultSettings))
      return res.status(200).json(defaultSettings)
    }

    console.log("🔧 Settings query result count:", settings?.length)
    console.log(
      "🔧 Settings query result:",
      settings?.length > 0 ? "Found data" : "No data"
    )

    if (settings && settings.length > 0) {
      console.log("🔧 Returning existing settings with ID:", settings[0].id)
      return res.status(200).json(settings[0])
    }

    // If no settings exist yet, return defaults
    console.log("🔧 No settings found in database, returning default settings")
    const defaultSettings = getDefaultSettings()
    console.log("🔧 Default settings keys:", Object.keys(defaultSettings))
    return res.status(200).json(defaultSettings)
  } catch (error) {
    console.error("🔧 Error in settings endpoint:", error)
    console.error("🔧 Error stack:", error.stack)
    return res.status(500).json({
      error: "Failed to fetch platform settings",
      details: error.message
    })
  }
})

// Update platform settings
router.put("/", requireAdmin, async (req, res) => {
  try {
    const settingsData = req.body

    // Validate settings
    const validatedSettings = settingsSchema.parse(settingsData)

    // Check if settings exist using Supabase
    const { data: existingSettings, error: fetchError } = await supabase
      .from("platform_settings")
      .select("*")
      .limit(1)

    if (fetchError) {
      console.error("Error fetching existing settings:", fetchError)
      return res
        .status(500)
        .json({ error: "Failed to fetch existing settings" })
    }

    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      const { data: updatedSettings, error: updateError } = await supabase
        .from("platform_settings")
        .update({
          ...validatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingSettings[0].id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating settings:", updateError)
        return res.status(500).json({ error: "Failed to update settings" })
      }

      return res.json({
        message: "Settings updated successfully",
        settings: updatedSettings
      })
    } else {
      // Create new settings
      const { data: newSettings, error: insertError } = await supabase
        .from("platform_settings")
        .insert({
          ...validatedSettings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        console.error("Error creating settings:", insertError)
        return res.status(500).json({ error: "Failed to create settings" })
      }

      return res.json({
        message: "Settings created successfully",
        settings: newSettings
      })
    }
  } catch (error) {
    console.error("Error updating platform settings:", error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid settings data",
        details: error.errors
      })
    }
    return res.status(500).json({ error: "Failed to update platform settings" })
  }
})

// Reset platform settings to defaults
router.post("/reset", requireAdmin, async (req, res) => {
  try {
    const defaultSettings = getDefaultSettings()

    // Check if settings exist using Supabase
    const { data: existingSettings, error: fetchError } = await supabase
      .from("platform_settings")
      .select("*")
      .limit(1)

    if (fetchError) {
      console.error("Error fetching existing settings:", fetchError)
      return res
        .status(500)
        .json({ error: "Failed to fetch existing settings" })
    }

    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings with defaults
      const { error: updateError } = await supabase
        .from("platform_settings")
        .update({
          ...defaultSettings,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingSettings[0].id)

      if (updateError) {
        console.error("Error updating settings:", updateError)
        return res.status(500).json({ error: "Failed to reset settings" })
      }
    } else {
      // Create new settings with defaults
      const { error: insertError } = await supabase
        .from("platform_settings")
        .insert({
          ...defaultSettings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error("Error creating settings:", insertError)
        return res.status(500).json({ error: "Failed to create settings" })
      }
    }

    return res.json({
      message: "Settings reset to defaults successfully",
      settings: defaultSettings
    })
  } catch (error) {
    console.error("Error resetting platform settings:", error)
    return res.status(500).json({ error: "Failed to reset platform settings" })
  }
})

export default router
