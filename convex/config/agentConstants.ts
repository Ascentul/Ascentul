/**
 * Agent System Constants
 *
 * Centralized configuration for:
 * - Rate limits per plan
 * - Cooldown periods for proactive nudges
 * - Daily nudge caps
 * - Quiet hours defaults
 * - Channel priorities
 */

/**
 * Rate limits for agent tool usage
 */
export const RATE_LIMITS = {
  free: {
    requestsPerHour: 10,
    requestsPerDay: 50,
    proactiveNudgesPerDay: 2,
  },
  premium: {
    requestsPerHour: 50,
    requestsPerDay: 500,
    proactiveNudgesPerDay: 5,
  },
  university: {
    requestsPerHour: 50,
    requestsPerDay: 500,
    proactiveNudgesPerDay: 5,
  },
} as const

/**
 * Cooldown periods for proactive nudges (in milliseconds)
 */
export const NUDGE_COOLDOWNS = {
  // Rule-specific cooldowns
  interviewSoon: 24 * 60 * 60 * 1000, // 24 hours
  appRescue: 7 * 24 * 60 * 60 * 1000, // 7 days
  dailyCheck: 24 * 60 * 60 * 1000, // 24 hours
  resumeWeak: 3 * 24 * 60 * 60 * 1000, // 3 days
  roleNoPlan: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Default cooldown for new rules
  default: 4 * 60 * 60 * 1000, // 4 hours
} as const

/**
 * Maximum nudges per day by plan and priority
 */
export const MAX_NUDGES_PER_DAY = {
  free: {
    high: 2,
    medium: 1,
    low: 0,
    total: 2,
  },
  premium: {
    high: 3,
    medium: 2,
    low: 1,
    total: 5,
  },
  university: {
    high: 3,
    medium: 2,
    low: 1,
    total: 5,
  },
} as const

/**
 * Default quiet hours (local time, 24-hour format)
 */
export const DEFAULT_QUIET_HOURS = {
  start: 22, // 10 PM
  end: 8, // 8 AM
} as const

/**
 * Default agent preferences
 */
export const DEFAULT_AGENT_PREFERENCES = {
  agent_enabled: true,
  proactive_enabled: false, // Opt-in for proactive nudges
  notification_frequency: 'realtime' as const,
  quiet_hours_start: DEFAULT_QUIET_HOURS.start,
  quiet_hours_end: DEFAULT_QUIET_HOURS.end,
  timezone: 'America/Los_Angeles', // Default to PST
  channels: {
    inApp: true,
    email: false, // Opt-in for email
    push: false, // Opt-in for push
  },
  playbook_toggles: {
    jobSearch: true,
    resumeHelp: true,
    interviewPrep: true,
    networking: true,
    careerPath: true,
    applicationTracking: true,
  },
} as const

/**
 * Channel priorities for nudges by urgency
 */
export const CHANNEL_PRIORITIES = {
  high: ['inApp', 'email', 'push'],
  medium: ['inApp', 'email'],
  low: ['inApp'],
} as const

/**
 * Snooze preset durations (in milliseconds)
 */
export const SNOOZE_PRESETS = {
  laterToday: 4 * 60 * 60 * 1000, // 4 hours
  tomorrowMorning: () => {
    // Calculate time until tomorrow at 8 AM
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(8, 0, 0, 0)
    return tomorrow.getTime() - now.getTime()
  },
  nextWeek: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const

/**
 * Nudge scoring weights
 */
export const NUDGE_SCORING = {
  priorityMultipliers: {
    high: 1.5,
    medium: 1.0,
    low: 0.5,
  },
  urgencyBonus: {
    // Bonus for time-sensitive nudges
    within24Hours: 2.0,
    within48Hours: 1.5,
    within7Days: 1.2,
  },
  recentIgnorePenalty: 0.5, // Reduce score if user ignored similar nudge recently
  cooldownPenalty: 0, // Zero out score if cooldown active
} as const

/**
 * Agent memory settings
 */
export const MEMORY_SETTINGS = {
  maxMemoriesPerUser: 100,
  defaultExpirationDays: 90,
  confidenceThreshold: 0.7, // Minimum confidence to use memory
} as const

/**
 * Audit log settings
 */
export const AUDIT_SETTINGS = {
  maxPayloadSize: 10240, // 10 KB
  retentionDays: 90,
} as const

/**
 * Tool execution limits
 */
export const TOOL_LIMITS = {
  maxExecutionTime: 30000, // 30 seconds
  maxRetries: 2,
  maxConcurrentTools: 3,
} as const

/**
 * Feature flag keys
 */
export const FEATURE_FLAGS = {
  AGENT_ENABLED: 'agent.enabled',
  PROACTIVE_ENABLED: 'agent.proactive.enabled',
  EMAIL_NUDGES: 'agent.nudges.email',
  PUSH_NUDGES: 'agent.nudges.push',
  RESUME_ANALYSIS: 'agent.tools.resume.analyze',
  CAREER_PATH: 'agent.tools.careerPath',
  JOB_MATCHING: 'agent.tools.jobMatching',
} as const

/**
 * Get rate limit for user's plan
 */
export function getRateLimitForPlan(plan: string): (typeof RATE_LIMITS)['free'] {
  const normalizedPlan = plan.toLowerCase()
  if (normalizedPlan.includes('premium')) {
    return RATE_LIMITS.premium
  }
  if (normalizedPlan.includes('university')) {
    return RATE_LIMITS.university
  }
  return RATE_LIMITS.free
}

/**
 * Get nudge cooldown for rule
 */
export function getCooldownForRule(ruleId: string): number {
  return NUDGE_COOLDOWNS[ruleId as keyof typeof NUDGE_COOLDOWNS] || NUDGE_COOLDOWNS.default
}

/**
 * Get max nudges for plan and priority
 */
export function getMaxNudges(
  plan: string,
  priority?: 'high' | 'medium' | 'low'
): number {
  const normalizedPlan = plan.toLowerCase()
  const limits = normalizedPlan.includes('premium') || normalizedPlan.includes('university')
    ? MAX_NUDGES_PER_DAY.premium
    : MAX_NUDGES_PER_DAY.free

  if (priority) {
    return limits[priority]
  }
  return limits.total
}

/**
 * Check if current time is within quiet hours
 */
export function isQuietHours(
  currentHour: number,
  quietStart: number,
  quietEnd: number
): boolean {
  if (quietStart > quietEnd) {
    // Wrapping case: e.g., 22:00 - 08:00 (wraps midnight)
    return currentHour >= quietStart || currentHour < quietEnd
  } else {
    // Non-wrapping case: e.g., 08:00 - 22:00 (quiet during day)
    return currentHour >= quietStart && currentHour < quietEnd
  }
}
