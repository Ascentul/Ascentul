"use client";

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useCanUndo, useCanRedo } from '@/features/resume/editor/state/selectors';
import { useEditorActions } from '@/features/resume/editor/state/editorStore';

export function UndoRedoToolbar() {
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const actions = useEditorActions();

  const handleUndo = useCallback(() => {
    actions.undo();
  }, [actions]);

  const handleRedo = useCallback(() => {
    actions.redo();
  }, [actions]);

  return (
    <div className="flex items-center gap-1 border-r pr-2 mr-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={!canUndo}
        onClick={handleUndo}
        title="Undo (Cmd+Z)"
      >
        Undo
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={!canRedo}
        onClick={handleRedo}
        title="Redo (Cmd+Shift+Z)"
      >
        Redo
      </Button>
    </div>
  );
}
