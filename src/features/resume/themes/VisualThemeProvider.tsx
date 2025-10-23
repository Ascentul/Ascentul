'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { VisualTheme } from './visual-theme-types';

interface VisualThemeContextValue {
  theme: VisualTheme;
  cssVars: Record<string, string>;
}

const VisualThemeContext = createContext<VisualThemeContextValue | null>(null);

interface VisualThemeProviderProps {
  theme: VisualTheme;
  children: ReactNode;
}

/**
 * VisualThemeProvider - Applies visual theme colors as CSS custom properties
 *
 * Converts the visual theme palette to CSS variables that block components can use.
 */
export function VisualThemeProvider({ theme, children }: VisualThemeProviderProps) {
  const cssVars = useMemo(() => {
    console.log('[VisualThemeProvider] Theme changed:', {
      id: theme.id,
      name: theme.name,
      accent: theme.palette.accent,
      primary: theme.palette.primary,
    });
    return {
      '--color-primary': theme.palette.primary,
      '--color-surface': theme.palette.surface,
      '--color-surface-alt': theme.palette.surfaceAlt,
      '--color-text': theme.palette.text,
      '--color-text-muted': theme.palette.textMuted,
      '--color-border': theme.palette.border,
      '--color-accent': theme.palette.accent,
    };
  }, [theme]);

  const value = useMemo<VisualThemeContextValue>(
    () => ({
      theme,
      cssVars,
    }),
    [theme, cssVars]
  );

  return (
    <VisualThemeContext.Provider value={value}>
      <div
        style={{
          ...cssVars,
          // Apply bullet colors globally
          // @ts-ignore - CSS custom properties for list markers
          '--tw-prose-bullets': cssVars['--color-accent'],
        } as React.CSSProperties}
        className="visual-theme-root"
        data-visual-theme-id={theme.id}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Apply accent color to list markers (bullets) */
            .visual-theme-root li::marker {
              color: var(--color-accent) !important;
            }

            /* Apply accent color to all borders that use border-foreground */
            .visual-theme-root .border-foreground,
            .visual-theme-root .border-b-foreground,
            .visual-theme-root .border-t-foreground {
              border-color: var(--color-accent) !important;
            }

            /* Apply accent color to section dividers with border-b-2 */
            .visual-theme-root .border-b-2,
            .visual-theme-root h2.border-b-2 {
              border-bottom-color: var(--color-accent) !important;
            }
          `
        }} />
        {children}
      </div>
    </VisualThemeContext.Provider>
  );
}

/**
 * Hook to access current visual theme context
 */
export function useVisualTheme(): VisualThemeContextValue {
  const context = useContext(VisualThemeContext);
  if (!context) {
    throw new Error('useVisualTheme must be used within VisualThemeProvider');
  }
  return context;
}
