import { apiRequest } from "../utils/api";
const DEFAULT_SETTINGS = {
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
};
class FrontendSettingsService {
    static instance;
    cachedSettings = null;
    lastFetch = 0;
    CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    static getInstance() {
        if (!FrontendSettingsService.instance) {
            FrontendSettingsService.instance = new FrontendSettingsService();
        }
        return FrontendSettingsService.instance;
    }
    constructor() { }
    async getSettings() {
        const now = Date.now();
        // Return cached settings if still valid
        if (this.cachedSettings && now - this.lastFetch < this.CACHE_DURATION) {
            return this.cachedSettings;
        }
        try {
            const response = await apiRequest("GET", "/api/settings");
            const data = await response.json();
            if (data && !data.error) {
                this.cachedSettings = {
                    general: data.general || DEFAULT_SETTINGS.general,
                    features: data.features || DEFAULT_SETTINGS.features,
                    userRoles: data.userRoles || DEFAULT_SETTINGS.userRoles,
                    university: data.university || DEFAULT_SETTINGS.university,
                    email: data.email || DEFAULT_SETTINGS.email,
                    api: data.api || DEFAULT_SETTINGS.api,
                    security: data.security || DEFAULT_SETTINGS.security,
                    xpSystem: data.xpSystem || DEFAULT_SETTINGS.xpSystem,
                    admin: data.admin || DEFAULT_SETTINGS.admin
                };
                this.lastFetch = now;
                return this.cachedSettings;
            }
        }
        catch (error) {

        }
        return DEFAULT_SETTINGS;
    }
    async getXpReward(type) {
        const settings = await this.getSettings();
        return settings.xpSystem[type];
    }
    async getBulkThreshold() {
        const settings = await this.getSettings();
        return settings.admin.bulkThreshold;
    }
    async getDefaultHealthValue() {
        const settings = await this.getSettings();
        return settings.admin.defaultHealthValue;
    }
    async getDefaultLicenseSeats() {
        const settings = await this.getSettings();
        return settings.university.defaultLicenseSeats;
    }
    // Clear cache to force refresh
    clearCache() {
        this.cachedSettings = null;
        this.lastFetch = 0;
    }
}
export const frontendSettingsService = FrontendSettingsService.getInstance();
