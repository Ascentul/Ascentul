/**
 * PII Redaction Utilities for Audit Logging
 *
 * Redacts sensitive personally identifiable information (PII) from payloads
 * before storing in audit logs to ensure GDPR/CCPA compliance and data minimization.
 */

// Maximum size for JSON payloads (in characters)
export const MAX_PAYLOAD_SIZE = 10000 // 10KB character limit

// Regex patterns for PII detection
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
const PHONE_PATTERN = /\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
const URL_PATTERN = /(https?:\/\/[^\s]+)/g
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g
const CREDIT_CARD_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g

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
 */
function redactValue(value: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[MAX_DEPTH_EXCEEDED]'
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return value
  }

  // Handle strings
  if (typeof value === 'string') {
    return redactString(value)
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1))
  }

  // Handle objects
  if (typeof value === 'object') {
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
        redacted[key] = redactValue(val, depth + 1)
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

  // Create truncation metadata
  const metadata = {
    _truncated: true,
    _original_size: jsonString.length,
    _max_size: maxSize,
    _preview: jsonString.substring(0, Math.min(500, maxSize - 200)),
  }

  return JSON.stringify(metadata)
}

/**
 * Main function: Redacts PII and enforces size limits on audit payloads
 *
 * @param payload - The payload to redact (can be any JSON-serializable value)
 * @param maxSize - Maximum allowed size in characters (default: MAX_PAYLOAD_SIZE)
 * @returns Redacted payload, or null if serialization fails
 */
export function redactAuditPayload(
  payload: unknown,
  maxSize: number = MAX_PAYLOAD_SIZE
): unknown {
  try {
    // Step 1: Redact PII from the payload
    const redacted = redactValue(payload)

    // Step 2: Serialize to JSON
    const jsonString = JSON.stringify(redacted)

    // Step 3: Check size and truncate if needed
    const final = truncatePayload(jsonString, maxSize)

    // Step 4: Parse back to object (to maintain type consistency)
    return JSON.parse(final)
  } catch (error) {
    // If anything fails, return error metadata instead of crashing
    return {
      _error: true,
      _message: 'Failed to redact/serialize payload',
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
