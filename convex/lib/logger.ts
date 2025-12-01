/**
 * Convex-Compatible Structured Logger
 *
 * This module provides logging utilities for Convex functions with:
 * - Structured JSON output for log aggregation
 * - PII sanitization leveraging existing piiSafe.ts utilities
 * - Correlation ID support for request tracing
 *
 * ## Usage Example
 *
 * ```typescript
 * import { log, createLogContext } from './lib/logger';
 *
 * export const createGoal = mutation({
 *   args: {
 *     clerkId: v.string(),
 *     title: v.string(),
 *     correlationId: v.optional(v.string()),
 *   },
 *   handler: async (ctx, args) => {
 *     const logCtx = createLogContext('goal', args.correlationId);
 *
 *     log('info', 'Creating goal', { ...logCtx, event: 'operation.start' });
 *
 *     // ... handler logic
 *
 *     log('info', 'Goal created', {
 *       ...logCtx,
 *       event: 'operation.success',
 *       extra: { goalId: newGoal._id }
 *     });
 *
 *     return newGoal._id;
 *   },
 * });
 * ```
 *
 * ## PII Safety Rules
 *
 * NEVER LOG:
 * - names, emails, phone, address, ssn
 * - resume text, cover letter content, chat messages
 * - tokens, API keys, secrets, passwords
 *
 * SAFE TO LOG:
 * - internal IDs (userId, goalId, applicationId, resumeId, universityId)
 * - metadata (role, planType, status, stage)
 * - metrics (count, durationMs, tokenCount)
 */

import { sanitizeError } from './piiSafe';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Log severity levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Numeric priority for level comparison */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Application feature areas for log categorization */
export type LogFeature =
  | 'auth'
  | 'resume'
  | 'cover-letter'
  | 'application'
  | 'goal'
  | 'ai-coach'
  | 'career-path'
  | 'university'
  | 'advisor'
  | 'webhook'
  | 'gdpr'
  | 'admin'
  | 'billing'
  | 'support'
  | 'file'
  | 'audit'
  | 'system';

/** Runtime environment */
export type Environment = 'development' | 'preview' | 'production';

/** User role for log context */
export type UserRole =
  | 'individual'
  | 'student'
  | 'advisor'
  | 'university_admin'
  | 'super_admin'
  | 'staff'
  | 'unknown';

/** Subscription plan for log context */
export type PlanType = 'free' | 'premium' | 'university' | 'unknown';

/** Log context - all fields are safe to log (no PII) */
export interface LogContext {
  /** Feature area being logged */
  feature: LogFeature;
  /** Event type (e.g., 'operation.start', 'data.created') */
  event: string;

  // Request context
  /** Correlation ID for request tracing (passed from API routes) */
  correlationId?: string;

  // User context (IDs and metadata only)
  /** Internal Convex user ID (safe to log) */
  userId?: string;
  /** Clerk user ID (safe to log) */
  clerkId?: string;
  /** User role */
  role?: UserRole;
  /** University ID for multi-tenancy */
  tenantId?: string;
  /** Subscription plan type */
  planType?: PlanType;

  // Operation context
  /** Operation duration in milliseconds */
  durationMs?: number;

  // Error context (safe fields only)
  /** Safe error code (e.g., 'USER_NOT_FOUND', 'UNAUTHORIZED') */
  errorCode?: string;
  /** Error type name (e.g., 'ValidationError', 'AuthError') */
  errorType?: string;

  /** Additional safe metadata - automatically sanitized */
  extra?: Record<string, unknown>;
}

/** Full log entry structure */
export interface LogEntry {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Log level */
  level: LogLevel;
  /** Human-readable message */
  message: string;
  /** Runtime environment */
  environment: Environment;
  /** Service name */
  service: string;
  /** Log context */
  context: LogContext;
}

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Detect current environment.
 * In Convex, we can check CONVEX_CLOUD_ENVIRONMENT or fall back to a default.
 */
export function getEnvironment(): Environment {
  // Convex provides environment info - check if we're in production
  // Note: Convex doesn't expose NODE_ENV directly, but we can infer from URL
  const isProduction = process.env.CONVEX_CLOUD_URL?.includes('.convex.cloud');
  return isProduction ? 'production' : 'development';
}

/**
 * Get minimum log level for current environment.
 * Production only logs info and above, dev logs everything.
 */
function getMinLogLevel(): LogLevel {
  const env = getEnvironment();
  return env === 'production' ? 'info' : 'debug';
}

// ============================================================================
// PII SANITIZATION
// ============================================================================

/**
 * PII-unsafe field patterns to sanitize from extra data.
 * Fields matching these patterns will be redacted.
 */
const PII_PATTERNS = [
  'email',
  'mail',
  'name',
  'firstname',
  'lastname',
  'phone',
  'address',
  'ssn',
  'social',
  'password',
  'pwd',
  'token',
  'secret',
  'key',
  'auth',
  'credential',
  'resume',
  'cover',
  'letter',
  'message',
  'content',
  'text',
  'body',
  'bio',
  'notes',
  'description',
  'comment',
  'dob',
  'dateofbirth',
  'birthday',
];

/**
 * Recursively sanitize PII from extra context.
 * Redacts fields matching PII patterns and converts arrays to counts.
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object safe for logging
 */
export function sanitizePII(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isPIIField = PII_PATTERNS.some((pattern) => lowerKey.includes(pattern));

    if (isPIIField) {
      result[key] = '[REDACTED]';
    } else if (value === null || value === undefined) {
      result[key] = value;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizePII(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      // Log array length, not contents (may contain PII)
      result[key] = `[Array:${value.length}]`;
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Map error to safe error code.
 * Never logs raw error.message as it may contain PII.
 *
 * @param error - Error to map
 * @returns Safe error code string
 */
export function toErrorCode(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('unauthorized') || message.includes('unauthenticated')) {
      return 'UNAUTHORIZED';
    }
    if (message.includes('not found')) return 'NOT_FOUND';
    if (message.includes('forbidden') || message.includes('access denied')) {
      return 'FORBIDDEN';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('rate limit')) return 'RATE_LIMITED';
    if (message.includes('conflict') || message.includes('duplicate')) {
      return 'CONFLICT';
    }
    if (message.includes('bad request')) return 'BAD_REQUEST';

    // Check error name
    if (error.name === 'ConvexError') return 'CONVEX_ERROR';
    if (error.name === 'ValidationError') return 'VALIDATION_ERROR';

    return 'INTERNAL_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

/**
 * Extract error type from error object.
 *
 * @param error - Error to extract type from
 * @returns Error type name
 */
export function toErrorType(error: unknown): string {
  if (error instanceof Error) {
    return error.constructor.name;
  }
  return 'UnknownError';
}

/**
 * Create a safe error context for logging.
 * Uses existing sanitizeError from piiSafe.ts plus our error code mapping.
 *
 * @param error - Error to create context from
 * @returns Safe error context for logging
 */
export function createErrorContext(error: unknown): {
  errorCode: string;
  errorType: string;
  errorStatus?: number;
} {
  const sanitized = sanitizeError(error);
  return {
    errorCode: toErrorCode(error),
    errorType: toErrorType(error),
    errorStatus: sanitized.status,
  };
}

// ============================================================================
// CORE LOGGING
// ============================================================================

/**
 * Main logging function - outputs single-line JSON.
 *
 * @param level - Log level
 * @param message - Human-readable message
 * @param context - Log context with feature, event, and metadata
 */
export function log(level: LogLevel, message: string, context: LogContext): void {
  const minLevel = getMinLogLevel();
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minLevel]) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: getEnvironment(),
    service: 'ascentul-convex',
    context: {
      ...context,
      extra: context.extra ? sanitizePII(context.extra) : undefined,
    },
  };

  // Output as single-line JSON for log aggregation
  const jsonLine = JSON.stringify(entry);

  switch (level) {
    case 'error':
      console.error(jsonLine);
      break;
    case 'warn':
      console.warn(jsonLine);
      break;
    default:
      console.log(jsonLine);
  }
}

/** Convenience logger object with level methods */
export const logger = {
  debug: (message: string, context: LogContext) => log('debug', message, context),
  info: (message: string, context: LogContext) => log('info', message, context),
  warn: (message: string, context: LogContext) => log('warn', message, context),
  error: (message: string, context: LogContext) => log('error', message, context),
};

// ============================================================================
// CONTEXT HELPERS
// ============================================================================

/**
 * Create a log context object for Convex functions.
 * Use this to create a base context that can be spread into log calls.
 *
 * @param feature - Feature area
 * @param correlationId - Optional correlation ID from API route
 * @returns Partial log context object
 *
 * @example
 * ```typescript
 * const logCtx = createLogContext('goal', args.correlationId);
 *
 * log('info', 'Creating goal', { ...logCtx, event: 'operation.start' });
 * log('info', 'Goal created', { ...logCtx, event: 'operation.success', extra: { goalId } });
 * ```
 */
export function createLogContext(
  feature: LogFeature,
  correlationId?: string,
): { feature: LogFeature; correlationId?: string } {
  return {
    feature,
    correlationId,
  };
}

/**
 * Create a log context with user information.
 *
 * @param feature - Feature area
 * @param options - User context options
 * @returns Log context with user info
 */
export function createUserLogContext(
  feature: LogFeature,
  options: {
    correlationId?: string;
    userId?: string;
    clerkId?: string;
    role?: UserRole;
    tenantId?: string;
    planType?: PlanType;
  },
): Partial<LogContext> {
  return {
    feature,
    ...options,
  };
}

/** Performance timer for measuring operation duration */
export class PerformanceTimer {
  private startTime: number;
  private feature: LogFeature;
  private correlationId?: string;

  constructor(feature: LogFeature, correlationId?: string) {
    this.feature = feature;
    this.correlationId = correlationId;
    this.startTime = Date.now();
  }

  /**
   * End the timer and log the result.
   *
   * @param message - Log message
   * @param event - Event type
   * @param extra - Additional context
   * @returns Duration in milliseconds
   */
  end(message: string, event: string, extra?: Record<string, unknown>): number {
    const durationMs = Date.now() - this.startTime;

    log('info', message, {
      feature: this.feature,
      event,
      correlationId: this.correlationId,
      durationMs,
      extra,
    });

    return durationMs;
  }

  /** Get elapsed time without logging */
  elapsed(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * Create a new performance timer.
 *
 * @param feature - Feature area
 * @param correlationId - Optional correlation ID
 * @returns Performance timer instance
 *
 * @example
 * ```typescript
 * const timer = startTimer('resume', args.correlationId);
 * // ... do work
 * timer.end('Resume processed', 'operation.success', { resumeId });
 * ```
 */
export function startTimer(feature: LogFeature, correlationId?: string): PerformanceTimer {
  return new PerformanceTimer(feature, correlationId);
}
