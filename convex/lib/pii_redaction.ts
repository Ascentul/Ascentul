/**
 * PII Redaction Utilities for Audit Logging
 *
 * Redacts sensitive personally identifiable information (PII) from payloads
 * before storing in audit logs to ensure GDPR/CCPA compliance and data minimization.
 */

// Maximum size for JSON payloads (in characters)
export const MAX_PAYLOAD_SIZE = 10000 // 10KB character limit

// Regex patterns for PII detection
// Note: Patterns are designed to avoid ReDoS (Regular Expression Denial of Service)
// by using non-backtracking patterns and limiting quantifier nesting

// Email: Uses character classes without nested quantifiers to prevent catastrophic backtracking
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,}\b/g

// Phone: Uses non-capturing groups and limited quantifiers to prevent backtracking
const PHONE_PATTERN = /\b(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g

// URL: Tightened pattern to avoid catastrophic backtracking on long inputs
const URL_PATTERN = /https?:\/\/[^\s]{1,2048}/g

// SSN: Simple pattern with no nested quantifiers
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g

// Credit Card: More specific pattern to reduce false positives on order IDs, tracking numbers, etc.
// Uses non-capturing group and limits total length
// Note: This is still broad and may match non-card 16-digit numbers. Consider:
// 1. Only applying in payment-related contexts
// 2. Adding Luhn algorithm validation for higher confidence
// 3. Checking for known card BIN ranges (first 6 digits)
const CREDIT_CARD_PATTERN = /\b(?:\d{4}[\s-]?){3}\d{4}\b/g

/**
 * Sensitive field names for PII redaction
 *
 * SECURITY NOTE: Pattern matching uses underscore-delimited boundaries to avoid
 * false positives like "secretary" or "tokenize", while still catching variants
 * like "user_password", "password_hash", "access_token", etc.
 *
 * Trade-off: Some legitimate fields may be redacted (e.g., "password_strength",
 * "token_count"). This is intentional - it's safer to over-redact than under-redact
 * for PII/compliance purposes. If specific fields need to be preserved, add them
 * to an allowlist or use more specific sensitive field patterns.
 */
const SENSITIVE_FIELD_NAMES = [
  // Authentication credentials
  'password',
  'passwd',
  'pwd',

  // API credentials
  'api_key',
  'apikey',
  'access_token',
  'refresh_token',
  'bearer_token',
  'auth_token',
  'session_token',
  'csrf_token',

  // Secrets
  'secret',
  'client_secret',
  'private_key',

  // Payment information
  'stripe_customer_id',
  'stripe_subscription_id',
  'credit_card',
  'card_number',
  'cvv',
  'card_cvv',

  // Personal identifiers
  'ssn',
  'social_security',
  'phone',
  'phone_number',
  'mobile',
  'mobile_number',
]

/**
 * Redacts PII from a string value
 */
function redactString(value: string): string {
  let redacted = value

  // Redact emails
  redacted = redacted.replace(EMAIL_PATTERN, '[EMAIL_REDACTED]')

  // Redact phone numbers
  redacted = redacted.replace(PHONE_PATTERN, '[PHONE_REDACTED]')

  // Redact URLs (may contain tracking params or sensitive info)
  redacted = redacted.replace(URL_PATTERN, '[URL_REDACTED]')

  // Redact SSNs
  redacted = redacted.replace(SSN_PATTERN, '[SSN_REDACTED]')

  // Redact credit cards
  redacted = redacted.replace(CREDIT_CARD_PATTERN, '[CARD_REDACTED]')

  return redacted
}

/**
 * Recursively redacts PII from objects, arrays, and primitive values
 *
 * @param value - The value to redact
 * @param depth - Current recursion depth (prevents stack overflow)
 * @param seen - WeakSet tracking visited objects (prevents infinite loops on circular references)
 */
function redactValue(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  // Prevent infinite recursion (depth limit protects against pathological deep structures)
  if (depth > 10) {
    return '[MAX_DEPTH_EXCEEDED]'
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return value
  }

  // Detect circular references (must check before processing objects/arrays)
  if (typeof value === 'object' && seen.has(value as object)) {
    return '[CIRCULAR_REFERENCE]'
  }

  // Handle strings
  if (typeof value === 'string') {
    return redactString(value)
  }

  // Handle arrays
  if (Array.isArray(value)) {
    seen.add(value)
    return value.map((item) => redactValue(item, depth + 1, seen))
  }

  // Handle objects
  if (typeof value === 'object') {
    seen.add(value)
    const redacted: Record<string, unknown> = {}

    for (const [key, val] of Object.entries(value)) {
      // Check if field name is sensitive using precise matching
      // This prevents false positives like "secret_santa", "token_count", etc.
      const keyLower = key.toLowerCase()
      const isSensitiveField = SENSITIVE_FIELD_NAMES.some((sensitiveKey) => {
        const lowerSensitive = sensitiveKey.toLowerCase()
        return (
          keyLower === lowerSensitive || // Exact match: "password"
          keyLower.endsWith(`_${lowerSensitive}`) || // Suffix: "user_password"
          keyLower.startsWith(`${lowerSensitive}_`) || // Prefix: "password_hash"
          keyLower.includes(`_${lowerSensitive}_`) // Middle: "temp_password_reset"
        )
      })

      if (isSensitiveField) {
        redacted[key] = '[REDACTED]'
      } else {
        redacted[key] = redactValue(val, depth + 1, seen)
      }
    }

    return redacted
  }

  // Return primitive values as-is (numbers, booleans)
  return value
}

/**
 * Truncates a JSON string to max size, ensuring valid JSON output
 */
function truncatePayload(jsonString: string, maxSize: number): string {
  if (jsonString.length <= maxSize) {
    return jsonString
  }

  // Calculate preview size, ensuring enough room for metadata overhead
  const metadataOverhead = 150 // Approximate size of metadata structure
  const availablePreviewSize = Math.max(0, maxSize - metadataOverhead)
  const previewSize = Math.min(500, availablePreviewSize)

  // Create truncation metadata
  const metadata = {
    _truncated: true,
    _original_size: jsonString.length,
    _max_size: maxSize,
    _preview: jsonString.substring(0, previewSize),
  }

  const result = JSON.stringify(metadata)
  
  // If metadata itself exceeds maxSize, return minimal metadata
  if (result.length > maxSize) {
    return JSON.stringify({
      _truncated: true,
      _original_size: jsonString.length,
      _max_size: maxSize,
      _preview: '',
    })
  }
  
  return result
}

/**
 * Main function: Redacts PII and enforces size limits on audit payloads
 *
 * @param payload - The payload to redact (can be any JSON-serializable value)
 * @param maxSize - Maximum allowed size in characters (default: MAX_PAYLOAD_SIZE)
 * @returns Redacted payload, or error metadata object if serialization fails
 */
export function redactAuditPayload(
  payload: unknown,
  maxSize: number = MAX_PAYLOAD_SIZE
): unknown {
  try {
    // Step 1: Redact PII from the payload
    let redacted: unknown
    try {
      redacted = redactValue(payload)
    } catch (error) {
      return {
        _error: true,
        _message: 'Failed to redact PII from payload',
        _error_details: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Step 2: Serialize to JSON
    let jsonString: string
    try {
      jsonString = JSON.stringify(redacted)
    } catch (error) {
      return {
        _error: true,
        _message: 'Failed to serialize redacted payload',
        _error_details: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Step 3: Check size and truncate if needed
    let final: string
    try {
      final = truncatePayload(jsonString, maxSize)
    } catch (error) {
      return {
        _error: true,
        _message: 'Failed to truncate payload',
        _error_details: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Step 4: Parse back to object (to maintain type consistency)
    try {
      return JSON.parse(final)
    } catch (error) {
      return {
        _error: true,
        _message: 'Failed to parse truncated payload',
        _error_details: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  } catch (error) {
    // Catch any unexpected errors not caught by inner handlers
    return {
      _error: true,
      _message: 'Failed to process payload',
      _error_details: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Lightweight version for smaller payloads (like tool names, status flags)
 * Only applies size limits, skips PII redaction
 */
export function capPayloadSize(payload: unknown, maxSize: number = MAX_PAYLOAD_SIZE): unknown {
  try {
    const jsonString = JSON.stringify(payload)
    const final = truncatePayload(jsonString, maxSize)
    return JSON.parse(final)
  } catch (error) {
    return {
      _error: true,
      _message: 'Failed to serialize payload',
    }
  }
}
