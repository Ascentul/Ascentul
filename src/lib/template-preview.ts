/**
 * Template Preview Utilities
 * Handles preview image URLs for resume templates with support for local and remote sources
 */

interface Template {
  id: string;
  slug: string;
  thumbnailUrl?: string;
}

/**
 * Get the preview image source URL for a template
 *
 * Priority order:
 * 1. If thumbnailUrl starts with http/https, return as-is (remote URL)
 * 2. If NEXT_PUBLIC_PREVIEW_BASE_URL is set, construct remote URL: {base}/{slug}.png
 * 3. Otherwise, use local path from thumbnailUrl or fall back to empty string
 *
 * @param template - Template object with thumbnailUrl and slug
 * @returns Image source URL or empty string if no preview available
 *
 * @example
 * // Remote URL passthrough
 * getPreviewSrc({ id: '1', slug: 'modern', thumbnailUrl: 'https://cdn.example.com/preview.png' })
 * // => 'https://cdn.example.com/preview.png'
 *
 * @example
 * // With NEXT_PUBLIC_PREVIEW_BASE_URL='https://storage.example.com/previews'
 * getPreviewSrc({ id: '1', slug: 'modern-clean', thumbnailUrl: '' })
 * // => 'https://storage.example.com/previews/modern-clean.png'
 *
 * @example
 * // Local path
 * getPreviewSrc({ id: '1', slug: 'modern', thumbnailUrl: '/previews/modern.png' })
 * // => '/previews/modern.png'
 */
export function getPreviewSrc(template: Template): string {
  const { thumbnailUrl, slug } = template;

  // If no thumbnailUrl provided, check for remote base URL
  if (!thumbnailUrl || thumbnailUrl.trim() === '') {
    const baseUrl = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;
    if (baseUrl) {
      // Ensure base URL doesn't end with slash, slug doesn't start with slash
      const cleanBase = baseUrl.replace(/\/$/, '');
      return `${cleanBase}/${slug}.png`;
    }
    return '';
  }

  // If thumbnailUrl is already a full HTTP/HTTPS URL, return as-is
  if (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://')) {
    return thumbnailUrl;
  }

  // If NEXT_PUBLIC_PREVIEW_BASE_URL is set and thumbnailUrl is a relative path,
  // construct the full URL
  const baseUrl = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;
  if (baseUrl && !thumbnailUrl.startsWith('/')) {
    const cleanBase = baseUrl.replace(/\/$/, '');
    return `${cleanBase}/${thumbnailUrl}`;
  }

  // Return local path as-is (e.g., "/previews/template.png")
  return thumbnailUrl;
}

/**
 * Check if a template has a preview image available
 *
 * @param template - Template object
 * @returns true if preview is available (either thumbnailUrl or remote base URL configured)
 */
export function hasPreview(template: Template): boolean {
  if (template.thumbnailUrl && template.thumbnailUrl.trim() !== '') {
    return true;
  }

  // Check if remote base URL is configured (would generate preview URL)
  return Boolean(process.env.NEXT_PUBLIC_PREVIEW_BASE_URL);
}
