import { useEffect, useRef, RefObject, useState } from 'react';

function isElementVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }
  if (style.position === 'fixed') {
    return true;
  }
  return el.offsetParent !== null;
}

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
  const previousItemCountRef = useRef(0);

  // Store callback in ref to avoid effect re-runs when callback changes
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = (Array.from(
        container.querySelectorAll(itemSelector)
      ) as T[]).filter(isElementVisible);

      if (items.length === 0) return;

      // Reset currentIndex if the filtered items list has changed significantly
      // This prevents stale indices when items are added/removed/hidden between keyboard events
      if (previousItemCountRef.current !== items.length) {
        previousItemCountRef.current = items.length;
        setCurrentIndex(prevIndex => {
          // If current index is out of bounds, reset to -1
          if (prevIndex >= items.length) {
            return -1;
          }
          return prevIndex;
        });
      }

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
            if (prevIndex >= 0 && onSelectRef.current) {
              event.preventDefault();
              onSelectRef.current(items[prevIndex], prevIndex);
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
  }, [containerRef, itemSelector, enabled]);

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
    const initialFocusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]):not(:disabled), [href], input:not([disabled]):not(:disabled), select:not([disabled]):not(:disabled), textarea:not([disabled]):not(:disabled), [tabindex]:not([tabindex="-1"]), details, summary, [contenteditable]'
      )
    ).filter(isElementVisible);
    const firstInitialElement = initialFocusableElements[0];
    firstInitialElement?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      // Rebuild focusable elements list on each Tab press to handle DOM changes
      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]):not(:disabled), [href], input:not([disabled]):not(:disabled), select:not([disabled]):not(:disabled), textarea:not([disabled]):not(:disabled), [tabindex]:not([tabindex="-1"]), details, summary, [contenteditable]'
        )
      ).filter(isElementVisible);
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

    // Use role="alert" for assertive (implicit aria-live="assertive")
    // Use role="status" for polite (requires explicit aria-live="polite")
    if (priority === 'assertive') {
      announcement.setAttribute('role', 'alert');
      // aria-live is implicit for role="alert", but set explicitly for clarity
      announcement.setAttribute('aria-live', 'assertive');
    } else {
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
    }

    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.cssText = 'position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement with dynamic timeout based on message length
    // Average reading speed: ~250 words/min = ~50ms per character
    // Minimum 1 second, maximum 10 seconds for very long messages
    const timeoutDuration = Math.max(1000, Math.min(message.length * 50, 10000));

    const timeoutId = window.setTimeout(() => {
      timeoutsRef.current.delete(timeoutId);
      if (announcement.parentNode) {
        document.body.removeChild(announcement);
      }
    }, timeoutDuration);
    timeoutsRef.current.add(timeoutId);
  };

  return { announce };
}

/**
 * Hook for keyboard shortcuts
 * Supports modifier keys (control, alt, shift) and regular keys
 *
 * IMPORTANT: This hook normalizes both Ctrl and Cmd (Meta) keys to 'control' for
 * cross-platform consistency. This means:
 * - On Windows/Linux: Ctrl+K triggers shortcuts with ['control', 'k']
 * - On macOS: Cmd+K triggers shortcuts with ['control', 'k']
 *
 * This intentional design provides a better UX by making shortcuts work consistently
 * across platforms. However, it prevents distinguishing between Control and Meta keys
 * for platform-specific behavior. If you need to detect Ctrl vs Cmd separately, use
 * a lower-level keydown listener with event.ctrlKey and event.metaKey directly.
 *
 * @example
 * // Cross-platform: Ctrl+K (Windows/Linux) or Cmd+K (macOS)
 * useKeyboardShortcut(['control', 'k'], handleSearch)
 *
 * // Shift+Alt+F (all platforms)
 * useKeyboardShortcut(['shift', 'alt', 'f'], handleFormat)
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
  const activatedRef = useRef(false);

  // Store callback in ref to avoid effect re-runs when callback changes
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    // Reset activation when effect runs
    activatedRef.current = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Build set of currently active keys from event
      const activeKeys = new Set<string>();

      // Add modifier keys if pressed (normalize 'control' to match both Ctrl and Cmd on Mac)
      if (event.ctrlKey || event.metaKey) activeKeys.add('control');
      if (event.altKey) activeKeys.add('alt');
      if (event.shiftKey) activeKeys.add('shift');

      // Add the actual key pressed (normalize to lowercase)
      const key = event.key.toLowerCase();
      activeKeys.add(key);

      // Check if all required keys are currently pressed
      const allKeysPressed = keys.every((requiredKey) =>
        activeKeys.has(requiredKey.toLowerCase())
      );

      if (allKeysPressed && !activatedRef.current) {
        activatedRef.current = true;
        if (preventDefault) {
          event.preventDefault();
        }
        callbackRef.current();
      }
    };

    const handleKeyUp = () => {
      // Reset activation when any key is released
      activatedRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Reset activation on cleanup
      activatedRef.current = false;
    };
  }, [keys, enabled, preventDefault]);
}
