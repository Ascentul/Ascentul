import { getPreviewSrc } from '@/lib/templates/getPreviewSrc';

describe('getPreviewSrc', () => {
  const originalEnv = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_PREVIEW_BASE_URL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;
    }
  });

  describe('validation', () => {
    it('throws error for empty previewAssetId', () => {
      expect(() =>
        getPreviewSrc({ preview: null, previewAssetId: '' })
      ).toThrow('previewAssetId must be a non-empty string');
    });

    it('throws error for whitespace-only previewAssetId', () => {
      expect(() =>
        getPreviewSrc({ preview: null, previewAssetId: '   ' })
      ).toThrow('previewAssetId must be a non-empty string');
    });

    it('throws error for null previewAssetId', () => {
      expect(() =>
        getPreviewSrc({ preview: null, previewAssetId: null as any })
      ).toThrow('previewAssetId must be a non-empty string');
    });

    it('throws error for undefined previewAssetId', () => {
      expect(() =>
        getPreviewSrc({ preview: null, previewAssetId: undefined as any })
      ).toThrow('previewAssetId must be a non-empty string');
    });
  });

  describe('priority 1: absolute HTTP(S) URLs', () => {
    it('returns HTTPS URL as-is', () => {
      const result = getPreviewSrc({
        preview: 'https://cdn.example.com/templates/modern.png',
        previewAssetId: 'modern',
      });
      expect(result).toBe('https://cdn.example.com/templates/modern.png');
    });

    it('returns HTTP URL as-is', () => {
      const result = getPreviewSrc({
        preview: 'http://cdn.example.com/templates/modern.png',
        previewAssetId: 'modern',
      });
      expect(result).toBe('http://cdn.example.com/templates/modern.png');
    });
  });

  describe('priority 2: relative paths starting with /', () => {
    it('returns absolute path as-is', () => {
      const result = getPreviewSrc({
        preview: '/assets/templates/custom.jpg',
        previewAssetId: 'custom',
      });
      expect(result).toBe('/assets/templates/custom.jpg');
    });
  });

  describe('priority 3: filename with extension', () => {
    it('constructs path with provided filename', () => {
      const result = getPreviewSrc({
        preview: 'grid-compact.png',
        previewAssetId: 'grid-compact',
      });
      expect(result).toBe('/previews/grid-compact.png');
    });

    it('supports SVG format', () => {
      const result = getPreviewSrc({
        preview: 'modern-sidebar.svg',
        previewAssetId: 'modern-sidebar',
      });
      expect(result).toBe('/previews/modern-sidebar.svg');
    });

    it('supports WEBP format', () => {
      const result = getPreviewSrc({
        preview: 'compact.webp',
        previewAssetId: 'compact',
      });
      expect(result).toBe('/previews/compact.webp');
    });
  });

  describe('priority 4: remote CDN fallback', () => {
    it('constructs CDN URL with PNG extension by default', () => {
      process.env.NEXT_PUBLIC_PREVIEW_BASE_URL = 'https://cdn.example.com/previews';

      const result = getPreviewSrc({
        preview: null,
        previewAssetId: 'modern-clean',
      });

      expect(result).toBe('https://cdn.example.com/previews/modern-clean.png');
    });

    it('constructs CDN URL with custom extension', () => {
      process.env.NEXT_PUBLIC_PREVIEW_BASE_URL = 'https://cdn.example.com/previews';

      const result = getPreviewSrc({
        preview: null,
        previewAssetId: 'modern-clean',
        extension: 'webp',
      });

      expect(result).toBe('https://cdn.example.com/previews/modern-clean.webp');
    });

    it('strips trailing slash from CDN base URL', () => {
      process.env.NEXT_PUBLIC_PREVIEW_BASE_URL = 'https://cdn.example.com/previews/';

      const result = getPreviewSrc({
        preview: null,
        previewAssetId: 'minimal',
      });

      expect(result).toBe('https://cdn.example.com/previews/minimal.png');
    });

    it('supports SVG extension on CDN', () => {
      process.env.NEXT_PUBLIC_PREVIEW_BASE_URL = 'https://cdn.example.com';

      const result = getPreviewSrc({
        preview: null,
        previewAssetId: 'sidebar',
        extension: 'svg',
      });

      expect(result).toBe('https://cdn.example.com/sidebar.svg');
    });
  });

  describe('priority 5: local fallback', () => {
    it('constructs local path with PNG extension by default', () => {
      const result = getPreviewSrc({
        preview: null,
        previewAssetId: 'grid-compact',
      });

      expect(result).toBe('/previews/grid-compact.png');
    });

    it('constructs local path with custom extension', () => {
      const result = getPreviewSrc({
        preview: null,
        previewAssetId: 'timeline',
        extension: 'svg',
      });

      expect(result).toBe('/previews/timeline.svg');
    });

    it('supports JPEG extension', () => {
      const result = getPreviewSrc({
        preview: null,
        previewAssetId: 'professional',
        extension: 'jpg',
      });

      expect(result).toBe('/previews/professional.jpg');
    });

    it('supports WEBP extension', () => {
      const result = getPreviewSrc({
        preview: null,
        previewAssetId: 'creative',
        extension: 'webp',
      });

      expect(result).toBe('/previews/creative.webp');
    });
  });

  describe('edge cases', () => {
    it('trims whitespace from preview value', () => {
      const result = getPreviewSrc({
        preview: '  modern.png  ',
        previewAssetId: 'modern',
      });

      expect(result).toBe('/previews/modern.png');
    });

    it('treats empty string preview as null', () => {
      const result = getPreviewSrc({
        preview: '',
        previewAssetId: 'compact',
      });

      expect(result).toBe('/previews/compact.png');
    });

    it('ignores extension parameter when preview is provided', () => {
      const result = getPreviewSrc({
        preview: 'custom.svg',
        previewAssetId: 'custom',
        extension: 'png',
      });

      // Should use the extension in the preview filename, not the parameter
      expect(result).toBe('/previews/custom.svg');
    });

    it('handles undefined preview value', () => {
      const result = getPreviewSrc({
        preview: undefined,
        previewAssetId: 'modern',
        extension: 'webp',
      });

      expect(result).toBe('/previews/modern.webp');
    });

    it('handles filenames with multiple dots', () => {
      const result = getPreviewSrc({
        preview: 'my.template.name.png',
        previewAssetId: 'my-template',
      });

      expect(result).toBe('/previews/my.template.name.png');
    });

    it('handles preview values with query parameters', () => {
      const result = getPreviewSrc({
        preview: 'template.png?v=1.2.3',
        previewAssetId: 'template',
      });

      expect(result).toBe('/previews/template.png?v=1.2.3');
    });

    it('handles uppercase file extensions', () => {
      const result = getPreviewSrc({
        preview: 'MODERN.PNG',
        previewAssetId: 'modern',
      });

      expect(result).toBe('/previews/MODERN.PNG');
    });

    it('handles mixed case extensions', () => {
      const result = getPreviewSrc({
        preview: 'creative.WebP',
        previewAssetId: 'creative',
      });

      expect(result).toBe('/previews/creative.WebP');
    });
  });
});
