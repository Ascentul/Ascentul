"use client";

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useCanUndo, useCanRedo } from '@/features/resume/editor/state/selectors';
import { useEditorActions } from '@/features/resume/editor/state/editorStore';

// Detect platform for cross-platform keyboard shortcuts
const isMac = typeof window !== 'undefined' &&
  /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);
const modKey = isMac ? 'Cmd' : 'Ctrl';

export function UndoRedoToolbar() {
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const actions = useEditorActions();

  return (
    <div className="flex items-center gap-1 border-r pr-2 mr-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={!canUndo}
        onClick={() => actions.undo()}
        title={`Undo (${modKey}+Z)`}
      >
        Undo
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={!canRedo}
        onClick={() => actions.redo()}
        aria-label="Redo"
        title={`Redo (${modKey}+Shift+Z)`}
      >
        Redo
      </Button>
    </div>
  );
}
