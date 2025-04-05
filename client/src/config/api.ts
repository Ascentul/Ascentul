/**
 * API Configuration
 * 
 * This file centralizes API endpoint configuration to enable seamless
 * migration between development and production environments.
 */

type EnvironmentConfig = {
  apiBaseUrl: string;
  authBaseUrl: string;
};

// Default configuration for development (local Replit environment)
const devConfig: EnvironmentConfig = {
  apiBaseUrl: '',  // Empty string means relative URL, same origin
  authBaseUrl: '', // Empty string means relative URL, same origin
};

// Production configuration (change when deploying to production)
const prodConfig: EnvironmentConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.careertracker.io',
  authBaseUrl: import.meta.env.VITE_AUTH_BASE_URL || 'https://auth.careertracker.io',
};

// Determine which config to use based on environment
const config = import.meta.env.PROD ? prodConfig : devConfig;

// Admin API endpoints
export const adminEndpoints = {
  // User management
  users: `${config.apiBaseUrl}/api/admin/users`,
  userStats: `${config.apiBaseUrl}/api/admin/users/stats`,
  userDetails: (userId: number) => `${config.apiBaseUrl}/api/admin/users/${userId}`,
  createStaff: `${config.apiBaseUrl}/api/admin/create-staff`,
  updateUserRole: (userId: number) => `${config.apiBaseUrl}/api/admin/users/${userId}/role`,
  
  // Content management
  goals: `${config.apiBaseUrl}/api/admin/goals`,
  achievements: `${config.apiBaseUrl}/api/admin/achievements`,
  interviews: `${config.apiBaseUrl}/api/admin/interviews`,
  
  // System management
  systemStatus: `${config.apiBaseUrl}/api/admin/system/status`,
  systemConfig: `${config.apiBaseUrl}/api/admin/system/config`,
  databaseHealth: `${config.apiBaseUrl}/api/health/database`,
  
  // Analytics
  analytics: {
    users: `${config.apiBaseUrl}/api/admin/analytics/users`,
    engagement: `${config.apiBaseUrl}/api/admin/analytics/engagement`,
    revenue: `${config.apiBaseUrl}/api/admin/analytics/revenue`,
    subscriptions: `${config.apiBaseUrl}/api/admin/analytics/subscriptions`,
  },
  
  // Support
  supportMessages: `${config.apiBaseUrl}/api/contact/messages`,
  supportMessageDetails: (id: number) => `${config.apiBaseUrl}/api/contact/messages/${id}`,
  markMessageRead: (id: number) => `${config.apiBaseUrl}/api/contact/messages/${id}/read`,
  markMessageArchived: (id: number) => `${config.apiBaseUrl}/api/contact/messages/${id}/archive`,
};

// Regular endpoints used in admin dashboard
export const endpoints = {
  // Auth
  login: `${config.authBaseUrl}/api/auth/login`,
  logout: `${config.authBaseUrl}/api/auth/logout`,
  currentUser: `${config.apiBaseUrl}/api/users/me`,
};

// API version for tracking API compatibility
export const API_VERSION = 'v1';

export default config;