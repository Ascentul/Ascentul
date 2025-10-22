import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import { resolveThemeToCSSVars, resolveThemeToClasses, resolveThemeTokens } from '@/features/resume/themes/resolveTokens';
import { ThemeProvider, useTheme, useThemeClasses } from '@/features/resume/themes/ThemeProvider';
import { DEFAULT_THEME_TOKENS } from '@/features/resume/themes/types';
import type { Theme } from '@/features/resume/themes/types';

describe('Theme Application - Phase 5', () => {
  const mockTheme: Theme = {
    id: 'theme1',
    name: 'Test Theme',
    slug: 'test-theme',
    fonts: {
      body: 'Inter, sans-serif',
      heading: 'Roboto, sans-serif',
      mono: 'Fira Code, monospace',
    },
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#0066cc',
      text: '#111111',
      background: '#ffffff',
      muted: '#999999',
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
    spacing: {
      scale: 1.2,
      blockGap: 1.5,
      sectionGap: 2.5,
    },
    isPublic: true,
    createdAt: Date.now(),
  };

  describe('resolveThemeToCSSVars', () => {
    it('should convert theme to CSS custom properties', () => {
      const cssVars = resolveThemeToCSSVars(mockTheme);

      expect(cssVars['--font-body']).toBe('Inter, sans-serif');
      expect(cssVars['--font-heading']).toBe('Roboto, sans-serif');
      expect(cssVars['--font-mono']).toBe('Fira Code, monospace');
      expect(cssVars['--color-primary']).toBe('#000000');
      expect(cssVars['--color-text']).toBe('#111111');
      expect(cssVars['--font-size-base']).toBe('1rem');
      expect(cssVars['--font-size-xl']).toBe('1.25rem');
      expect(cssVars['--spacing-block-gap']).toBe('1.5rem');
      expect(cssVars['--spacing-section-gap']).toBe('2.5rem');
    });

    it('should use defaults for null theme', () => {
      const cssVars = resolveThemeToCSSVars(null);

      expect(cssVars['--font-body']).toBe(DEFAULT_THEME_TOKENS.fonts.body);
      expect(cssVars['--color-primary']).toBe(DEFAULT_THEME_TOKENS.colors.primary);
      expect(cssVars['--font-size-base']).toBe(`${DEFAULT_THEME_TOKENS.fontSizes.base}rem`);
    });

    it('should use defaults for undefined theme', () => {
      const cssVars = resolveThemeToCSSVars(undefined);

      expect(cssVars['--font-heading']).toBe(DEFAULT_THEME_TOKENS.fonts.heading);
      expect(cssVars['--spacing-scale']).toBe(DEFAULT_THEME_TOKENS.spacing.scale.toString());
    });

    it('should complete in reasonable time (smoke test)', () => {
      const start = performance.now();
      resolveThemeToCSSVars(mockTheme);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Smoke test for major regressions
    });
  });

  describe('resolveThemeToClasses', () => {
    it('should return semantic class names', () => {
      const classes = resolveThemeToClasses(mockTheme);

      expect(classes.bodyClass).toContain('font-body');
      expect(classes.bodyClass).toContain('text-[var(--color-text)]');
      expect(classes.headingClass).toContain('font-heading');
      expect(classes.headingClass).toContain('text-[var(--color-text)]');
      expect(classes.mutedClass).toContain('font-body');
      expect(classes.mutedClass).toContain('text-[var(--color-muted)]');
    });

    it('should return same classes for null theme (using CSS vars)', () => {
      const classes = resolveThemeToClasses(null);

      expect(classes.bodyClass).toBe('font-body text-[var(--color-text)]');
      expect(classes.headingClass).toBe('font-heading text-[var(--color-text)]');
      expect(classes.mutedClass).toBe('font-body text-[var(--color-muted)]');
    });
  });

  describe('resolveThemeTokens', () => {
    it('should merge theme with defaults', () => {
      // Create a theme with only partial font overrides to test merging behavior
      const partialTheme: Theme = {
        ...mockTheme,
        fonts: {
          body: 'Custom Font',
          heading: DEFAULT_THEME_TOKENS.fonts.heading,
          mono: DEFAULT_THEME_TOKENS.fonts.mono,
        },
      };

      const tokens = resolveThemeTokens(partialTheme);

      expect(tokens.fonts.body).toBe('Custom Font');
      expect(tokens.fonts.heading).toBe(DEFAULT_THEME_TOKENS.fonts.heading);
      expect(tokens.fonts.mono).toBe(DEFAULT_THEME_TOKENS.fonts.mono);
    });

    it('should use all defaults for null theme', () => {
      const tokens = resolveThemeTokens(null);

      expect(tokens).toEqual(DEFAULT_THEME_TOKENS);
    });

    it('should preserve numeric zero values', () => {
      const themeWithZero: Theme = {
        ...mockTheme,
        fontSizes: {
          xs: 0,
          sm: 0.875,
          base: 1,
          lg: 1.125,
          xl: 1.25,
          '2xl': 1.5,
          '3xl': 1.875,
        },
      };

      const tokens = resolveThemeTokens(themeWithZero);

      expect(tokens.fontSizes.xs).toBe(0);
    });
  });

  describe('ThemeProvider', () => {
    function TestChild() {
      const { theme, cssVars, classes } = useTheme();
      return (
        <div>
          <div data-testid="theme-id">{theme?.id ?? 'null'}</div>
          <div data-testid="font-body">{cssVars['--font-body']}</div>
          <div data-testid="body-class">{classes.bodyClass}</div>
        </div>
      );
    }

    it('should provide theme context to children', () => {
      render(
        <ThemeProvider theme={mockTheme}>
          <TestChild />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-id')).toHaveTextContent('theme1');
      expect(screen.getByTestId('font-body')).toHaveTextContent('Inter, sans-serif');
      expect(screen.getByTestId('body-class')).toHaveTextContent('font-body text-[var(--color-text)]');
    });

    it('should apply CSS custom properties to wrapper div', () => {
      const { container } = render(
        <ThemeProvider theme={mockTheme}>
          <div>Content</div>
        </ThemeProvider>
      );

      const wrapper = container.querySelector('.theme-root');
      expect(wrapper).toBeInTheDocument();

      // Check inline styles
      const style = wrapper?.getAttribute('style');
      expect(style).toContain('--font-body');
      expect(style).toContain('Inter, sans-serif');
      expect(style).toContain('--color-primary');
      expect(style).toContain('#000000');
    });

    it('should set data-theme-id attribute', () => {
      const { container } = render(
        <ThemeProvider theme={mockTheme}>
          <div>Content</div>
        </ThemeProvider>
      );

      const wrapper = container.querySelector('.theme-root');
      expect(wrapper).toHaveAttribute('data-theme-id', 'theme1');
    });

    it('should handle null theme gracefully', () => {
      render(
        <ThemeProvider theme={null}>
          <TestChild />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-id')).toHaveTextContent('null');
      expect(screen.getByTestId('font-body')).toHaveTextContent(DEFAULT_THEME_TOKENS.fonts.body);
    });

    it('should handle undefined theme gracefully', () => {
      render(
        <ThemeProvider theme={undefined}>
          <TestChild />
        </ThemeProvider>
      );

      expect(screen.getByTestId('theme-id')).toHaveTextContent('null');
      expect(screen.getByTestId('font-body')).toHaveTextContent(DEFAULT_THEME_TOKENS.fonts.body);
    });
  });

  describe('useThemeClasses hook', () => {
    function TestComponent() {
      const classes = useThemeClasses();
      return (
        <div>
          <p className={classes.bodyClass} data-testid="body">Body text</p>
          <h1 className={classes.headingClass} data-testid="heading">Heading</h1>
          <span className={classes.mutedClass} data-testid="muted">Muted</span>
        </div>
      );
    }

    it('should provide semantic classes via hook', () => {
      render(
        <ThemeProvider theme={mockTheme}>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('body')).toHaveClass('font-body');
      expect(screen.getByTestId('heading')).toHaveClass('font-heading');
      expect(screen.getByTestId('muted')).toHaveClass('font-body');
    });
  });

  describe('Phase 5 constraints', () => {
    it('should resolve theme synchronously without async operations', () => {
      const cssVars = resolveThemeToCSSVars(mockTheme);
      const classes = resolveThemeToClasses(mockTheme);
      const tokens = resolveThemeTokens(mockTheme);

      // Verify synchronous execution by ensuring results are not Promises
      expect(cssVars).not.toBeInstanceOf(Promise);
      expect(classes).not.toBeInstanceOf(Promise);
      expect(tokens).not.toBeInstanceOf(Promise);
      
      // Also verify results are immediately usable
      expect(cssVars).toBeDefined();
      expect(classes).toBeDefined();
      expect(tokens).toBeDefined();
    });

    it('should render ThemeProvider without errors', () => {
      const { container } = render(
        <ThemeProvider theme={mockTheme}>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(container).toBeInTheDocument();
    });
  });
});
