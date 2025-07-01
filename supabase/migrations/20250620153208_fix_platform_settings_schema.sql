-- Fix platform_settings table schema
-- Drop and recreate platform_settings table with correct schema
DROP TABLE IF EXISTS public.platform_settings CASCADE;

CREATE TABLE public.platform_settings (
  id SERIAL PRIMARY KEY,
  general JSONB NOT NULL,
  features JSONB NOT NULL,
  user_roles JSONB NOT NULL,
  university JSONB NOT NULL,
  email JSONB NOT NULL,
  api JSONB NOT NULL,
  security JSONB NOT NULL,
  xp_system JSONB NOT NULL,
  admin JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.platform_settings (
  general, features, user_roles, university, email, api, security, xp_system, admin
) VALUES (
  '{"platformName":"Ascentul","supportEmail":"support@ascentul.com","defaultTimezone":"America/New_York","maintenanceMode":false}',
  '{"enableReviews":true,"enableAICoach":true,"enableResumeStudio":true,"enableVoicePractice":true,"enableCareerGoals":true,"enableApplicationTracker":true,"enableNetworkHub":true,"enableCareerPathExplorer":true,"enableProjectPortfolio":true,"enableCoverLetterStudio":true}',
  '{"defaultUserRole":"student","freeFeatures":["resume-builder","cover-letter","application-tracker"],"proFeatures":["ai-coach","voice-practice","unlimited-resumes"]}',
  '{"defaultSeatCount":100,"trialDurationDays":30,"defaultAdminPermissions":["manage-users","view-analytics"],"defaultLicenseSeats":100}',
  '{"notifyOnReviews":true,"notifyOnSignups":true,"notifyOnErrors":true,"defaultReplyToEmail":"noreply@ascentul.com","enableMarketingEmails":false}',
  '{"openaiModel":"gpt-4o","maxTokensPerRequest":4000,"webhookUrls":[]}',
  '{"requireMfaForAdmins":false,"sessionTimeoutMinutes":120,"allowedIpAddresses":[]}',
  '{"goalCompletionReward":100,"goalCreationReward":50,"personalAchievementValue":100,"personalAchievementCreationReward":50,"resumeCreationReward":100,"achievementEarnedReward":100}',
  '{"bulkThreshold":100,"defaultHealthValue":100}'
); 