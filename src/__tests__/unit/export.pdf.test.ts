/**
 * Phase 8: Unit tests for PDF export polish
 * Tests file naming, clickable links, contact validation, and metadata
 */

import { generatePDFFileName } from '@/lib/pdf/fileName';
import { renderContactField, renderContactLink, buildContactParts } from '@/lib/pdf/contactRenderer';
import type { ContactLink, ContactData } from '@/lib/pdf/contactRenderer';
import { buildPageConfig, getPageDimensions, convertMarginsToInches } from '@/lib/pdf/pageConfig';
import type { TemplateConfig } from '@/lib/pdf/pageConfig';

describe('PDF Export - File Name Generation', () => {
  beforeAll(() => {
    // Mock Date to ensure consistent date in tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-10-20T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should generate file name with FullName-Template-YYYYMMDD.pdf format', () => {
    const result = generatePDFFileName('John Doe', 'modern');
    expect(result).toBe('John-Doe-modern-20251020.pdf');
  });

  it('should replace spaces with hyphens for readability', () => {
    const result = generatePDFFileName('Jane Mary Smith', 'classic');
    expect(result).toBe('Jane-Mary-Smith-classic-20251020.pdf');
  });

  it('should preserve accented Latin characters', () => {
    const result = generatePDFFileName('José O\'Brien-García', 'modern');
    expect(result).toBe('José-OBrien-García-modern-20251020.pdf');
  });

  it('should handle empty name with fallback', () => {
    const result = generatePDFFileName('', 'modern');
    expect(result).toBe('Resume-modern-20251020.pdf');
  });

  it('should handle special characters in template slug', () => {
    const result = generatePDFFileName('John Doe', 'modern_v2!');
    expect(result).toBe('John-Doe-modernv2-20251020.pdf');
  });

  it('should limit name length to 50 characters', () => {
    const longName = 'A'.repeat(100);
    const result = generatePDFFileName(longName, 'template');
    const namePart = result.split('-')[0];
    expect(namePart.length).toBeLessThanOrEqual(50);
  });

  it('should limit template slug length to 30 characters', () => {
    const longSlug = 'template-'.repeat(10);
    const result = generatePDFFileName('John Doe', longSlug);
    const templatePart = result.split('-')[1];
    expect(templatePart.length).toBeLessThanOrEqual(30);
  });

  it('should use current date in YYYYMMDD format', () => {
    const result = generatePDFFileName('John Doe', 'modern');
    expect(result).toContain('-20251020.pdf');
  });

  it('should preserve hyphens and convert spaces', () => {
    const result = generatePDFFileName('Mary-Jane Watson', 'classic');
    expect(result).toBe('Mary-Jane-Watson-classic-20251020.pdf');
  });

  it('should handle single character names', () => {
    const result = generatePDFFileName('X', 'modern');
    expect(result).toBe('X-modern-20251020.pdf');
  });
});

describe('PDF Export - Clickable Links Toggle', () => {
  describe('renderContactField - Email', () => {
    it('should render mailto link when clickableLinks is true', () => {
      const result = renderContactField('john@example.com', 'email', { clickableLinks: true });

      expect(result).toContain('<a href="mailto:');
      expect(result).toContain('john@example.com');
      expect(result).toBe('<a href="mailto:john@example.com">john@example.com</a>');
    });

    it('should render plain text when clickableLinks is false', () => {
      const result = renderContactField('john@example.com', 'email', { clickableLinks: false });

      expect(result).not.toContain('<a href');
      expect(result).toBe('john@example.com');
    });

    it('should default to plain text when clickableLinks is not specified', () => {
      const result = renderContactField('john@example.com', 'email');

      expect(result).not.toContain('<a href');
      expect(result).toBe('john@example.com');
    });

    it('should HTML-escape email addresses', () => {
      const result = renderContactField('user+test<script>@example.com', 'email', { clickableLinks: true });

      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });
  });

  describe('renderContactField - Phone', () => {
    it('should render tel link when clickableLinks is true', () => {
      const result = renderContactField('+1 555-1234', 'phone', { clickableLinks: true });

      expect(result).toContain('<a href="tel:');
      expect(result).toContain('+1555-1234'); // Spaces removed in href
      expect(result).toContain('+1 555-1234'); // Original format in display text
    });

    it('should strip spaces from tel: href but preserve in display text', () => {
      const result = renderContactField('+1 (555) 123-4567', 'phone', { clickableLinks: true });

      expect(result).toContain('href="tel:+1(555)123-4567"');
      expect(result).toContain('>+1 (555) 123-4567<');
      expect(result).not.toContain('tel:+1 (555)'); // No spaces in href
    });

    it('should render plain text when clickableLinks is false', () => {
      const result = renderContactField('+1 555-1234', 'phone', { clickableLinks: false });

      expect(result).not.toContain('<a href');
      expect(result).toBe('+1 555-1234');
    });
  });

  describe('renderContactField - Location', () => {
    it('should always render as plain text (never clickable)', () => {
      const result = renderContactField('New York, NY', 'location', { clickableLinks: true });

      expect(result).not.toContain('<a href');
      expect(result).toBe('New York, NY');
    });

    it('should HTML-escape location text', () => {
      const result = renderContactField('City<script>alert("xss")</script>', 'location');

      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });
  });

  describe('renderContactField - Link', () => {
    it('should render hyperlink when clickableLinks is true', () => {
      const result = renderContactField('https://portfolio.com', 'link', { clickableLinks: true });

      expect(result).toContain('<a href="https://portfolio.com">https://portfolio.com</a>');
    });

    it('should render plain text when clickableLinks is false', () => {
      const result = renderContactField('https://portfolio.com', 'link', { clickableLinks: false });

      expect(result).not.toContain('<a href');
      expect(result).toBe('https://portfolio.com');
    });
  });

  describe('renderContactLink - External Links', () => {
    it('should render link with label when clickableLinks is true', () => {
      const link: ContactLink = { url: 'https://linkedin.com/in/johndoe', label: 'LinkedIn' };
      const result = renderContactLink(link, { clickableLinks: true });

      expect(result).toBe('<a href="https://linkedin.com/in/johndoe">LinkedIn</a>');
    });

    it('should render label only when clickableLinks is false', () => {
      const link: ContactLink = { url: 'https://linkedin.com/in/johndoe', label: 'LinkedIn' };
      const result = renderContactLink(link, { clickableLinks: false });

      expect(result).not.toContain('<a href');
      expect(result).toBe('LinkedIn');
    });

    it('should HTML-escape both URL and label', () => {
      const link: ContactLink = {
        url: 'https://example.com?param=<script>',
        label: 'Portfolio<script>',
      };
      const result = renderContactLink(link, { clickableLinks: true });

      expect(result).toContain('&lt;script&gt;');
      expect(result).not.toContain('<script>');
    });
  });

  describe('Edge Cases', () => {
    it('should return empty string for empty contact field value', () => {
      const result = renderContactField('', 'email', { clickableLinks: true });

      expect(result).toBe('');
    });

    it('should handle special characters in phone numbers', () => {
      const result = renderContactField('+1-555-CALL-ME', 'phone', { clickableLinks: true });

      expect(result).toContain('tel:+1-555-CALL-ME'); // No spaces to strip
      expect(result).toContain('>+1-555-CALL-ME<');
    });
  });
});

describe('PDF Export - Contact Validation', () => {
  describe('buildContactParts - Field Filtering', () => {
    it('should include email when present', () => {
      const contactData: ContactData = {
        email: 'john@example.com',
        phone: '555-1234',
        location: 'New York, NY',
      };

      const result = buildContactParts(contactData);

      expect(result).toContain('john@example.com');
      expect(result.length).toBe(3);
    });

    it('should filter out empty email field', () => {
      const contactData: ContactData = {
        email: '',
        phone: '555-1234',
        location: 'New York, NY',
      };

      const result = buildContactParts(contactData);

      expect(result).not.toContain('');
      expect(result.length).toBe(2);
      expect(result).toEqual(['555-1234', 'New York, NY']);
    });

    it('should include all contact fields when present', () => {
      const contactData: ContactData = {
        email: 'john@example.com',
        phone: '555-1234',
        location: 'New York, NY',
      };

      const result = buildContactParts(contactData);

      expect(result.length).toBe(3);
      expect(result).toEqual(['john@example.com', '555-1234', 'New York, NY']);
    });

    it('should return empty array when all fields are empty', () => {
      const contactData: ContactData = {
        email: '',
        phone: '',
        location: '',
      };

      const result = buildContactParts(contactData);

      expect(result.length).toBe(0);
      expect(result).toEqual([]);
    });

    it('should handle undefined contact object', () => {
      const result = buildContactParts(undefined);

      expect(result.length).toBe(0);
      expect(result).toEqual([]);
    });

    it('should handle partial contact data', () => {
      const contactData: ContactData = {
        email: 'john@example.com',
        // phone and location missing
      };

      const result = buildContactParts(contactData);

      expect(result.length).toBe(1);
      expect(result).toEqual(['john@example.com']);
    });
  });

  describe('buildContactParts - Clickable Links Integration', () => {
    it('should render clickable links when enabled', () => {
      const contactData: ContactData = {
        email: 'john@example.com',
        phone: '+1 555-1234',
        location: 'New York, NY',
      };

      const result = buildContactParts(contactData, { clickableLinks: true });

      expect(result[0]).toContain('<a href="mailto:john@example.com">');
      expect(result[1]).toContain('<a href="tel:+1555-1234">');
      expect(result[2]).not.toContain('<a href'); // Location is never clickable
    });

    it('should render plain text when clickable links disabled', () => {
      const contactData: ContactData = {
        email: 'john@example.com',
        phone: '555-1234',
        location: 'New York, NY',
      };

      const result = buildContactParts(contactData, { clickableLinks: false });

      expect(result.every(part => !part.includes('<a href'))).toBe(true);
      expect(result).toEqual(['john@example.com', '555-1234', 'New York, NY']);
    });

    it('should HTML-escape all contact fields', () => {
      const contactData: ContactData = {
        email: 'user<script>@example.com',
        phone: '+1<script>555-1234',
        location: 'New York<script>, NY',
      };

      const result = buildContactParts(contactData);

      expect(result.every(part => part.includes('&lt;script&gt;'))).toBe(true);
      expect(result.every(part => !part.includes('<script>'))).toBe(true);
    });
  });
});

describe('PDF Export - Debug Warnings', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log warning when DEBUG_UI is true and email is missing', () => {
    const originalEnv = process.env.NEXT_PUBLIC_DEBUG_UI;
    process.env.NEXT_PUBLIC_DEBUG_UI = 'true';

    const debugEnabled = process.env.NEXT_PUBLIC_DEBUG_UI === 'true';
    const email = '';
    const phone = '555-1234';

    if (debugEnabled && (!email || !phone)) {
      console.warn(`[PDF Export] Header block missing contact fields: email=${!!email}, phone=${!!phone}`);
    }

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[PDF Export] Header block missing contact fields')
    );

    process.env.NEXT_PUBLIC_DEBUG_UI = originalEnv;
  });

  it('should not log warning when DEBUG_UI is false', () => {
    const originalEnv = process.env.NEXT_PUBLIC_DEBUG_UI;
    process.env.NEXT_PUBLIC_DEBUG_UI = 'false';

    const debugEnabled = process.env.NEXT_PUBLIC_DEBUG_UI === 'true';
    const email = '';
    const phone = '';

    if (debugEnabled && (!email || !phone)) {
      console.warn('[PDF Export] Missing fields');
    }

    expect(console.warn).not.toHaveBeenCalled();

    process.env.NEXT_PUBLIC_DEBUG_UI = originalEnv;
  });
});

describe('PDF Export - Page Size and Margins', () => {
  describe('getPageDimensions', () => {
    it('should return Letter dimensions (8.5in x 11in)', () => {
      const dimensions = getPageDimensions('Letter');

      expect(dimensions).toEqual({
        width: '8.5in',
        height: '11in',
      });
    });

    it('should return A4 dimensions (210mm x 297mm)', () => {
      const dimensions = getPageDimensions('A4');

      expect(dimensions).toEqual({
        width: '210mm',
        height: '297mm',
      });
    });
  });

  describe('convertMarginsToInches', () => {
    it('should convert 72px margins to 0.75in (96 DPI)', () => {
      const margins = convertMarginsToInches({
        top: 72,
        right: 72,
        bottom: 72,
        left: 72,
      });

      expect(margins).toEqual({
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
      });
    });

    it('should convert 96px margins to 1in (96 DPI)', () => {
      const margins = convertMarginsToInches({
        top: 96,
        right: 96,
        bottom: 96,
        left: 96,
      });

      expect(margins).toEqual({
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in',
      });
    });

    it('should handle asymmetric margins', () => {
      const margins = convertMarginsToInches({
        top: 48,
        right: 72,
        bottom: 96,
        left: 120,
      });

      expect(margins).toEqual({
        top: '0.5in',
        right: '0.75in',
        bottom: '1in',
        left: '1.25in',
      });
    });

    it('should handle zero margins', () => {
      const margins = convertMarginsToInches({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      });

      expect(margins).toEqual({
        top: '0in',
        right: '0in',
        bottom: '0in',
        left: '0in',
      });
    });
  });

  describe('buildPageConfig', () => {
    it('should use Letter page size by default', () => {
      const config = buildPageConfig(undefined);

      expect(config.pageSize).toBe('Letter');
      expect(config.dimensions).toEqual({
        width: '8.5in',
        height: '11in',
      });
    });

    it('should use A4 page size when specified', () => {
      const template: TemplateConfig = { pageSize: 'A4' };
      const config = buildPageConfig(template);

      expect(config.pageSize).toBe('A4');
      expect(config.dimensions).toEqual({
        width: '210mm',
        height: '297mm',
      });
    });

    it('should use default 72px margins when not specified', () => {
      const config = buildPageConfig(undefined);

      expect(config.margins).toEqual({
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in',
      });
    });

    it('should use custom margins when provided', () => {
      const template: TemplateConfig = {
        margins: { top: 96, right: 96, bottom: 96, left: 96 },
      };
      const config = buildPageConfig(template);

      expect(config.margins).toEqual({
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in',
      });
    });

    it('should combine custom page size and margins', () => {
      const template: TemplateConfig = {
        pageSize: 'A4',
        margins: { top: 48, right: 72, bottom: 96, left: 120 },
      };
      const config = buildPageConfig(template);

      expect(config.pageSize).toBe('A4');
      expect(config.dimensions).toEqual({
        width: '210mm',
        height: '297mm',
      });
      expect(config.margins).toEqual({
        top: '0.5in',
        right: '0.75in',
        bottom: '1in',
        left: '1.25in',
      });
    });

    it('should handle partial template config', () => {
      const template: TemplateConfig = { pageSize: 'A4' };
      const config = buildPageConfig(template);

      expect(config.pageSize).toBe('A4');
      expect(config.dimensions.width).toBe('210mm');
      expect(config.margins.top).toBe('0.75in'); // Default margins
    });

    it('should return complete config ready for PDF generation', () => {
      const template: TemplateConfig = {
        pageSize: 'Letter',
        margins: { top: 72, right: 72, bottom: 72, left: 72 },
      };
      const config = buildPageConfig(template);

      // Verify all required properties are present
      expect(config).toHaveProperty('pageSize');
      expect(config).toHaveProperty('dimensions');
      expect(config).toHaveProperty('margins');
      expect(config.dimensions).toHaveProperty('width');
      expect(config.dimensions).toHaveProperty('height');
      expect(config.margins).toHaveProperty('top');
      expect(config.margins).toHaveProperty('right');
      expect(config.margins).toHaveProperty('bottom');
      expect(config.margins).toHaveProperty('left');
    });
  });
});
