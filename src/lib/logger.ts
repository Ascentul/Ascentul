/**
 * Structured logging utility
 *
 * Provides consistent logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured context data
 * - Production-ready output format
 * - Easy integration with logging services (Datadog, Sentry, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Check if we're in production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Format log message with context
 *
 * Safely serializes log data to JSON, handling circular references and
 * non-serializable values that could crash the application.
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const logData = {
    ...context,
    timestamp,
    level: level.toUpperCase(),
    message,
  };

  try {
    return JSON.stringify(logData);
  } catch (err) {
    // Fallback if serialization fails (circular references, functions, symbols, etc.)
    // Preserve error details and context keys to aid debugging
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      serializationError: err instanceof Error ? err.message : String(err),
      contextKeys: context ? Object.keys(context) : [],
    });
  }
}

/**
 * Log a debug message (only in development)
 */
export function logDebug(message: string, context?: LogContext): void {
  if (!isProduction()) {
    console.log(formatLog('debug', message, context));
  }
}

/**
 * Log an info message
 */
export function logInfo(message: string, context?: LogContext): void {
  console.log(formatLog('info', message, context));
}

/**
 * Log a warning message
 */
export function logWarn(message: string, context?: LogContext): void {
  console.warn(formatLog('warn', message, context));
}

/**
 * Log an error message
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext): void {
  const errorContext = {
    ...context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  };

  console.error(formatLog('error', message, errorContext));
}

/**
 * Logger instance with all methods
 */
export const logger = {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
};
