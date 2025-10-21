import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'debug-panel-open';
const TOGGLE_KEY = '`'; // Backtick key

/**
 * Hook to manage debug panel visibility with keyboard toggle
 *
 * Keyboard shortcut: Cmd/Ctrl + Backtick
 * Persists state in sessionStorage
 *
 * @returns {{ isOpen: boolean, toggle: () => void }}
 */
export function useDebugToggle() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // SessionStorage might be unavailable in some contexts
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux) + Backtick
      if ((event.metaKey || event.ctrlKey) && event.key === TOGGLE_KEY) {
        event.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, toggle };
}
