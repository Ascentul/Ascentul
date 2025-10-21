import type { Id } from '../../../../convex/_generated/dataModel';

/**
 * Theme font configuration
 */
export interface ThemeFonts {
  body?: string;
  heading?: string;
  mono?: string;
}

/**
 * Theme font size configuration (in rem units)
 */
export interface ThemeFontSizes {
  xs?: number;
  sm?: number;
  base?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
  '3xl'?: number;
}

/**
 * Theme color configuration
 */
export interface ThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  text?: string;
  background?: string;
  muted?: string;
}

/**
 * Theme spacing configuration (scale multiplier)
 */
export interface ThemeSpacing {
  scale?: number;
  blockGap?: number;
  sectionGap?: number;
}

/**
 * Complete theme definition matching Convex builder_resume_themes table
 */
export interface Theme {
  id: Id<'builder_resume_themes'>;
  name: string;
  slug: string;
  fonts: ThemeFonts;
  colors: ThemeColors;
  fontSizes?: ThemeFontSizes;
  spacing: ThemeSpacing;
  isPublic: boolean;
  createdAt: number;
}

/**
 * Resolved theme tokens ready for CSS application
 */
export interface ThemeTokens {
  fonts: Required<ThemeFonts>;
  fontSizes: Required<ThemeFontSizes>;
  colors: Required<ThemeColors>;
  spacing: Required<ThemeSpacing>;
}

/**
 * Default theme values for fallback
 */
export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  fonts: {
    body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  fontSizes: {
    xs: 0.75,
    sm: 0.875,
    base: 1,
    lg: 1.125,
    xl: 1.25,
    '2xl': 1.5,
    '3xl': 1.875,
  },
  colors: {
    primary: '#000000',
    secondary: '#666666',
    accent: '#0066cc',
    text: '#000000',
    background: '#ffffff',
    muted: '#999999',
  },
  spacing: {
    scale: 1,
    blockGap: 1.5,
    sectionGap: 2,
  },
};
