/**
 * PII-Safe Logging Utilities
 *
 * This module provides utilities for safely logging data that may contain
 * Personally Identifiable Information (PII). Use these functions instead of
 * directly logging emails, names, or other sensitive data.
 *
 * FERPA/GDPR Compliance: Logs should not contain raw PII that could identify
 * students or users. These utilities mask sensitive data while preserving
 * enough information for debugging.
 *
 * @example
 * // Instead of: console.log(`Processing ${user.email}`)
 * // Use: console.log(`Processing ${maskEmail(user.email)}`)
 * // Output: Processing j***e@example.com
 */

/**
 * Masks an email address to hide most of the local part while preserving domain.
 * Used for logging to prevent exposing full email addresses.
 *
 * @param email - The email address to mask
 * @returns Masked email like "j***e@domain.com" or "[redacted]" if invalid
 *
 * @example
 * maskEmail("john.doe@example.com")  // "j***e@example.com"
 * maskEmail("ab@test.io")            // "a*@test.io"
 * maskEmail("a@x.com")               // "a*@x.com"
 * maskEmail("")                      // "[redacted]"
 * maskEmail(undefined)               // "[redacted]"
 */
export function maskEmail(email: string | undefined | null): string {
  if (!email) return "[redacted]";

  const [local, domain] = email.split("@");
  if (!domain) return "[redacted]";
  if (!local) return `[redacted]@${domain}`;

  const maskedLocal =
    local.length <= 2
      ? `${local[0] || ""}*`
      : `${local[0]}***${local.slice(-1)}`;

  return `${maskedLocal}@${domain}`;
}

/**
 * Masks a name to show only first initial and last initial.
 * Used for logging to prevent exposing full names.
 *
 * @param name - The name to mask
 * @returns Masked name like "J*** D***" or "[redacted]" if invalid
 *
 * @example
 * maskName("John Doe")        // "J*** D***"
 * maskName("Alice")           // "A***"
 * maskName("")                // "[redacted]"
 */
export function maskName(name: string | undefined | null): string {
  if (!name || name.trim().length === 0) return "[redacted]";

  const parts = name.trim().split(/\s+/);
  return parts
    .map((part) => (part.length > 0 ? `${part[0]}***` : ""))
    .filter(Boolean)
    .join(" ");
}

/**
 * Masks a user ID to show only first and last few characters.
 * Useful for correlating logs while not exposing full IDs.
 *
 * @param id - The ID to mask
 * @returns Masked ID like "abc...xyz" or "[no-id]" if invalid
 *
 * @example
 * maskId("user_abc123xyz789")  // "use...789"
 * maskId("abcdefgh")           // "abc...fgh"
 */
export function maskId(id: string | undefined | null): string {
  if (!id) return "[no-id]";
  if (id.length <= 6) return id; // Short IDs shown in full

  return `${id.slice(0, 3)}...${id.slice(-3)}`;
}

/**
 * Sanitizes an error object for safe logging by removing potentially sensitive fields.
 * Use this when logging errors from third-party services that may include PII.
 *
 * NOTE: This function extracts the error message as-is. Callers should ensure error
 * messages do not contain raw PII before logging. When throwing custom errors, use
 * maskEmail(), maskName(), or maskId() for any user-identifying data:
 *   throw new Error(`User not found: ${maskId(userId)}`)
 *
 * @param error - The error object to sanitize
 * @returns Object with only safe fields (message, code, status)
 *
 * @example
 * try { await sendEmail(user.email, ...); }
 * catch (e) { console.error("Email failed:", sanitizeError(e)); }
 */
export function sanitizeError(
  error: unknown
): { message: string; code?: string | number; status?: number } {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as any).code,
      status: (error as any).status || (error as any).statusCode,
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    return {
      message: String(err.message || "Unknown error"),
      code: err.code as string | number | undefined,
      status: (err.status || err.statusCode) as number | undefined,
    };
  }

  return { message: "Unknown error" };
}

/**
 * Creates a safe log prefix with masked user context.
 * Useful for creating consistent, privacy-safe log messages.
 *
 * @param context - Object containing user identifiers
 * @returns Formatted string like "[user:abc...xyz|j***e@domain.com]"
 *
 * @example
 * console.log(`${safeLogPrefix({ userId, email })} Processing invite`);
 * // Output: [user:abc...xyz|j***e@domain.com] Processing invite
 */
export function safeLogPrefix(context: {
  userId?: string;
  email?: string;
  name?: string;
}): string {
  const parts: string[] = [];

  if (context.userId) {
    parts.push(`user:${maskId(context.userId)}`);
  }
  if (context.email) {
    parts.push(maskEmail(context.email));
  }
  if (context.name) {
    parts.push(maskName(context.name));
  }

  return parts.length > 0 ? `[${parts.join("|")}]` : "[anonymous]";
}
