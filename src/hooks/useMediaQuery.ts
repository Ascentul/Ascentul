import { useState, useEffect } from 'react';

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

    // Add listener
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      media.addListener(listener);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

/**
 * Detects mobile devices (max-width: 768px)
 * @returns true if viewport width is 768px or less
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

/**
 * Detects tablet devices (769px - 1024px)
 * @returns true if viewport width is between 769px and 1024px
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

/**
 * Detects desktop devices (min-width: 1025px)
 * @returns true if viewport width is 1025px or greater
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
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
