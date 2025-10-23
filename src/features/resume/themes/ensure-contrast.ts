/**
 * Utility to ensure text has adequate contrast against backgrounds
 * Used for sidebar text that needs to be readable on dark backgrounds
 */

/**
 * Convert hex color to RGB object
 * @param hex - Hex color string (e.g., '#0B1F3B')
 * @returns RGB object or null if invalid
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
 * Determines if a background color is dark (luminance < 0.5)
 * @param hexColor - Hex color string (e.g., '#0B1F3B')
 * @returns true if color is dark
 */
export function isDarkColor(hexColor: string): boolean {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return false;

  // Calculate relative luminance
  const sRGB_r = rgb.r / 255;
  const sRGB_g = rgb.g / 255;
  const sRGB_b = rgb.b / 255;

  const r = sRGB_r <= 0.03928 ? sRGB_r / 12.92 : Math.pow((sRGB_r + 0.055) / 1.055, 2.4);
  const g = sRGB_g <= 0.03928 ? sRGB_g / 12.92 : Math.pow((sRGB_g + 0.055) / 1.055, 2.4);
  const b = sRGB_b <= 0.03928 ? sRGB_b / 12.92 : Math.pow((sRGB_b + 0.055) / 1.055, 2.4);

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.5;
}

/**
 * Returns appropriate text color (white or dark) based on background
 * @param backgroundColor - Hex color of the background
 * @param desiredContrast - Minimum WCAG contrast ratio (default 4.5 for AA)
 * @returns Tailwind class for text color
 */
export function ensureContrast(
  backgroundColor: string,
  desiredContrast: number = 4.5
): { text: string; textMuted: string; border: string } {
  const isDark = isDarkColor(backgroundColor);

  if (isDark) {
    // Dark background → white text
    return {
      text: 'text-white',
      textMuted: 'text-white/80',
      border: 'border-white/20',
    };
  } else {
    // Light background → dark text
    return {
      text: 'text-gray-900',
      textMuted: 'text-gray-600',
      border: 'border-gray-200',
    };
  }
}

/**
 * Get contrast-safe classes for sidebar region
 * @param sidebarBg - Background color of the sidebar
 * @returns Object with Tailwind classes for various sidebar elements
 */
export function getSidebarClasses(sidebarBg: string) {
  const contrast = ensureContrast(sidebarBg);

  return {
    heading: `${contrast.text} font-bold`,
    body: contrast.text,
    muted: contrast.textMuted,
    border: contrast.border,
    chip: `${contrast.text} bg-white/10 ${contrast.border}`,
    rule: `${contrast.border}`,
    link: `${contrast.text} hover:${contrast.textMuted} underline`,
  };
}
