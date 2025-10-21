import { useEffect } from 'react';
import { useEditorActions } from '../state/editorStore';

/**
 * Registers keyboard shortcuts for undo/redo operations.
 *
 * Shortcuts:
 * - Cmd/Ctrl+Z: Undo
 * - Cmd/Ctrl+Shift+Z: Redo
 *
 * Focus rules:
 * - Intercepts shortcuts when focus is outside input/textarea (Canvas, buttons)
 * - Allows native browser undo/redo when focus is inside input/textarea (Inspector)
 */
export function useHistoryShortcuts() {
  const actions = useEditorActions();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (!cmdOrCtrl) return;

      // Ignore if focus is in Inspector input/textarea - allow native undo/redo
      const target = e.target as HTMLElement;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') {
        return;
      }

      // Handle Cmd/Ctrl+Z (Undo)
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        actions.undo();
        return;
      }

      // Handle Cmd/Ctrl+Shift+Z (Redo)
      if (e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        actions.redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
