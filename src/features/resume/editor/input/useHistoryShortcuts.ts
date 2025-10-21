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

const getPlatform = () => {
  if (typeof navigator === 'undefined') {
    return '';
  }
  const uaDataPlatform = (navigator as any).userAgentData?.platform;
  if (uaDataPlatform) {
    return uaDataPlatform;
  }
  return navigator.platform || navigator.userAgent || '';
};

export function useHistoryShortcuts() {
  const actions = useEditorActions();

  useEffect(() => {
    const platform = getPlatform();
    const isMac = /mac/i.test(platform);
    const handleKeyDown = (e: KeyboardEvent) => {
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (!cmdOrCtrl) return;

      // Ignore if focus is in Inspector input/textarea - allow native undo/redo
      const target = e.target as HTMLElement;
      const tagName = target?.tagName?.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target?.isContentEditable
      ) {
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
