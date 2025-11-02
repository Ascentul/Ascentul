/**
 * Client-side audit payload sanitization
 *
 * Provides defense-in-depth PII redaction and size limiting BEFORE
 * sending audit logs to Convex (which also applies server-side redaction).
 *
 * Benefits of dual-layer sanitization:
 * - Reduces network transmission of large/sensitive payloads
 * - Prevents PII from being logged in server-side errors/traces
 * - Provides fallback if server-side redaction fails
 */

const MAX_AUDIT_PAYLOAD_SIZE = 8000 // 8KB limit (Convex applies 10KB, use smaller here)

// Simple regex patterns for common PII
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
const URL_PATTERN = /(https?:\/\/[^\s]+)/g
const PHONE_PATTERN = /\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g

/**
 * Sanitize a string value by redacting common PII patterns
 */
function sanitizeString(value: string): string {
  return value
    .replace(EMAIL_PATTERN, '[EMAIL]')
    .replace(URL_PATTERN, '[URL]')
    .replace(PHONE_PATTERN, '[PHONE]')
}

/**
 * Recursively sanitize a value (object, array, or primitive)
 */
function sanitizeValue(value: unknown, depth = 0): unknown {
  // Prevent deep recursion
  if (depth > 5) {
    return '[MAX_DEPTH]'
  }

  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === 'string') {
    return sanitizeString(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1))
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val, depth + 1)
    }
    return sanitized
  }

  // Return primitives (numbers, booleans) as-is
  return value
}

/**
 * Sanitize and size-limit an audit payload
 *
 * @param payload - Raw payload to sanitize (tool input/output)
 * @param maxSize - Maximum size in characters (default: 8KB)
 * @returns Sanitized payload or truncation metadata if too large
 */
export function safeAuditPayload(payload: unknown, maxSize = MAX_AUDIT_PAYLOAD_SIZE): unknown {
  try {
    // Step 1: Redact PII
    const sanitized = sanitizeValue(payload)

    // Step 2: Serialize and check size
    const serialized = JSON.stringify(sanitized)

    if (serialized.length <= maxSize) {
      return sanitized
    }

    // Step 3: Truncate if too large
    return {
      _truncated: true,
      _original_size: serialized.length,
      _max_size: maxSize,
      _preview: serialized.substring(0, Math.min(500, maxSize - 200)),
    }
  } catch (error) {
    // Fallback if sanitization fails (e.g., circular references)
    return {
      _error: true,
      _message: 'Failed to sanitize audit payload',
    }
  }
}
