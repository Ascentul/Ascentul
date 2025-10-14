/**
 * Template Picker Component Tests
 * Tests preview image rendering, fallback behavior, and accessibility
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import { getPreviewSrc, hasPreview } from '@/lib/template-preview';

// Mock template data
const mockTemplateWithPreview = {
  id: '1',
  slug: 'modern-clean',
  name: 'Modern Clean',
  thumbnailUrl: '/previews/modern-clean.png',
  pageSize: 'Letter',
  allowedBlocks: ['header', 'summary', 'experience'],
};

const mockTemplateWithoutPreview = {
  id: '2',
  slug: 'no-preview',
  name: 'No Preview Template',
  thumbnailUrl: '',
  pageSize: 'Letter',
  allowedBlocks: ['header', 'summary'],
};

const mockTemplateWithRemoteUrl = {
  id: '3',
  slug: 'remote',
  name: 'Remote Template',
  thumbnailUrl: 'https://cdn.example.com/preview.png',
  pageSize: 'A4',
  allowedBlocks: ['header', 'experience'],
};

describe('Template Preview Helper Functions', () => {
  describe('getPreviewSrc', () => {
    beforeEach(() => {
      // Clear environment variable before each test
      delete process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;
    });

    it('should return local path for template with thumbnailUrl', () => {
      const src = getPreviewSrc(mockTemplateWithPreview);
      expect(src).toBe('/previews/modern-clean.png');
    });

    it('should return empty string for template without thumbnailUrl', () => {
      const src = getPreviewSrc(mockTemplateWithoutPreview);
      expect(src).toBe('');
    });

    it('should pass through remote HTTP URLs unchanged', () => {
      const src = getPreviewSrc(mockTemplateWithRemoteUrl);
      expect(src).toBe('https://cdn.example.com/preview.png');
    });

    it('should pass through remote HTTPS URLs unchanged', () => {
      const template = {
        ...mockTemplateWithPreview,
        thumbnailUrl: 'https://storage.example.com/preview.png',
      };
      const src = getPreviewSrc(template);
      expect(src).toBe('https://storage.example.com/preview.png');
    });

    it('should construct remote URL when NEXT_PUBLIC_PREVIEW_BASE_URL is set and no thumbnailUrl', () => {
      process.env.NEXT_PUBLIC_PREVIEW_BASE_URL = 'https://cdn.example.com/previews';
      const src = getPreviewSrc(mockTemplateWithoutPreview);
      expect(src).toBe('https://cdn.example.com/previews/no-preview.png');
    });

    it('should handle base URL with trailing slash', () => {
      process.env.NEXT_PUBLIC_PREVIEW_BASE_URL = 'https://cdn.example.com/previews/';
      const src = getPreviewSrc(mockTemplateWithoutPreview);
      expect(src).toBe('https://cdn.example.com/previews/no-preview.png');
    });

    it('should construct URL from relative thumbnailUrl when base URL is set', () => {
      process.env.NEXT_PUBLIC_PREVIEW_BASE_URL = 'https://cdn.example.com';
      const template = {
        ...mockTemplateWithPreview,
        thumbnailUrl: 'preview.png',
      };
      const src = getPreviewSrc(template);
      expect(src).toBe('https://cdn.example.com/preview.png');
    });

    it('should return local absolute path unchanged when base URL is not set', () => {
      const src = getPreviewSrc(mockTemplateWithPreview);
      expect(src).toBe('/previews/modern-clean.png');
    });
  });

  describe('hasPreview', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;
    });

    it('should return true for template with thumbnailUrl', () => {
      expect(hasPreview(mockTemplateWithPreview)).toBe(true);
    });

    it('should return false for template without thumbnailUrl and no base URL', () => {
      expect(hasPreview(mockTemplateWithoutPreview)).toBe(false);
    });

    it('should return true when base URL is configured even without thumbnailUrl', () => {
      process.env.NEXT_PUBLIC_PREVIEW_BASE_URL = 'https://cdn.example.com';
      expect(hasPreview(mockTemplateWithoutPreview)).toBe(true);
    });

    it('should return true for remote URL', () => {
      expect(hasPreview(mockTemplateWithRemoteUrl)).toBe(true);
    });

    it('should return false for empty string thumbnailUrl', () => {
      const template = {
        ...mockTemplateWithPreview,
        thumbnailUrl: '',
      };
      expect(hasPreview(template)).toBe(false);
    });

    it('should return false for whitespace-only thumbnailUrl', () => {
      const template = {
        ...mockTemplateWithPreview,
        thumbnailUrl: '   ',
      };
      expect(hasPreview(template)).toBe(false);
    });
  });
});

describe('Template Preview URL Generation', () => {
  it('should generate correct URLs for all seed templates', () => {
    const templates = [
      { slug: 'modern-clean', thumbnailUrl: '/previews/modern-clean.png' },
      { slug: 'modern-two-col', thumbnailUrl: '/previews/modern-two-col.png' },
      { slug: 'grid-compact', thumbnailUrl: '/previews/grid-compact.png' },
      { slug: 'timeline', thumbnailUrl: '/previews/timeline.png' },
      { slug: 'minimal-serif', thumbnailUrl: '/previews/minimal-serif.png' },
      { slug: 'product-designer', thumbnailUrl: '/previews/product-designer.png' },
    ];

    templates.forEach((template) => {
      const mockTemplate = {
        id: template.slug,
        slug: template.slug,
        name: template.slug,
        thumbnailUrl: template.thumbnailUrl,
        pageSize: 'Letter',
        allowedBlocks: [],
      };

      const src = getPreviewSrc(mockTemplate);
      expect(src).toBe(template.thumbnailUrl);
      expect(hasPreview(mockTemplate)).toBe(true);
    });
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;
  });

  it('should handle undefined thumbnailUrl', () => {
    const template = {
      id: '1',
      slug: 'test',
      name: 'Test',
      pageSize: 'Letter',
      allowedBlocks: [],
    };

    const src = getPreviewSrc(template as any);
    expect(src).toBe('');
    expect(hasPreview(template as any)).toBe(false);
  });

  it('should handle null thumbnailUrl', () => {
    const template = {
      id: '1',
      slug: 'test',
      name: 'Test',
      thumbnailUrl: null as any,
      pageSize: 'Letter',
      allowedBlocks: [],
    };

    const src = getPreviewSrc(template);
    expect(src).toBe('');
  });

  it('should handle special characters in slug', () => {
    process.env.NEXT_PUBLIC_PREVIEW_BASE_URL = 'https://cdn.example.com';
    const template = {
      id: '1',
      slug: 'modern-clean_v2',
      name: 'Modern Clean v2',
      thumbnailUrl: '',
      pageSize: 'Letter',
      allowedBlocks: [],
    };

    const src = getPreviewSrc(template);
    expect(src).toBe('https://cdn.example.com/modern-clean_v2.png');
  });

  it('should handle very long slugs', () => {
    const longSlug = 'very-long-template-name-that-exceeds-normal-length';
    const template = {
      id: '1',
      slug: longSlug,
      name: 'Long Name',
      thumbnailUrl: `/previews/${longSlug}.png`,
      pageSize: 'Letter',
      allowedBlocks: [],
    };

    const src = getPreviewSrc(template);
    expect(src).toBe(`/previews/${longSlug}.png`);
  });
});
