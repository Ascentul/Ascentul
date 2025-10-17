import { useState, useEffect } from 'react';

/**
 * Responsive design breakpoint system
 *
 * These breakpoints define the viewport width ranges for different device categories.
 * Should align with Tailwind CSS breakpoints and design system specifications.
 *
 * Breakpoint ranges:
 * - Mobile:  0px - 768px   (smartphones, small tablets in portrait)
 * - Tablet:  769px - 1024px (tablets in landscape, small laptops)
 * - Desktop: 1025px+        (laptops, desktops, large displays)
 *
 * @see https://tailwindcss.com/docs/responsive-design for Tailwind defaults
 */
const BREAKPOINTS = {
  /** Maximum width for mobile devices (768px) */
  MOBILE_MAX: '768px',
  /** Minimum width for tablet devices (769px) */
  TABLET_MIN: '769px',
  /** Maximum width for tablet devices (1024px) */
  TABLET_MAX: '1024px',
  /** Minimum width for desktop devices (1025px) */
  DESKTOP_MIN: '1025px',
} as const;

/**
 * Custom hook to detect media query matches
 * Useful for responsive design and conditional rendering
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Define listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener (modern browsers only - deprecated addListener removed)
    media.addEventListener('change', listener);

    // Cleanup
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}

/**
 * Detects mobile devices (max-width: 768px)
 * @returns true if viewport width is 768px or less
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.MOBILE_MAX})`);
}

/**
 * Detects tablet devices (769px - 1024px)
 * @returns true if viewport width is between 769px and 1024px
 */
export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.TABLET_MIN}) and (max-width: ${BREAKPOINTS.TABLET_MAX})`);
}

/**
 * Detects desktop devices (min-width: 1025px)
 * @returns true if viewport width is 1025px or greater
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.DESKTOP_MIN})`);
}

/**
 * Detects touch devices (no hover support, coarse pointer)
 * @returns true if device has touch input without hover capability
 */
export function useIsTouchDevice(): boolean {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
}

/**
 * Detects if user prefers reduced motion
 * @returns true if user has reduced motion preference enabled
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Detects if user prefers dark color scheme
 * @returns true if user has dark mode preference enabled
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}
