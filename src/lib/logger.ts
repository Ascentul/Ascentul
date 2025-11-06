/**
 * Centralized logging utility for the application
 *
 * This provides a single point for all application logging,
 * making it easy to integrate with external services like
 * Sentry, LogRocket, or Datadog in the future.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogContext {
  [key: string]: unknown
}

/**
 * Safely stringify objects with circular references
 * Prevents JSON.stringify from throwing on cyclic dependencies
 */
function safeStringify(obj: any): string {
  const seen = new WeakSet()
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]'
      }
      seen.add(value)
    }
    return value
  })
}

/**
 * Log an error with optional context
 */
export function logError(
  message: string,
  error?: unknown,
  context?: LogContext
): void {
  const errorInfo = {
    message,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    context,
    timestamp: new Date().toISOString(),
  }

  // Console output for development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', message, errorInfo)
  } else {
    // Production: output structured JSON for log aggregators
    console.error(safeStringify(errorInfo))
  }

  // TODO: Integrate external error tracking service (e.g., Sentry, LogRocket)
  // Implementation: Add env var check and service initialization
  // See: docs/logging-integration.md (to be created)
}

/**
 * Log a warning with optional context
 */
export function logWarning(
  message: string,
  context?: LogContext
): void {
  const warningInfo = {
    message,
    context,
    timestamp: new Date().toISOString(),
  }

  // Console output for development
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Warning]', message, warningInfo)
  } else {
    // Production: output structured JSON for log aggregators
    console.warn(safeStringify(warningInfo))
  }

  // TODO: Integrate external error tracking service (e.g., Sentry, LogRocket)
  // Implementation: Add env var check and service initialization
  // See: docs/logging-integration.md (to be created)
}

/**
 * Log an info message with optional context
 */
export function logInfo(
  message: string,
  context?: LogContext
): void {
  const infoData = {
    message,
    context,
    timestamp: new Date().toISOString(),
  }

  // Console output for development
  if (process.env.NODE_ENV === 'development') {
    console.info('[Info]', message, infoData)
  } else {
    // Production: output structured JSON for log aggregators
    console.info(safeStringify(infoData))
  }

  // TODO: Integrate external error tracking service (e.g., Sentry, LogRocket)
  // Implementation: Add env var check and service initialization
  // See: docs/logging-integration.md (to be created)
}

/**
 * Log a debug message with optional context
 * Only logs in development mode
 */
export function logDebug(
  message: string,
  context?: LogContext
): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[Debug]', message, {
      context,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Generic log function with level
 */
export function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): void {
  switch (level) {
    case 'error':
      logError(message, error, context)
      break
    case 'warn':
      logWarning(message, context)
      break
    case 'info':
      logInfo(message, context)
      break
    case 'debug':
      logDebug(message, context)
      break
  }
}
