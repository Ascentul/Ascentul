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

export default router
