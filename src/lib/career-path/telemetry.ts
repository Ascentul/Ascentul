/**
 * Career Path Telemetry
 *
 * Structured logging and metrics for career path generation.
 * Tracks success, failures, quality rejections, and fallback events.
 */

import { TelemetryEvent, QualityCheckResult, QualityFailureReason } from './types'

// ============================================================================
// TELEMETRY CONFIGURATION
// ============================================================================

const TELEMETRY_ENABLED = process.env.NODE_ENV !== 'test'
// Enable console logging in development for debugging
const CONSOLE_LOG_ENABLED = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_CAREER_PATH === 'true'

// ============================================================================
// EVENT EMITTERS
// ============================================================================

/**
 * Emit a telemetry event
 */
export function emitTelemetryEvent(event: TelemetryEvent): void {
  if (!TELEMETRY_ENABLED) return

  // Console logging for development
  if (CONSOLE_LOG_ENABLED) {
    console.log('[Career Path Telemetry]', JSON.stringify(event, null, 2))
  }

  // TODO: Send to your analytics service (e.g., PostHog, Mixpanel, Segment)
  // Example:
  // posthog.capture(event.event, {
  //   userId: event.userId,
  //   jobTitle: event.jobTitle,
  //   model: event.model,
  //   ...event
  // })
}

/**
 * Log a generation attempt
 */
export function logGenerationAttempt(params: {
  userId: string
  jobTitle: string
  model: string
  promptVariant: 'base' | 'refine'
  attemptNumber: number
}): void {
  emitTelemetryEvent({
    event: 'career_path_generation_attempt',
    timestamp: Date.now(),
    ...params,
  })
}

/**
 * Log a successful generation
 */
export function logGenerationSuccess(params: {
  userId: string
  jobTitle: string
  model: string
  promptVariant: 'base' | 'refine'
}): void {
  emitTelemetryEvent({
    event: 'career_path_generation_success',
    timestamp: Date.now(),
    ...params,
  })
}

/**
 * Log a quality check failure
 */
export function logQualityFailure(params: {
  userId: string
  jobTitle: string
  model: string
  promptVariant: 'base' | 'refine'
  failureReason: QualityFailureReason
  failureDetails?: string
}): void {
  emitTelemetryEvent({
    event: 'career_path_quality_failure',
    timestamp: Date.now(),
    ...params,
  })
}

/**
 * Log a fallback to profile guidance
 */
export function logFallbackToGuidance(params: {
  userId: string
  jobTitle: string
  reason: string
  failureReason?: QualityFailureReason
}): void {
  emitTelemetryEvent({
    event: 'career_path_generation_fallback',
    timestamp: Date.now(),
    failureReason: params.failureReason || 'insufficient_domain_specificity',
    failureDetails: params.reason,
    userId: params.userId,
    jobTitle: params.jobTitle,
  })
}

// ============================================================================
// QUALITY CHECK RESULT BUILDERS
// ============================================================================

export function buildQualitySuccess(): QualityCheckResult {
  return { valid: true }
}

export function buildQualityFailure(
  reason: QualityFailureReason,
  details?: string
): QualityCheckResult {
  return {
    valid: false,
    reason,
    details,
  }
}

// ============================================================================
// STRUCTURED ERROR LOGGING
// ============================================================================

export function logStructuredError(context: string, error: unknown, metadata?: Record<string, unknown>): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  const logEntry = {
    context,
    error: errorMessage,
    stack: errorStack,
    timestamp: Date.now(),
    ...metadata,
  }

  if (CONSOLE_LOG_ENABLED) {
    console.error('[Career Path Error]', JSON.stringify(logEntry, null, 2))
  }

  // TODO: Send to error tracking service (e.g., Sentry)
  // Sentry.captureException(error, { contexts: { careerPath: metadata } })
}

// ============================================================================
// ANALYTICS HELPERS
// ============================================================================

/**
 * Track user action in career path feature
 */
export function trackUserAction(action: string, properties?: Record<string, unknown>): void {
  if (!TELEMETRY_ENABLED) return

  if (CONSOLE_LOG_ENABLED) {
    console.log('[Career Path Action]', action, properties)
  }

  // TODO: Send to analytics service
  // analytics.track(action, properties)
}

/**
 * Common actions for tracking
 */
export const CareerPathActions = {
  GENERATE_CLICKED: 'career_path_generate_clicked',
  CAREER_PATH_LOADED: 'career_path_loaded',
  GUIDANCE_PATH_LOADED: 'guidance_path_loaded',
  ADD_AS_GOAL_CLICKED: 'career_path_add_as_goal_clicked',
  NODE_CLICKED: 'career_path_node_clicked',
  CERTIFICATION_ADDED: 'career_path_certification_added',
  PATH_SAVED: 'career_path_saved',
  PATH_DELETED: 'career_path_deleted',
} as const

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export class PerformanceTimer {
  private startTime: number
  private label: string

  constructor(label: string) {
    this.label = label
    this.startTime = Date.now()
  }

  end(metadata?: Record<string, unknown>): number {
    const duration = Date.now() - this.startTime

    if (CONSOLE_LOG_ENABLED) {
      console.log(`[Career Path Performance] ${this.label}: ${duration}ms`, metadata)
    }

    // TODO: Send to performance monitoring service
    // Example: track metric to DataDog, New Relic, etc.

    return duration
  }
}

export function startTimer(label: string): PerformanceTimer {
  return new PerformanceTimer(label)
}
