// Mock for convex/_generated modules
module.exports = {
  api: {
    analytics: {
      getUserDashboardAnalytics: jest.fn(),
      getAdminAnalytics: jest.fn(),
    },
    university_admin: {
      getUniversityAnalytics: jest.fn(),
    },
  },
};