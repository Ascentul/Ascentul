import { useEffect, useRef, RefObject, useState } from 'react';

/**
 * Hook to enable keyboard navigation for a list of elements
 * Returns the current index which triggers re-renders when navigation occurs
 */
export function useKeyboardNavigation<T extends HTMLElement>({
  containerRef,
  itemSelector,
  onSelect,
  enabled = true,
}: {
  containerRef: RefObject<HTMLElement>;
  itemSelector: string;
  onSelect?: (element: T, index: number) => void;
  enabled?: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = Array.from(
        container.querySelectorAll(itemSelector)
      ) as T[];

      if (items.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
        case 'j': // Vim-style navigation
          event.preventDefault();
          setCurrentIndex((prevIndex) => {
            const newIndex = Math.min(prevIndex + 1, items.length - 1);
            items[newIndex]?.focus();
            return newIndex;
          });
          break;

        case 'ArrowUp':
        case 'k': // Vim-style navigation
          event.preventDefault();
          setCurrentIndex((prevIndex) => {
            const newIndex = Math.max(prevIndex - 1, 0);
            items[newIndex]?.focus();
            return newIndex;
          });
          break;

        case 'Home':
          event.preventDefault();
          setCurrentIndex(() => {
            items[0]?.focus();
            return 0;
          });
          break;

        case 'End':
          event.preventDefault();
          setCurrentIndex(() => {
            const newIndex = items.length - 1;
            items[newIndex]?.focus();
            return newIndex;
          });
          break;

        case 'Enter':
        case ' ':
          setCurrentIndex((prevIndex) => {
            if (prevIndex >= 0 && onSelect) {
              event.preventDefault();
              onSelect(items[prevIndex], prevIndex);
            }
            return prevIndex;
          });
          break;

        case 'Escape':
          event.preventDefault();
          setCurrentIndex(() => {
            (document.activeElement as HTMLElement)?.blur();
            return -1;
          });
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, itemSelector, onSelect, enabled]);

  return {
    currentIndex,
  };
}

/**
 * Hook to trap focus within a modal or dialog
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the previously focused element to restore later
    const previousActiveElement = document.activeElement as HTMLElement;
    const container = containerRef.current;

    // Get initial focusable elements and focus the first one
    const initialFocusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]):not(:disabled), [href], input:not([disabled]):not(:disabled), select:not([disabled]):not(:disabled), textarea:not([disabled]):not(:disabled), [tabindex]:not([tabindex="-1"])'
    );
    const firstInitialElement = initialFocusableElements[0];
    firstInitialElement?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      // Rebuild focusable elements list on each Tab press to handle DOM changes
      const focusableElements = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not(:disabled), [href], input:not([disabled]):not(:disabled), select:not([disabled]):not(:disabled), textarea:not([disabled]):not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // If no focusable elements, do nothing
      if (focusableElements.length === 0) return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the previously focused element
      previousActiveElement?.focus();
    };
  }, [containerRef, isActive]);
}

/**
 * Hook to announce content to screen readers
 */
export function useAriaLive() {
  const timeoutsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only'; // Visually hidden but accessible
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    const timeoutId = window.setTimeout(() => {
      timeoutsRef.current.delete(timeoutId);
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, 1000);
    timeoutsRef.current.add(timeoutId);
  };

  return { announce };
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  options: {
    enabled?: boolean;
    preventDefault?: boolean;
  } = {}
) {
  const { enabled = true, preventDefault = true } = options;
  const pressedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    // Clear any pressed keys when effect runs
    pressedKeysRef.current.clear();

    const handleKeyDown = (event: KeyboardEvent) => {
      pressedKeysRef.current.add(event.key.toLowerCase());

      // Check if all keys are pressed
      const allKeysPressed = keys.every((key) =>
        pressedKeysRef.current.has(key.toLowerCase())
      );

      if (allKeysPressed) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeysRef.current.delete(event.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Clear pressed keys on cleanup
      pressedKeysRef.current.clear();
    };
  }, [keys, callback, enabled, preventDefault]);
}
