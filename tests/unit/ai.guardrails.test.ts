/**
 * Phase 7 - Part B: Guardrails Unit Tests
 * Test content validation and sanitization
 */

import { describe, it, expect } from '@jest/globals';
import { validateContent, sanitize, validateAndSanitize } from '@/features/resume/ai/guardrails';

describe('validateContent', () => {
  describe('Job Description Dump Detection', () => {
    it('blocks raw JD dump over 500 words', () => {
      const jdDump = `
        We are looking for a Senior Software Engineer to join our team.
        Requirements: 5+ years of experience in software development, Bachelor's degree in Computer Science.
        Responsibilities include developing web applications, mentoring junior developers,
        and participating in code reviews. What you'll do: Build scalable systems,
        collaborate with product managers, and ensure code quality.
        ${' Additional text content here for this job posting '.repeat(100)}
      `;

      const result = validateContent(jdDump);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('JD_DUMP');
        expect(result.reason).toContain('job description dump');
      }
    });

    it('allows structured experience section over 500 words', () => {
      const structuredContent = `
        Senior Software Engineer at TechCorp (2020 - Present)

        • Led development of microservices architecture serving 1M+ users
        • Reduced API response time by 45% through optimization
        • Mentored 5 junior engineers on best practices

        Software Engineer at StartupCo (2018 - 2020)

        • Built real-time data processing pipeline handling 10TB/day
        • Improved test coverage from 60% to 95%
        • Collaborated with 8-person cross-functional team

        ${' • Additional accomplishment '.repeat(50)}
      `;

      const result = validateContent(structuredContent);
      expect(result.ok).toBe(true);
    });

    it('allows short content under 500 words', () => {
      const shortContent = 'Led a team of 5 engineers to deliver key product features.';
      const result = validateContent(shortContent);
      expect(result.ok).toBe(true);
    });
  });

  describe('PII Detection', () => {
    it('blocks SSN pattern 123-45-6789', () => {
      const content = 'My SSN is 123-45-6789 for verification.';
      const result = validateContent(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('PII_DETECTED');
        expect(result.reason).toContain('Social Security Number');
      }
    });

    it('blocks SSN pattern 123456789 (9 consecutive digits)', () => {
      const content = 'SSN: 123456789';
      const result = validateContent(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('PII_DETECTED');
      }
    });

    it('blocks non-professional emails in resume body', () => {
      const content = 'Contact me at john.doe@gmail.com or jane@yahoo.com';
      const result = validateContent(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('PII_DETECTED');
        expect(result.reason).toContain('Personal email');
      }
    });

    it('allows emails in contact info', () => {
      const content = 'Email: john.doe@gmail.com';
      const result = validateContent(content, { isContactInfo: true });

      expect(result.ok).toBe(true);
    });

    it('allows professional emails', () => {
      const content = 'Contact: john.doe@company.com';
      const result = validateContent(content);

      expect(result.ok).toBe(true);
    });
  });

  describe('URL Spam Detection', () => {
    it('blocks excessive URLs (more than 5)', () => {
      const content = `
        Check out these links:
        http://link1.com
        http://link2.com
        http://link3.com
        http://link4.com
        http://link5.com
        http://link6.com
      `;

      const result = validateContent(content);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('URL_SPAM');
        expect(result.reason).toContain('Too many URLs');
      }
    });

    it('allows reasonable number of URLs (2-3 for portfolio)', () => {
      const content = `
        Portfolio: https://johndoe.com
        GitHub: https://github.com/johndoe
        LinkedIn: https://linkedin.com/in/johndoe
      `;

      const result = validateContent(content);
      expect(result.ok).toBe(true);
    });

    it('blocks all URLs when allowUrls is false', () => {
      const content = 'Check my site: https://example.com';
      const result = validateContent(content, { allowUrls: false });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('URL_SPAM');
      }
    });
  });

  describe('Unprofessional Language Detection', () => {
    it('blocks unprofessional acronyms (lol, lmao)', () => {
      const content = 'This project was awesome lol!';
      const result = validateContent(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('UNPROFESSIONAL');
        expect(result.reason).toContain('Unprofessional language');
      }
    });

    it('blocks multiple unprofessional terms', () => {
      const content = 'Tbh, this was a wtf moment imo.';
      const result = validateContent(content);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('UNPROFESSIONAL');
      }
    });

    it('allows professional language', () => {
      const content = 'Led cross-functional team to deliver project ahead of schedule.';
      const result = validateContent(content);

      expect(result.ok).toBe(true);
    });
  });

  describe('Empty Content Validation', () => {
    it('blocks empty string', () => {
      const result = validateContent('');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('UNPROFESSIONAL');
        expect(result.reason).toContain('empty');
      }
    });

    it('blocks whitespace-only string', () => {
      const result = validateContent('   \n  \t  ');
      expect(result.ok).toBe(false);
    });
  });
});

describe('sanitize', () => {
  describe('SSN Redaction', () => {
    it('redacts SSN pattern 123-45-6789', () => {
      const input = 'SSN: 123-45-6789';
      const result = sanitize(input);

      expect(result.text).toBe('SSN: [REDACTED]');
      expect(result.redactions).toBe(1);
      expect(result.patterns).toContain('ssn');
    });

    it('redacts SSN pattern 123456789', () => {
      const input = 'ID: 123456789';
      const result = sanitize(input);

      expect(result.text).toBe('ID: [REDACTED]');
      expect(result.redactions).toBe(1);
      expect(result.patterns).toContain('ssn');
    });

    it('redacts multiple SSNs', () => {
      const input = 'SSN1: 123-45-6789, SSN2: 987-65-4321';
      const result = sanitize(input);

      expect(result.text).toContain('[REDACTED]');
      expect(result.redactions).toBe(2);
    });
  });

  describe('Phone Number Redaction', () => {
    it('redacts phone pattern 555-555-5555', () => {
      const input = 'Call me at 555-555-5555';
      const result = sanitize(input);

      expect(result.text).toBe('Call me at [REDACTED]');
      expect(result.redactions).toBe(1);
      expect(result.patterns).toContain('phone');
    });

    it('redacts phone pattern (555) 555-5555', () => {
      const input = 'Phone: (555) 555-5555';
      const result = sanitize(input);

      expect(result.text).toBe('Phone: [REDACTED]');
      expect(result.redactions).toBe(1);
    });

    it('redacts international phone +1 555-555-5555', () => {
      const input = 'Mobile: +1 555-555-5555';
      const result = sanitize(input);

      expect(result.text).toBe('Mobile: +1 [REDACTED]');
      expect(result.redactions).toBe(1);
    });
  });

  describe('Email Redaction', () => {
    it('redacts non-professional email addresses', () => {
      const input = 'Contact: john@gmail.com';
      const result = sanitize(input);

      expect(result.text).toBe('Contact: [EMAIL]');
      expect(result.redactions).toBe(1);
      expect(result.patterns).toContain('email');
    });

    it('preserves professional email addresses', () => {
      const input = 'Email: john@company.com';
      const result = sanitize(input);

      expect(result.text).toBe('Email: john@company.com');
      expect(result.redactions).toBe(0);
    });

    it('redacts multiple non-professional emails', () => {
      const input = 'john@gmail.com, jane@yahoo.com';
      const result = sanitize(input);

      expect(result.text).toBe('[EMAIL], [EMAIL]');
      expect(result.redactions).toBe(2);
    });
  });

  describe('Mixed PII Redaction', () => {
    it('redacts multiple PII types in one pass', () => {
      const input = 'Contact 555-123-4567, email test@gmail.com, SSN 123-45-6789';
      const result = sanitize(input);

      expect(result.text).toContain('[REDACTED]');
      expect(result.text).toContain('[EMAIL]');
      expect(result.redactions).toBeGreaterThan(0);
      expect(result.patterns.length).toBeGreaterThan(1);
    });
  });

  describe('Clean Content', () => {
    it('returns unchanged text with no redactions', () => {
      const input = 'Led team of 5 engineers to deliver project on time.';
      const result = sanitize(input);

      expect(result.text).toBe(input);
      expect(result.redactions).toBe(0);
      expect(result.patterns).toHaveLength(0);
    });
  });
});

describe('validateAndSanitize', () => {
  it('validates and sanitizes in one call', () => {
    const input = 'Call me at 555-123-4567 for interview.';
    const result = validateAndSanitize(input);

    expect(result.ok).toBe(true);
    if (result.ok && result.sanitized) {
      expect(result.sanitized.text).toBe('Call me at [REDACTED] for interview.');
      expect(result.sanitized.redactions).toBe(1);
    }
  });

  it('returns validation error without sanitizing', () => {
    const input = 'lol this is unprofessional';
    const result = validateAndSanitize(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('UNPROFESSIONAL');
      expect('sanitized' in result).toBe(false);
    }
  });

  it('handles valid content with no PII', () => {
    const input = 'Developed scalable microservices architecture.';
    const result = validateAndSanitize(input);

    expect(result.ok).toBe(true);
    if (result.ok && result.sanitized) {
      expect(result.sanitized.redactions).toBe(0);
    }
  });
});
