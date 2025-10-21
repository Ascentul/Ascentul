import type { Theme, ThemeTokens } from './types';
import { DEFAULT_THEME_TOKENS } from './types';

/**
 * Resolve theme to CSS custom properties (CSS variables)
 *
 * @param theme - Theme configuration from Convex
 * @returns Object mapping CSS variable names to values
 *
 * @example
 * const vars = resolveThemeToCSSVars(theme);
 * // { '--font-body': 'Inter, sans-serif', '--color-primary': '#000', ... }
 */
export function resolveThemeToCSSVars(theme: Theme | null | undefined): Record<string, string> {
  const tokens = resolveThemeTokens(theme);

  return {
    // Font families
    '--font-body': tokens.fonts.body,
    '--font-heading': tokens.fonts.heading,
    '--font-mono': tokens.fonts.mono,

    // Font sizes (rem values)
    '--font-size-xs': `${tokens.fontSizes.xs}rem`,
    '--font-size-sm': `${tokens.fontSizes.sm}rem`,
    '--font-size-base': `${tokens.fontSizes.base}rem`,
    '--font-size-lg': `${tokens.fontSizes.lg}rem`,
    '--font-size-xl': `${tokens.fontSizes.xl}rem`,
    '--font-size-2xl': `${tokens.fontSizes['2xl']}rem`,
    '--font-size-3xl': `${tokens.fontSizes['3xl']}rem`,

    // Colors
    '--color-primary': tokens.colors.primary,
    '--color-secondary': tokens.colors.secondary,
    '--color-accent': tokens.colors.accent,
    '--color-text': tokens.colors.text,
    '--color-background': tokens.colors.background,
    '--color-muted': tokens.colors.muted,

    // Spacing (multipliers)
    '--spacing-scale': tokens.spacing.scale.toString(),
    '--spacing-block-gap': `${tokens.spacing.blockGap}rem`,
    '--spacing-section-gap': `${tokens.spacing.sectionGap}rem`,
  };
}

/**
 * Resolve theme to Tailwind-compatible class names
 *
 * @param theme - Theme configuration from Convex
 * @returns Object with semantic class names for common elements
 *
 * @example
 * const classes = resolveThemeToClasses(theme);
 * <div className={classes.bodyClass}>Body text</div>
 * <h1 className={classes.headingClass}>Heading</h1>
 */
export function resolveThemeToClasses(theme: Theme | null | undefined): {
  bodyClass: string;
  headingClass: string;
  mutedClass: string;
} {
  // For Phase 5, we rely on CSS variables applied via ThemeProvider
  // Classes use var(--font-*) and var(--color-*) references
  // Future phases can add dynamic Tailwind class generation

  return {
    bodyClass: 'font-body text-[var(--color-text)]',
    headingClass: 'font-heading text-[var(--color-text)]',
    mutedClass: 'font-body text-[var(--color-muted)]',
  };
}

/**
 * Resolve theme to complete token set with defaults
 *
 * @param theme - Theme configuration from Convex (nullable)
 * @returns Fully resolved theme tokens with defaults for missing values
 */
export function resolveThemeTokens(theme: Theme | null | undefined): ThemeTokens {
  if (!theme) {
    return DEFAULT_THEME_TOKENS;
  }

  return {
    fonts: {
      body: theme.fonts?.body || DEFAULT_THEME_TOKENS.fonts.body,
      heading: theme.fonts?.heading || DEFAULT_THEME_TOKENS.fonts.heading,
      mono: theme.fonts?.mono || DEFAULT_THEME_TOKENS.fonts.mono,
    },
    fontSizes: {
      xs: theme.fontSizes?.xs ?? DEFAULT_THEME_TOKENS.fontSizes.xs,
      sm: theme.fontSizes?.sm ?? DEFAULT_THEME_TOKENS.fontSizes.sm,
      base: theme.fontSizes?.base ?? DEFAULT_THEME_TOKENS.fontSizes.base,
      lg: theme.fontSizes?.lg ?? DEFAULT_THEME_TOKENS.fontSizes.lg,
      xl: theme.fontSizes?.xl ?? DEFAULT_THEME_TOKENS.fontSizes.xl,
      '2xl': theme.fontSizes?.['2xl'] ?? DEFAULT_THEME_TOKENS.fontSizes['2xl'],
      '3xl': theme.fontSizes?.['3xl'] ?? DEFAULT_THEME_TOKENS.fontSizes['3xl'],
    },
    colors: {
      primary: theme.colors?.primary || DEFAULT_THEME_TOKENS.colors.primary,
      secondary: theme.colors?.secondary || DEFAULT_THEME_TOKENS.colors.secondary,
      accent: theme.colors?.accent || DEFAULT_THEME_TOKENS.colors.accent,
      text: theme.colors?.text || DEFAULT_THEME_TOKENS.colors.text,
      background: theme.colors?.background || DEFAULT_THEME_TOKENS.colors.background,
      muted: theme.colors?.muted || DEFAULT_THEME_TOKENS.colors.muted,
    },
    spacing: {
      scale: theme.spacing?.scale ?? DEFAULT_THEME_TOKENS.spacing.scale,
      blockGap: theme.spacing?.blockGap ?? DEFAULT_THEME_TOKENS.spacing.blockGap,
      sectionGap: theme.spacing?.sectionGap ?? DEFAULT_THEME_TOKENS.spacing.sectionGap,
    },
  };
}
