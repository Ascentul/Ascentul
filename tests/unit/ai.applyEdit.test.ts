/**
 * Phase 7 - Part B: Apply Edit Integration Tests
 * Test guardrail integration in apply suggestion flow
 */

import { describe, it, expect } from '@jest/globals';
import { validateContent, sanitize } from '@/features/resume/ai/guardrails';

describe('Apply Edit Guardrail Integration', () => {
  describe('Guardrail Fail Path', () => {
    it('validation fails → returns error without mutation', () => {
      // Simulate unprofessional content
      const content = 'This is lol so unprofessional';

      const validation = validateContent(content);

      expect(validation.ok).toBe(false);
      if (!validation.ok) {
        expect(validation.code).toBe('UNPROFESSIONAL');
        // In actual API, this would return 400 and no broker call
      }
    });

    it('SSN detected → blocks before persistence', () => {
      const content = 'Call me at 123-45-6789';

      const validation = validateContent(content);

      expect(validation.ok).toBe(false);
      if (!validation.ok) {
        expect(validation.code).toBe('PII_DETECTED');
        // No broker call, no history entry
      }
    });

    it('JD dump detected → blocks before mutation', () => {
      const jdDump = `
        We are looking for a Senior Software Engineer to join our team.
        Requirements: 5+ years of experience in software development.
        ${' Additional job posting text content here for this position '.repeat(100)}
      `;

      const validation = validateContent(jdDump);

      expect(validation.ok).toBe(false);
      if (!validation.ok) {
        expect(validation.code).toBe('JD_DUMP');
      }
    });

    it('URL spam detected → blocks application', () => {
      const spamContent = `
        Check these: http://1.com http://2.com http://3.com
        http://4.com http://5.com http://6.com http://7.com
      `;

      const validation = validateContent(spamContent);

      expect(validation.ok).toBe(false);
      if (!validation.ok) {
        expect(validation.code).toBe('URL_SPAM');
      }
    });
  });

  describe('Guardrail Pass Path', () => {
    it('valid professional content → allows mutation', () => {
      const content = 'Led cross-functional team of 8 to deliver project 2 weeks ahead of schedule.';

      const validation = validateContent(content);

      expect(validation.ok).toBe(true);
      // In actual flow: broker called once, history entry created
    });

    it('sanitization occurs → redacted content persisted', () => {
      const content = 'Contact at 555-123-4567 for follow-up.';

      // First validate (passes)
      const validation = validateContent(content);
      expect(validation.ok).toBe(true);

      // Then sanitize
      const sanitized = sanitize(content);
      expect(sanitized.text).toBe('Contact at [REDACTED] for follow-up.');
      expect(sanitized.redactions).toBe(1);
      expect(sanitized.patterns).toContain('phone');

      // In actual flow: sanitized.text is persisted
    });

    it('no PII → content unchanged, no redactions', () => {
      const content = 'Developed scalable microservices architecture serving 1M+ users.';

      const validation = validateContent(content);
      expect(validation.ok).toBe(true);

      const sanitized = sanitize(content);
      expect(sanitized.text).toBe(content);
      expect(sanitized.redactions).toBe(0);
    });
  });

  describe('Contact Info Special Cases', () => {
    it('email allowed in header/contact block', () => {
      const email = 'john.doe@gmail.com';

      const validation = validateContent(email, { isContactInfo: true });

      expect(validation.ok).toBe(true);
    });

    it('email blocked in experience block', () => {
      const content = 'Managed team, email: john@gmail.com';

      const validation = validateContent(content, { isContactInfo: false });

      expect(validation.ok).toBe(false);
      if (!validation.ok) {
        expect(validation.code).toBe('PII_DETECTED');
      }
    });

    it('URLs allowed in projects block', () => {
      const content = `
        Project: https://github.com/user/project
        Demo: https://project-demo.com
        Docs: https://docs.project.com
      `;

      const validation = validateContent(content, { allowUrls: true, maxUrls: 5 });

      expect(validation.ok).toBe(true);
    });
  });

  describe('Mixed Content Scenarios', () => {
    it('sanitizes PII while preserving professional content', () => {
      const content = 'Led team of 5, increased revenue by 30%, contact: 555-123-4567';

      const validation = validateContent(content);
      expect(validation.ok).toBe(true);

      const sanitized = sanitize(content);
      expect(sanitized.text).toContain('Led team of 5');
      expect(sanitized.text).toContain('increased revenue by 30%');
      expect(sanitized.text).toContain('[REDACTED]');
    });

    it('multiple PII types redacted', () => {
      const content = 'Call 555-123-4567, email test@gmail.com, SSN 123-45-6789';

      // First attempt: fails validation due to SSN
      const validation = validateContent(content);
      expect(validation.ok).toBe(false);

      // If content is pre-sanitized by user:
      const manualSanitized = 'Call 555-123-4567, email test@gmail.com';
      const validation2 = validateContent(manualSanitized);
      expect(validation2.ok).toBe(false); // Still fails due to email

      const manualSanitized2 = 'Call 555-123-4567';
      const validation3 = validateContent(manualSanitized2);
      expect(validation3.ok).toBe(true);

      const sanitized = sanitize(manualSanitized2);
      expect(sanitized.text).toBe('Call [REDACTED]');
    });
  });

  describe('End-to-End Flow Simulation', () => {
    it('full success path: validate → sanitize → persist', () => {
      // Simulated suggestion content
      const proposedContent = 'Led development team, increased efficiency by 40%';

      // Step 1: Validate
      const validation = validateContent(proposedContent);
      expect(validation.ok).toBe(true);

      // Step 2: Sanitize
      const sanitized = sanitize(proposedContent);
      const finalContent = sanitized.text;

      // Step 3: Would call applySuggestionToBlock with finalContent
      expect(finalContent).toBe(proposedContent); // No changes
      expect(sanitized.redactions).toBe(0);

      // In actual API: broker.enqueue() called once
      // In actual API: single history entry created
    });

    it('full failure path: validate → reject early', () => {
      const proposedContent = 'lol this is unprofessional';

      // Step 1: Validate (fails)
      const validation = validateContent(proposedContent);
      expect(validation.ok).toBe(false);

      // Step 2: Never reaches sanitize or persist
      // In actual API: return 400 immediately
      // In actual API: no broker call
      // In actual API: no history entry
    });

    it('sanitization path: validate → sanitize (with changes) → persist sanitized', () => {
      const proposedContent = 'Reach out at john@gmail.com for more info';

      // This would fail validation (email in body)
      const validation = validateContent(proposedContent);
      expect(validation.ok).toBe(false);

      // But if we sanitize first (hypothetically):
      const sanitized = sanitize(proposedContent);
      expect(sanitized.text).toBe('Reach out at [EMAIL] for more info');

      // Then re-validate sanitized content:
      const validation2 = validateContent(sanitized.text);
      expect(validation2.ok).toBe(true);

      // In actual flow: we validate first, so this content would be rejected
      // This test shows sanitization can clean content, but we validate before sanitizing
    });
  });

  describe('Edge Cases', () => {
    it('empty content blocked by validation', () => {
      const validation = validateContent('');
      expect(validation.ok).toBe(false);
    });

    it('whitespace-only content blocked', () => {
      const validation = validateContent('   \n\n   ');
      expect(validation.ok).toBe(false);
    });

    it('very short valid content passes', () => {
      const validation = validateContent('Led team.');
      expect(validation.ok).toBe(true);
    });

    it('long structured content passes', () => {
      const longContent = `
        Senior Software Engineer

        • Led development of microservices architecture
        • Reduced API latency by 60% through optimization
        • Mentored 8 junior developers on best practices
        • Implemented CI/CD pipeline reducing deploy time by 50%
        • Collaborated with product team on roadmap planning

        ${' • Additional accomplishment with metrics\n'.repeat(20)}
      `;

      const validation = validateContent(longContent);
      expect(validation.ok).toBe(true);
    });
  });
});
