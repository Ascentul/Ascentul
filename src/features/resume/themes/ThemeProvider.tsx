'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Theme } from './types';
import { resolveThemeToCSSVars, resolveThemeToClasses } from './resolveTokens';

interface ThemeContextValue {
  theme: Theme | null;
  cssVars: Record<string, string>;
  classes: {
    bodyClass: string;
    headingClass: string;
    mutedClass: string;
  };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  theme: Theme | null | undefined;
  children: ReactNode;
}

/**
 * ThemeProvider - Applies theme tokens as CSS custom properties
 *
 * Attaches CSS variables to the wrapper div, making them available to all children.
 * Resolves theme once on mount/theme change for optimal performance.
 *
 * @example
 * <ThemeProvider theme={currentTheme}>
 *   <ResumeCanvas /> // Canvas uses var(--font-body), var(--color-primary), etc.
 * </ThemeProvider>
 */
export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  // Normalize theme once to avoid repeated ?? null operations
  // This prevents unnecessary recomputations if theme alternates between null/undefined
  const normalizedTheme = theme ?? null;

  const cssVars = useMemo(() => resolveThemeToCSSVars(normalizedTheme), [normalizedTheme]);
  const classes = useMemo(() => resolveThemeToClasses(normalizedTheme), [normalizedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: normalizedTheme,
      cssVars,
      classes,
    }),
    [normalizedTheme, cssVars, classes]
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        style={cssVars as React.CSSProperties}
        className="theme-root"
        data-theme-id={normalizedTheme?.id}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access current theme context
 *
 * @returns Theme context value with theme, cssVars, and semantic classes
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

/**
 * Hook to access theme classes for semantic elements
 *
 * @returns Object with bodyClass, headingClass, mutedClass
 *
 * @example
 * const { bodyClass, headingClass } = useThemeClasses();
 * <p className={bodyClass}>Body text</p>
 * <h1 className={headingClass}>Heading</h1>
 */
export function useThemeClasses() {
  const { classes } = useTheme();
  return classes;
}
