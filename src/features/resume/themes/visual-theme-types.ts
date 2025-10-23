/**
 * Visual Theme System - Complete visual styling for resumes
 *
 * This extends the basic theme system with full visual control including:
 * - Color palettes with accessibility checks
 * - Typography scales with Tailwind classes
 * - Component-specific styling (sidebars, headers, bullets, etc.)
 * - Export-safe rendering
 */

/**
 * Color palette with semantic naming
 */
export interface ThemePalette {
  /** Primary brand color (headers, accents) */
  primary: string;
  /** Text color on primary (light or dark for contrast) */
  primaryTextOn: 'light' | 'dark';
  /** Main page background */
  surface: string;
  /** Alternate surface (sidebar, bands) */
  surfaceAlt: string;
  /** Body text color */
  text: string;
  /** Muted/secondary text color */
  textMuted: string;
  /** Border color */
  border: string;
  /** Accent color (bullets, underlines, highlights) */
  accent: string;
}

/**
 * Typography configuration with Tailwind classes
 */
export interface ThemeTypography {
  /** Heading font family */
  headingFamily?: string;
  /** Body font family */
  bodyFamily?: string;
  /** H1 Tailwind classes */
  h1: string;
  /** H2 Tailwind classes */
  h2: string;
  /** H3 Tailwind classes */
  h3: string;
  /** Body text Tailwind classes */
  body: string;
  /** Small text Tailwind classes */
  small: string;
}

/**
 * Sidebar configuration
 */
export interface ThemeSidebar {
  /** Enable sidebar */
  enabled: boolean;
  /** Sidebar width */
  width: 'narrow' | 'medium' | 'wide';
  /** Sidebar alignment */
  align: 'left' | 'right';
  /** Sidebar container classes */
  classes: string;
  /** Avatar style in sidebar */
  avatarStyle?: 'circle' | 'rounded' | 'square' | 'none';
  /** Section title style in sidebar */
  sectionTitle: string;
  /** List item style in sidebar */
  item: string;
  /** Divider style between sections */
  divider?: 'line' | 'spacer' | 'none';
}

/**
 * Section header configuration
 */
export interface ThemeSectionHeader {
  /** Title classes */
  title: string;
  /** Show underline */
  underline?: boolean;
  /** Underline classes */
  underlineClass?: string;
  /** Gap after header */
  gapClass?: string;
  /** Icon color */
  iconColor?: string;
}

/**
 * Bullet point configuration
 */
export interface ThemeBullet {
  /** Bullet style */
  style: 'disc' | 'dot' | 'dash' | 'square' | 'check';
  /** Bullet classes */
  className: string;
}

/**
 * Chip/tag configuration (skills, technologies)
 */
export interface ThemeChip {
  /** Chip classes */
  className: string;
}

/**
 * Divider configuration
 */
export interface ThemeDivider {
  /** Divider classes */
  className: string;
}

/**
 * Link configuration
 */
export interface ThemeLink {
  /** Link classes */
  className: string;
}

/**
 * Theme components configuration
 */
export interface ThemeComponents {
  /** Page root classes */
  page: string;
  /** Sidebar configuration (optional) */
  sidebar?: ThemeSidebar;
  /** Section header styling */
  sectionHeader: ThemeSectionHeader;
  /** Bullet styling */
  bullet: ThemeBullet;
  /** Chip/tag styling */
  chip: ThemeChip;
  /** Divider styling */
  divider: ThemeDivider;
  /** Link styling */
  link: ThemeLink;
}

/**
 * Accessibility configuration
 */
export interface ThemeA11y {
  /** Minimum contrast ratio (WCAG AA = 4.5, AAA = 7) */
  minContrast: number;
}

/**
 * Complete visual theme definition
 */
export interface VisualTheme {
  /** Unique theme identifier */
  id: string;
  /** Display name */
  name: string;
  /** Human-readable slug */
  slug: string;
  /** Theme description */
  description?: string;
  /** Color palette */
  palette: ThemePalette;
  /** Typography configuration */
  typography: ThemeTypography;
  /** Component styling */
  components: ThemeComponents;
  /** Accessibility settings */
  a11y?: ThemeA11y;
  /** Preview thumbnail */
  preview?: string;
  /** Is theme public */
  isPublic?: boolean;
  /** Created timestamp */
  createdAt?: number;
}

/**
 * Sidebar width mappings
 */
export const SIDEBAR_WIDTHS = {
  narrow: 'w-[200px]',
  medium: 'w-[240px]',
  wide: 'w-[280px]',
} as const;
