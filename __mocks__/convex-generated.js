// Mock for convex/_generated modules
const ref = (name) => ({ _name: name })

module.exports = {
  api: {
    analytics: {
      getUserDashboardAnalytics: ref('analytics:getUserDashboardAnalytics'),
      getAdminAnalytics: ref('analytics:getAdminAnalytics'),
    },
    university_admin: {
      getUniversityAnalytics: ref('university_admin:getUniversityAnalytics'),
    },
    universities: {
      getUniversitySettings: ref('universities:getUniversitySettings'),
      updateUniversitySettings: ref('universities:updateUniversitySettings'),
    },
    users: {
      getUserByClerkId: ref('users:getUserByClerkId'),
      setStripeCustomer: ref('users:setStripeCustomer'),
      updateUser: ref('users:updateUser'),
    },
    avatar: {
      generateAvatarUploadUrl: ref('avatar:generateAvatarUploadUrl'),
      updateUserAvatar: ref('avatar:updateUserAvatar'),
    },
    projects: {
      getUserProjects: ref('projects:getUserProjects'),
    },
    ai_coach: {
      getConversations: ref('ai_coach:getConversations'),
      getMessages: ref('ai_coach:getMessages'),
      createConversation: ref('ai_coach:createConversation'),
      sendMessage: ref('ai_coach:sendMessage'),
      addMessages: ref('ai_coach:addMessages'),
    },
    goals: {
      getUserGoals: ref('goals:getUserGoals'),
    },
    applications: {
      getUserApplications: ref('applications:getUserApplications'),
    },
    resumes: {
      getUserResumes: ref('resumes:getUserResumes'),
    },
    cover_letters: {
      getUserCoverLetters: ref('cover_letters:getUserCoverLetters'),
    },
    platform_settings: {
      getPlatformSettings: ref('platform_settings:getPlatformSettings'),
      updatePlatformSettings: ref('platform_settings:updatePlatformSettings'),
    },
  },
};
