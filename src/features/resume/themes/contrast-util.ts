/**
 * Contrast Utility - WCAG contrast ratio calculations
 *
 * Ensures theme colors meet accessibility standards:
 * - WCAG AA: 4.5:1 for normal text, 3:1 for large text
 * - WCAG AAA: 7:1 for normal text, 4.5:1 for large text
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance
 * Formula from WCAG 2.1
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 *
 * @param color1 - First color (hex)
 * @param color2 - Second color (hex)
 * @returns Contrast ratio (1-21)
 *
 * @example
 * getContrastRatio('#000000', '#FFFFFF') // 21 (maximum contrast)
 * getContrastRatio('#4F46E5', '#FFFFFF') // 8.59
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    console.warn(`Invalid hex colors: ${color1}, ${color2}`);
    return 0;
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG level
 *
 * @param ratio - Contrast ratio
 * @param level - WCAG level ('AA' or 'AAA')
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns Whether contrast meets the standard
 */
export function meetsWCAG(
  ratio: number,
  level: 'AA' | 'AAA',
  isLargeText: boolean = false
): boolean {
  if (level === 'AA') {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  } else {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
}

/**
 * Validate theme colors for accessibility
 *
 * @param palette - Theme palette
 * @param minContrast - Minimum required contrast ratio
 * @returns Validation result with any warnings
 */
export function validateThemeContrast(
  palette: {
    primary: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    accent: string;
  },
  minContrast: number = 4.5
): {
  valid: boolean;
  warnings: string[];
  ratios: Record<string, number>;
} {
  const warnings: string[] = [];
  const ratios: Record<string, number> = {};

  // Check text on surface
  const textOnSurface = getContrastRatio(palette.text, palette.surface);
  ratios['text-on-surface'] = textOnSurface;
  if (textOnSurface < minContrast) {
    warnings.push(
      `Text on surface contrast (${textOnSurface.toFixed(2)}) is below ${minContrast}`
    );
  }

  // Check text on surfaceAlt
  const textOnAlt = getContrastRatio(palette.text, palette.surfaceAlt);
  ratios['text-on-alt'] = textOnAlt;
  if (textOnAlt < minContrast) {
    warnings.push(
      `Text on alt surface contrast (${textOnAlt.toFixed(2)}) is below ${minContrast}`
    );
  }

  // Check primary on surface
  const primaryOnSurface = getContrastRatio(palette.primary, palette.surface);
  ratios['primary-on-surface'] = primaryOnSurface;
  if (primaryOnSurface < minContrast) {
    warnings.push(
      `Primary on surface contrast (${primaryOnSurface.toFixed(2)}) is below ${minContrast}`
    );
  }

  // Check accent on surface
  const accentOnSurface = getContrastRatio(palette.accent, palette.surface);
  ratios['accent-on-surface'] = accentOnSurface;
  if (accentOnSurface < 3) {
    // Lower threshold for accents (they're often decorative)
    warnings.push(
      `Accent on surface contrast (${accentOnSurface.toFixed(2)}) is very low`
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
    ratios,
  };
}

/**
 * Get suggested text color (light or dark) for a background
 *
 * @param backgroundColor - Background color (hex)
 * @returns 'light' or 'dark' for best contrast
 */
export function getSuggestedTextColor(backgroundColor: string): 'light' | 'dark' {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return 'dark';

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);

  // Use white text on dark backgrounds (luminance < 0.5)
  return luminance < 0.5 ? 'light' : 'dark';
}
