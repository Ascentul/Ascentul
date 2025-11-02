/**
 * Client-side Feature Flag Utilities
 *
 * Simple helpers for checking feature flags in React components
 */

/**
 * Feature flags type definition
 */
export type FeatureFlags = {
  agent?: {
    enabled?: boolean
    proactive?: boolean
    nudges?: {
      email?: boolean
      push?: boolean
    }
    tools?: {
      resume?: {
        analyze?: boolean
      }
      careerPath?: boolean
      jobMatching?: boolean
    }
  }
}

/**
 * Check if agent is enabled
 */
export const isAgentEnabled = (flags?: FeatureFlags): boolean => {
  return !!flags?.agent?.enabled
}

/**
 * Check if proactive nudges are enabled
 */
export const isProactiveEnabled = (flags?: FeatureFlags): boolean => {
  return !!flags?.agent?.proactive
}

/**
 * Check if email nudges are enabled
 */
export const isEmailNudgesEnabled = (flags?: FeatureFlags): boolean => {
  return !!flags?.agent?.nudges?.email
}

/**
 * Check if push nudges are enabled
 */
export const isPushNudgesEnabled = (flags?: FeatureFlags): boolean => {
  return !!flags?.agent?.nudges?.push
}

/**
 * Check if resume analysis tool is enabled
 */
export const isResumeAnalysisEnabled = (flags?: FeatureFlags): boolean => {
  return !!flags?.agent?.tools?.resume?.analyze
}

/**
 * Check if career path tool is enabled
 */
export const isCareerPathEnabled = (flags?: FeatureFlags): boolean => {
  return !!flags?.agent?.tools?.careerPath
}

/**
 * Check if job matching is enabled
 */
export const isJobMatchingEnabled = (flags?: FeatureFlags): boolean => {
  return !!flags?.agent?.tools?.jobMatching
}

/**
 * Generic feature flag checker
 *
 * Traverses nested flag object using dot-notation path.
 * Example: isFeatureEnabled(flags, 'agent.tools.careerPath')
 */
export const isFeatureEnabled = (flags: FeatureFlags | undefined, path: string): boolean => {
  const parts = path.split('.')
  let current: any = flags

  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return false
    }
    current = current[part]
  }

  return !!current
}

/**
 * Feature flag keys (should match convex/config/agentConstants.ts)
 */
export const FEATURE_FLAG_KEYS = {
  AGENT_ENABLED: 'agent.enabled',
  PROACTIVE_ENABLED: 'agent.proactive.enabled',
  EMAIL_NUDGES: 'agent.nudges.email',
  PUSH_NUDGES: 'agent.nudges.push',
  RESUME_ANALYSIS: 'agent.tools.resume.analyze',
  CAREER_PATH: 'agent.tools.careerPath',
  JOB_MATCHING: 'agent.tools.jobMatching',
} as const
