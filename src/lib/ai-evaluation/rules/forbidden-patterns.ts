/**
 * Forbidden Patterns
 *
 * Regex patterns for detecting content that should never appear in AI outputs.
 * These run as deterministic rule checks before and after model evaluation.
 */

import { RiskFlag } from '../types';

/**
 * Pattern category with associated risk flag
 */
export interface ForbiddenPattern {
  pattern: RegExp;
  flag: RiskFlag;
  description: string;
  severity: 'blocking' | 'warning';
}

/**
 * PII Detection Patterns
 *
 * Detect personally identifiable information that shouldn't be in AI outputs.
 */
export const PII_PATTERNS: ForbiddenPattern[] = [
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/,
    flag: 'pii_detected',
    description: 'Social Security Number pattern detected',
    severity: 'blocking',
  },
  {
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
    flag: 'pii_detected',
    description: 'Credit card number pattern detected',
    severity: 'blocking',
  },
  {
    pattern: /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/,
    flag: 'pii_detected',
    description: 'Phone number pattern detected (may be intentional)',
    severity: 'warning',
  },
  {
    pattern: /\b(?:password|passwd|pwd)\s*[:=]\s*["']?[^\s"']{8,}["']?\b/i,
    flag: 'pii_detected',
    description: 'Password pattern detected',
    severity: 'blocking',
  },
  {
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}[A-Z0-9]{0,16}\b/,
    flag: 'pii_detected',
    description: 'Bank account (IBAN) pattern detected',
    severity: 'blocking',
  },
];

/**
 * Discriminatory Content Patterns
 *
 * Detect language that could be discriminatory or biased.
 */
export const DISCRIMINATORY_PATTERNS: ForbiddenPattern[] = [
  // Age discrimination
  {
    pattern: /\b(too old|too young|age requirement|young blood|fresh graduate only)\b/i,
    flag: 'discriminatory_content',
    description: 'Age-related discriminatory language',
    severity: 'blocking',
  },
  // Gender discrimination
  {
    pattern: /\b(men only|women only|male only|female only|no women|no men)\b/i,
    flag: 'discriminatory_content',
    description: 'Gender-related discriminatory language',
    severity: 'blocking',
  },
  // Religious discrimination
  {
    pattern: /\b(christians only|muslims only|no jews|no muslims|atheists not welcome)\b/i,
    flag: 'discriminatory_content',
    description: 'Religious discriminatory language',
    severity: 'blocking',
  },
  // Racial discrimination
  {
    pattern: /\b(whites only|blacks only|no immigrants|native speakers only)\b/i,
    flag: 'discriminatory_content',
    description: 'Racial/ethnic discriminatory language',
    severity: 'blocking',
  },
  // Disability discrimination
  {
    pattern: /\b(no disabled|physically fit only|able-bodied only|no handicapped)\b/i,
    flag: 'discriminatory_content',
    description: 'Disability-related discriminatory language',
    severity: 'blocking',
  },
];

/**
 * Safety Concern Patterns
 *
 * Detect advice that could be harmful to the user.
 */
export const SAFETY_PATTERNS: ForbiddenPattern[] = [
  {
    pattern: /\b(lie on your resume|fake your|fabricate experience|invent a degree)\b/i,
    flag: 'safety_concern',
    description: 'Advising dishonesty or fraud',
    severity: 'blocking',
  },
  {
    pattern: /\b(quit without notice|burn bridges|tell them off|ghost your employer)\b/i,
    flag: 'safety_concern',
    description: 'Advising unprofessional behavior',
    severity: 'warning',
  },
  {
    pattern: /\b(illegal|break the law|don't pay taxes|under the table)\b/i,
    flag: 'safety_concern',
    description: 'Potentially advising illegal activity',
    severity: 'warning',
  },
];

/**
 * Out of Scope Patterns
 *
 * Detect responses outside career guidance domain.
 */
export const OUT_OF_SCOPE_PATTERNS: ForbiddenPattern[] = [
  {
    pattern: /\b(medical advice|health diagnosis|mental health treatment|see a doctor)\b/i,
    flag: 'out_of_scope',
    description: 'Medical advice (outside scope)',
    severity: 'warning',
  },
  {
    pattern: /\b(legal advice|sue them|lawyer up|legal action|lawsuit)\b/i,
    flag: 'out_of_scope',
    description: 'Legal advice (outside scope)',
    severity: 'warning',
  },
  {
    pattern: /\b(investment advice|buy stocks|crypto|trading tips|financial planning)\b/i,
    flag: 'out_of_scope',
    description: 'Financial advice (outside scope)',
    severity: 'warning',
  },
  {
    pattern: /\b(relationship advice|dating tips|marriage counseling)\b/i,
    flag: 'out_of_scope',
    description: 'Relationship advice (outside scope)',
    severity: 'warning',
  },
];

/**
 * Hallucination Indicator Patterns
 *
 * Detect language that suggests AI is making things up.
 */
export const HALLUCINATION_PATTERNS: ForbiddenPattern[] = [
  // Uncertainty markers in factual claims
  {
    pattern:
      /\b(I think|I believe|probably|might be|could be|perhaps)\b.*\b(company|employer|salary|role)\b/i,
    flag: 'hallucination_detected',
    description: 'Uncertainty in factual claims about companies/roles',
    severity: 'warning',
  },
  // Made up statistics
  {
    pattern: /\b(studies show|research indicates|statistics prove)\b(?!.*\bcited\b)/i,
    flag: 'hallucination_detected',
    description: 'Uncited statistics or studies',
    severity: 'warning',
  },
];

/**
 * Copy-Paste Detection Patterns
 *
 * Detect when output copies large portions from input.
 */
export const COPY_PASTE_PATTERNS: ForbiddenPattern[] = [
  // Note: These are placeholder patterns. Real copy-paste detection
  // requires comparing output to input, which is done in the rule engine.
  {
    pattern: /Requirements:|Qualifications:|About the company:/i,
    flag: 'copy_paste_detected',
    description: 'Job description section headers in output (may indicate copying)',
    severity: 'warning',
  },
];

/**
 * All forbidden patterns combined
 */
export const ALL_FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  ...PII_PATTERNS,
  ...DISCRIMINATORY_PATTERNS,
  ...SAFETY_PATTERNS,
  ...OUT_OF_SCOPE_PATTERNS,
  ...HALLUCINATION_PATTERNS,
  ...COPY_PASTE_PATTERNS,
];

/**
 * Get only blocking patterns
 */
export function getBlockingPatterns(): ForbiddenPattern[] {
  return ALL_FORBIDDEN_PATTERNS.filter((p) => p.severity === 'blocking');
}

/**
 * Get only warning patterns
 */
export function getWarningPatterns(): ForbiddenPattern[] {
  return ALL_FORBIDDEN_PATTERNS.filter((p) => p.severity === 'warning');
}

/**
 * Check text against all patterns
 */
export function checkForbiddenPatterns(text: string): {
  matches: ForbiddenPattern[];
  hasBlocking: boolean;
} {
  const matches: ForbiddenPattern[] = [];

  for (const pattern of ALL_FORBIDDEN_PATTERNS) {
    if (pattern.pattern.test(text)) {
      matches.push(pattern);
    }
  }

  return {
    matches,
    hasBlocking: matches.some((m) => m.severity === 'blocking'),
  };
}
