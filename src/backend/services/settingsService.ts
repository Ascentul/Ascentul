import { supabase } from "../db"

interface PlatformSettings {
  general: {
    platformName: string
    supportEmail: string
    defaultTimezone: string
    maintenanceMode: boolean
  }
  features: {
    enableReviews: boolean
    enableAICoach: boolean
    enableResumeStudio: boolean
    enableVoicePractice: boolean
    enableCareerGoals: boolean
    enableApplicationTracker?: boolean
    enableNetworkHub?: boolean
    enableCareerPathExplorer?: boolean
    enableProjectPortfolio?: boolean
    enableCoverLetterStudio?: boolean
  }
  userRoles: {
    defaultUserRole: string
    freeFeatures: string[]
    proFeatures: string[]
  }
  university: {
    defaultSeatCount: number
    trialDurationDays: number
    defaultAdminPermissions: string[]
    defaultLicenseSeats: number
  }
  email: {
    notifyOnReviews: boolean
    notifyOnSignups: boolean
    notifyOnErrors: boolean
    defaultReplyToEmail: string
    enableMarketingEmails: boolean
  }
  api: {
    openaiModel: string
    maxTokensPerRequest: number
    webhookUrls: string[]
  }
  security: {
    requireMfaForAdmins: boolean
    sessionTimeoutMinutes: number
    allowedIpAddresses: string[]
  }
  xpSystem: {
    goalCompletionReward: number
    goalCreationReward: number
    personalAchievementValue: number
    personalAchievementCreationReward: number
    resumeCreationReward: number
    achievementEarnedReward: number
  }
  admin: {
    bulkThreshold: number
    defaultHealthValue: number
  }
}

const DEFAULT_SETTINGS: PlatformSettings = {
  general: {
    platformName: "Ascentul",
    supportEmail: "support@ascentul.com",
    defaultTimezone: "America/New_York",
    maintenanceMode: false
  },
  features: {
    enableReviews: true,
    enableAICoach: true,
    enableResumeStudio: true,
    enableVoicePractice: true,
    enableCareerGoals: true,
    enableApplicationTracker: true,
    enableNetworkHub: true,
    enableCareerPathExplorer: true,
    enableProjectPortfolio: true,
    enableCoverLetterStudio: true
  },
  userRoles: {
    defaultUserRole: "student",
    freeFeatures: ["resume-builder", "cover-letter", "application-tracker"],
    proFeatures: ["ai-coach", "voice-practice", "unlimited-resumes"]
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
    defaultReplyToEmail: "noreply@ascentul.com",
    enableMarketingEmails: false
  },
  api: {
    openaiModel: "gpt-4o",
    maxTokensPerRequest: 4000,
    webhookUrls: []
  },
  security: {
    requireMfaForAdmins: false,
    sessionTimeoutMinutes: 120,
    allowedIpAddresses: []
  },
  xpSystem: {
    goalCompletionReward: 100,
    goalCreationReward: 50,
    personalAchievementValue: 100,
    personalAchievementCreationReward: 50,
    resumeCreationReward: 100,
    achievementEarnedReward: 100
  },
  admin: {
    bulkThreshold: 100,
    defaultHealthValue: 100
  }
}

class SettingsService {
  private static instance: SettingsService
  private cachedSettings: PlatformSettings | null = null
  private lastFetch: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }
    return SettingsService.instance
  }

  private constructor() {}

  async getSettings(): Promise<PlatformSettings> {
    const now = Date.now()

    // Return cached settings if still valid
    if (this.cachedSettings && now - this.lastFetch < this.CACHE_DURATION) {
      return this.cachedSettings
    }

    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {

export type { PlatformSettings }
