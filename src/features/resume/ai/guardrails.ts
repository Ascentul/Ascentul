/**
 * Phase 7 - Part B: Content Guardrails
 * Validates and sanitizes AI-generated content before application
 */

/**
 * Validation result types
 */
export type ContentValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason: string;
      code: 'JD_DUMP' | 'PII_DETECTED' | 'URL_SPAM' | 'UNPROFESSIONAL' | 'INVALID_INPUT';
    };

/**
 * Sanitization result with redaction details
 */
export interface SanitizeResult {
  text: string;
  redactions: number;
  patterns: Array<'ssn' | 'phone' | 'email'>;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Maximum word count before considering content a dump (default: 500) */
  maxWords?: number;

  /** Whether to allow URLs in content (default: true) */
  allowUrls?: boolean;

  /** Maximum number of URLs allowed (default: 5) */
  maxUrls?: number;

  /** Whether this is header/contact content (allows emails) */
  isContactInfo?: boolean;
}

// PII Pattern Regexes
const SSN_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // 123-45-6789
];

const PHONE_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // 555-555-5555, 555.555.5555, 555 555 5555
  /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}\b/g, // (555) 555-5555
  /\+\d{1,3}\s*\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // +1 555-555-5555, +44 555-555-5555 (international format)
];

// Non-professional email domains (exclude from resume body, allow in header)
const NON_PROFESSIONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
  'live.com',
];

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// URL pattern
const URL_PATTERN = /https?:\/\/[^\s]+/g;

// Common unprofessional phrases
const UNPROFESSIONAL_PATTERNS = [
  /\blol\b/i,
  /\blmao\b/i,
  /\bwtf\b/i,
  /\bomg\b/i,
  /\btbh\b/i,
  /\bimo\b/i,
  /\bimho\b/i,
  /\bbrb\b/i,
  /\bidk\b/i,
];

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Check if text appears to be an unstructured job description dump
 * A JD dump is characterized by:
 * - Very long text (> maxWords)
 * - Lacks structured formatting (bullets, sections)
 * - Contains job posting language ("we are looking for", "requirements", etc.)
 */
function isJobDescriptionDump(text: string, maxWords: number): boolean {
  const wordCount = countWords(text);

  // Short text is never a dump
  if (wordCount <= maxWords) {
    return false;
  }

  // Check for job posting language
  const jdIndicators = [
    /we are (looking|seeking) for/i,
    /job (description|requirements)/i,
    /qualifications?:/i,
    /requirements?:/i,
    /responsibilities?:/i,
    /what (you'll|you will) do/i,
    /apply (now|today)/i,
    /equal opportunity employer/i,
    /years? of experience (in|with)/i,
    /bachelor'?s? degree/i,
  ];

  const hasJDLanguage = jdIndicators.some((pattern) => pattern.test(text));

  // Long text + job posting language = likely a dump
  if (hasJDLanguage && wordCount > maxWords) {
    return true;
  }

  // Check if text is unstructured (no bullets, line breaks, or formatting)
  const hasStructure =
    text.includes('\n') || text.includes('•') || text.includes('-') || text.includes('*');

  // Very long unstructured text is suspicious
  if (!hasStructure && wordCount > maxWords * 1.5) {
    return true;
  }

  return false;
}

/**
 * Validate content before applying AI edits
 *
 * @param input - Content to validate
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateContent(userInput);
 * if (!result.ok) {
 *   console.error(`Validation failed: ${result.reason}`);
 *   return;
 * }
 * // Proceed with content
 * ```
 */
export function validateContent(
  input: string,
  options: ValidationOptions = {}
): ContentValidationResult {
  const {
    maxWords = 500,
    allowUrls = true,
    maxUrls = 5,
    isContactInfo = false,
  } = options;

  // Empty input is invalid
  if (!input || input.trim().length === 0) {
    return {
      ok: false,
      reason: 'Content cannot be empty',
      code: 'INVALID_INPUT',
    };
  }

  // Check for job description dump
  if (isJobDescriptionDump(input, maxWords)) {
    return {
      ok: false,
      reason: `Content appears to be a raw job description dump (${countWords(input)} words). Please provide structured, concise content.`,
      code: 'JD_DUMP',
    };
  }

  // Check for SSN patterns
  for (const pattern of SSN_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(input)) {
      return {
        ok: false,
        reason: 'Content contains what appears to be a Social Security Number. Please remove sensitive information.',
        code: 'PII_DETECTED',
      };
    }
  }

  // Check for excessive URLs (spam)
  if (!allowUrls) {
    const urlMatches = input.match(URL_PATTERN);
    if (urlMatches && urlMatches.length > 0) {
      return {
        ok: false,
        reason: 'URLs are not allowed in this content',
        code: 'URL_SPAM',
      };
    }
  } else {
    const urlMatches = input.match(URL_PATTERN);
    if (urlMatches && urlMatches.length > maxUrls) {
      return {
        ok: false,
        reason: `Too many URLs detected (${urlMatches.length}). Maximum allowed: ${maxUrls}`,
        code: 'URL_SPAM',
      };
    }
  }

  // Check for unprofessional language
  const foundUnprofessional = UNPROFESSIONAL_PATTERNS.filter((pattern) =>
    pattern.test(input)
  ).map((pattern) => pattern.source.replace(/\\b/g, '').replace(/\\/g, ''));

  if (foundUnprofessional.length > 0) {
    return {
      ok: false,
      reason: `Unprofessional language detected: ${foundUnprofessional.join(', ')}. Please use professional tone.`,
      code: 'UNPROFESSIONAL',
    };
  }

  // Check for non-professional emails (only if not contact info)
  if (!isContactInfo) {
    const emails = input.match(EMAIL_PATTERN) || [];
    const nonProfessionalEmails = emails.filter((email) => {
      const domain = email.split('@')[1]?.toLowerCase();
      return domain && NON_PROFESSIONAL_EMAIL_DOMAINS.includes(domain);
    });

    if (nonProfessionalEmails.length > 0) {
      return {
        ok: false,
        reason: `Personal email addresses detected: ${nonProfessionalEmails.join(', ')}. These should only appear in contact information.`,
        code: 'PII_DETECTED',
      };
    }
  }

  return { ok: true };
}

/**
 * Sanitize content by redacting sensitive information
 *
 * @param input - Content to sanitize
 * @returns Sanitized content with redaction details
 *
 * @example
 * ```typescript
 * const result = sanitize('Call me at 555-123-4567');
 * console.log(result.text); // 'Call me at [REDACTED]'
 * console.log(result.redactions); // 1
 * console.log(result.patterns); // ['phone']
 * ```
 */
export function sanitize(input: string): SanitizeResult {
  let text = input;
  let redactions = 0;
  const patterns: Array<'ssn' | 'phone' | 'email'> = [];

  // Redact SSNs
  for (const pattern of SSN_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      text = text.replace(pattern, '[REDACTED]');
      redactions += matches.length;
      if (!patterns.includes('ssn')) {
        patterns.push('ssn');
      }
    }
  }

  // Redact phone numbers
  for (const pattern of PHONE_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      text = text.replace(pattern, '[REDACTED]');
      redactions += matches.length;
      if (!patterns.includes('phone')) {
        patterns.push('phone');
      }
    }
  }

  // Redact non-professional emails (preserve professional ones)
  const emails = text.match(EMAIL_PATTERN) || [];
  for (const email of emails) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && NON_PROFESSIONAL_EMAIL_DOMAINS.includes(domain)) {
      text = text.replace(email, '[EMAIL]');
      redactions++;
      if (!patterns.includes('email')) {
        patterns.push('email');
      }
    }
  }

  return {
    text,
    redactions,
    patterns,
  };
}

/**
 * Validate and sanitize content in one operation
 * Convenience function that combines validation and sanitization
 *
 * @param input - Content to process
 * @param options - Validation options
 * @returns Validation result with sanitized text if valid
 */
export function validateAndSanitize(
  input: string,
  options: ValidationOptions = {}
): ContentValidationResult & { sanitized?: SanitizeResult } {
  const validation = validateContent(input, options);

  if (!validation.ok) {
    return validation;
  }

  const sanitized = sanitize(input);

  return {
    ok: true,
    sanitized,
  };
}
