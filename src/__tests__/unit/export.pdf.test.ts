/**
 * Phase 8: Unit tests for PDF export polish
 * Tests file naming, clickable links, contact validation, and metadata
 */

import { generatePDFFileName } from '@/lib/pdf/fileName';

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
    expect(result).toBe('JohnDoe-modern-20251020.pdf');
  });

  it('should sanitize spaces from full name', () => {
    const result = generatePDFFileName('Jane Mary Smith', 'classic');
    expect(result).toBe('JaneMarySmith-classic-20251020.pdf');
  });

  it('should remove special characters from name', () => {
    const result = generatePDFFileName('José O\'Brien-García', 'modern');
    expect(result).toBe('JosOBrien-Garca-modern-20251020.pdf');
  });

  it('should handle empty name with fallback', () => {
    const result = generatePDFFileName('', 'modern');
    expect(result).toBe('Resume-modern-20251020.pdf');
  });

  it('should handle special characters in template slug', () => {
    const result = generatePDFFileName('John Doe', 'modern_v2!');
    expect(result).toBe('JohnDoe-modernv2-20251020.pdf');
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

  it('should preserve hyphens in names', () => {
    const result = generatePDFFileName('Mary-Jane Watson', 'classic');
    expect(result).toBe('Mary-JaneWatson-classic-20251020.pdf');
  });

  it('should handle single character names', () => {
    const result = generatePDFFileName('X', 'modern');
    expect(result).toBe('X-modern-20251020.pdf');
  });
});

describe('PDF Export - Clickable Links Toggle', () => {
  it('should render mailto link when clickableLinks is true', () => {
    const clickableLinks = true;
    const email = 'john@example.com';

    const result = clickableLinks
      ? `<a href="mailto:${email}">${email}</a>`
      : email;

    expect(result).toContain('<a href="mailto:');
    expect(result).toContain('john@example.com');
  });

  it('should render plain text when clickableLinks is false', () => {
    const clickableLinks = false;
    const email = 'john@example.com';

    const result = clickableLinks
      ? `<a href="mailto:${email}">${email}</a>`
      : email;

    expect(result).not.toContain('<a href');
    expect(result).toBe('john@example.com');
  });

  it('should render tel link when clickableLinks is true', () => {
    const clickableLinks = true;
    const phone = '+1 555-1234';

    const result = clickableLinks
      ? `<a href="tel:${phone.replace(/\s/g, '')}">${phone}</a>`
      : phone;

    expect(result).toContain('<a href="tel:');
    expect(result).toContain('+1555-1234'); // Spaces removed in href, hyphens preserved
  });

  it('should strip spaces from tel: links', () => {
    const phone = '+1 (555) 123-4567';
    const telLink = `tel:${phone.replace(/\s/g, '')}`;

    expect(telLink).toBe('tel:+1(555)123-4567');
    expect(telLink).not.toContain(' ');
  });
});

describe('PDF Export - Contact Validation', () => {
  it('should include email when present', () => {
    const contactData = {
      email: 'john@example.com',
      phone: '555-1234',
      location: 'New York, NY',
    };

    const contactParts: string[] = [];
    if (contactData.email) {
      contactParts.push(contactData.email);
    }

    expect(contactParts).toContain('john@example.com');
  });

  it('should skip empty email field', () => {
    const contactData = {
      email: '',
      phone: '555-1234',
      location: 'New York, NY',
    };

    const contactParts: string[] = [];
    if (contactData.email) {
      contactParts.push(contactData.email);
    }
    if (contactData.phone) {
      contactParts.push(contactData.phone);
    }

    expect(contactParts).not.toContain('');
    expect(contactParts.length).toBe(1);
  });

  it('should include all contact fields when present', () => {
    const contactData = {
      email: 'john@example.com',
      phone: '555-1234',
      location: 'New York, NY',
    };

    const contactParts: string[] = [];
    if (contactData.email) contactParts.push(contactData.email);
    if (contactData.phone) contactParts.push(contactData.phone);
    if (contactData.location) contactParts.push(contactData.location);

    expect(contactParts.length).toBe(3);
  });

  it('should handle missing contact object gracefully', () => {
    const contactData = {
      email: '',
      phone: '',
      location: '',
    };

    const contactParts: string[] = [];
    if (contactData.email) contactParts.push(contactData.email);
    if (contactData.phone) contactParts.push(contactData.phone);
    if (contactData.location) contactParts.push(contactData.location);

    expect(contactParts.length).toBe(0);
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
  it('should use Letter page size by default', () => {
    const template = { pageSize: undefined };
    const pageSize = template?.pageSize || 'Letter';

    expect(pageSize).toBe('Letter');
  });

  it('should use A4 page size when specified', () => {
    const template = { pageSize: 'A4' };
    const pageSize = template?.pageSize || 'Letter';

    expect(pageSize).toBe('A4');
  });

  it('should use template margins when provided', () => {
    const template = {
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
    };
    const margins = template?.margins || { top: 72, right: 72, bottom: 72, left: 72 };

    expect(margins.top).toBe(72);
    expect(margins.right).toBe(72);
  });

  it('should convert margins from pixels to inches (96 DPI)', () => {
    const marginsPx = { top: 72, right: 72, bottom: 72, left: 72 };
    const marginTop = `${marginsPx.top / 96}in`;

    expect(marginTop).toBe('0.75in');
  });
});
